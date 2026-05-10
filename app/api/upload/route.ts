import { NextRequest, NextResponse } from "next/server";
import { processAndStorePDFs } from "@/lib/rag";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }
    
    const validFiles = files.filter(f => f.name.endsWith('.pdf'));
    if (validFiles.length === 0) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const totalChunks = await processAndStorePDFs(validFiles);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${validFiles.length} file(s) into ${totalChunks} chunks.` 
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong during ingestion" }, { status: 500 });
  }
}
