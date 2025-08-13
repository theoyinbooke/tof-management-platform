"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell,
  BellRing,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  DollarSign,
  AlertTriangle,
  Users,
  Settings,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

interface NotificationBellProps {
  foundationId: Id<"foundations">;
  className?: string;
}

export function NotificationBell({ foundationId, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get recent notifications (last 10)
  const recentNotifications = useQuery(api.notifications.getNotificationsByUser, {
    foundationId,
    limit: 10,
  });

  const notificationStats = useQuery(api.notifications.getNotificationStats, {
    foundationId,
  });

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);

  // Get notification type icon
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-blue-600";
      case "low":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent popover from closing
    try {
      await markAsRead({
        notificationId: notificationId as Id<"notifications">,
        foundationId,
      });
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const unreadCount = notificationStats?.unreadCount || 0;
  const urgentCount = notificationStats?.urgentCount || 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative", className)}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              className={cn(
                "absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center",
                urgentCount > 0 
                  ? "bg-red-500 hover:bg-red-500" 
                  : "bg-blue-500 hover:bg-blue-500"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end" sideOffset={4}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} unread
                </Badge>
              )}
              <Link href="/dashboard/notifications">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-96">
          {recentNotifications && recentNotifications.length > 0 ? (
            <div className="p-0">
              {recentNotifications.map((notification, index) => (
                <div key={notification._id}>
                  <div 
                    className={cn(
                      "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                      !notification.isRead && "bg-blue-50"
                    )}
                    onClick={() => {
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm font-medium truncate",
                              notification.isRead ? "text-gray-700" : "text-gray-900"
                            )}>
                              {notification.title}
                            </p>
                            
                            <p className={cn(
                              "text-xs mt-1 line-clamp-2",
                              notification.isRead ? "text-gray-500" : "text-gray-600"
                            )}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                              </span>
                              
                              <div className="flex items-center gap-1">
                                <span className={cn(
                                  "text-xs font-medium",
                                  getPriorityColor(notification.priority)
                                )}>
                                  {notification.priority.toUpperCase()}
                                </span>
                                
                                {!notification.isRead && (
                                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>
                          </div>

                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleMarkAsRead(notification._id, e)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < recentNotifications.length - 1 && (
                    <Separator className="mx-4" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500 mb-2">No notifications</p>
              <p className="text-xs text-gray-400">You're all caught up!</p>
            </div>
          )}
        </ScrollArea>

        {recentNotifications && recentNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Link href="/dashboard/notifications">
              <Button variant="ghost" className="w-full text-sm" size="sm">
                View All Notifications
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}