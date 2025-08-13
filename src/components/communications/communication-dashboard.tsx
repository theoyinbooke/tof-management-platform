"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  MessageSquare, 
  Send, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { format } from "date-fns";

interface CommunicationDashboardProps {
  foundationId: Id<"foundations">;
}

export function CommunicationDashboard({ foundationId }: CommunicationDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch data
  const communicationStats = useQuery(api.communications.getCommunicationStats, {
    foundationId,
    dateRange: {
      start: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
      end: Date.now(),
    },
  });

  const communicationLogs = useQuery(api.communications.getCommunicationLogs, {
    foundationId,
    type: typeFilter === "all" ? undefined : (typeFilter as "email" | "sms"),
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    limit: 50,
  });

  const templates = useQuery(api.communications.getTemplates, {
    foundationId,
  });

  // Mutations
  const sendBulkNotification = useMutation(api.communications.sendBulkNotification);

  // Stats cards data
  const statsCards = [
    {
      title: "Total Messages",
      value: communicationStats?.total.sent || 0,
      change: "+12%",
      trend: "up",
      icon: Send,
      color: "text-blue-600",
    },
    {
      title: "Success Rate",
      value: `${communicationStats?.successRate.overall.toFixed(1) || 0}%`,
      change: "+2.1%",
      trend: "up",
      icon: CheckCircle,
      color: "text-emerald-600",
    },
    {
      title: "Email Delivered",
      value: communicationStats?.email.sent || 0,
      change: "+8%",
      trend: "up",
      icon: Mail,
      color: "text-purple-600",
    },
    {
      title: "SMS Sent",
      value: communicationStats?.sms.sent || 0,
      change: "+15%",
      trend: "up",
      icon: MessageSquare,
      color: "text-orange-600",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: "bg-emerald-100 text-emerald-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      delivered: "bg-blue-100 text-blue-800",
    } as const;

    return (
      <Badge className={cn("text-xs", variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800")}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
          <p className="text-gray-600">Manage email, SMS, and bulk communications</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Send Bulk Message
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className={cn("h-3 w-3 mr-1", 
                      stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                    )} />
                    <span className={cn("text-xs font-medium",
                      stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                    )}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={cn("p-3 rounded-lg bg-gray-50")}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Communication Logs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Messaging</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Success Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Success Rate by Channel</CardTitle>
                <CardDescription>Delivery success rates for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${communicationStats?.successRate.email || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {communicationStats?.successRate.email.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">SMS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${communicationStats?.successRate.sms || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {communicationStats?.successRate.sms.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest communication attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {communicationLogs?.slice(0, 5).map((log) => (
                      <div key={log._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.type === "email" ? "Email" : "SMS"} to {log.recipient}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(log.createdAt, "MMM dd, HH:mm")}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(log.status)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Communication Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Communication Logs</CardTitle>
                  <CardDescription>Track all email and SMS communications</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {communicationLogs?.map((log) => (
                    <div key={log._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(log.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {log.type === "email" ? "Email" : "SMS"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            To: {log.recipient}
                          </p>
                          {log.subject && (
                            <p className="text-sm text-gray-600 mb-1">
                              Subject: {log.subject}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {format(log.createdAt, "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(log.status)}
                        {log.errorMessage && (
                          <div className="text-xs text-red-600 max-w-48 truncate">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Communication Templates</CardTitle>
                  <CardDescription>Manage email and SMS templates</CardDescription>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.map((template) => (
                  <Card key={template._id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {template.type}
                        </Badge>
                        <Badge className="text-xs bg-blue-100 text-blue-800">
                          {template.category}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">{template.name}</h3>
                      {template.description && (
                        <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{template.variables.length} variables</span>
                        <span>{template.usageCount || 0} uses</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Messaging Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Messaging</CardTitle>
              <CardDescription>Send messages to multiple recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bulk Messaging</h3>
                <p className="text-gray-600 mb-4">
                  Send emails and SMS to multiple beneficiaries, guardians, or admins at once.
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="h-4 w-4 mr-2" />
                  Create Bulk Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}