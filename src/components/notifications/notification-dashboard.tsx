"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell,
  BellRing,
  CheckCircle,
  CheckCircle2,
  Circle,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Eye,
  ExternalLink,
  AlertTriangle,
  DollarSign,
  GraduationCap,
  Settings,
  Users,
  Clock,
  Calendar,
  ArrowRight,
  Dot,
  BellOff
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { format, formatDistanceToNow } from "date-fns";

interface NotificationDashboardProps {
  foundationId: Id<"foundations">;
}

export function NotificationDashboard({ foundationId }: NotificationDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Convex queries
  const notifications = useQuery(api.notifications.getNotificationsByUser, {
    foundationId,
    filters: {
      type: typeFilter !== "all" ? typeFilter as any : undefined,
      priority: priorityFilter !== "all" ? priorityFilter as any : undefined,
      isRead: statusFilter === "read" ? true : statusFilter === "unread" ? false : undefined,
    },
    limit: 100,
  });

  const notificationStats = useQuery(api.notifications.getNotificationStats, {
    foundationId,
  });

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markMultipleAsRead = useMutation(api.notifications.markMultipleAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  // Filter notifications based on search
  const filteredNotifications = React.useMemo(() => {
    if (!notifications) return [];
    
    return notifications.filter(notification => {
      const matchesSearch = searchTerm === "" || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [notifications, searchTerm]);

  // Get notification type icon and color
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "academic":
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case "financial":
        return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "administrative":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "system":
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string, isRead: boolean) => {
    const baseOpacity = isRead ? "50" : "100";
    switch (priority) {
      case "urgent":
        return `text-red-600 opacity-${baseOpacity}`;
      case "high":
        return `text-orange-600 opacity-${baseOpacity}`;
      case "medium":
        return `text-blue-600 opacity-${baseOpacity}`;
      case "low":
        return `text-gray-600 opacity-${baseOpacity}`;
      default:
        return `text-gray-600 opacity-${baseOpacity}`;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Medium</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({
        notificationId: notificationId as Id<"notifications">,
        foundationId,
      });
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  // Handle bulk mark as read
  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      const notificationIds = Array.from(selectedNotifications) as Id<"notifications">[];
      await markMultipleAsRead({
        notificationIds,
        foundationId,
      });
      toast.success(`Marked ${selectedNotifications.size} notifications as read`);
      setSelectedNotifications(new Set());
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification({
        notificationId: notificationId as Id<"notifications">,
        foundationId,
      });
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId: string) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  // Select all notifications
  const selectAllNotifications = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n._id)));
    }
  };

  if (!notifications || !notificationStats) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with important foundation activities</p>
        </div>
        
        <div className="flex gap-3">
          {selectedNotifications.size > 0 && (
            <Button
              onClick={handleBulkMarkAsRead}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark {selectedNotifications.size} as Read
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <div className="text-2xl font-bold text-gray-900">
                  {notificationStats.totalCount}
                </div>
                <p className="text-xs text-gray-500">All time</p>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <div className="text-2xl font-bold text-blue-600">
                  {notificationStats.unreadCount}
                </div>
                <p className="text-xs text-gray-500">Requiring attention</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BellRing className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <div className="text-2xl font-bold text-red-600">
                  {notificationStats.urgentCount}
                </div>
                <p className="text-xs text-gray-500">Need immediate action</p>
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
                <p className="text-sm font-medium text-gray-600">Academic Alerts</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {notificationStats.typeBreakdown.academic + notificationStats.typeBreakdown.alert}
                </div>
                <p className="text-xs text-gray-500">Student related</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Management */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({notificationStats.unreadCount})</TabsTrigger>
          <TabsTrigger value="urgent">Urgent ({notificationStats.urgentCount})</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-emerald-600" />
                    All Notifications ({filteredNotifications.length})
                  </CardTitle>
                  <CardDescription>Manage your notifications and stay updated</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllNotifications}
                  >
                    {selectedNotifications.size === filteredNotifications.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="alert">Alerts</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications List */}
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification._id} 
                    className={cn(
                      "border transition-all duration-200 hover:shadow-md",
                      notification.isRead ? "border-gray-200 bg-gray-50" : "border-blue-200 bg-blue-50",
                      selectedNotifications.has(notification._id) && "ring-2 ring-emerald-500"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleNotificationSelection(notification._id)}
                            className="h-6 w-6 p-0"
                          >
                            {selectedNotifications.has(notification._id) ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notification.type)}
                            {!notification.isRead && <Dot className="h-6 w-6 text-blue-600" />}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={cn(
                                  "font-medium text-sm",
                                  notification.isRead ? "text-gray-700" : "text-gray-900"
                                )}>
                                  {notification.title}
                                </h3>
                                {getPriorityBadge(notification.priority)}
                              </div>
                              
                              <p className={cn(
                                "text-sm mb-2",
                                notification.isRead ? "text-gray-500" : "text-gray-700"
                              )}>
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                </span>
                                
                                {notification.sender && (
                                  <span>From: {notification.sender.firstName} {notification.sender.lastName}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {notification.actionUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.location.href = notification.actionUrl!}
                                >
                                  {notification.actionText || "View"}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!notification.isRead && (
                                    <DropdownMenuItem 
                                      onClick={() => handleMarkAsRead(notification._id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Read
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(notification._id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredNotifications.length === 0 && (
                  <div className="text-center py-12">
                    <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                    <p className="text-gray-600">
                      {searchTerm || typeFilter !== "all" || priorityFilter !== "all" || statusFilter !== "all"
                        ? "No notifications match your current filters."
                        : "You're all caught up! No new notifications."
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents would be similar with different filters */}
        <TabsContent value="unread">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <p className="text-gray-600">Unread notifications will be displayed here with the same layout.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urgent">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <p className="text-gray-600">Urgent notifications will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <p className="text-gray-600">Academic notifications will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <p className="text-gray-600">Financial notifications will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}