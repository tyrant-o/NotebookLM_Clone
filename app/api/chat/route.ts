import { NextRequest } from "next/server";
import { retrieveContext } from "@/lib/rag";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1];
    const userQuery = latestMessage.content;

    // Retrieve context from Qdrant
    const searchedChunks = await retrieveContext(userQuery, 5);
    
    // Format context for the LLM
    const contextString = searchedChunks
      .map((chunk: any, index: number) => `--- Chunk ${index + 1} (File: ${chunk.metadata.fileName || 'Unknown'}) ---\n${chunk.pageContent}`)
      .join("\n\n");

    const systemPrompt = `You are a helpful AI assistant (similar to Google NotebookLM). 
You must answer the user's questions based ONLY on the provided context below.
If the answer is not contained in the context, say "I don't know based on the provided documents" or something similar.
Cite the file names and chunk numbers when relevant to ground your answer.

CONTEXT:
${contextString || "No relevant context found in the uploaded documents."}`;

    const response = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: messages, // pass all previous messages for conversational memory
    });

    return response.toTextStreamResponse();
  } catch (error: any) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
