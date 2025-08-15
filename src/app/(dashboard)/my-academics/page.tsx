"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  School,
  User,
  BarChart3,
  FileText,
  Eye,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

export default function MyAcademicsPage() {
  const { user } = useCurrentUser();
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  // Get beneficiary ID from user
  const beneficiary = useQuery(
    api.beneficiaries.getByUserId,
    user?.clerkId ? { userId: user.clerkId } : "skip"
  );

  const beneficiaryId = beneficiary?._id as Id<"beneficiaries"> | undefined;

  // Fetch academic data
  const academicSessions = useQuery(
    api.academicSessions.getByBeneficiary,
    beneficiaryId ? { beneficiaryId, foundationId: beneficiary.foundationId } : "skip"
  );

  const performanceRecords = useQuery(
    api.academic.getPerformanceByBeneficiary,
    beneficiaryId ? { beneficiaryId } : "skip"
  );

  const currentSession = academicSessions?.find(s => s.status === "active");
  const latestPerformance = performanceRecords?.[0];

  // Calculate academic statistics
  const academicStats = React.useMemo(() => {
    if (!performanceRecords) return null;

    const totalRecords = performanceRecords.length;
    const averageGrade = totalRecords > 0 
      ? performanceRecords.reduce((sum, record) => sum + (record.overallGrade || 0), 0) / totalRecords
      : 0;
    
    const improvingCount = performanceRecords.filter(r => r.hasImproved).length;
    const needsInterventionCount = performanceRecords.filter(r => r.needsIntervention).length;
    
    return {
      totalRecords,
      averageGrade,
      improvingCount,
      needsInterventionCount,
      completedSessions: academicSessions?.filter(s => s.status === "completed").length || 0,
      activeSessions: academicSessions?.filter(s => s.status === "active").length || 0,
    };
  }, [performanceRecords, academicSessions]);

  const getGradeColor = (grade: number) => {
    if (grade >= 80) return "text-green-600";
    if (grade >= 70) return "text-blue-600";
    if (grade >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBadge = (grade: number) => {
    if (grade >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (grade >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (grade >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Satisfactory</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const getProgressPercentage = (grade: number) => {
    return Math.min(Math.max(grade, 0), 100);
  };

  if (!beneficiary) {
    return (
      <ProtectedRoute allowedRoles={["beneficiary"]}>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Beneficiary Profile Not Found</h3>
            <p className="text-gray-600">Please contact your administrator to set up your beneficiary profile.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["beneficiary"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Academic Progress</h1>
            <p className="text-gray-600 mt-1">Track your academic performance and achievements</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              {beneficiary.beneficiaryNumber}
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1">
              {beneficiary.academicLevel?.name}
            </Badge>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Average</p>
                  <div className={`text-2xl font-bold ${getGradeColor(academicStats?.averageGrade || 0)}`}>
                    {academicStats?.averageGrade?.toFixed(1) || "0.0"}%
                  </div>
                  <p className="text-xs text-gray-500">Overall performance</p>
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
                  <p className="text-sm font-medium text-gray-600">Sessions Completed</p>
                  <div className="text-2xl font-bold text-blue-600">
                    {academicStats?.completedSessions || 0}
                  </div>
                  <p className="text-xs text-gray-500">Academic periods</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Improvement Trend</p>
                  <div className="text-2xl font-bold text-green-600">
                    {academicStats?.improvingCount || 0}
                  </div>
                  <p className="text-xs text-gray-500">Sessions improved</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <div className="text-2xl font-bold text-purple-600">
                    {academicStats?.totalRecords || 0}
                  </div>
                  <p className="text-xs text-gray-500">Performance entries</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Session Info */}
        {currentSession && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Clock className="w-5 h-5" />
                Current Academic Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Session Name</p>
                  <p className="text-lg font-semibold text-emerald-900">{currentSession.sessionName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700">Duration</p>
                  <p className="text-emerald-800">
                    {formatDate(new Date(currentSession.startDate))} - {formatDate(new Date(currentSession.endDate))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700">School</p>
                  <p className="text-emerald-800">{currentSession.schoolName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Performance History</TabsTrigger>
            <TabsTrigger value="sessions">Academic Sessions</TabsTrigger>
            <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          </TabsList>

          {/* Performance History Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Latest Performance */}
            {latestPerformance && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Latest Performance
                  </CardTitle>
                  <CardDescription>Your most recent academic performance record</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-3xl font-bold ${getGradeColor(latestPerformance.overallGrade || 0)}`}>
                        {latestPerformance.overallGrade?.toFixed(1) || "N/A"}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Overall Grade</p>
                      {latestPerformance.overallGrade && (
                        <div className="mt-2">
                          {getGradeBadge(latestPerformance.overallGrade)}
                        </div>
                      )}
                    </div>

                    {latestPerformance.position && latestPerformance.totalStudents && (
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">
                          {latestPerformance.position}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          of {latestPerformance.totalStudents} students
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Class Position</p>
                      </div>
                    )}

                    {latestPerformance.attendance && (
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          {latestPerformance.attendance.toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Attendance</p>
                        <Progress 
                          value={latestPerformance.attendance} 
                          className="mt-2"
                        />
                      </div>
                    )}

                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {latestPerformance.subjects?.length || 0}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Subjects</p>
                      <p className="text-xs text-gray-500 mt-1">Recorded</p>
                    </div>
                  </div>

                  {/* Subject Breakdown */}
                  {latestPerformance.subjects && latestPerformance.subjects.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Subject Performance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {latestPerformance.subjects.map((subject, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{subject.name}</span>
                              <span className={`font-bold ${getGradeColor(subject.grade)}`}>
                                {subject.grade}%
                              </span>
                            </div>
                            <Progress 
                              value={getProgressPercentage(subject.grade)} 
                              className="mt-2"
                            />
                            {subject.comment && (
                              <p className="text-xs text-gray-600 mt-1">{subject.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {(latestPerformance.teacherComments || latestPerformance.principalComments) && (
                    <div className="mt-6 space-y-3">
                      {latestPerformance.teacherComments && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-2">Teacher's Comments</h5>
                          <p className="text-blue-800">{latestPerformance.teacherComments}</p>
                        </div>
                      )}
                      
                      {latestPerformance.principalComments && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h5 className="font-medium text-purple-900 mb-2">Principal's Comments</h5>
                          <p className="text-purple-800">{latestPerformance.principalComments}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Performance History */}
            <Card>
              <CardHeader>
                <CardTitle>Performance History</CardTitle>
                <CardDescription>Your academic performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceRecords && performanceRecords.length > 0 ? (
                  <div className="space-y-3">
                    {performanceRecords.slice(0, 5).map((record) => (
                      <div key={record._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {record.hasImproved ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium">{record.session?.sessionName || "Session"}</p>
                              <p className="text-sm text-gray-600">
                                {formatDate(new Date(record.recordedAt))}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getGradeColor(record.overallGrade || 0)}`}>
                              {record.overallGrade?.toFixed(1) || "N/A"}%
                            </div>
                            {record.position && (
                              <p className="text-xs text-gray-600">
                                Position: {record.position}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {record.needsIntervention && (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Needs Support
                              </Badge>
                            )}
                            {record.hasImproved && (
                              <Badge className="bg-green-100 text-green-800">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Improved
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Records</h3>
                    <p className="text-gray-600">Your performance records will appear here once they are recorded.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Academic Sessions</CardTitle>
                <CardDescription>All your academic sessions and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {academicSessions && academicSessions.length > 0 ? (
                  <div className="space-y-4">
                    {academicSessions.map((session) => (
                      <Card key={session._id} className="border-l-4 border-l-emerald-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                <h3 className="font-semibold">{session.sessionName}</h3>
                                <Badge className={
                                  session.status === "active" ? "bg-green-100 text-green-800" :
                                  session.status === "completed" ? "bg-blue-100 text-blue-800" :
                                  session.status === "planned" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                                }>
                                  {session.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Duration</p>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(new Date(session.startDate))} - {formatDate(new Date(session.endDate))}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Academic Level</p>
                                  <p className="text-sm text-gray-600">{session.academicLevel?.name}</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-700">School</p>
                                  <p className="text-sm text-gray-600">{session.schoolName}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Academic Sessions</h3>
                    <p className="text-gray-600">Your academic sessions will appear here once they are created.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tracking Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Academic Performance</span>
                        <span className="text-sm text-gray-600">
                          {academicStats?.averageGrade?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <Progress value={academicStats?.averageGrade || 0} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Sessions Completed</span>
                        <span className="text-sm text-gray-600">
                          {academicStats?.completedSessions || 0} sessions
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((academicStats?.completedSessions || 0) * 10, 100)} 
                        className="h-2" 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Improvement Rate</span>
                        <span className="text-sm text-gray-600">
                          {academicStats?.totalRecords ? 
                            Math.round((academicStats.improvingCount / academicStats.totalRecords) * 100) : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={academicStats?.totalRecords ? 
                          (academicStats.improvingCount / academicStats.totalRecords) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievement Highlights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Achievement Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          {academicStats?.completedSessions || 0} Sessions Completed
                        </p>
                        <p className="text-sm text-green-700">Great progress!</p>
                      </div>
                    </div>

                    {(academicStats?.averageGrade || 0) >= 70 && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Award className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">Good Academic Standing</p>
                          <p className="text-sm text-blue-700">Maintaining excellent grades</p>
                        </div>
                      </div>
                    )}

                    {(academicStats?.improvingCount || 0) > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-medium text-emerald-900">
                            {academicStats?.improvingCount} Improvement{(academicStats?.improvingCount || 0) > 1 ? 's' : ''}
                          </p>
                          <p className="text-sm text-emerald-700">Keep up the great work!</p>
                        </div>
                      </div>
                    )}

                    {(academicStats?.needsInterventionCount || 0) > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-900">Academic Support Available</p>
                          <p className="text-sm text-yellow-700">Additional help is being provided</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}