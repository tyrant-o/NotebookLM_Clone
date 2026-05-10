"use client";

import { useState, useCallback } from "react";
import { UploadCloud, File as FileIcon, X, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DocumentUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf'));
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.name.endsWith('.pdf'));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setStatusMessage(null);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatusMessage({ type: 'success', text: data.message });
        setFiles([]); // Clear files on success
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: "Failed to upload and process files." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 p-6">
      <h2 className="text-xl font-bold text-white mb-6">Sources</h2>
      
      <div 
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer mb-6",
          isUploading ? "opacity-50 pointer-events-none border-slate-700 bg-slate-800/50" : "border-slate-700 hover:border-blue-500 hover:bg-slate-800/50"
        )}
      >
        <input 
          type="file" 
          multiple 
          accept=".pdf" 
          className="hidden" 
          id="file-upload" 
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
          <p className="text-slate-300 font-medium">Click to upload or drag & drop</p>
          <p className="text-slate-500 text-sm mt-1">PDF files only</p>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto mb-4">
        {files.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Ready to process</h3>
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center overflow-hidden">
                  <FileIcon className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-slate-200 truncate">{file.name}</span>
                </div>
                <button 
                  onClick={() => removeFile(i)}
                  className="text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {statusMessage && (
        <div className={cn(
          "p-4 rounded-lg mb-4 text-sm flex items-start",
          statusMessage.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
        )}>
          {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />}
          <p>{statusMessage.text}</p>
        </div>
      )}

      <button
        onClick={uploadFiles}
        disabled={files.length === 0 || isUploading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Process Documents'
        )}
      </button>
    </div>
  );
}
