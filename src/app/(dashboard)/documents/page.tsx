"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText,
  Upload,
  Filter,
  Download,
  Eye,
  Check,
  X,
  Clock,
  AlertTriangle,
  Search,
  User,
  Calendar,
  FileIcon,
  FolderOpen,
  MoreHorizontal,
  Trash2,
  Edit
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate, formatFileSize } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DocumentUpload } from "@/components/documents/document-upload";

export default function DocumentsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [beneficiaryFilter, setBeneficiaryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch documents
  const documents = useQuery(
    api.documents.getByFoundation,
    foundationId ? {
      foundationId,
      documentType: typeFilter !== "all" ? typeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      beneficiaryId: beneficiaryFilter !== "all" ? beneficiaryFilter as Id<"beneficiaries"> : undefined,
    } : "skip"
  );

  // Fetch statistics
  const statistics = useQuery(
    api.documents.getStatistics,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch beneficiaries for filter
  const beneficiaries = useQuery(
    api.beneficiaries.getByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  const updateStatus = useMutation(api.documents.updateStatus);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const getDownloadUrl = useMutation(api.documents.getDownloadUrl);

  const handleStatusUpdate = async (documentId: Id<"documents">, newStatus: string) => {
    try {
      await updateStatus({
        documentId,
        status: newStatus as any,
      });
      toast.success(`Document ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update document status");
    }
  };

  const handleDownload = async (documentId: Id<"documents">) => {
    try {
      const url = await getDownloadUrl({ documentId });
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (documentId: Id<"documents">) => {
    try {
      await deleteDocument({ documentId });
      toast.success("Document deleted successfully");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDocumentIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const getDocumentTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filter documents based on search
  const filteredDocuments = documents?.filter(doc => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(searchLower) ||
      doc.documentType.toLowerCase().includes(searchLower) ||
      doc.beneficiaryUser?.firstName?.toLowerCase().includes(searchLower) ||
      doc.beneficiaryUser?.lastName?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer", "beneficiary", "guardian"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Document Management</h1>
            <p className="text-gray-600 mt-1">Manage and review uploaded documents</p>
          </div>
          {(user?.role === "admin" || user?.role === "super_admin") && (
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
                <FolderOpen className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics?.total || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formatFileSize(statistics?.totalSize || 0)} total size
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statistics?.byStatus.pending_review || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
                <Check className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics?.byStatus.approved || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Verified documents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
                <X className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics?.byStatus.rejected || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Need resubmission</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="application_document">Application Document</SelectItem>
                    <SelectItem value="academic_transcript">Academic Transcript</SelectItem>
                    <SelectItem value="financial_document">Financial Document</SelectItem>
                    <SelectItem value="identity_document">Identity Document</SelectItem>
                    <SelectItem value="medical_document">Medical Document</SelectItem>
                    <SelectItem value="recommendation_letter">Recommendation Letter</SelectItem>
                    <SelectItem value="proof_of_income">Proof of Income</SelectItem>
                    <SelectItem value="school_certificate">School Certificate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                {(user?.role === "admin" || user?.role === "super_admin" || user?.role === "reviewer") && (
                  <Select value={beneficiaryFilter} onValueChange={setBeneficiaryFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Beneficiaries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Beneficiaries</SelectItem>
                      {beneficiaries?.map((beneficiary) => (
                        <SelectItem key={beneficiary._id} value={beneficiary._id}>
                          {beneficiary.user?.firstName} {beneficiary.user?.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-gray-700">Document</th>
                    <th className="text-left p-2 font-medium text-gray-700">Type</th>
                    <th className="text-left p-2 font-medium text-gray-700">Beneficiary</th>
                    <th className="text-left p-2 font-medium text-gray-700">Size</th>
                    <th className="text-left p-2 font-medium text-gray-700">Uploaded</th>
                    <th className="text-left p-2 font-medium text-gray-700">Status</th>
                    <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getDocumentIcon(doc.fileType)}</span>
                          <div>
                            <div className="font-medium">{doc.fileName}</div>
                            {doc.description && (
                              <div className="text-sm text-gray-600">{doc.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm font-medium">
                          {getDocumentTypeLabel(doc.documentType)}
                        </div>
                      </td>
                      <td className="p-2">
                        {doc.beneficiaryUser ? (
                          <div>
                            <div className="font-medium">
                              {doc.beneficiaryUser.firstName} {doc.beneficiaryUser.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {doc.beneficiary?.beneficiaryNumber}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">General</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="text-sm">{formatFileSize(doc.fileSize)}</div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          {formatDate(new Date(doc.createdAt))}
                        </div>
                        <div className="text-xs text-gray-600">
                          by {doc.uploadedByUser?.firstName} {doc.uploadedByUser?.lastName}
                        </div>
                      </td>
                      <td className="p-2">
                        {getStatusBadge(doc.status)}
                        {doc.reviewDate && (
                          <div className="text-xs text-gray-600 mt-1">
                            Reviewed {formatDate(new Date(doc.reviewDate))}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDownload(doc._id)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {(user?.role === "admin" || user?.role === "super_admin" || user?.role === "reviewer") && (
                              <>
                                {doc.status === "pending_review" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(doc._id, "approved")}
                                      className="text-green-600"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(doc._id, "rejected")}
                                      className="text-red-600"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(user?.role === "admin" || user?.role === "super_admin") && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(doc._id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDocuments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {documents?.length === 0 
                      ? "Upload documents to get started"
                      : "Try adjusting your search or filters"
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document to the system
              </DialogDescription>
            </DialogHeader>
            <DocumentUpload
              foundationId={foundationId!}
              onUploadComplete={(documentId) => {
                setIsUploadOpen(false);
                toast.success("Document uploaded successfully!");
              }}
              onCancel={() => setIsUploadOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}