import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { DocumentTypeEnum } from "@/services/documentService";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  trialId: string;
  onUploadComplete?: (documents: any[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
}

const DOCUMENT_TYPES: { value: DocumentTypeEnum; label: string }[] = [
  { value: "protocol", label: "Protocol" },
  { value: "brochure", label: "Investigator Brochure" },
  { value: "consent_form", label: "Informed Consent Form" },
  { value: "report", label: "Report" },
  { value: "manual", label: "Study Manual" },
  { value: "plan", label: "Data Management Plan" },
  { value: "amendment", label: "Amendment" },
  { value: "icf", label: "ICF" },
  { value: "case_report_form", label: "Case Report Form" },
  { value: "standard_operating_procedure", label: "SOP" },
  { value: "other", label: "Other" },
];

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "text/plain": [".txt"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function DocumentUpload({
  trialId,
  onUploadComplete,
  onUploadError,
  disabled = false,
  maxFiles = 5,
  maxSizeBytes = MAX_FILE_SIZE,
}: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<DocumentTypeEnum>("other");
  const [description, setDescription] = useState("");
  const [amendmentNumber, setAmendmentNumber] = useState<string>("");
  const [tags, setTags] = useState<string>("");

  const {
    uploadMultipleDocuments,
    isUploading,
    uploadProgress,
    clearProgress,
  } = useDocumentUpload();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > maxSizeBytes) {
          onUploadError?.(
            `File ${file.name} is too large (max ${
              maxSizeBytes / 1024 / 1024
            }MB)`
          );
          return false;
        }
        return true;
      });

      setSelectedFiles((prev) => {
        const newFiles = [...prev, ...validFiles];
        return newFiles.slice(0, maxFiles);
      });
    },
    [maxFiles, maxSizeBytes, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles,
    disabled: disabled || isUploading,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      onUploadError?.("Please select at least one file");
      return;
    }

    if (!documentType) {
      onUploadError?.("Please select a document type");
      return;
    }

    try {
      const uploadOptions = selectedFiles.map((file) => ({
        file,
        trialId,
        documentType,
        description: description || undefined,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : undefined,
        amendmentNumber: amendmentNumber
          ? parseInt(amendmentNumber)
          : undefined,
      }));

      const uploadedDocuments = await uploadMultipleDocuments(uploadOptions);

      // Clear form
      setSelectedFiles([]);
      setDescription("");
      setAmendmentNumber("");
      setTags("");
      clearProgress();

      onUploadComplete?.(uploadedDocuments);
    } catch (error) {
      console.error("Upload error:", error);
      onUploadError?.(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const hasFiles = selectedFiles.length > 0;
  const hasUploading = uploadProgress.some((p) => p.status === "uploading");

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400",
              disabled && "opacity-50 cursor-not-allowed",
              hasFiles && "border-green-300 bg-green-50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

            {isDragActive ? (
              <p className="text-primary font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Max {maxFiles} files, {formatFileSize(maxSizeBytes)} each
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {hasFiles && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Configuration */}
      {hasFiles && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Document Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Document Type *</Label>
                <Select
                  value={documentType}
                  onValueChange={setDocumentType as any}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amendmentNumber">Amendment Number</Label>
                <Input
                  id="amendmentNumber"
                  type="number"
                  value={amendmentNumber}
                  onChange={(e) => setAmendmentNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description for the document(s)"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Optional tags, separated by commas"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Upload Progress</h3>
            <div className="space-y-3">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {progress.file.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      {progress.status === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {progress.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge
                        variant={
                          progress.status === "success"
                            ? "default"
                            : progress.status === "error"
                            ? "destructive"
                            : progress.status === "uploading"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {progress.status}
                      </Badge>
                    </div>
                  </div>
                  {progress.status === "uploading" && (
                    <Progress value={progress.progress} className="h-2" />
                  )}
                  {progress.status === "error" && progress.error && (
                    <p className="text-xs text-red-500">{progress.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {hasFiles && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !documentType}
            size="lg"
            className="min-w-32"
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {selectedFiles.length}{" "}
                {selectedFiles.length === 1 ? "File" : "Files"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
