import { QdrantClient } from "@qdrant/js-client-rest";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import PDFParser from "pdf2json";

const COLLECTION_NAME = "notebooklm-clone-docs";

// Custom embedder calling Google v1beta API directly with verified model name and retry logic
async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GOOGLE_API_KEY!;
  const results: number[][] = [];
  
  for (const text of texts) {
    let lastError;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: { parts: [{ text }] } }),
          }
        );
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Google embedding error: ${err}`);
        }
        const data = await res.json();
        results.push(data.embedding.values);
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Embedding attempt ${i + 1} failed: ${err.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    if (lastError) throw lastError;
  }
  return results;
}

function getQdrantClient() {
  return new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
  });
}

async function ensureCollection(client: QdrantClient, dim: number) {
  try {
    await client.getCollection(COLLECTION_NAME);
  } catch {
    await client.createCollection(COLLECTION_NAME, {
      vectors: { size: dim, distance: "Cosine" },
    });
  }
}

function parsePdfBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
      resolve(pdfParser.getRawTextContent());
    });
    pdfParser.parseBuffer(buffer);
  });
}

export async function processAndStorePDFs(files: File[]) {
  let totalChunks = 0;
  const client = getQdrantClient();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      // 1. Ingestion
      const text = await parsePdfBuffer(buffer);

      const doc = new Document({
        pageContent: text,
        metadata: { fileName: file.name },
      });

      // 2. Chunking
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", " ", ""],
      });

      const chunkedDocs = await textSplitter.splitDocuments([doc]);
      const docsWithMetadata = chunkedDocs.map((d) => {
        d.metadata = { ...d.metadata, fileName: file.name };
        return d;
      });

      // 3. Embed
      const texts = docsWithMetadata.map((d) => d.pageContent);
      const vectors = await embedTexts(texts);
      const actualDim = vectors[0].length;

      // 4. Ensure collection exists with correct dimensions
      await ensureCollection(client, actualDim);

      // 5. Upsert into Qdrant
      const points = vectors.map((vector, i) => ({
        id: Date.now() + i,
        vector,
        payload: {
          pageContent: docsWithMetadata[i].pageContent,
          metadata: docsWithMetadata[i].metadata,
        },
      }));

      await client.upsert(COLLECTION_NAME, { points });
      totalChunks += docsWithMetadata.length;
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw error;
    }
  }

  return totalChunks;
}

export async function retrieveContext(query: string, k: number = 5) {
  console.log("Retrieving context for query:", query);
  try {
    const client = getQdrantClient();
    const queryVectors = await embedTexts([query]);
    const queryVector = queryVectors[0];

    const results = await client.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: k,
      with_payload: true,
    });

    return results.map((r) => ({
      pageContent: (r.payload as any).pageContent as string,
      metadata: (r.payload as any).metadata as Record<string, any>,
    }));
  } catch (error) {
    console.error("Error retrieving context:", error);
    return [];
  }
}
