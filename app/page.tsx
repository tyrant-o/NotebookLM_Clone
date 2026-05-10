import DocumentUpload from "@/components/DocumentUpload";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <main className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans">
      <div className="w-80 flex-shrink-0">
        <DocumentUpload />
      </div>
      <div className="flex-1 min-w-0">
        <ChatInterface />
      </div>
    </main>
  );
}
