"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2,
  Users,
  GraduationCap,
  DollarSign,
  FileText,
  Calendar,
  TrendingUp,
  Target,
  Award,
  Activity,
  Settings,
  BarChart3,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

export default function FoundationOverviewPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch foundation data
  const foundation = useQuery(
    api.foundations.getById,
    foundationId ? { foundationId } : "skip"
  );

  const stats = useQuery(
    api.foundations.getStatistics,
    foundationId ? { foundationId } : "skip"
  );

  const recentActivities = useQuery(
    api.foundations.getRecentActivities,
    foundationId ? { foundationId } : "skip"
  );

  const performanceMetrics = useQuery(
    api.foundations.getPerformanceMetrics,
    foundationId ? { foundationId } : "skip"
  );

  if (!foundation) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading foundation information...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const completionRate = stats ? 
    Math.round((stats.activeBeneficiaries / Math.max(stats.totalBeneficiaries, 1)) * 100) : 0;

  const approvalRate = stats && stats.totalApplications > 0 ? 
    Math.round((stats.approvedApplications / stats.totalApplications) * 100) : 0;

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="w-8 h-8 text-emerald-600" />
              {foundation.name}
            </h1>
            <p className="text-gray-600 mt-1">{foundation.description}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/foundation/team")}
            >
              <Users className="w-4 h-4 mr-2" />
              Team
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/settings/foundation")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Foundation Info Card */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </div>
                <p className="font-medium">{foundation.contactEmail}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Phone</span>
                </div>
                <p className="font-medium">{foundation.contactPhone}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Location</span>
                </div>
                <p className="font-medium">{foundation.address || "Not set"}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Website</span>
                </div>
                <p className="font-medium">{foundation.website || "Not set"}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registration Number</p>
                <p className="font-semibold">{foundation.registrationNumber || "Not set"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Tax ID</p>
                <p className="font-semibold">{foundation.taxId || "Not set"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Founded</p>
                <p className="font-semibold">
                  {foundation.foundedDate ? formatDate(new Date(foundation.foundedDate)) : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Beneficiaries</CardTitle>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {stats?.totalBeneficiaries || 0}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {stats?.activeBeneficiaries || 0} Active
                </Badge>
                <Progress value={completionRate} className="flex-1 h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalApplications || 0}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                  {stats?.pendingApplications || 0} Pending
                </Badge>
                <div className="text-xs text-gray-600">
                  {approvalRate}% approval rate
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Programs</CardTitle>
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats?.activePrograms || 0}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {stats?.totalPrograms || 0} Total
                </Badge>
                <span className="text-xs text-gray-600">
                  Active programs
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
                <Award className="w-4 h-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.totalUsers || 0}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {stats?.adminUsers || 0} Admins
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats?.reviewerUsers || 0} Reviewers
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance & Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
                <Badge className="bg-emerald-100 text-emerald-800">This Month</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceMetrics ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium">Application Processing</p>
                        <p className="text-sm text-gray-600">Average time: {performanceMetrics.avgProcessingTime} days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {performanceMetrics.processingTrend > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.abs(performanceMetrics.processingTrend)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Beneficiary Retention</p>
                        <p className="text-sm text-gray-600">Active rate: {performanceMetrics.retentionRate}%</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Academic Performance</p>
                        <p className="text-sm text-gray-600">Average: {performanceMetrics.academicAverage}%</p>
                      </div>
                    </div>
                    <Progress value={performanceMetrics.academicAverage} className="w-20 h-2" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Financial Efficiency</p>
                        <p className="text-sm text-gray-600">Disbursement rate: {performanceMetrics.disbursementRate}%</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activities
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push("/activities")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'application' ? 'bg-blue-100' :
                      activity.type === 'beneficiary' ? 'bg-emerald-100' :
                      activity.type === 'payment' ? 'bg-green-100' :
                      activity.type === 'alert' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'application' && <FileText className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'beneficiary' && <Users className="w-4 h-4 text-emerald-600" />}
                      {activity.type === 'payment' && <DollarSign className="w-4 h-4 text-green-600" />}
                      {activity.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(new Date(activity.timestamp))}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations for your foundation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col p-4 space-y-2"
                onClick={() => router.push("/applications")}
              >
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="text-sm">Review Applications</span>
                {stats?.pendingApplications ? (
                  <Badge className="bg-red-100 text-red-800">{stats.pendingApplications}</Badge>
                ) : null}
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col p-4 space-y-2"
                onClick={() => router.push("/beneficiaries")}
              >
                <Users className="w-6 h-6 text-emerald-600" />
                <span className="text-sm">Manage Beneficiaries</span>
                <Badge variant="outline">{stats?.activeBeneficiaries || 0}</Badge>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col p-4 space-y-2"
                onClick={() => router.push("/programs")}
              >
                <GraduationCap className="w-6 h-6 text-purple-600" />
                <span className="text-sm">View Programs</span>
                <Badge variant="outline">{stats?.activePrograms || 0}</Badge>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col p-4 space-y-2"
                onClick={() => router.push("/reports")}
              >
                <BarChart3 className="w-6 h-6 text-orange-600" />
                <span className="text-sm">Generate Reports</span>
                <Badge variant="outline">New</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}