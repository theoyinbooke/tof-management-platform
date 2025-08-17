"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  Users, 
  GraduationCap, 
  DollarSign,
  Calendar,
  Settings,
  ChevronLeft,
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Edit,
  Power,
  Loader2
} from "lucide-react";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export default function FoundationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const foundationId = params.foundationId as string;
  
  // Pagination state for activities
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);

  // Check if this is the "new" route (shouldn't happen but just in case)
  if (foundationId === "new") {
    router.push("/admin/foundations/new");
    return null;
  }

  // Validate that foundationId looks like a valid Convex ID
  const isValidId = foundationId && foundationId.length > 20 && !foundationId.includes("/");
  
  // Fetch foundation data only if we have a valid ID
  const foundation = useQuery(
    api.foundations.getById, 
    isValidId ? { foundationId: foundationId as Id<"foundations"> } : "skip"
  );
  const statistics = useQuery(
    api.foundations.getStatistics, 
    isValidId ? { foundationId: foundationId as Id<"foundations"> } : "skip"
  );
  const performanceMetrics = useQuery(
    api.foundations.getPerformanceMetrics, 
    isValidId ? { foundationId: foundationId as Id<"foundations"> } : "skip"
  );
  const recentActivities = useQuery(
    api.foundations.getRecentActivities, 
    isValidId ? { foundationId: foundationId as Id<"foundations"> } : "skip"
  );
  const configData = useQuery(
    api.foundations.getConfigurationData, 
    isValidId ? { foundationId: foundationId as Id<"foundations"> } : "skip"
  );

  // Mutations
  const toggleStatus = useMutation(api.foundations.toggleStatus);
  const updateSettings = useMutation(api.foundations.updateSettings);

  const handleToggleStatus = async () => {
    if (!isValidId) return;
    
    try {
      const result = await toggleStatus({ foundationId: foundationId as Id<"foundations"> });
      toast.success(
        result.newStatus 
          ? `${foundation?.name} has been activated` 
          : `${foundation?.name} has been deactivated`
      );
    } catch (error) {
      console.error("Failed to toggle foundation status:", error);
      toast.error("Failed to update foundation status");
    }
  };

  if (!isValidId) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Foundation ID</h2>
            <p className="text-muted-foreground mb-4">The foundation ID provided is not valid.</p>
            <Button onClick={() => router.push("/admin/foundations")}>
              Back to Foundations
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!foundation) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/foundations")}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8 text-emerald-600" />
                {foundation.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Foundation ID: {foundationId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(
              "text-sm px-3 py-1",
              foundation.isActive 
                ? "bg-emerald-100 text-emerald-800" 
                : "bg-gray-100 text-gray-800"
            )}>
              {foundation.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
            >
              <Power className="h-4 w-4 mr-2" />
              {foundation.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/admin/foundations/${foundationId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Beneficiaries</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalBeneficiaries || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics?.activeBeneficiaries || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics?.pendingApplications || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics?.adminUsers || 0} admins, {statistics?.reviewerUsers || 0} reviewers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programs</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalPrograms || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics?.activePrograms || 0} active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Foundation Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Foundation Details</CardTitle>
                  <CardDescription>Basic information about the foundation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Registration</p>
                    <p className="text-sm">{foundation.description || "Not provided"}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">{formatDate(new Date(foundation.createdAt))}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{formatDate(new Date(foundation.updatedAt))}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Default Currency</p>
                    <p className="text-sm">{foundation.settings?.defaultCurrency || "NGN"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Exchange Rate</p>
                    <p className="text-sm">₦{foundation.settings?.exchangeRate || 1500} to $1</p>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceMetrics ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Application Processing Time</p>
                          <span className="text-sm text-muted-foreground">
                            {performanceMetrics.avgProcessingTime} days avg
                          </span>
                        </div>
                        <Progress value={Math.min(100, (3 / performanceMetrics.avgProcessingTime) * 100)} />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Beneficiary Retention Rate</p>
                          <span className="text-sm text-muted-foreground">
                            {performanceMetrics.retentionRate}%
                          </span>
                        </div>
                        <Progress value={performanceMetrics.retentionRate} />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Academic Performance Average</p>
                          <span className="text-sm text-muted-foreground">
                            {performanceMetrics.academicAverage}%
                          </span>
                        </div>
                        <Progress value={performanceMetrics.academicAverage} />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Fund Disbursement Rate</p>
                          <span className="text-sm text-muted-foreground">
                            {performanceMetrics.disbursementRate}%
                          </span>
                        </div>
                        <Progress value={performanceMetrics.disbursementRate} />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading metrics...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Beneficiary Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Active</span>
                      <span className="font-medium">{statistics?.byStatus?.beneficiaries?.active || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Graduated</span>
                      <span className="font-medium">{statistics?.byStatus?.beneficiaries?.graduated || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Suspended</span>
                      <span className="font-medium">{statistics?.byStatus?.beneficiaries?.suspended || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Withdrawn</span>
                      <span className="font-medium">{statistics?.byStatus?.beneficiaries?.withdrawn || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Pending</span>
                      <span className="font-medium">{statistics?.byStatus?.applications?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Under Review</span>
                      <span className="font-medium">{statistics?.byStatus?.applications?.under_review || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Approved</span>
                      <span className="font-medium">{statistics?.byStatus?.applications?.approved || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rejected</span>
                      <span className="font-medium">{statistics?.byStatus?.applications?.rejected || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Academic Levels</CardTitle>
                  <CardDescription>Nigerian education system levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Configured</span>
                      <Badge variant="outline">{configData?.academicLevels?.length || 0}</Badge>
                    </div>
                    {configData?.academicLevels?.length ? (
                      <div className="text-xs text-muted-foreground space-y-1 mt-2">
                        <div>Nursery: {configData.academicLevels.filter((l: any) => l.category === "nursery").length}</div>
                        <div>Primary: {configData.academicLevels.filter((l: any) => l.category === "primary").length}</div>
                        <div>Secondary: {configData.academicLevels.filter((l: any) => l.category === "secondary").length}</div>
                        <div>University: {configData.academicLevels.filter((l: any) => l.category === "university").length}</div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fee Categories</CardTitle>
                  <CardDescription>Types of fees and expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Configured</span>
                      <Badge variant="outline">{configData?.feeCategories?.length || 0}</Badge>
                    </div>
                    {configData?.feeCategories?.length ? (
                      <div className="text-xs text-muted-foreground space-y-1 mt-2">
                        <div>Required: {configData.feeCategories.filter((c: any) => c.isRequired).length}</div>
                        <div>Optional: {configData.feeCategories.filter((c: any) => !c.isRequired).length}</div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Types</CardTitle>
                  <CardDescription>Required documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Configured</span>
                      <Badge variant="outline">{configData?.documentTypes?.length || 0}</Badge>
                    </div>
                    {configData?.documentTypes?.length ? (
                      <div className="text-xs text-muted-foreground space-y-1 mt-2">
                        <div>Required: {configData.documentTypes.filter((d: any) => d.isRequired).length}</div>
                        <div>Optional: {configData.documentTypes.filter((d: any) => !d.isRequired).length}</div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest actions and events in this foundation</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities?.length ? (
                  <>
                    {/* Compact Table View */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead className="w-[150px]">User</TableHead>
                            <TableHead className="w-[150px]">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            // Calculate pagination
                            const startIndex = (activityPage - 1) * activityPageSize;
                            const endIndex = startIndex + activityPageSize;
                            const paginatedActivities = recentActivities.slice(startIndex, endIndex);
                            
                            return paginatedActivities.map((activity: any, index: number) => (
                              <TableRow key={startIndex + index}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "p-1.5 rounded-full",
                                      activity.type === "application" && "bg-blue-100",
                                      activity.type === "beneficiary" && "bg-emerald-100",
                                      activity.type === "payment" && "bg-yellow-100",
                                      activity.type === "alert" && "bg-red-100"
                                    )}>
                                      {activity.type === "application" && <FileText className="h-3 w-3 text-blue-600" />}
                                      {activity.type === "beneficiary" && <Users className="h-3 w-3 text-emerald-600" />}
                                      {activity.type === "payment" && <DollarSign className="h-3 w-3 text-yellow-600" />}
                                      {activity.type === "alert" && <AlertCircle className="h-3 w-3 text-red-600" />}
                                    </div>
                                    <span className="text-xs font-medium capitalize">
                                      {activity.type}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {activity.description}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground truncate">
                                    {activity.userEmail}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(new Date(activity.timestamp))}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="mt-4">
                      <DataTablePagination
                        currentPage={activityPage}
                        totalPages={Math.ceil(recentActivities.length / activityPageSize)}
                        pageSize={activityPageSize}
                        totalItems={recentActivities.length}
                        onPageChange={setActivityPage}
                        onPageSizeChange={(newSize) => {
                          setActivityPageSize(newSize);
                          setActivityPage(1);
                        }}
                        pageSizeOptions={[5, 10, 20, 50]}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activities</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Foundation Settings</CardTitle>
                <CardDescription>Configure operational settings for this foundation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium mb-1">Academic Year</p>
                    <p className="text-sm text-muted-foreground">
                      {foundation.settings?.academicYearStart} - {foundation.settings?.academicYearEnd}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Application Deadline</p>
                    <p className="text-sm text-muted-foreground">
                      {foundation.settings?.applicationDeadline}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Payment Terms</p>
                    <p className="text-sm text-muted-foreground">
                      {foundation.settings?.paymentTerms}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Status</p>
                    <Badge className={cn(
                      foundation.isActive 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-gray-100 text-gray-800"
                    )}>
                      {foundation.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button onClick={() => router.push(`/admin/foundations/${foundationId}/edit`)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}