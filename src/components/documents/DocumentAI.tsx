import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useDocument } from "@/hooks/useDocuments";

interface DocumentAIProps {
  trial: any;
}

interface ChatMessage {
  id: string;
  role: "user" | "llm";
  content: string;
}

export function DocumentAI({ trial }: DocumentAIProps) {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Parse documentId from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId = params.get("documentId");
    setDocumentId(docId);
  }, [location.search]);

  // Fetch document data
  const {
    data: document,
    isLoading: docLoading,
    error,
  } = useDocument(documentId || "");

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle send
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: query.trim(),
    };
    setChat((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);
    // Mock LLM response after 1.5s
    setTimeout(() => {
      setChat((prev) => [
        ...prev,
        {
          id: `${Date.now()}-llm`,
          role: "llm",
          content: `Echo: ${userMsg.content}`,
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  let documentIndicator = null;
  if (!documentId) {
    documentIndicator = (
      <span className="text-gray-500">(No document selected)</span>
    );
  } else if (docLoading) {
    documentIndicator = (
      <span className="text-gray-500 animate-pulse">Loading document...</span>
    );
  } else if (error) {
    documentIndicator = (
      <span className="text-red-500">Error loading document</span>
    );
  } else if (document) {
    documentIndicator = (
      <span
        className="truncate font-semibold text-blue-700"
        title={document.document_name}
      >
        {document.document_name}
      </span>
    );
  }

  return (
    <div className="relative h-full">
      {/* Messages container - scrolls above the fixed input */}
      <div className="h-full overflow-y-auto pb-40">
        {" "}
        {/* pb-40 to prevent content from going under input */}
        <div className="px-4 py-6 space-y-4">
          {chat.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-12">
              No messages yet. Ask something about the document!
            </div>
          )}
          {chat.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-2xl mx-auto flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 shadow text-sm whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="max-w-2xl mx-auto flex justify-start">
              <div className="rounded-lg px-4 py-2 shadow text-sm bg-gray-100 text-gray-900 rounded-bl-none">
                <span className="animate-pulse">Connecting to LLM...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input container - fixed at the bottom of this component */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 ">
        {/* Document indicator */}
        <div className="px-4 pt-3 pb-1 border-b border-gray-100 bg-gray-50 text-xs text-gray-600 flex items-center gap-2">
          <span className="font-medium text-gray-700">
            Consulting document:
          </span>
          {documentIndicator}
        </div>
        {/* Input row */}
        <form
          onSubmit={handleSend}
          className="flex items-end justify-center px-4 py-4"
        >
          <div className="flex w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-2 gap-2 items-center">
            <Input
              ref={inputRef}
              className="flex-1 text-base bg-transparent border-none focus:ring-0 focus:outline-none placeholder-gray-400"
              placeholder="Ask a question about this document..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              autoComplete="off"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!query.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-2 transition-colors disabled:opacity-50"
              style={{ boxShadow: "none" }}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
