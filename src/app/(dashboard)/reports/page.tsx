"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  BarChart3,
  Users,
  GraduationCap,
  DollarSign,
  Calendar as CalendarIcon,
  Download,
  FileText,
  TrendingUp,
  Award,
  Target,
  Activity,
  PieChart,
  LineChart,
  BookOpen,
  MapPin,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user } = useCurrentUser();
  const [selectedReport, setSelectedReport] = useState("beneficiary");
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

  // Fetch reports data
  const beneficiaryReport = useQuery(
    api.reports.getBeneficiaryReport,
    user?.foundationId ? {
      foundationId: user.foundationId,
      startDate: dateRange.from?.getTime(),
      endDate: dateRange.to?.getTime(),
    } : "skip"
  );

  const financialReport = useQuery(
    api.reports.getFinancialReport,
    user?.foundationId ? {
      foundationId: user.foundationId,
      startDate: dateRange.from?.getTime(),
      endDate: dateRange.to?.getTime(),
    } : "skip"
  );

  const programReport = useQuery(
    api.reports.getProgramReport,
    user?.foundationId ? {
      foundationId: user.foundationId,
      startDate: dateRange.from?.getTime(),
      endDate: dateRange.to?.getTime(),
    } : "skip"
  );

  const academicReport = useQuery(
    api.reports.getAcademicReport,
    user?.foundationId ? {
      foundationId: user.foundationId,
      startDate: dateRange.from?.getTime(),
      endDate: dateRange.to?.getTime(),
    } : "skip"
  );

  const impactReport = useQuery(
    api.reports.getImpactReport,
    user?.foundationId ? {
      foundationId: user.foundationId,
      startDate: dateRange.from?.getTime(),
      endDate: dateRange.to?.getTime(),
    } : "skip"
  );

  const handleExportReport = async (reportType: string) => {
    toast.info("Export functionality will be available soon");
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights and performance analysis
            </p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={() => handleExportReport(selectedReport)}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Report Tabs */}
        <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="beneficiary">
              <Users className="w-4 h-4 mr-2" />
              Beneficiaries
            </TabsTrigger>
            <TabsTrigger value="financial">
              <DollarSign className="w-4 h-4 mr-2" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="programs">
              <BookOpen className="w-4 h-4 mr-2" />
              Programs
            </TabsTrigger>
            <TabsTrigger value="academic">
              <GraduationCap className="w-4 h-4 mr-2" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="impact">
              <Award className="w-4 h-4 mr-2" />
              Impact
            </TabsTrigger>
          </TabsList>

          {/* Beneficiary Report */}
          <TabsContent value="beneficiary" className="space-y-6">
            {beneficiaryReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Beneficiaries</CardTitle>
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{beneficiaryReport.summary.totalBeneficiaries}</div>
                      <p className="text-xs text-gray-600 mt-1">
                        {beneficiaryReport.summary.activeBeneficiaries} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Graduated</CardTitle>
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{beneficiaryReport.summary.graduatedBeneficiaries}</div>
                      <p className="text-xs text-gray-600 mt-1">
                        {Math.round((beneficiaryReport.summary.graduatedBeneficiaries / beneficiaryReport.summary.totalBeneficiaries) * 100)}% graduation rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Average Grade</CardTitle>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {beneficiaryReport.summary.overallAverageGrade || "N/A"}
                        {beneficiaryReport.summary.overallAverageGrade && "%"}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Overall performance
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Support Types</CardTitle>
                        <Target className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Object.keys(beneficiaryReport.summary.supportTypeDistribution).length}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Different support types
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Academic Level Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Level Distribution</CardTitle>
                    <CardDescription>Distribution of beneficiaries across academic levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(beneficiaryReport.summary.academicLevelDistribution).map(([level, count]) => (
                        <div key={level} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{count as number}</div>
                          <p className="text-sm text-gray-600">{level}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Support Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Support Type Distribution</CardTitle>
                    <CardDescription>Types of support provided to beneficiaries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(beneficiaryReport.summary.supportTypeDistribution).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                          <Badge variant="secondary">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Beneficiaries Overview</CardTitle>
                    <CardDescription>Latest beneficiaries with their performance summary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {beneficiaryReport.beneficiaries.slice(0, 10).map((beneficiary) => (
                        <div key={beneficiary._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {beneficiary.user?.firstName} {beneficiary.user?.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {beneficiary.beneficiaryNumber} • {beneficiary.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Sessions</p>
                                <p className="font-medium">{beneficiary.statistics.totalAcademicSessions}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Programs</p>
                                <p className="font-medium">{beneficiary.statistics.activePrograms}</p>
                              </div>
                              {beneficiary.statistics.averageGrade && (
                                <div>
                                  <p className="text-gray-600">Avg Grade</p>
                                  <p className="font-medium text-blue-600">{beneficiary.statistics.averageGrade}%</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </TabsContent>

          {/* Financial Report */}
          <TabsContent value="financial" className="space-y-6">
            {financialReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialReport.summary.totalIncome)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Revenue generated
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(financialReport.summary.totalExpenses)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Money spent
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Net Income</CardTitle>
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${
                        financialReport.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(financialReport.summary.netIncome)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Profit/Loss
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Payment Rate</CardTitle>
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(financialReport.summary.paymentRate)}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Invoice collection rate
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Income by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Income by Category</CardTitle>
                    <CardDescription>Revenue breakdown by source</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(financialReport.breakdown.incomeByCategory).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                          <span className="text-green-700 font-bold">{formatCurrency(amount as number)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Expenses by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                    <CardDescription>Spending breakdown by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(financialReport.breakdown.expensesByCategory).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                          <span className="text-red-700 font-bold">{formatCurrency(amount as number)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Program Budget Utilization */}
                <Card>
                  <CardHeader>
                    <CardTitle>Program Budget Utilization</CardTitle>
                    <CardDescription>How program budgets are being utilized</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {financialReport.breakdown.programBudgetData.map((program) => (
                        <div key={program.programId} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{program.programName}</h4>
                            <Badge 
                              variant={program.utilizationRate > 90 ? "destructive" : 
                                     program.utilizationRate > 70 ? "default" : "secondary"}
                            >
                              {Math.round(program.utilizationRate)}% utilized
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Allocated</p>
                              <p className="font-medium">{formatCurrency(program.budgetAllocated)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Spent</p>
                              <p className="font-medium text-red-600">{formatCurrency(program.budgetSpent)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Remaining</p>
                              <p className="font-medium text-green-600">{formatCurrency(program.budgetRemaining)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </TabsContent>

          {/* Program Report */}
          <TabsContent value="programs" className="space-y-6">
            {programReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Programs</CardTitle>
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{programReport.summary.totalPrograms}</div>
                      <p className="text-xs text-gray-600 mt-1">
                        {programReport.summary.activePrograms} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Enrollments</CardTitle>
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{programReport.summary.totalEnrollments}</div>
                      <p className="text-xs text-gray-600 mt-1">
                        Across all programs
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {programReport.summary.overallCompletionRate}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Program completion
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
                        <Activity className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {programReport.summary.overallAttendanceRate}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Average attendance
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Program Type Effectiveness */}
                <Card>
                  <CardHeader>
                    <CardTitle>Program Type Effectiveness</CardTitle>
                    <CardDescription>Performance metrics by program type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(programReport.summary.programTypeStats).map(([type, stats]: [string, any]) => (
                        <div key={type} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium capitalize">{type.replace('_', ' ')}</h4>
                            <Badge variant="outline">{stats.count} programs</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Total Enrollments</p>
                              <p className="font-medium">{stats.totalEnrollments}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Completion Rate</p>
                              <p className="font-medium text-green-600">{stats.avgCompletionRate}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Attendance Rate</p>
                              <p className="font-medium text-blue-600">{stats.avgAttendanceRate}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Program Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Program Performance Overview</CardTitle>
                    <CardDescription>Individual program statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {programReport.programs.slice(0, 10).map((program) => (
                        <div key={program.program._id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{program.program.name}</h4>
                              <p className="text-sm text-gray-600 capitalize">
                                {program.program.type.replace('_', ' ')} • {program.program.status}
                              </p>
                            </div>
                            <Badge 
                              className={
                                program.statistics.completionRate >= 80 ? "bg-green-100 text-green-800" :
                                program.statistics.completionRate >= 60 ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }
                            >
                              {program.statistics.completionRate}% completion
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Enrollments</p>
                              <p className="font-medium">{program.statistics.totalEnrollments}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Sessions</p>
                              <p className="font-medium">{program.statistics.totalSessions}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Attendance</p>
                              <p className="font-medium text-purple-600">{program.statistics.attendanceRate}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Coordinator</p>
                              <p className="font-medium">
                                {program.program.coordinator ? 
                                  `${program.program.coordinator.firstName} ${program.program.coordinator.lastName}` : 
                                  "Not assigned"
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </TabsContent>

          {/* Academic Report */}
          <TabsContent value="academic" className="space-y-6">
            {academicReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{academicReport.summary.totalSessions}</div>
                      <p className="text-xs text-gray-600 mt-1">
                        {academicReport.summary.sessionsWithGrades} with grades
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Average Grade</CardTitle>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {academicReport.summary.averageGrade || "N/A"}
                        {academicReport.summary.averageGrade && "%"}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Overall performance
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Need Intervention</CardTitle>
                        <AlertTriangle className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {academicReport.summary.studentsNeedingIntervention}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Students requiring support
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Academic Levels</CardTitle>
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Object.keys(academicReport.summary.levelPerformance).length}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Different levels
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Grade Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Distribution</CardTitle>
                    <CardDescription>Distribution of student grades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(academicReport.summary.gradeDistribution).map(([range, count]) => (
                        <div key={range} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{count as number}</div>
                          <p className="text-sm text-gray-600">{range}%</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Level Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Academic Level</CardTitle>
                    <CardDescription>Average performance across different levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(academicReport.summary.levelPerformance).map(([level, stats]: [string, any]) => (
                        <div key={level} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{level}</h4>
                            <Badge variant="outline">{stats.count} sessions</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Average Grade</p>
                              <p className="font-medium text-blue-600">{stats.averageGrade}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Highest Grade</p>
                              <p className="font-medium text-green-600">{stats.topGrade}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Lowest Grade</p>
                              <p className="font-medium text-red-600">{stats.lowGrade}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Students Needing Intervention */}
                {academicReport.interventionCases.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Students Needing Intervention</CardTitle>
                      <CardDescription>Students who may require additional support</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {academicReport.interventionCases.map((case_, index) => (
                          <div key={index} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  {case_.beneficiary?.user?.firstName} {case_.beneficiary?.user?.lastName}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {case_.beneficiary?.beneficiaryNumber} • {case_.session.sessionName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-orange-600 font-medium">
                                  Grade: {case_.session.overallGrade}%
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(new Date(case_.session.startDate))}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </TabsContent>

          {/* Impact Report */}
          <TabsContent value="impact" className="space-y-6">
            {impactReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Supported</CardTitle>
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{impactReport.summary.totalBeneficiariesSupported}</div>
                      <p className="text-xs text-gray-600 mt-1">
                        Beneficiaries helped
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Graduation Rate</CardTitle>
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {impactReport.summary.graduationRate}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {impactReport.summary.graduatedBeneficiaries} graduated
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Improvement Rate</CardTitle>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {impactReport.summary.improvementRate}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Academic improvement
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Long-term Success</CardTitle>
                        <Award className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {impactReport.summary.longTermSuccessRate}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        2+ year beneficiaries
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Support Type Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle>Support Type Effectiveness</CardTitle>
                    <CardDescription>Success rates by type of support provided</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(impactReport.impact.supportTypeImpact).map(([type, stats]: [string, any]) => (
                        <div key={type} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium capitalize">{type.replace('_', ' ')}</h4>
                            <Badge 
                              className={
                                stats.successRate >= 80 ? "bg-green-100 text-green-800" :
                                stats.successRate >= 60 ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }
                            >
                              {Math.round(stats.successRate)}% success rate
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Total Beneficiaries</p>
                              <p className="font-medium">{stats.total}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Successful Outcomes</p>
                              <p className="font-medium text-green-600">{stats.successful}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Success Rate</p>
                              <p className="font-medium text-blue-600">{Math.round(stats.successRate)}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Geographic Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Impact</CardTitle>
                    <CardDescription>Impact across different states</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(impactReport.impact.geographicImpact).map(([state, stats]: [string, any]) => (
                        <div key={state} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <h4 className="font-medium">{state}</h4>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium">{stats.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Active:</span>
                              <span className="font-medium text-blue-600">{stats.active}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Graduated:</span>
                              <span className="font-medium text-green-600">{stats.graduated}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Year-over-Year Growth */}
                <Card>
                  <CardHeader>
                    <CardTitle>Year-over-Year Impact</CardTitle>
                    <CardDescription>Growth and graduation trends by year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(impactReport.impact.yearlyImpact)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .slice(0, 5)
                        .map(([year, stats]: [string, any]) => (
                        <div key={year} className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{year}</h4>
                            <p className="text-sm text-gray-600">Academic Year</p>
                          </div>
                          <div className="grid grid-cols-2 gap-8 text-right">
                            <div>
                              <p className="text-sm text-gray-600">New Beneficiaries</p>
                              <p className="font-medium text-blue-600">{stats.newBeneficiaries}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Graduations</p>
                              <p className="font-medium text-green-600">{stats.graduations}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}