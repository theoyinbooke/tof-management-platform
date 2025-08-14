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
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  User,
  Calendar,
  Download,
  Eye,
  AlertTriangle,
  Filter,
  MoreHorizontal,
  MessageSquare,
  RefreshCw,
  CheckSquare
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
import { DocumentReviewDialog } from "@/components/documents/document-review-dialog";

export default function ReviewsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("applications");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"documents"> | null>(null);

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch pending documents for review
  const pendingDocuments = useQuery(
    api.documents.getByFoundation,
    foundationId ? {
      foundationId,
      status: "pending_review",
    } : "skip"
  );

  // Fetch pending applications for review
  const pendingApplications = useQuery(
    api.applications.getForReview,
    foundationId ? {
      foundationId,
      status: "under_review",
    } : "skip"
  );

  // Fetch financial records pending approval
  const pendingFinancialRecords = useQuery(
    api.financial.getByFoundationDetailed,
    foundationId ? { foundationId } : "skip"
  );

  const pendingFinancial = pendingFinancialRecords?.filter(
    record => record.status === "pending" || record.status === "approved"
  ) || [];

  const updateDocumentStatus = useMutation(api.documents.updateStatus);
  const getDownloadUrl = useMutation(api.documents.getDownloadUrl);

  const handleDocumentAction = async (documentId: Id<"documents">, action: "approve" | "reject", notes?: string) => {
    try {
      await updateDocumentStatus({
        documentId,
        status: action === "approve" ? "approved" : "rejected",
        reviewNotes: notes,
      });
      toast.success(`Document ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} document`);
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

  const getDocumentIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const getDocumentTypeLabel = (type: string) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Normal</Badge>;
    }
  };

  const getApplicationPriority = (application: any) => {
    const daysSinceSubmission = Math.floor((Date.now() - application.createdAt) / (1000 * 60 * 60 * 24));
    if (daysSinceSubmission > 30) return "high";
    if (daysSinceSubmission > 14) return "medium";
    return "low";
  };

  const getDocumentPriority = (document: any) => {
    const daysSinceUpload = Math.floor((Date.now() - document.createdAt) / (1000 * 60 * 60 * 24));
    if (daysSinceUpload > 7) return "high";
    if (daysSinceUpload > 3) return "medium";
    return "low";
  };

  // Filter documents based on search and priority
  const filteredDocuments = pendingDocuments?.filter(doc => {
    if (!searchTerm && priorityFilter === "all") return true;
    
    const matchesSearch = !searchTerm || 
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.beneficiaryUser?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.beneficiaryUser?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const docPriority = getDocumentPriority(doc);
    const matchesPriority = priorityFilter === "all" || docPriority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  }) || [];

  // Filter applications based on search and priority
  const filteredApplications = pendingApplications?.filter(app => {
    if (!searchTerm && priorityFilter === "all") return true;
    
    const matchesSearch = !searchTerm || 
      app.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const appPriority = getApplicationPriority(app);
    const matchesPriority = priorityFilter === "all" || appPriority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  }) || [];

  const totalPendingItems = (pendingDocuments?.length || 0) + 
                           (pendingApplications?.length || 0) + 
                           (pendingFinancial?.length || 0);

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserCheck className="w-8 h-8 text-blue-600" />
              Reviews & Approvals
            </h1>
            <p className="text-gray-600 mt-1">
              Review pending documents, applications, and financial records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Badge className="bg-yellow-100 text-yellow-800 text-lg px-3 py-1">
              {totalPendingItems} items pending
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Documents</CardTitle>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {pendingDocuments?.length || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
                <User className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {pendingApplications?.length || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Under review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Financial</CardTitle>
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingFinancial?.length || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search by name, email, or document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Review Items */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Applications ({pendingApplications?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents ({pendingDocuments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Financial ({pendingFinancial?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Applications Under Review</CardTitle>
                <CardDescription>
                  {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} pending review
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No applications pending review</p>
                    <p className="text-sm text-gray-400 mt-1">
                      All applications have been reviewed
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((app) => (
                      <div key={app._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-purple-600" />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {app.user?.firstName} {app.user?.lastName}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{app.user?.email}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <span>Applied: {formatDate(new Date(app.createdAt))}</span>
                                  <span>•</span>
                                  <span>Academic Level: {app.currentLevel || 'Not specified'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getPriorityBadge(getApplicationPriority(app))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/applications/review/${app._id}`)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents Pending Review</CardTitle>
                <CardDescription>
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} awaiting review
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No documents pending review</p>
                    <p className="text-sm text-gray-400 mt-1">
                      All documents have been reviewed
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDocuments.map((doc) => (
                      <div key={doc._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          {/* Document Icon */}
                          <div className="flex-shrink-0">
                            <span className="text-3xl">{getDocumentIcon(doc.fileType)}</span>
                          </div>

                          {/* Document Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 
                                  className="font-medium text-gray-900 break-words"
                                  style={{ 
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                    lineHeight: '1.4'
                                  }}
                                  title={doc.fileName}
                                >
                                  {doc.fileName}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <span>{getDocumentTypeLabel(doc.documentType)}</span>
                                  <span>•</span>
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                  <span>•</span>
                                  <span>{formatDate(new Date(doc.createdAt))}</span>
                                </div>
                                {doc.beneficiaryUser && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {doc.beneficiaryUser.firstName} {doc.beneficiaryUser.lastName}
                                    </span>
                                    {doc.beneficiary?.beneficiaryNumber && (
                                      <span className="text-xs text-gray-500">
                                        ({doc.beneficiary.beneficiaryNumber})
                                      </span>
                                    )}
                                  </div>
                                )}
                                {doc.description && (
                                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Priority Badge */}
                              <div className="ml-4 flex flex-col gap-2">
                                {getPriorityBadge(getDocumentPriority(doc))}
                                {Math.floor((Date.now() - doc.createdAt) / (1000 * 60 * 60 * 24)) > 7 && (
                                  <Badge className="bg-red-100 text-red-800 text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc._id)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDocumentId(doc._id)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Review
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDocumentAction(doc._id, "approve")}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Quick Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDocumentAction(doc._id, "reject", "Rejected for review")}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Quick Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Records Pending Approval</CardTitle>
                <CardDescription>
                  {pendingFinancial.length} financial record{pendingFinancial.length !== 1 ? 's' : ''} awaiting approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingFinancial.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No financial records pending approval</p>
                    <p className="text-sm text-gray-400 mt-1">
                      All financial records are up to date
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingFinancial.map((record) => (
                      <div key={record._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {record.beneficiaryUser?.firstName} {record.beneficiaryUser?.lastName}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {record.feeCategory?.name} - {record.currency} {record.amount.toLocaleString()}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <span>Status: {record.status}</span>
                                  <span>•</span>
                                  <span>Due: {record.dueDate}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/financial/${record._id}`)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Document Review Dialog */}
        <DocumentReviewDialog
          documentId={selectedDocumentId}
          open={selectedDocumentId !== null}
          onOpenChange={(open) => !open && setSelectedDocumentId(null)}
          onReviewComplete={() => {
            setSelectedDocumentId(null);
            // The data will automatically refresh due to Convex real-time updates
          }}
        />
      </div>
    </ProtectedRoute>
  );
}