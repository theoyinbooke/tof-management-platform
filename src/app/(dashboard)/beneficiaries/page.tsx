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
import { DataTable } from "@/components/ui/data-table";
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  UserPlus,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  MoreHorizontal,
  Users,
  School,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BeneficiariesPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [academicLevelFilter, setAcademicLevelFilter] = useState<string>("all");

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch beneficiaries
  const beneficiaries = useQuery(
    api.beneficiaries.getByFoundation,
    foundationId ? {
      foundationId,
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter as any : undefined,
      academicLevelId: academicLevelFilter !== "all" ? academicLevelFilter as Id<"academicLevels"> : undefined,
    } : "skip"
  );

  // Fetch statistics
  const statistics = useQuery(
    api.beneficiaries.getStatistics,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch beneficiaries needing attention
  const needingAttention = useQuery(
    api.beneficiaries.getNeedingAttention,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch academic levels for filter
  const academicLevels = useQuery(
    api.academic.getAcademicLevels,
    foundationId ? { foundationId } : "skip"
  );

  const updateStatus = useMutation(api.beneficiaries.updateStatus);

  const handleStatusUpdate = async (beneficiaryId: Id<"beneficiaries">, newStatus: string, reason: string) => {
    try {
      await updateStatus({
        beneficiaryId,
        status: newStatus as any,
        reason,
      });
      toast.success("Beneficiary status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

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
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Beneficiaries</h1>
            <p className="text-gray-600 mt-1">Manage and track scholarship beneficiaries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/beneficiaries/export")}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => router.push("/beneficiaries/applications")}>
              <UserPlus className="w-4 h-4 mr-2" />
              Review Applications
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Beneficiaries</CardTitle>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.total || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Across all levels</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics?.byStatus.active || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Currently supported</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Graduated</CardTitle>
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics?.byStatus.graduated || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Completed education</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Need Attention</CardTitle>
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {needingAttention?.length || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Require intervention</p>
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
                    placeholder="Search by name, number, or school..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={academicLevelFilter} onValueChange={setAcademicLevelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {academicLevels?.map((level) => (
                    <SelectItem key={level._id} value={level._id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Beneficiaries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Beneficiaries List</CardTitle>
            <CardDescription>
              {beneficiaries?.length || 0} beneficiaries found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-gray-700">Beneficiary</th>
                    <th className="text-left p-2 font-medium text-gray-700">Academic Level</th>
                    <th className="text-left p-2 font-medium text-gray-700">School</th>
                    <th className="text-left p-2 font-medium text-gray-700">Performance</th>
                    <th className="text-left p-2 font-medium text-gray-700">Status</th>
                    <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries?.map((beneficiary) => (
                    <tr key={beneficiary._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">
                            {beneficiary.user?.firstName} {beneficiary.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {beneficiary.beneficiaryNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {beneficiary.user?.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <Badge variant="outline">
                            {beneficiary.academicLevel?.name}
                          </Badge>
                          <div className="text-xs text-gray-600 mt-1">
                            {beneficiary.academicLevel?.category}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">{beneficiary.currentSchool}</div>
                        {beneficiary.currentSession && (
                          <div className="text-xs text-gray-600">
                            {beneficiary.currentSession.sessionName}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        {beneficiary.latestPerformance ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {beneficiary.latestPerformance.overallGrade}%
                            </span>
                            {getPerformanceTrend(beneficiary.latestPerformance)}
                            {beneficiary.latestPerformance.needsIntervention && (
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="p-2">
                        {getStatusBadge(beneficiary.status)}
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
                              onClick={() => router.push(`/beneficiaries/${beneficiary._id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/beneficiaries/${beneficiary._id}/edit`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/beneficiaries/${beneficiary._id}/academic`)}
                            >
                              <School className="w-4 h-4 mr-2" />
                              Academic Sessions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(
                                beneficiary._id,
                                "suspended",
                                "Administrative action"
                              )}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {beneficiaries?.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No beneficiaries found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Review and approve applications to add beneficiaries
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/beneficiaries/applications")}
                  >
                    Review Applications
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Beneficiaries Needing Attention */}
        {needingAttention && needingAttention.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Beneficiaries Needing Attention
              </CardTitle>
              <CardDescription>
                These beneficiaries require immediate intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {needingAttention.map((item) => (
                  <div key={item.beneficiary._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {item.user?.firstName} {item.user?.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.beneficiary.beneficiaryNumber}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/beneficiaries/${item.beneficiary._id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {item.alerts.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span>{item.alerts.length} active alerts</span>
                        </div>
                      )}
                      {item.missingDocuments.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>{item.missingDocuments.length} missing documents</span>
                        </div>
                      )}
                      {item.overduePayments.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span>{item.overduePayments.length} overdue payments</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}