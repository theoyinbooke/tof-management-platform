"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Edit,
  GraduationCap,
  User,
  Phone,
  Mail,
  MapPin,
  School,
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Calendar,
  Award,
  Upload,
  Download,
  Check,
  X,
  MoreHorizontal
} from "lucide-react";
import { formatCurrency, formatDate, formatPhoneNumber, formatFileSize } from "@/lib/utils";
import { Id } from "../../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { DocumentUpload } from "@/components/documents/document-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BeneficiaryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const beneficiaryId = params.beneficiaryId as Id<"beneficiaries">;

  // Fetch beneficiary details
  const beneficiaryData = useQuery(
    api.beneficiaries.getById,
    beneficiaryId ? { beneficiaryId } : "skip"
  );

  // Fetch academic sessions for this beneficiary
  const academicSessions = useQuery(
    api.academicSessions.getByBeneficiary,
    beneficiaryId ? { beneficiaryId } : "skip"
  );

  // Fetch performance history
  const performanceHistory = useQuery(
    api.academicSessions.getPerformanceHistory,
    beneficiaryId ? { beneficiaryId } : "skip"
  );

  // Fetch documents for this beneficiary
  const documents = useQuery(
    api.documents.getByBeneficiary,
    beneficiaryData?.foundationId && beneficiaryId ? {
      beneficiaryId,
      foundationId: beneficiaryData.foundationId,
    } : "skip"
  );

  const updateStatus = useMutation(api.beneficiaries.updateStatus);
  const updateAcademicLevel = useMutation(api.beneficiaries.updateAcademicLevel);
  const getDownloadUrl = useMutation(api.documents.getDownloadUrl);
  const updateDocumentStatus = useMutation(api.documents.updateStatus);

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleDownloadDocument = async (documentId: Id<"documents">) => {
    try {
      const url = await getDownloadUrl({ documentId });
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const handleDocumentStatusUpdate = async (documentId: Id<"documents">, newStatus: string) => {
    try {
      await updateDocumentStatus({
        documentId,
        status: newStatus as any,
      });
      toast.success(`Document ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update document status");
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
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

  if (!beneficiaryData) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading beneficiary details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "graduated":
        return <Badge className="bg-blue-100 text-blue-800">Graduated</Badge>;
      case "withdrawn":
        return <Badge className="bg-gray-100 text-gray-800">Withdrawn</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPerformanceTrend = (performance: any) => {
    if (!performance) return null;
    
    if (performance.hasImproved) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (performance.hasImproved === false) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer", "beneficiary", "guardian"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {beneficiaryData.user?.firstName} {beneficiaryData.user?.lastName}
              </h1>
              <p className="text-gray-600 mt-1">
                {beneficiaryData.beneficiaryNumber}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/beneficiaries/${beneficiaryId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Details
            </Button>
            <Button onClick={() => router.push(`/beneficiaries/${beneficiaryId}/academic`)}>
              <School className="w-4 h-4 mr-2" />
              Academic Sessions
            </Button>
          </div>
        </div>

        {/* Status and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
                <User className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              {getStatusBadge(beneficiaryData.status)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Academic Level</CardTitle>
                <GraduationCap className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {beneficiaryData.academicLevel?.name}
              </div>
              <p className="text-xs text-gray-600 capitalize">
                {beneficiaryData.academicLevel?.category}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Current School</CardTitle>
                <School className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{beneficiaryData.currentSchool}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Support Duration</CardTitle>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                Since {formatDate(new Date(beneficiaryData.supportStartDate))}
              </div>
              {beneficiaryData.supportEndDate && (
                <div className="text-xs text-gray-600">
                  Until {formatDate(new Date(beneficiaryData.supportEndDate))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="academic">Academic History</TabsTrigger>
            <TabsTrigger value="financial">Financial Records</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-medium">
                          {beneficiaryData.user?.firstName} {beneficiaryData.user?.lastName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{beneficiaryData.user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">
                          {beneficiaryData.user?.phone ? 
                            formatPhoneNumber(beneficiaryData.user.phone) : 
                            "Not provided"
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">
                          {beneficiaryData.application?.address.street}, {beneficiaryData.application?.address.city}, {beneficiaryData.application?.address.state}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Date of Birth</p>
                        <p className="font-medium">
                          {beneficiaryData.application?.dateOfBirth ? 
                            formatDate(new Date(beneficiaryData.application.dateOfBirth)) :
                            "Not available"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{beneficiaryData.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Relationship</p>
                    <p className="font-medium">{beneficiaryData.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">
                      {formatPhoneNumber(beneficiaryData.emergencyContact.phone)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">
                      {beneficiaryData.emergencyContact.email || "Not provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Types */}
            <Card>
              <CardHeader>
                <CardTitle>Support Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {beneficiaryData.supportTypes.map((type: string) => (
                    <Badge key={type} variant="outline" className="capitalize">
                      {type.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            {/* Current Performance */}
            {performanceHistory && performanceHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {performanceHistory[0].overallGrade && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {performanceHistory[0].overallGrade}%
                        </div>
                        <p className="text-sm text-gray-600">Overall Grade</p>
                      </div>
                    )}
                    {performanceHistory[0].position && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {performanceHistory[0].position}
                        </div>
                        <p className="text-sm text-gray-600">
                          out of {performanceHistory[0].totalStudents || "N/A"}
                        </p>
                      </div>
                    )}
                    {performanceHistory[0].attendance && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {performanceHistory[0].attendance}%
                        </div>
                        <p className="text-sm text-gray-600">Attendance</p>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {performanceHistory[0].gradeClass || "N/A"}
                      </div>
                      <p className="text-sm text-gray-600">Grade Class</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Academic Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Sessions</CardTitle>
                <CardDescription>
                  All academic sessions for this beneficiary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {academicSessions?.map((session: any) => (
                    <div key={session._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{session.sessionName}</h4>
                          <p className="text-sm text-gray-600">{session.schoolName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">
                              {session.sessionType}
                            </Badge>
                            <Badge 
                              className={
                                session.status === "active" ? "bg-green-100 text-green-800" :
                                session.status === "completed" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }
                            >
                              {session.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {formatDate(new Date(session.startDate))} - {formatDate(new Date(session.endDate))}
                          </p>
                          {session.performanceRecord && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm font-medium">
                                {session.performanceRecord.overallGrade}%
                              </span>
                              {getPerformanceTrend(session.performanceRecord)}
                              {session.performanceRecord.needsIntervention && (
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-gray-600 py-8">No academic sessions found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Records</CardTitle>
                <CardDescription>
                  Payment history and financial support details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Financial records will be displayed here</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Implementation in progress
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      Uploaded documents and certificates ({documents?.length || 0} documents)
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsUploadOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc: any) => (
                      <div key={doc._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="text-2xl">{getDocumentIcon(doc.fileType)}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{doc.fileName}</p>
                                {getDocumentStatusBadge(doc.status)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>{getDocumentTypeLabel(doc.documentType)}</span>
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span>Uploaded {formatDate(new Date(doc.createdAt))}</span>
                              </div>
                              {doc.description && (
                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                              )}
                              {doc.reviewDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Reviewed {formatDate(new Date(doc.reviewDate))} by {doc.reviewedByUser?.firstName} {doc.reviewedByUser?.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc._id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
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
                                  onClick={() => handleDownloadDocument(doc._id)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                {doc.status === "pending_review" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleDocumentStatusUpdate(doc._id, "approved")}
                                      className="text-green-600"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDocumentStatusUpdate(doc._id, "rejected")}
                                      className="text-red-600"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No documents uploaded yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Click "Upload Document" to add files
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setIsUploadOpen(true)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload First Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programs">
            <Card>
              <CardHeader>
                <CardTitle>Programs</CardTitle>
                <CardDescription>
                  Program participation and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Program participation will be displayed here</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Program management system coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Document Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a document for {beneficiaryData.user?.firstName} {beneficiaryData.user?.lastName}
              </DialogDescription>
            </DialogHeader>
            <DocumentUpload
              foundationId={beneficiaryData.foundationId}
              beneficiaryId={beneficiaryId}
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