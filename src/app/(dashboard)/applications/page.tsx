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
import { Checkbox } from "@/components/ui/checkbox";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">New</Badge>;
      case "under_review":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      case "waitlisted":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Waitlisted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAssignReviewer = async (applicationId: Id<"applications">, reviewerId: Id<"users">) => {
    try {
      await assignReviewer({ applicationId, reviewerId });
      toast.success("Reviewer assigned successfully");
    } catch (error) {
      toast.error("Failed to assign reviewer");
    }
  };

  const handleStatusUpdate = async (applicationId: Id<"applications">, status: string, comments?: string) => {
    try {
      await updateStatus({
        applicationId,
        status: status as any,
        reviewComments: comments
      });
      toast.success("Application status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleBulkAction = async () => {
    if (selectedApplications.length === 0 || !bulkActionDialog) return;

    try {
      if (bulkActionDialog === "approve") {
        await bulkApprove({
          applicationIds: selectedApplications,
          reviewComments: bulkComments
        });
        toast.success(`${selectedApplications.length} applications approved`);
      }
      setSelectedApplications([]);
      setBulkActionDialog(null);
      setBulkComments("");
    } catch (error) {
      toast.error("Bulk action failed");
    }
  };

  const handleCreateBeneficiary = async (applicationId: Id<"applications">) => {
    if (!foundationId) return;
    
    try {
      await createBeneficiaryFromApplication({
        applicationId,
        foundationId
      });
      toast.success("Beneficiary created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create beneficiary");
    }
  };

  const toggleApplicationSelection = (applicationId: Id<"applications">) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const selectAllApplications = () => {
    if (!applications) return;
    
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(app => app._id));
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Application Review</h1>
            <p className="text-gray-600 mt-1">Review and manage scholarship applications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {selectedApplications.length > 0 && (
              <Button 
                onClick={() => setBulkActionDialog("approve")}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Bulk Approve ({selectedApplications.length})
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
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

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">New</CardTitle>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.pending || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Under Review</CardTitle>
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.underReview || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Being reviewed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.approved || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Ready for enrollment</p>
            </CardContent>
          </Card>

          <Card>
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
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or application number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Applications ({applications?.length || 0})</CardTitle>
                <CardDescription>
                  Review and manage scholarship applications
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={applications?.length > 0 && selectedApplications.length === applications.length}
                  onCheckedChange={selectAllApplications}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-gray-700 w-12">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="text-left p-2 font-medium text-gray-700">Applicant</th>
                    <th className="text-left p-2 font-medium text-gray-700">Academic Level</th>
                    <th className="text-left p-2 font-medium text-gray-700">Status</th>
                    <th className="text-left p-2 font-medium text-gray-700">Reviewer</th>
                    <th className="text-left p-2 font-medium text-gray-700">Applied</th>
                    <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications?.map((application) => (
                    <tr key={application._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Checkbox
                          checked={selectedApplications.includes(application._id)}
                          onCheckedChange={() => toggleApplicationSelection(application._id)}
                        />
                      </td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">
                            {application.firstName} {application.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {application.applicationNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {application.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <Badge variant="outline">
                            {application.education.currentLevel}
                          </Badge>
                          <div className="text-xs text-gray-600 mt-1">
                            {application.education.currentSchool}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="p-2">
                        {application.reviewer ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {application.reviewer.firstName} {application.reviewer.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {application.reviewer.role}
                            </div>
                          </div>
                        ) : (
                          <Select
                            onValueChange={(reviewerId) => handleAssignReviewer(application._id, reviewerId as Id<"users">)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Assign" />
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
                      <td className="p-2">
                        <div className="text-sm">
                          {formatDate(application.submittedAt || application.createdAt)}
                        </div>
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
                              onClick={() => router.push(`/applications/review/${application._id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review Application
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {application.status !== "approved" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(application._id, "approved")}
                                className="text-green-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {application.status === "approved" && (
                              <DropdownMenuItem
                                onClick={() => handleCreateBeneficiary(application._id)}
                                className="text-blue-600"
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Create Beneficiary
                              </DropdownMenuItem>
                            )}
                            {application.status !== "rejected" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(application._id, "rejected")}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(application._id, "waitlisted")}
                              className="text-purple-600"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Waitlist
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {applications?.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No applications found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Applications will appear here once students submit them
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Action Dialog */}
        <Dialog open={bulkActionDialog !== null} onOpenChange={() => setBulkActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Bulk {bulkActionDialog === "approve" ? "Approve" : "Reject"} Applications
              </DialogTitle>
              <DialogDescription>
                You are about to {bulkActionDialog} {selectedApplications.length} applications.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Comments (Optional)</label>
                <Textarea
                  placeholder="Add comments for this bulk action..."
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
                className={bulkActionDialog === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {bulkActionDialog === "approve" ? "Approve" : "Reject"} {selectedApplications.length} Applications
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}