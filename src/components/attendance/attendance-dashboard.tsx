"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Target,
  UserCheck,
  UserX,
  Timer
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface AttendanceDashboardProps {
  foundationId: Id<"foundations">;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function AttendanceDashboard({ foundationId }: AttendanceDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  // Convex queries
  const attendanceAnalytics = useQuery(api.attendance.getAttendanceAnalytics, {
    foundationId,
    programId: selectedProgram !== "all" ? selectedProgram as Id<"programs"> : undefined,
    dateRange: dateRange.from && dateRange.to 
      ? {
          start: dateRange.from.toISOString().split('T')[0],
          end: dateRange.to.toISOString().split('T')[0],
        }
      : undefined,
  });

  const programs = useQuery(api.programs.getByFoundation, {
    foundationId,
  });

  // Get attendance status color and icon
  const getAttendanceStatusColor = (rate: number) => {
    if (rate >= 90) return "text-emerald-600";
    if (rate >= 75) return "text-sky-600";
    if (rate >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getAttendanceStatusLabel = (rate: number) => {
    if (rate >= 90) return "Excellent";
    if (rate >= 75) return "Good";
    if (rate >= 60) return "Average";
    return "Poor";
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "late":
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!attendanceAnalytics) {
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
    overview,
    poorAttendanceCount,
    poorAttendance,
    programCount,
    beneficiaryCount
  } = attendanceAnalytics;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Dashboard</h1>
          <p className="text-gray-600">Monitor and track program attendance across the foundation</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs?.map((program) => (
                <SelectItem key={program._id} value={program._id}>
                  {program.name}
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
                <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
                <div className={cn("text-2xl font-bold", getAttendanceStatusColor(overview.overallAttendanceRate))}>
                  {overview.overallAttendanceRate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500">{getAttendanceStatusLabel(overview.overallAttendanceRate)}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <div className="text-2xl font-bold text-gray-900">
                  {overview.totalSessions.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">Across {programCount} programs</p>
              </div>
              <div className="h-12 w-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Rate</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {overview.totalSessions > 0 ? ((overview.totalPresent / overview.totalSessions) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-gray-500">{overview.totalPresent.toLocaleString()} present</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Poor Attendance</p>
                <div className="text-2xl font-bold text-red-600">
                  {poorAttendanceCount}
                </div>
                <p className="text-xs text-gray-500">Students below 75%</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Poor Attendance Alerts */}
      {poorAttendanceCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Poor Attendance Alerts ({poorAttendanceCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {poorAttendance.slice(0, 5).map((alert) => (
                <div key={alert.beneficiaryId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-sm text-red-800">
                      Beneficiary ID: {alert.beneficiaryId}
                    </p>
                    <p className="text-xs text-red-600">
                      Attendance: {alert.attendanceRate.toFixed(1)}% ({alert.totalSessions} sessions)
                    </p>
                  </div>
                  <Badge className="bg-red-600 text-white text-xs">
                    Action Required
                  </Badge>
                </div>
              ))}
            </div>
            {poorAttendanceCount > 5 && (
              <Button variant="outline" size="sm" className="mt-3 border-red-300 text-red-700 hover:bg-red-100">
                View All {poorAttendanceCount} Students
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Breakdown */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Attendance Breakdown
                </CardTitle>
                <CardDescription>Distribution of attendance statuses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">Present</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{overview.totalPresent}</span>
                  </div>
                  <Progress 
                    value={overview.totalSessions > 0 ? (overview.totalPresent / overview.totalSessions) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium">Late</span>
                    </div>
                    <span className="text-sm font-bold text-amber-600">{overview.totalLate}</span>
                  </div>
                  <Progress 
                    value={overview.totalSessions > 0 ? (overview.totalLate / overview.totalSessions) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Absent</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{overview.totalAbsent}</span>
                  </div>
                  <Progress 
                    value={overview.totalSessions > 0 ? (overview.totalAbsent / overview.totalSessions) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Sessions</span>
                    <span className="text-lg font-bold text-gray-900">{overview.totalSessions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Quick Statistics
                </CardTitle>
                <CardDescription>Key attendance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">
                      {overview.overallAttendanceRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-emerald-700">Overall Rate</p>
                  </div>
                  
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {overview.overallLateRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-amber-700">Late Rate</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Active Programs</span>
                    <span className="font-bold">{programCount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Tracked Students</span>
                    <span className="font-bold">{beneficiaryCount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Avg Sessions/Student</span>
                    <span className="font-bold">
                      {beneficiaryCount > 0 ? (overview.totalSessions / beneficiaryCount).toFixed(1) : 0}
                    </span>
                  </div>
                </div>

                {overview.overallAttendanceRate >= 85 ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700">Excellent attendance performance!</span>
                  </div>
                ) : overview.overallAttendanceRate < 70 ? (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">Attendance needs improvement</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700">Good attendance, can be improved</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Program & Student Breakdown</CardTitle>
              <CardDescription>Detailed attendance analysis by program and student</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Program and student breakdown components will go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>Record and manage session attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Session management components will go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Historical attendance patterns and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Trend analysis components will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}