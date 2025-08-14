"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Check,
  X,
  FileText,
  User,
  Calendar,
  Download,
  AlertTriangle,
  Eye,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatFileSize } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { DocumentVersionHistory } from "./document-version-history";

interface DocumentReviewDialogProps {
  documentId: Id<"documents"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewComplete?: () => void;
}

export function DocumentReviewDialog({
  documentId,
  open,
  onOpenChange,
  onReviewComplete
}: DocumentReviewDialogProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch document details
  const document = useQuery(
    api.documents.getById,
    documentId ? { documentId } : "skip"
  );

  const updateStatus = useMutation(api.documents.updateStatus);
  const getDownloadUrl = useMutation(api.documents.getDownloadUrl);

  const handleApprove = async () => {
    if (!documentId) return;
    
    setIsSubmitting(true);
    try {
      await updateStatus({
        documentId,
        status: "approved",
        reviewNotes: reviewNotes.trim() || undefined,
      });
      toast.success("Document approved successfully");
      onReviewComplete?.();
      onOpenChange(false);
      setReviewNotes("");
    } catch (error) {
      toast.error("Failed to approve document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!documentId || !reviewNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateStatus({
        documentId,
        status: "rejected",
        reviewNotes: reviewNotes.trim(),
      });
      toast.success("Document rejected");
      onReviewComplete?.();
      onOpenChange(false);
      setReviewNotes("");
    } catch (error) {
      toast.error("Failed to reject document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!documentId) return;
    
    try {
      const url = await getDownloadUrl({ documentId });
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDocumentIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  if (!document) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading document details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isReviewable = document.status === "pending_review";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{getDocumentIcon(document.fileType)}</span>
            <div>
              <div className="flex items-center gap-2">
                <span>Document Review</span>
                <Badge className={getStatusColor(document.status)}>
                  {document.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p 
                className="text-sm text-gray-600 mt-1 font-normal break-words"
                style={{ 
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  lineHeight: '1.4'
                }}
                title={document.fileName}
              >
                {document.fileName}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Review and approve or reject this document submission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Document Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">File Name</Label>
                <p 
                  className="text-sm mt-1 break-words"
                  style={{ 
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    lineHeight: '1.4'
                  }}
                  title={document.fileName}
                >
                  {document.fileName}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Document Type</Label>
                <p className="text-sm mt-1 capitalize">
                  {document.documentType.replace(/_/g, ' ')}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">File Size</Label>
                <p className="text-sm mt-1">{formatFileSize(document.fileSize)}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Upload Date</Label>
                <p className="text-sm mt-1">{formatDate(new Date(document.createdAt))}</p>
              </div>
            </div>

            {document.description && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{document.description}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Beneficiary Information */}
          {document.beneficiaryUser && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Beneficiary Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="text-sm mt-1">
                      {document.beneficiaryUser.firstName} {document.beneficiaryUser.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Beneficiary Number</Label>
                    <p className="text-sm mt-1">{document.beneficiary?.beneficiaryNumber || "N/A"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-sm mt-1">{document.beneficiaryUser.email}</p>
                  </div>
                  
                  {document.beneficiaryUser.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-sm mt-1">{document.beneficiaryUser.phone}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Upload Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Uploaded By</Label>
                <p className="text-sm mt-1">
                  {document.uploadedByUser?.firstName} {document.uploadedByUser?.lastName}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Upload Date</Label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(new Date(document.createdAt))}
                </p>
              </div>
            </div>
          </div>

          {/* Previous Review Information */}
          {document.reviewDate && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Previous Review</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Review Date</Label>
                    <p className="text-sm mt-1">{formatDate(new Date(document.reviewDate))}</p>
                  </div>
                  
                  {document.reviewNotes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Review Notes</Label>
                      <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{document.reviewNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Version History */}
          <Separator />
          <DocumentVersionHistory 
            documentId={documentId!} 
            className="border-0 shadow-none p-0"
          />

          {/* Review Action Section */}
          {isReviewable && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Review Action
                </h3>
                
                <div>
                  <Label htmlFor="reviewNotes">Review Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add your review comments here... (Required for rejection)"
                    className="min-h-[120px] mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes will be shared with the document uploader
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download & Review
          </Button>
          
          {isReviewable ? (
            <>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isSubmitting}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                {isSubmitting ? "Processing..." : "Reject"}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                {isSubmitting ? "Processing..." : "Approve"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}