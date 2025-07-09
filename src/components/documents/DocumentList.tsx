import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ArrowUpDown,
  Filter,
  MessageSquare,
  FileText,
  Download,
  Printer,
  Trash2,
  AlertTriangle,
  Eye,
  Archive,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";

interface DocumentListProps {
  trialId: string;
  trialName: string;
  trialDescription: string;
  latestProtocol?: any;
  latestAmendment?: any;
  onAddDocClick?: () => void;
}

export function DocumentList({
  trialId,
  trialName,
  trialDescription,
  latestProtocol,
  latestAmendment,
  onAddDocClick,
}: DocumentListProps) {
  const [activeTab, setActiveTab] = useState("Active");
  const navigate = useNavigate();
  const { data: documents = [], isLoading } = useTrialDocuments(trialId);

  const tabs = ["Active", "Archived", "All Documents"];

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

  // Check if document is an active protocol that should potentially be inactive
  const isActiveProtocol = (document: any) => {
    if (document.document_type !== "protocol") return false;

    const activeStatuses = ["active", "approved", "signed", "pending"];
    return activeStatuses.includes(document.status?.toLowerCase());
  };

  // Find all active protocols
  const activeProtocols = documents.filter(isActiveProtocol);
  const hasMultipleActiveProtocols = activeProtocols.length > 1;

  // Check if a specific protocol should show warning (active but not latest)
  const shouldShowProtocolWarning = (document: any) => {
    if (!isActiveProtocol(document)) return false;
    if (hasMultipleActiveProtocols && !document.is_latest) return true;
    return false;
  };

  // Use the protocol passed from parent instead of searching again
  const protocolDocument =
    latestProtocol ||
    documents.find((doc) => doc.document_type === "protocol" && doc.is_latest);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Protocol Header Section */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div
            className="min-h-32 p-6 text-white relative"
            style={{
              background: "linear-gradient(135deg, #06A6D4 5%, #0656D4 80%)",
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
                  <span className="font-medium">Latest Protocol: </span>
                  <span>{protocolDocument.document_name}</span>
                </div>
              )}

              {/* Latest Amendment */}
              {latestAmendment && (
                <div className="text-sm text-white/80">
                  <p className="flex items-center gap-2 font-medium">
                    Latest Amendment:{" "}
                    <span className="font-normal">
                      {latestAmendment.document_name}
                    </span>
                  </p>
                  <div className="mt-2">
                    <p className="text-xs italic">
                      Last modification by{" "}
                      {latestAmendment.uploaded_by_member?.name || "Unknown"},
                      on{" "}
                      {format(
                        new Date(
                          latestAmendment.updated_at ||
                            latestAmendment.created_at
                        ),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Multiple Active Protocols Warning */}
              {hasMultipleActiveProtocols && (
                <div className="text-sm text-yellow-200 italic flex items-center gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Warning: {activeProtocols.length} active protocols found -
                    some should be marked as inactive
                  </span>
                </div>
              )}

              {/* No Amendment message */}
              {!latestAmendment && protocolDocument && (
                <div className="text-sm text-white/80">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-white/60 rounded-sm"></span>
                    No amendments available
                  </span>
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
            {onAddDocClick && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={onAddDocClick}
              >
                Add Doc
              </Button>
            )}
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
                      <span
                        className={`font-medium ${
                          shouldShowProtocolWarning(document)
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {document.document_name}
                      </span>
                      {isLatestDocument(document) && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          Latest
                        </Badge>
                      )}
                      {shouldShowProtocolWarning(document) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="w-4 h-4 text-red-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-red-200 border-red-200">
                            <p className="max-w-xs text-red-600">
                              This protocol is active but should likely be
                              marked as inactive. Only one protocol should
                              typically remain active per trial.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        <p>{document.uploaded_by_member?.name || "Unknown"}</p>
                      </div>
                      <div className="text-muted-foreground text-xs"></div>
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
                      {/* Direct Actions with Tooltips */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Navigate to Document AI with this document
                              navigate(
                                `/document-assistant/${trialId}/document-ai?documentId=${document.id}`
                              );
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ask AI about this document</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // View document logic
                              console.log("View document:", document.id);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View document</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Archive document logic
                              console.log("Archive document:", document.id);
                            }}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Archive document</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* More Actions Dropdown */}
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>More actions</p>
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              // Print document logic
                              console.log("Print document:", document.id);
                            }}
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // Download document logic
                              console.log("Download document:", document.id);
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // Delete document logic
                              console.log("Delete document:", document.id);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </TooltipProvider>
  );
}
