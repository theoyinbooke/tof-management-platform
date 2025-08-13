"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Trophy, 
  BookOpen, 
  Users, 
  Target,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  Star,
  Award
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface AcademicDashboardProps {
  foundationId: Id<"foundations">;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function AcademicDashboard({ foundationId }: AcademicDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  // Convex queries
  const performanceAnalytics = useQuery(api.academic.getPerformanceAnalytics, {
    foundationId,
    academicLevelId: selectedLevel !== "all" ? selectedLevel as Id<"academicLevels"> : undefined,
    dateRange: dateRange.from && dateRange.to 
      ? {
          start: dateRange.from.toISOString().split('T')[0],
          end: dateRange.to.toISOString().split('T')[0],
        }
      : undefined,
  });

  const performanceAlerts = useQuery(api.academic.getPerformanceAlerts, {
    foundationId,
    status: "active",
  });

  const academicLevels = useQuery(api.academic.getActiveByFoundation, {
    foundationId,
  });

  const academicSessions = useQuery(api.academic.getSessionsByFoundation, {
    foundationId,
    status: "active",
  });

  // Get grade color
  const getGradeColor = (grade: number) => {
    if (grade >= 80) return "text-emerald-600";
    if (grade >= 70) return "text-sky-600";
    if (grade >= 60) return "text-amber-600";
    return "text-red-600";
  };

  // Get grade label
  const getGradeLabel = (grade: number) => {
    if (grade >= 80) return "Excellent";
    if (grade >= 70) return "Good";
    if (grade >= 60) return "Average";
    return "Needs Improvement";
  };

  if (!performanceAnalytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="p-6">
                <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded mb-2" />
                <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { 
    totalRecords, 
    averageGrade, 
    gradeDistribution, 
    needsIntervention, 
    improved, 
    recentRecords 
  } = performanceAnalytics;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Academic Progress Dashboard</h1>
          <p className="text-gray-600">Monitor student performance and academic achievements</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select academic level" />
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-72 justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <div className="text-2xl font-bold text-gray-900">
                  {totalRecords}
                </div>
                <p className="text-xs text-gray-500">Academic assessments</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <div className={cn("text-2xl font-bold", getGradeColor(averageGrade))}>
                  {averageGrade.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500">{getGradeLabel(averageGrade)}</p>
              </div>
              <div className="h-12 w-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Need Intervention</p>
                <div className="text-2xl font-bold text-red-600">
                  {needsIntervention}
                </div>
                <p className="text-xs text-gray-500">Students requiring support</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Improved</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {improved}
                </div>
                <p className="text-xs text-gray-500">Students showing progress</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Alerts */}
      {performanceAlerts && performanceAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Performance Alerts ({performanceAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceAlerts.slice(0, 3).map((alert) => (
                <div key={alert._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-sm text-red-800">{alert.title}</p>
                    <p className="text-xs text-red-600">
                      {alert.beneficiaryUser?.firstName} {alert.beneficiaryUser?.lastName} - {alert.description}
                    </p>
                  </div>
                  <Badge 
                    className={cn(
                      "text-xs",
                      alert.severity === "critical" ? "bg-red-600 text-white" :
                      alert.severity === "high" ? "bg-red-500 text-white" :
                      alert.severity === "medium" ? "bg-amber-500 text-white" :
                      "bg-yellow-500 text-white"
                    )}
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
            {performanceAlerts.length > 3 && (
              <Button variant="outline" size="sm" className="mt-3 border-red-300 text-red-700 hover:bg-red-100">
                View All {performanceAlerts.length} Alerts
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Grade Distribution
                </CardTitle>
                <CardDescription>Performance breakdown by grade ranges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">Excellent (80-100%)</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{gradeDistribution.excellent}</span>
                  </div>
                  <Progress 
                    value={totalRecords > 0 ? (gradeDistribution.excellent / totalRecords) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-sky-600" />
                      <span className="text-sm font-medium">Good (70-79%)</span>
                    </div>
                    <span className="text-sm font-bold text-sky-600">{gradeDistribution.good}</span>
                  </div>
                  <Progress 
                    value={totalRecords > 0 ? (gradeDistribution.good / totalRecords) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium">Average (60-69%)</span>
                    </div>
                    <span className="text-sm font-bold text-amber-600">{gradeDistribution.average}</span>
                  </div>
                  <Progress 
                    value={totalRecords > 0 ? (gradeDistribution.average / totalRecords) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Needs Improvement (0-59%)</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{gradeDistribution.poor}</span>
                  </div>
                  <Progress 
                    value={totalRecords > 0 ? (gradeDistribution.poor / totalRecords) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Performance Records */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  Recent Performance Records
                </CardTitle>
                <CardDescription>Latest academic assessments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentRecords.slice(0, 5).map((record) => (
                  <div key={record._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        record.overallGrade && record.overallGrade >= 80 ? "bg-emerald-500" :
                        record.overallGrade && record.overallGrade >= 70 ? "bg-sky-500" :
                        record.overallGrade && record.overallGrade >= 60 ? "bg-amber-500" : "bg-red-500"
                      )} />
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          Academic Session Record
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {record.overallGrade ? (
                        <p className={cn("font-medium text-sm", getGradeColor(record.overallGrade))}>
                          {record.overallGrade}%
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">No grade</p>
                      )}
                      {record.needsIntervention && (
                        <Badge variant="destructive" className="text-xs">
                          Intervention Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full">
                  View All Records
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>Detailed performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Performance analysis components will go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Academic Sessions</CardTitle>
              <CardDescription>Manage and track academic sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {academicSessions?.slice(0, 5).map((session) => (
                  <div key={session._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{session.sessionName}</p>
                      <p className="text-xs text-gray-500">
                        {session.beneficiaryUser?.firstName} {session.beneficiaryUser?.lastName} - {session.academicLevel?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.startDate} to {session.endDate}
                      </p>
                    </div>
                    <Badge variant={
                      session.status === "active" ? "default" :
                      session.status === "completed" ? "secondary" :
                      session.status === "planned" ? "outline" : "destructive"
                    }>
                      {session.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Performance Alerts</CardTitle>
              <CardDescription>Monitor and manage academic performance alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Alert management components will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}