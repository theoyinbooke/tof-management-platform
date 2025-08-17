"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  FileText,
  DollarSign,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  ArrowRight,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Plus,
  CreditCard,
  CalendarDays,
  FileBarChart,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export function AdminDashboard() {
  const { user } = useCurrentUser();
  const router = useRouter();
  
  // Fetch real-time dashboard statistics
  const dashboardStats = useQuery(
    api.dashboard.getAdminDashboardStats,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );

  const recentActivity = useQuery(
    api.dashboard.getRecentActivity,
    user?.foundationId ? { foundationId: user.foundationId, limit: 5 } : "skip"
  );

  // Quick action handlers
  const handleReviewApplications = () => {
    router.push("/reviews");
  };

  const handleAddBeneficiary = () => {
    router.push("/beneficiaries/new");
  };

  const handleProcessPayment = () => {
    router.push("/financial/payments");
  };

  const handleScheduleProgram = () => {
    router.push("/programs/new");
  };

  const handleGenerateReport = () => {
    router.push("/reports");
  };

  const handleViewAllApplications = () => {
    router.push("/applications");
  };

  if (!dashboardStats) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      title: "Beneficiaries",
      value: dashboardStats.totalBeneficiaries.toLocaleString(),
      subValue: `${dashboardStats.activeBeneficiaries.toLocaleString()} active • ${(100 - dashboardStats.activeBeneficiaries/dashboardStats.totalBeneficiaries*100).toFixed(0)}% inactive`,
      change: dashboardStats.beneficiariesChange > 0 ? `${dashboardStats.beneficiariesChange}%` : dashboardStats.beneficiariesChange < 0 ? `${dashboardStats.beneficiariesChange}%` : "0%",
      trend: dashboardStats.beneficiariesChange > 0 ? "up" : dashboardStats.beneficiariesChange < 0 ? "down" : "neutral",
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Applications",
      value: dashboardStats.pendingApplications.toLocaleString(),
      subValue: dashboardStats.todaysApplications > 0 
        ? `${dashboardStats.todaysApplications} today • ${dashboardStats.underReviewApplications} reviewing`
        : `${dashboardStats.underReviewApplications} under review`,
      change: dashboardStats.todaysApplications > 0 ? `${dashboardStats.todaysApplications}` : "0",
      trend: dashboardStats.todaysApplications > 0 ? "up" : "neutral",
      icon: FileText,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
    },
    {
      title: "Disbursement",
      value: formatCurrency(dashboardStats.monthlyDisbursement).replace('NGN', '₦'),
      subValue: dashboardStats.pendingInvoices > 0 
        ? `${dashboardStats.pendingInvoices} pending • ₦${(dashboardStats.monthlyDisbursement/dashboardStats.totalBeneficiaries).toFixed(0)}/student`
        : `₦${(dashboardStats.monthlyDisbursement/Math.max(dashboardStats.totalBeneficiaries, 1)).toFixed(0)} per student`,
      change: dashboardStats.disbursementChange !== 0 
        ? `${dashboardStats.disbursementChange}%`
        : "0%",
      trend: dashboardStats.disbursementChange > 0 ? "up" : dashboardStats.disbursementChange < 0 ? "down" : "neutral",
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Performance",
      value: `${dashboardStats.averagePerformance}%`,
      subValue: `${Math.round(dashboardStats.averagePerformance/20)}★ avg • ${dashboardStats.totalBeneficiaries > 0 ? Math.round(dashboardStats.averagePerformance * dashboardStats.totalBeneficiaries / 100) : 0} excelling`,
      change: `${dashboardStats.performanceChange}%`,
      trend: dashboardStats.performanceChange > 0 ? "up" : dashboardStats.performanceChange < 0 ? "down" : "neutral",
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Section - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {user?.role?.replace('_', ' ')}
          </Badge>
          {dashboardStats.pendingApplications > 0 && (
            <Badge className="bg-amber-100 text-amber-700 text-xs">
              {dashboardStats.pendingApplications} tasks pending
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Grid - Compact & Beautiful */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="group hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden relative"
            >
              <CardContent className="p-4">
                {/* Background gradient effect */}
                <div className={`absolute inset-0 ${stat.bgColor} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Top row with icon and trend */}
                <div className="flex items-start justify-between mb-3 relative">
                  <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    {stat.trend === "up" && (
                      <div className="flex items-center text-emerald-600">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs font-semibold ml-0.5">{stat.change}</span>
                      </div>
                    )}
                    {stat.trend === "down" && (
                      <div className="flex items-center text-red-600">
                        <TrendingDown className="h-3 w-3" />
                        <span className="text-xs font-semibold ml-0.5">{stat.change}</span>
                      </div>
                    )}
                    {stat.trend === "neutral" && (
                      <span className="text-xs text-gray-500 font-medium">{stat.change}</span>
                    )}
                  </div>
                </div>
                
                {/* Main value - Very large and prominent */}
                <div className="mb-2">
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight leading-none group-hover:scale-105 transition-transform duration-300 origin-left">
                    {stat.value}
                  </h3>
                </div>
                
                {/* Title and sub-value */}
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                    {stat.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stat.subValue}
                  </p>
                </div>
                
                {/* Subtle bottom border accent on hover */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${stat.color.replace('text', 'bg')} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Applications - Compact Design */}
        <Card className="lg:col-span-2 border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Recent Applications</CardTitle>
                {dashboardStats.pendingApplications > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs">
                    {dashboardStats.pendingApplications} pending
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleViewAllApplications}
                className="h-7 text-xs hover:bg-gray-50"
              >
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {dashboardStats.recentApplications?.length > 0 ? (
                dashboardStats.recentApplications.map((application) => (
                  <div 
                    key={application._id} 
                    className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200"
                    onClick={() => router.push(`/applications/${application._id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <FileText className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {application.firstName} {application.lastName}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 py-0 ${
                              application.status === "pending" ? "text-amber-600 border-amber-300 bg-amber-50" :
                              application.status === "under_review" ? "text-sky-600 border-sky-300 bg-sky-50" :
                              application.status === "approved" ? "text-emerald-600 border-emerald-300 bg-emerald-50" :
                              "text-red-600 border-red-300 bg-red-50"
                            }`}
                          >
                            {application.status === "pending" && <Clock className="mr-0.5 h-2.5 w-2.5" />}
                            {application.status === "under_review" && <UserCheck className="mr-0.5 h-2.5 w-2.5" />}
                            {application.status === "approved" && <CheckCircle className="mr-0.5 h-2.5 w-2.5" />}
                            {application.status === "rejected" && <XCircle className="mr-0.5 h-2.5 w-2.5" />}
                            {application.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-500">
                            {application.academicLevel}
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500">
                            {formatDate(new Date(application.createdAt))}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-7 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/reviews?applicationId=${application._id}`);
                      }}
                    >
                      Review
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent applications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Compact */}
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <Button 
              className="w-full justify-start h-9 text-sm bg-white hover:bg-emerald-50 text-gray-700 border border-gray-200 hover:border-emerald-300 transition-colors group" 
              variant="outline"
              onClick={handleReviewApplications}
            >
              <UserCheck className="mr-2 h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              Review Applications
              {dashboardStats.pendingApplications > 0 && (
                <Badge className="ml-auto bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0" variant="secondary">
                  {dashboardStats.pendingApplications}
                </Badge>
              )}
            </Button>
            
            <Button 
              className="w-full justify-start h-9 text-sm bg-white hover:bg-sky-50 text-gray-700 border border-gray-200 hover:border-sky-300 transition-colors group" 
              variant="outline"
              onClick={handleAddBeneficiary}
            >
              <Plus className="mr-2 h-3.5 w-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
              Add Beneficiary
            </Button>
            
            <Button 
              className="w-full justify-start h-9 text-sm bg-white hover:bg-amber-50 text-gray-700 border border-gray-200 hover:border-amber-300 transition-colors group" 
              variant="outline"
              onClick={handleProcessPayment}
            >
              <CreditCard className="mr-2 h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
              Process Payment
              {dashboardStats.pendingInvoices > 0 && (
                <Badge className="ml-auto bg-amber-100 text-amber-700 text-xs px-1.5 py-0" variant="secondary">
                  {dashboardStats.pendingInvoices}
                </Badge>
              )}
            </Button>
            
            <Button 
              className="w-full justify-start h-9 text-sm bg-white hover:bg-purple-50 text-gray-700 border border-gray-200 hover:border-purple-300 transition-colors group" 
              variant="outline"
              onClick={handleScheduleProgram}
            >
              <CalendarDays className="mr-2 h-3.5 w-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
              Schedule Program
            </Button>
            
            <Button 
              className="w-full justify-start h-9 text-sm bg-white hover:bg-indigo-50 text-gray-700 border border-gray-200 hover:border-indigo-300 transition-colors group" 
              variant="outline"
              onClick={handleGenerateReport}
            >
              <FileBarChart className="mr-2 h-3.5 w-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Application Pipeline</CardTitle>
              <Badge variant="outline" className="text-xs">
                {dashboardStats.totalApplications} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between group hover:bg-emerald-50 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium">Approved</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      {dashboardStats.approvedApplications}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round((dashboardStats.approvedApplications / Math.max(dashboardStats.totalApplications, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${(dashboardStats.approvedApplications / Math.max(dashboardStats.totalApplications, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between group hover:bg-amber-50 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      {dashboardStats.pendingApplications}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round((dashboardStats.pendingApplications / Math.max(dashboardStats.totalApplications, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${(dashboardStats.pendingApplications / Math.max(dashboardStats.totalApplications, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between group hover:bg-sky-50 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-sky-600" />
                  <span className="text-sm font-medium">Reviewing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      {dashboardStats.underReviewApplications}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round((dashboardStats.underReviewApplications / Math.max(dashboardStats.totalApplications, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-600 rounded-full transition-all duration-500"
                      style={{ width: `${(dashboardStats.underReviewApplications / Math.max(dashboardStats.totalApplications, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between group hover:bg-red-50 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Rejected</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      {dashboardStats.rejectedApplications}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round((dashboardStats.rejectedApplications / Math.max(dashboardStats.totalApplications, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 rounded-full transition-all duration-500"
                      style={{ width: `${(dashboardStats.rejectedApplications / Math.max(dashboardStats.totalApplications, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Activity Feed</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 text-xs"
                onClick={() => router.push("/audit-logs")}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div 
                    key={activity._id} 
                    className="group flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="mt-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        activity.riskLevel === "critical" ? "bg-red-500" :
                        activity.riskLevel === "high" ? "bg-orange-500" :
                        activity.riskLevel === "medium" ? "bg-yellow-500" :
                        "bg-green-500"
                      } group-hover:scale-150 transition-transform duration-200`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">
                          {activity.userEmail.split('@')[0]}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">
                          {formatDate(new Date(activity.createdAt))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events - Compact Grid */}
      {dashboardStats.upcomingEvents && dashboardStats.upcomingEvents.length > 0 && (
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Upcoming Events</CardTitle>
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  {dashboardStats.upcomingEvents.length} scheduled
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/programs")}
                className="h-7 text-xs hover:bg-gray-50"
              >
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {dashboardStats.upcomingEvents.slice(0, 8).map((event) => (
                <div 
                  key={event._id} 
                  className="group p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer relative overflow-hidden"
                  onClick={() => router.push(`/programs/${event.programId}`)}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                  
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="h-3.5 w-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
                    <Badge variant="outline" className="text-xs px-1.5 py-0 border-purple-300 text-purple-700">
                      {event.type}
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1 group-hover:text-purple-900">
                    {event.name}
                  </h4>
                  
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2 min-h-[2rem]">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(new Date(event.startDate))}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}