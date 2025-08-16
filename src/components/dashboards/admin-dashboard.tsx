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
      title: "Total Beneficiaries",
      value: dashboardStats.totalBeneficiaries,
      subValue: `${dashboardStats.activeBeneficiaries} active`,
      change: `+${dashboardStats.beneficiariesChange}%`,
      trend: dashboardStats.beneficiariesChange > 0 ? "up" : dashboardStats.beneficiariesChange < 0 ? "down" : "neutral",
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Active Applications",
      value: dashboardStats.pendingApplications,
      subValue: `${dashboardStats.todaysApplications} new today`,
      change: dashboardStats.todaysApplications > 0 ? `+${dashboardStats.todaysApplications}` : "No change",
      trend: dashboardStats.todaysApplications > 0 ? "up" : "neutral",
      icon: FileText,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
    },
    {
      title: "Monthly Disbursement",
      value: formatCurrency(dashboardStats.monthlyDisbursement),
      subValue: `${dashboardStats.pendingInvoices} pending invoices`,
      change: dashboardStats.disbursementChange !== 0 
        ? `${dashboardStats.disbursementChange > 0 ? '+' : ''}${dashboardStats.disbursementChange}%`
        : "No change",
      trend: dashboardStats.disbursementChange > 0 ? "up" : dashboardStats.disbursementChange < 0 ? "down" : "neutral",
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Academic Performance",
      value: `${dashboardStats.averagePerformance}%`,
      subValue: `Average score`,
      change: `+${dashboardStats.performanceChange}%`,
      trend: dashboardStats.performanceChange > 0 ? "up" : dashboardStats.performanceChange < 0 ? "down" : "neutral",
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your foundation today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  {stat.trend === "up" && (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  )}
                  {stat.trend === "down" && (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">{stat.subValue}</p>
                  <p className="text-xs font-medium text-gray-700">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <Card className="lg:col-span-2 border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Applications requiring review</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewAllApplications}
                className="hover:bg-gray-50"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.recentApplications?.length > 0 ? (
                dashboardStats.recentApplications.map((application) => (
                  <div 
                    key={application._id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/applications/${application._id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {application.firstName} {application.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {application.academicLevel} • Applied {formatDate(new Date(application.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={
                          application.status === "pending" ? "text-amber-600 border-amber-300" :
                          application.status === "under_review" ? "text-sky-600 border-sky-300" :
                          application.status === "approved" ? "text-emerald-600 border-emerald-300" :
                          "text-red-600 border-red-300"
                        }
                      >
                        {application.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                        {application.status === "under_review" && <UserCheck className="mr-1 h-3 w-3" />}
                        {application.status === "approved" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {application.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                        {application.status.replace("_", " ")}
                      </Badge>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/reviews?applicationId=${application._id}`);
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent applications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" 
              variant="outline"
              onClick={handleReviewApplications}
            >
              <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
              Review Applications
              {dashboardStats.pendingApplications > 0 && (
                <Badge className="ml-auto bg-emerald-100 text-emerald-700" variant="secondary">
                  {dashboardStats.pendingApplications}
                </Badge>
              )}
            </Button>
            
            <Button 
              className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" 
              variant="outline"
              onClick={handleAddBeneficiary}
            >
              <Plus className="mr-2 h-4 w-4 text-sky-600" />
              Add Beneficiary
            </Button>
            
            <Button 
              className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" 
              variant="outline"
              onClick={handleProcessPayment}
            >
              <CreditCard className="mr-2 h-4 w-4 text-amber-600" />
              Process Payment
              {dashboardStats.pendingInvoices > 0 && (
                <Badge className="ml-auto bg-amber-100 text-amber-700" variant="secondary">
                  {dashboardStats.pendingInvoices}
                </Badge>
              )}
            </Button>
            
            <Button 
              className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" 
              variant="outline"
              onClick={handleScheduleProgram}
            >
              <CalendarDays className="mr-2 h-4 w-4 text-purple-600" />
              Schedule Program
            </Button>
            
            <Button 
              className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" 
              variant="outline"
              onClick={handleGenerateReport}
            >
              <FileBarChart className="mr-2 h-4 w-4 text-indigo-600" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Current session applications breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {dashboardStats.approvedApplications}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({Math.round((dashboardStats.approvedApplications / Math.max(dashboardStats.totalApplications, 1)) * 100)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {dashboardStats.pendingApplications}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({Math.round((dashboardStats.pendingApplications / Math.max(dashboardStats.totalApplications, 1)) * 100)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-sky-600" />
                  <span className="text-sm font-medium">Under Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {dashboardStats.underReviewApplications}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({Math.round((dashboardStats.underReviewApplications / Math.max(dashboardStats.totalApplications, 1)) * 100)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">Rejected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {dashboardStats.rejectedApplications}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({Math.round((dashboardStats.rejectedApplications / Math.max(dashboardStats.totalApplications, 1)) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity._id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.riskLevel === "critical" ? "bg-red-500" :
                      activity.riskLevel === "high" ? "bg-orange-500" :
                      activity.riskLevel === "medium" ? "bg-yellow-500" :
                      "bg-green-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.userEmail} • {formatDate(new Date(activity.createdAt))}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      {dashboardStats.upcomingEvents && dashboardStats.upcomingEvents.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Scheduled programs and events</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/programs")}
                className="hover:bg-gray-50"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardStats.upcomingEvents.map((event) => (
                <div 
                  key={event._id} 
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/programs/${event.programId}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{event.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(new Date(event.startDate))}
                  </p>
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