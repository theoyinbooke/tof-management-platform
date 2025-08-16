"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePagination } from "@/hooks/use-pagination";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { 
  Search, 
  Filter, 
  Download, 
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  MoreHorizontal,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  User,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ApplicationsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplications, setSelectedApplications] = useState<Id<"applications">[]>([]);
  const [bulkActionDialog, setBulkActionDialog] = useState<"approve" | "reject" | null>(null);
  const [bulkComments, setBulkComments] = useState("");

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch applications for review
  const applications = useQuery(
    api.applications.getForReview,
    foundationId ? {
      foundationId,
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter as any : undefined,
    } : "skip"
  );

  // Initialize pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedRange,
    handlePageChange,
    handlePageSizeChange,
    resetPagination,
  } = usePagination({
    totalItems: applications?.length || 0,
    initialPageSize: 15,
  });

  // Get paginated applications
  const paginatedApplications = applications?.slice(paginatedRange.start, paginatedRange.end) || [];

  // Fetch application statistics
  const stats = useQuery(
    api.applications.getApplicationStats,
    foundationId ? { foundationId } : "skip"
  );

  // Get available reviewers
  const reviewers = useQuery(
    api.users.getByRoles,
    foundationId ? {
      foundationId,
      roles: ["reviewer", "admin", "super_admin"]
    } : "skip"
  );

  // Mutations
  const assignReviewer = useMutation(api.applications.assignReviewer);
  const updateStatus = useMutation(api.applications.updateStatus);
  const bulkApprove = useMutation(api.applications.bulkApprove);
  const createBeneficiaryFromApplication = useMutation(api.beneficiaries.createFromApplication);
  const convertToBeneficiary = useMutation(api.applications.convertToBeneficiary);
  const bulkConvertToBeneficiaries = useMutation(api.applications.bulkConvertToBeneficiaries);

  const handleAssignReviewer = async (applicationId: Id<"applications">, reviewerId: Id<"users">) => {
    try {
      await assignReviewer({ applicationId, reviewerId });
      toast.success("Reviewer assigned successfully");
    } catch (error) {
      toast.error("Failed to assign reviewer");
    }
  };

  const handleStatusUpdate = async (applicationId: Id<"applications">, status: string) => {
    try {
      await updateStatus({ 
        applicationId, 
        status: status as any,
        comments: ""
      });
      toast.success(`Application status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleBulkAction = async () => {
    if (!bulkActionDialog || selectedApplications.length === 0) return;

    try {
      if (bulkActionDialog === "approve") {
        await bulkApprove({
          applicationIds: selectedApplications,
          comments: bulkComments
        });
        
        // Convert approved applications to beneficiaries
        await bulkConvertToBeneficiaries({
          applicationIds: selectedApplications
        });
        
        toast.success(`${selectedApplications.length} applications approved and converted to beneficiaries`);
      } else {
        // Handle bulk reject
        for (const id of selectedApplications) {
          await updateStatus({
            applicationId: id,
            status: "rejected",
            comments: bulkComments
          });
        }
        toast.success(`${selectedApplications.length} applications rejected`);
      }
      
      setSelectedApplications([]);
      setBulkActionDialog(null);
      setBulkComments("");
    } catch (error) {
      toast.error("Failed to perform bulk action");
    }
  };

  const selectAllApplications = (checked: boolean) => {
    if (checked && paginatedApplications) {
      setSelectedApplications(paginatedApplications.map(app => app._id));
    } else {
      setSelectedApplications([]);
    }
  };

  const toggleApplicationSelection = (applicationId: Id<"applications">) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
      case "pending":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "under_review":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Applications</h1>
            <p className="text-gray-600 mt-1">
              Review and manage scholarship applications
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {selectedApplications.length > 0 && (
              <Button 
                onClick={() => setBulkActionDialog("approve")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Bulk Approve ({selectedApplications.length})
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
                <FileText className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-gray-600 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">New</CardTitle>
                <Clock className="w-4 h-4 text-sky-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-600">
                {stats?.pending || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Under Review</CardTitle>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats?.underReview || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Being reviewed</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {stats?.approved || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Ready for enrollment</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.rejected || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Not accepted</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or application number..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      resetPagination();
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                resetPagination();
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">New</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Applications Table */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  Showing {paginatedRange.start + 1}-{Math.min(paginatedRange.end, applications?.length || 0)} of {applications?.length || 0} applications
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={paginatedApplications.length > 0 && selectedApplications.length === paginatedApplications.length}
                  onCheckedChange={selectAllApplications}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Level
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviewer
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedApplications.length > 0 ? (
                    paginatedApplications.map((application) => (
                      <tr key={application._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedApplications.includes(application._id)}
                            onCheckedChange={() => toggleApplicationSelection(application._id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {application.firstName} {application.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{application.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{application.academicLevel}</div>
                          <div className="text-xs text-gray-500">{application.currentSchool}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {formatDate(new Date(application.createdAt))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${getStatusColor(application.status)} border-0`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(application.status)}
                              {application.status.replace("_", " ")}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {application.reviewerId ? (
                            <div className="text-sm text-gray-900">
                              {reviewers?.find(r => r._id === application.reviewerId)?.firstName || "Assigned"}
                            </div>
                          ) : (
                            <Select 
                              onValueChange={(value) => handleAssignReviewer(application._id, value as Id<"users">)}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Assign..." />
                              </SelectTrigger>
                              <SelectContent>
                                {reviewers?.map((reviewer) => (
                                  <SelectItem key={reviewer._id} value={reviewer._id}>
                                    {reviewer.firstName} {reviewer.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/applications/review/${application._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/applications/review/${application._id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(application._id, "under_review")}>
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Mark as Under Review
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusUpdate(application._id, "approved")}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusUpdate(application._id, "rejected")}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-gray-500">No applications found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Applications will appear here when submitted
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {applications && applications.length > 0 && (
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={applications.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[15, 25, 50]}
              />
            )}
          </CardContent>
        </Card>

        {/* Bulk Action Dialog */}
        <Dialog open={!!bulkActionDialog} onOpenChange={() => setBulkActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {bulkActionDialog === "approve" ? "Approve Applications" : "Reject Applications"}
              </DialogTitle>
              <DialogDescription>
                You are about to {bulkActionDialog} {selectedApplications.length} application(s).
                {bulkActionDialog === "approve" && " Approved applications will be converted to beneficiaries."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Comments (Optional)</label>
                <Textarea
                  placeholder="Add any comments or notes..."
                  value={bulkComments}
                  onChange={(e) => setBulkComments(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkAction}
                className={bulkActionDialog === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
              >
                {bulkActionDialog === "approve" ? "Approve All" : "Reject All"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}