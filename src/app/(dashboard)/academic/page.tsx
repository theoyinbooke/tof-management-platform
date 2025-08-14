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
  BookOpen,
  Plus,
  Filter,
  Download,
  Users,
  GraduationCap,
  Calendar,
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Clock,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  FileText,
  AlertCircle,
  CheckCircle,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { PerformanceForm } from "@/components/academic/performance-form";

export default function AcademicPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch academic data
  const academicLevels = useQuery(
    api.academic.getActiveByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  const academicSessions = useQuery(
    api.academicSessions.getByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  const academicPerformance = useQuery(
    api.academic.getPerformanceOverview,
    foundationId ? { foundationId } : "skip"
  );

  const beneficiaryProgress = useQuery(
    api.academic.getBeneficiaryProgress,
    foundationId ? { 
      foundationId,
      academicLevelId: levelFilter !== "all" ? levelFilter as Id<"academicLevels"> : undefined,
      sessionId: sessionFilter !== "all" ? sessionFilter as Id<"academicSessions"> : undefined,
    } : "skip"
  );

  // Performance alerts
  const performanceAlerts = useQuery(
    api.academic.getPerformanceAlerts,
    foundationId ? { foundationId } : "skip"
  );

  const getPerformanceColor = (average: number) => {
    if (average >= 80) return "text-green-600";
    if (average >= 70) return "text-blue-600";
    if (average >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (average: number) => {
    if (average >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (average >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (average >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Satisfactory</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Academic Management</h1>
            <p className="text-gray-600 mt-1">Track academic progress and manage educational records</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/academic/reports")}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </Button>
            {foundationId && (
              <PerformanceForm foundationId={foundationId} />
            )}
            <Button onClick={() => router.push("/academic/sessions")}>
              <Plus className="w-4 h-4 mr-2" />
              Manage Sessions
            </Button>
          </div>
        </div>

        {/* Academic Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Beneficiaries</CardTitle>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {academicPerformance?.totalBeneficiaries || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Academic Levels</CardTitle>
                <GraduationCap className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {academicLevels?.length || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Active levels</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Current Sessions</CardTitle>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {academicSessions?.filter(s => s.status === "active").length || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Active sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Average Performance</CardTitle>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(academicPerformance?.averagePerformance || 0)}`}>
                {academicPerformance?.averagePerformance?.toFixed(1) || "0.0"}%
              </div>
              <p className="text-xs text-gray-600 mt-1">Overall average</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Alerts */}
        {performanceAlerts && performanceAlerts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="w-5 h-5" />
                Performance Alerts ({performanceAlerts.length})
              </CardTitle>
              <CardDescription className="text-orange-700">
                Students requiring attention or intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceAlerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-900">{alert.beneficiaryName}</p>
                        <p className="text-sm text-gray-600">{alert.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-orange-700">
                        {alert.priority}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {performanceAlerts.length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm">
                      View All {performanceAlerts.length} Alerts
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search beneficiaries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Levels</SelectItem>
                  {academicLevels?.map((level) => (
                    <SelectItem key={level._id} value={level._id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Sessions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {academicSessions?.map((session) => (
                    <SelectItem key={session._id} value={session._id}>
                      {session.sessionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Academic Overview</TabsTrigger>
            <TabsTrigger value="progress">Student Progress</TabsTrigger>
            <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
            <TabsTrigger value="sessions">Session Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Academic Levels Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Academic Levels</CardTitle>
                  <CardDescription>Distribution of beneficiaries across academic levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {academicLevels?.map((level) => (
                    <div key={level._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{level.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{level.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{level.beneficiaryCount || 0}</p>
                        <p className="text-xs text-gray-600">students</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Overall academic performance distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Excellent (80-100%)</span>
                      <span className="text-green-600 font-bold">
                        {academicPerformance?.performanceDistribution?.excellent || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Good (70-79%)</span>
                      <span className="text-blue-600 font-bold">
                        {academicPerformance?.performanceDistribution?.good || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Satisfactory (60-69%)</span>
                      <span className="text-yellow-600 font-bold">
                        {academicPerformance?.performanceDistribution?.satisfactory || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Needs Improvement (&lt;60%)</span>
                      <span className="text-red-600 font-bold">
                        {academicPerformance?.performanceDistribution?.needsImprovement || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Progress Tracking</CardTitle>
                <CardDescription>
                  Monitor individual student academic progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-gray-700">Student</th>
                        <th className="text-left p-2 font-medium text-gray-700">Academic Level</th>
                        <th className="text-left p-2 font-medium text-gray-700">Current Session</th>
                        <th className="text-left p-2 font-medium text-gray-700">Average Score</th>
                        <th className="text-left p-2 font-medium text-gray-700">Performance</th>
                        <th className="text-left p-2 font-medium text-gray-700">Last Updated</th>
                        <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beneficiaryProgress?.map((progress) => (
                        <tr key={progress._id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">
                                {progress.beneficiary?.user?.firstName} {progress.beneficiary?.user?.lastName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {progress.beneficiary?.beneficiaryNumber}
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">
                              {progress.academicLevel?.name}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              {progress.session?.sessionName}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className={`text-lg font-bold ${getPerformanceColor(progress.averageScore || 0)}`}>
                              {progress.averageScore?.toFixed(1) || "N/A"}%
                            </div>
                          </td>
                          <td className="p-2">
                            {getPerformanceBadge(progress.averageScore || 0)}
                          </td>
                          <td className="p-2">
                            <div className="text-sm text-gray-600">
                              {progress.lastUpdated ? formatDate(new Date(progress.lastUpdated)) : "N/A"}
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
                                  onClick={() => router.push(`/academic/progress/${progress._id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/academic/progress/${progress._id}/edit`)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Update Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Generate Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {(!beneficiaryProgress || beneficiaryProgress.length === 0) && (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No academic progress data found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Start recording academic performance to see progress
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => router.push("/academic/progress/create")}
                      >
                        Record Progress
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Academic performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Performance charts coming soon</p>
                    <p className="text-sm text-gray-400">Charts will show performance trends and analytics</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Performance breakdown by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Subject analysis coming soon</p>
                    <p className="text-sm text-gray-400">Detailed subject-wise performance analysis</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Academic Sessions</CardTitle>
                    <CardDescription>Manage academic sessions and terms</CardDescription>
                  </div>
                  <Button onClick={() => router.push("/academic/sessions/create")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {academicSessions?.map((session) => (
                    <div key={session._id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{session.sessionName}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(new Date(session.startDate))} - {formatDate(new Date(session.endDate))}
                        </p>
                        <div className="mt-1">
                          <Badge 
                            className={
                              session.status === "active" 
                                ? "bg-green-100 text-green-800" 
                                : session.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/academic/sessions/${session._id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/academic/sessions/${session._id}/edit`)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!academicSessions || academicSessions.length === 0) && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No academic sessions found</p>
                      <p className="text-sm text-gray-400 mt-1">Create sessions to start tracking academic progress</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}