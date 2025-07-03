import React, { useState } from "react";
import { useTrialDocuments } from "@/hooks/useDocuments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ArrowUpDown,
  Filter,
  MessageSquare,
  FileText,
  Download,
  Printer,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

interface DocumentListProps {
  trialId: string;
  trialName: string;
  trialDescription: string;
  latestAmendment?: {
    modifiedBy: string;
    modifiedDate: string;
  };
  onAddDocClick?: () => void;
}

export function DocumentList({
  trialId,
  trialName,
  trialDescription,
  latestAmendment,
  onAddDocClick,
}: DocumentListProps) {
  const [activeTab, setActiveTab] = useState("All Documents");
  const { data: documents = [], isLoading } = useTrialDocuments(trialId);

  const tabs = [
    "All Documents",
    "Active Documents",
    "My Documents",
    "Shared With Me",
    "Archive",
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "default"; // Green
      case "pending":
        return "secondary"; // Orange/Yellow
      case "signed":
        return "default"; // Green/Teal
      case "submitted":
        return "outline"; // Gray
      default:
        return "outline";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "signed":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "submitted":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const isLatestDocument = (document: any) => {
    return document.is_latest;
  };

  // Find the protocol document for this trial
  const protocolDocument = documents.find(
    (doc) => doc.document_type === "protocol" && doc.is_latest
  );

  return (
    <div className="space-y-4">
      {/* Protocol Header Section */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div
          className="min-h-32 p-6 text-white relative"
          style={{
            background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
          }}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask AI
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Latest Protocol
            </Button>
          </div>

          <div className="space-y-2">
            {/* Trial Name */}
            <h2 className="text-2xl font-bold">{trialName}</h2>

            {/* Protocol Info */}
            {protocolDocument && (
              <div className="text-sm text-white/90">
                <span className="font-medium">Protocol: </span>
                <span>{protocolDocument.document_name}</span>
              </div>
            )}

            {/* Latest Amendment */}
            {latestAmendment && (
              <div className="text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-white/60 rounded-sm"></span>
                  Latest Amendment: {"[latest amendment file name]"}
                </span>
                <div className="mt-1">
                  Last modification by {"[latestAmendment.modifiedBy]"}, on
                  {"[latest amendment timestamps"}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <ArrowUpDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={onAddDocClick}
          >
            Add Doc
          </Button>
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Uploader</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document: any) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {document.document_name}
                    </span>
                    {isLatestDocument(document) && (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {document.uploaded_by_member?.name || "Unknown"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Principal Investigator
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-200"
                  >
                    {formatDocumentType(document.document_type)}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={getStatusBadgeColor(
                      document.status || "pending"
                    )}
                  >
                    {document.status || "Pending"}
                  </Badge>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {format(
                    new Date(document.updated_at || document.created_at),
                    "yyyy-MM-dd"
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
