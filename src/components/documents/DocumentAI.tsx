import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, AlertCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useDocument, useTrialDocuments } from "@/hooks/useDocuments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

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

  // Get all documents and filter for active ones
  const { data: documents = [], isLoading: docsLoading } = useTrialDocuments(
    trial.id
  );
  const activeDocuments = documents.filter((doc) => doc.is_latest);

  // Get latest protocol as default
  const latestProtocol = activeDocuments.find(
    (doc) => doc.document_type === "protocol"
  );

  // Parse documentId from URL or use latest protocol as default
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId = params.get("documentId");
    setDocumentId(docId || latestProtocol?.id || null);
  }, [location.search, latestProtocol]);

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
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !documentId) return;

    const userMessage = query.trim();
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: userMessage,
    };

    setChat((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("No authentication token available");
      }

      // Log the request payload
      const requestPayload = {
        message: userMessage,
        retrieve_only: false,
        limit: 5,
        document_ids: documentId ? [documentId] : undefined,
      };

      console.log("🔍 DocumentAI Query Request:", {
        documentId: documentId,
        selectedDocument: document?.document_name || "No document selected",
        requestPayload: requestPayload,
      });

      // Call backend API
      const apiResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestPayload),
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.status}`);
      }

      const responseText = await apiResponse.text();

      // Add the response to chat
      setChat((prev) => [
        ...prev,
        {
          id: `${Date.now()}-llm`,
          role: "llm",
          content: responseText,
        },
      ]);
    } catch (error) {
      console.error("Error with backend query:", error);
      setChat((prev) => [
        ...prev,
        {
          id: `${Date.now()}-llm`,
          role: "llm",
          content:
            "Sorry, I'm having trouble connecting to the AI service right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDocumentType = (type: string) => {
    switch (type) {
      case "protocol":
        return "Protocol";
      case "brochure":
        return "Brochure";
      case "consent_form":
        return "Consent Form";
      case "report":
        return "Report";
      case "manual":
        return "Manual";
      case "plan":
        return "Plan";
      default:
        return type;
    }
  };

  // Document selector component
  let documentSelector = null;
  if (docsLoading || docLoading) {
    documentSelector = (
      <span className="text-gray-500 animate-pulse">Loading document...</span>
    );
  } else if (activeDocuments.length === 0) {
    documentSelector = (
      <span className="text-gray-500">(No active documents available)</span>
    );
  } else if (error) {
    documentSelector = (
      <span className="text-red-500">Error loading document</span>
    );
  } else {
    documentSelector = (
      <Select
        value={documentId || ""}
        onValueChange={(value) => setDocumentId(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a document..." />
        </SelectTrigger>
        <SelectContent>
          {activeDocuments.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              <div className="flex flex-col text-left">
                <span className="font-medium">{doc.document_name}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {formatDocumentType(doc.document_type)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="relative h-full">
      {/* Alert when no active documents are available */}
      {!docsLoading && activeDocuments.length === 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No active documents are available for this trial. Please upload
            documents first.
          </AlertDescription>
        </Alert>
      )}

      {/* Messages container - scrolls above the fixed input */}
      <div className="h-full overflow-y-auto pb-8">
        <div className="px-4 py-2 space-y-4">
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
                className={`rounded-lg px-4 py-2 shadow text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="whitespace-pre-line">{msg.content}</div>
                ) : (
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900 prose-ul:text-gray-900 prose-ol:text-gray-900 prose-li:text-gray-900">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="max-w-2xl mx-auto flex justify-start">
              <div className="rounded-lg px-4 py-2 shadow text-sm bg-gray-100 text-gray-900 rounded-bl-none">
                <span className="animate-pulse">Analyzing document...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input container - fixed at the bottom of this component */}
      <div className="bottom-0 left-0 right-0 border-t border-gray-300">
        {/* Document selector */}
        <div className="px-4 pt-3 pb-2 text-xs text-gray-600 flex items-center gap-3">
          <span className="font-medium text-gray-700 flex-shrink-0">
            Querying document:
          </span>
          <div className="flex-1 max-w-md">{documentSelector}</div>
        </div>
        {/* Input row */}
        <form
          onSubmit={handleSend}
          className="flex items-end justify-center px-4 py-4"
        >
          <div className="flex w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-2 gap-2 items-center">
            <Input
              ref={inputRef}
              className="flex-1 text-base bg-transparent border-none outline-none placeholder-gray-400"
              placeholder={
                documentId
                  ? "Ask a question about this document..."
                  : "Please select a document first"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              autoComplete="off"
              disabled={isLoading || !documentId}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!query.trim() || isLoading || !documentId}
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
