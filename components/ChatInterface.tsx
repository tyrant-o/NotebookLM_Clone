"use client";

import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: assistantContent }
              : msg
          )
        );
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">NotebookLM</h1>
            <p className="text-sm text-slate-400">Ask questions about your uploaded documents</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-200">Hi, I'm your AI Assistant</h2>
            <p className="text-slate-400 max-w-md">
              Upload your PDF documents on the left, then ask me anything about them. I'll search through the content and give you grounded answers.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex w-full",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex max-w-[80%] rounded-2xl px-6 py-4 shadow-sm",
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-200 border border-slate-700"
                )}
              >
                <div className="mr-4 mt-1 flex-shrink-0">
                  {message.role === "user" ? (
                    <User className="w-5 h-5 text-blue-200" />
                  ) : (
                    <Bot className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl px-6 py-4">
              <div className="mr-4 mt-1">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex items-center">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                <span className="ml-3 text-slate-400">Searching documents and thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-6 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-slate-900 border border-slate-700 rounded-full focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all shadow-lg"
        >
          <input
            className="flex-1 bg-transparent py-4 pl-6 pr-14 outline-none text-slate-200 placeholder:text-slate-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
