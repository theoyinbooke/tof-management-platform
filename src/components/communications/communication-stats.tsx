"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Users
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface CommunicationStatsProps {
  foundationId: Id<"foundations">;
}

export function CommunicationStats({ foundationId }: CommunicationStatsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Calculate date range
  const getDateRange = () => {
    const end = Date.now();
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
    const start = end - (days * 24 * 60 * 60 * 1000);
    return { start, end };
  };

  // Fetch communication statistics
  const stats = useQuery(
    api.communications.getCommunicationStats,
    foundationId ? { 
      foundationId, 
      dateRange: getDateRange() 
    } : "skip"
  );

  // Fetch communication logs for analysis
  const communicationLogs = useQuery(
    api.communications.getCommunicationLogs,
    foundationId ? { 
      foundationId,
      limit: 100
    } : "skip"
  );

  if (stats === undefined || communicationLogs === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate trends and additional metrics
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  // Mock previous period data for trend calculation
  const previousStats = {
    total: { sent: stats.total.sent * 0.8, failed: stats.total.failed * 1.2 },
    email: { sent: stats.email.sent * 0.85, failed: stats.email.failed * 1.1 },
    sms: { sent: stats.sms.sent * 0.9, failed: stats.sms.failed * 0.8 },
  };

  const totalTrend = calculateTrend(stats.total.sent, previousStats.total.sent);
  const emailTrend = calculateTrend(stats.email.sent, previousStats.email.sent);
  const smsTrend = calculateTrend(stats.sms.sent, previousStats.sms.sent);

  // Calculate peak hours from logs
  const hourlyDistribution = communicationLogs?.reduce((acc, log) => {
    const hour = new Date(log.createdAt).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>) || {};

  const peakHour = Object.entries(hourlyDistribution)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || "12";

  // Calculate channel preference
  const channelStats = [
    { name: "Email", count: stats.email.sent, color: "text-blue-600", icon: Mail },
    { name: "SMS", count: stats.sms.sent, color: "text-green-600", icon: MessageSquare },
    { name: "In-App", count: stats.total.sent - stats.email.sent - stats.sms.sent, color: "text-purple-600", icon: Bell },
  ];

  const totalMessages = channelStats.reduce((sum, channel) => sum + channel.count, 0);

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Communication Analytics</h3>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sent</CardTitle>
              <div className="flex items-center gap-1">
                {totalTrend.isPositive ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span className={`text-xs ${totalTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {totalTrend.value.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total.sent}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.total.failed} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              <Target className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.successRate.overall.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Overall delivery rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Peak Hour</CardTitle>
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {peakHour}:00
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Most active time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.total.pending}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Channel Distribution
            </CardTitle>
            <CardDescription>Messages sent by communication channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {channelStats.map((channel) => {
              const Icon = channel.icon;
              const percentage = totalMessages > 0 ? (channel.count / totalMessages) * 100 : 0;
              
              return (
                <div key={channel.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${channel.color}`} />
                      <span className="text-sm font-medium">{channel.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{channel.count}</span>
                      <Badge variant="outline" className="text-xs">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        channel.name === "Email" ? "bg-blue-600" :
                        channel.name === "SMS" ? "bg-green-600" : "bg-purple-600"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Success Rates by Channel
            </CardTitle>
            <CardDescription>Delivery success rates for each channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{stats.successRate.email.toFixed(1)}%</span>
                  <div className={`flex items-center gap-1 ${emailTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {emailTrend.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs">{emailTrend.value.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${stats.successRate.email}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">SMS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{stats.successRate.sms.toFixed(1)}%</span>
                  <div className={`flex items-center gap-1 ${smsTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {smsTrend.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs">{smsTrend.value.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: `${stats.successRate.sms}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">In-App</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">98.5%</span>
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-purple-600" style={{ width: "98.5%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Communication Summary
          </CardTitle>
          <CardDescription>
            Overview of communication activity in the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{stats.total.sent}</div>
              <div className="text-sm text-green-700">Successfully Sent</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{stats.total.failed}</div>
              <div className="text-sm text-red-700">Failed Deliveries</div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{stats.total.pending}</div>
              <div className="text-sm text-yellow-700">Pending Delivery</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Email has a {stats.successRate.email.toFixed(1)}% success rate with {stats.email.sent} messages sent</li>
              <li>• SMS shows {stats.successRate.sms.toFixed(1)}% delivery rate with {stats.sms.sent} messages sent</li>
              <li>• Peak activity occurs around {peakHour}:00, optimize scheduling for this time</li>
              <li>• Overall communication success rate is {stats.successRate.overall.toFixed(1)}%</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}