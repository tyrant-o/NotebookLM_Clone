# Google NotebookLM Clone

This is a full-stack Next.js web application that replicates the core functionality of Google's NotebookLM. It allows users to upload PDF documents and ask questions about them. The system uses a complete RAG (Retrieval-Augmented Generation) pipeline to chunk, embed, store, and retrieve relevant document sections, generating answers using OpenAI models grounded strictly in the provided content.

## Features
- **Upload Multiple PDFs:** Upload documents simultaneously via drag and drop.
- **RAG Pipeline:** End-to-end ingestion, document chunking, embeddings, storage, retrieval, and generation.
- **Chunking Strategy:** Implemented `RecursiveCharacterTextSplitter` (1000 characters chunk size, 200 overlap) to maintain contextual boundaries like paragraphs and sentences.
- **Vector Database:** Uses Qdrant for storing embeddings and fast similarity search.
- **Streaming LLM:** Answers stream back in real-time using Vercel AI SDK and OpenAI (`gpt-4o-mini`).
- **Modern UI:** Tailwind CSS, Lucide icons, responsive layout, and dark mode aesthetics.

## Local Setup

### 1. Requirements
- Node.js 18+
- A running instance of Qdrant (either via Docker or Qdrant Cloud)
- OpenAI API Key

### 2. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env.local
```
Add your keys inside `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=http://localhost:6333  # Or your Qdrant Cloud URL
QDRANT_API_KEY=your_qdrant_api_key # Only if using Qdrant Cloud
```

### 3. Installation & Running
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

## Deployment (Vercel / Render)

To satisfy the assignment's requirement of a **Live Project Link** accessible without local setup, you must deploy this application.

1. **Vector DB Setup:** Create a free cluster on [Qdrant Cloud](https://cloud.qdrant.io/). Get the Cluster URL and API Key.
2. **Deploy Frontend/Backend:** Push this code to a GitHub repository, then link it to [Vercel](https://vercel.com/) or [Render](https://render.com/).
3. **Configure Environment Variables:** Add `OPENAI_API_KEY`, `QDRANT_URL`, and `QDRANT_API_KEY` to your Vercel/Render project settings.
4. **Deploy!** Your application is now accessible via the live Vercel URL without any local setup.
