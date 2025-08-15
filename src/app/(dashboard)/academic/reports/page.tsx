"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3,
  Download,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  BookOpen,
  FileText,
  Eye,
  ArrowLeft,
  Clock,
  CheckCircle,
  Target,
  GraduationCap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function AcademicReportsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [selectedPeriod, setSelectedPeriod] = useState("current_term");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [reportType, setReportType] = useState("overview");

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch data for reports
  const performanceAnalytics = useQuery(
    api.academic.getPerformanceAnalytics,
    foundationId ? { 
      foundationId,
      academicLevelId: selectedLevel !== "all" ? selectedLevel as Id<"academicLevels"> : undefined,
    } : "skip"
  );

  const academicLevels = useQuery(
    api.academic.getActiveByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  const beneficiaryProgress = useQuery(
    api.academic.getBeneficiaryProgress,
    foundationId ? { 
      foundationId,
      academicLevelId: selectedLevel !== "all" ? selectedLevel as Id<"academicLevels"> : undefined,
    } : "skip"
  );

  const alertsAnalytics = useQuery(
    api.academic.getAlertsAnalytics,
    foundationId ? { foundationId } : "skip"
  );

  const performanceOverview = useQuery(
    api.academic.getPerformanceOverview,
    foundationId ? { foundationId } : "skip"
  );

  const handleExportReport = () => {
    toast.info("Report export functionality coming soon");
  };

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

  const getTrendIcon = (hasImproved: boolean | undefined) => {
    if (hasImproved === true) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (hasImproved === false) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Academic Reports</h1>
              <p className="text-gray-600 mt-1">Comprehensive academic performance analysis and insights</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Performance Overview</SelectItem>
                    <SelectItem value="detailed">Detailed Analytics</SelectItem>
                    <SelectItem value="trends">Performance Trends</SelectItem>
                    <SelectItem value="alerts">Alert Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_term">Current Term</SelectItem>
                    <SelectItem value="last_term">Last Term</SelectItem>
                    <SelectItem value="current_year">Current Academic Year</SelectItem>
                    <SelectItem value="last_year">Last Academic Year</SelectItem>
                    <SelectItem value="all_time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Academic Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {academicLevels?.map((level) => (
                      <SelectItem key={level._id} value={level._id}>
                        {level.name} ({level.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Performance Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
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
                    {performanceOverview?.totalBeneficiaries || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Active students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Average Performance</CardTitle>
                    <Target className="w-4 h-4 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPerformanceColor(performanceOverview?.averagePerformance || 0)}`}>
                    {performanceOverview?.averagePerformance?.toFixed(1) || "0.0"}%
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Overall average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Excellent Performers</CardTitle>
                    <Award className="w-4 h-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {performanceOverview?.performanceDistribution?.excellent || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">80%+ average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Need Support</CardTitle>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {performanceOverview?.performanceDistribution?.needsImprovement || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Below 60%</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Distribution</CardTitle>
                  <CardDescription>Breakdown of beneficiary performance levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Excellent (80-100%)</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {performanceOverview?.performanceDistribution?.excellent || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Good (70-79%)</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {performanceOverview?.performanceDistribution?.good || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Satisfactory (60-69%)</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-600">
                        {performanceOverview?.performanceDistribution?.satisfactory || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-800">Needs Improvement (&lt;60%)</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {performanceOverview?.performanceDistribution?.needsImprovement || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alert Summary</CardTitle>
                  <CardDescription>Current alerts requiring attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-medium">Active Alerts</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {alertsAnalytics?.totalActive || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">In Progress</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {alertsAnalytics?.inProgressCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Resolved Today</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {alertsAnalytics?.resolvedToday || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Detailed Analytics Tab */}
          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Individual Beneficiary Performance</CardTitle>
                <CardDescription>Detailed performance analysis for each beneficiary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-gray-700">Beneficiary</th>
                        <th className="text-left p-2 font-medium text-gray-700">Academic Level</th>
                        <th className="text-left p-2 font-medium text-gray-700">Current Session</th>
                        <th className="text-left p-2 font-medium text-gray-700">Average Score</th>
                        <th className="text-left p-2 font-medium text-gray-700">Performance</th>
                        <th className="text-left p-2 font-medium text-gray-700">Trend</th>
                        <th className="text-left p-2 font-medium text-gray-700">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beneficiaryProgress?.slice(0, 10).map((progress) => (
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
                            <div className="flex items-center gap-2">
                              {getTrendIcon(progress.hasImproved)}
                              <span className="text-sm text-gray-600">
                                {progress.hasImproved === true ? "Improved" : 
                                 progress.hasImproved === false ? "Declined" : "No change"}
                              </span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm text-gray-600">
                              {progress.lastUpdated ? formatDate(new Date(progress.lastUpdated)) : "N/A"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {(!beneficiaryProgress || beneficiaryProgress.length === 0) && (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No performance data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <CardTitle>Improvement Analysis</CardTitle>
                  <CardDescription>Students showing improvement trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {beneficiaryProgress?.filter(p => p.hasImproved === true).slice(0, 5).map((progress) => (
                      <div key={progress._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">
                              {progress.beneficiary?.user?.firstName} {progress.beneficiary?.user?.lastName}
                            </p>
                            <p className="text-sm text-green-600">
                              {progress.academicLevel?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{progress.averageScore?.toFixed(1)}%</p>
                          <p className="text-xs text-green-500">Improved</p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No improvement data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Analytics</CardTitle>
                <CardDescription>Comprehensive alert summary and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{alertsAnalytics?.totalActive || 0}</div>
                    <p className="text-sm text-gray-600">Active Alerts</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{alertsAnalytics?.inProgressCount || 0}</div>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{alertsAnalytics?.resolvedToday || 0}</div>
                    <p className="text-sm text-gray-600">Resolved Today</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingDown className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-500">{alertsAnalytics?.performanceAlerts || 0}</div>
                    <p className="text-sm text-gray-600">Performance Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}