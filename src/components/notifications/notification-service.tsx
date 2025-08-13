"use client";

import React, { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface NotificationServiceProps {
  foundationId: Id<"foundations">;
  userId: Id<"users">;
}

/**
 * NotificationService - Background service that monitors for new notifications
 * and displays real-time toast notifications for urgent/high priority items
 */
export function NotificationService({ foundationId, userId }: NotificationServiceProps) {
  // Get recent notifications to monitor for new ones
  const recentNotifications = useQuery(api.notifications.getNotificationsByUser, {
    foundationId,
    filters: {
      priority: "urgent", // Only monitor urgent notifications for toasts
    },
    limit: 5,
  });

  // Track notification IDs to detect new ones
  const [seenNotifications, setSeenNotifications] = React.useState<Set<string>>(new Set());

  useEffect(() => {
    if (!recentNotifications) return;

    // Check for new urgent notifications
    recentNotifications.forEach(notification => {
      if (!seenNotifications.has(notification._id) && !notification.isRead) {
        // Show toast for new urgent notification
        if (notification.priority === "urgent") {
          toast.error(notification.title, {
            description: notification.message,
            action: notification.actionUrl ? {
              label: notification.actionText || "View",
              onClick: () => window.location.href = notification.actionUrl!,
            } : undefined,
            duration: 10000, // 10 seconds for urgent notifications
          });
        } else if (notification.priority === "high") {
          toast.warning(notification.title, {
            description: notification.message,
            action: notification.actionUrl ? {
              label: notification.actionText || "View",
              onClick: () => window.location.href = notification.actionUrl!,
            } : undefined,
            duration: 5000, // 5 seconds for high priority
          });
        }

        // Mark as seen
        setSeenNotifications(prev => new Set([...prev, notification._id]));
      }
    });
  }, [recentNotifications, seenNotifications]);

  // This component doesn't render anything visible
  return null;
}

// Hook for using notification service in other components
export function useNotificationService(foundationId: Id<"foundations">, userId: Id<"users">) {
  return React.useMemo(() => ({
    foundationId,
    userId,
  }), [foundationId, userId]);
}