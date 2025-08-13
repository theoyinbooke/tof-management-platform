// convex/notifications.ts
// Notification System - Convex Functions
// TheOyinbooke Foundation Management Platform

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

// ===================================
// NOTIFICATION MANAGEMENT
// ===================================

/**
 * Get notifications for a user
 */
export const getNotificationsByUser = query({
  args: {
    foundationId: v.id("foundations"),
    userId: v.optional(v.id("users")),
    filters: v.optional(v.object({
      type: v.optional(v.union(
        v.literal("academic"),
        v.literal("financial"),
        v.literal("administrative"),
        v.literal("system"),
        v.literal("alert")
      )),
      priority: v.optional(v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )),
      isRead: v.optional(v.boolean()),
      dateRange: v.optional(v.object({
        start: v.string(),
        end: v.string(),
      })),
    })),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    // Use provided userId or current user's ID
    const targetUserId = args.userId || user._id;

    // Get all notifications for the foundation and filter in code
    const allNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("foundationId"), args.foundationId))
      .collect();
    
    // Filter notifications where user is a recipient
    let notifications = allNotifications.filter(notification => 
      notification.recipients?.includes(targetUserId) || 
      notification.recipientType === "all_users"
    );

    // Apply filters to the filtered notifications
    if (args.filters?.type) {
      notifications = notifications.filter(n => n.notificationType === args.filters!.type);
    }
    if (args.filters?.priority) {
      notifications = notifications.filter(n => n.priority === args.filters!.priority);
    }
    if (args.filters?.isRead !== undefined) {
      notifications = notifications.filter(n => {
        const isRead = n.readBy?.some(r => r.userId === targetUserId);
        return args.filters!.isRead === isRead;
      });
    }

    // Date range filter
    if (args.filters?.dateRange) {
      const startTime = new Date(args.filters.dateRange.start).getTime();
      const endTime = new Date(args.filters.dateRange.end).getTime();
      notifications = notifications.filter(n => 
        n.createdAt >= startTime && n.createdAt <= endTime
      );
    }

    // Sort and limit the filtered notifications
    const finalNotifications = notifications
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, args.limit || 50);

    // Enrich with related data
    const enrichedNotifications = await Promise.all(
      finalNotifications.map(async (notification) => {
        let relatedData = null;

        // Related entity data would need to be stored differently in the schema
        // The current schema doesn't have relatedEntityId or relatedEntityType fields
        
        // Get sender info if available
        const sender = notification.createdBy ? await ctx.db.get(notification.createdBy) : null;

        return {
          ...notification,
          relatedData,
          sender,
        };
      })
    );

    return enrichedNotifications;
  },
});

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = query({
  args: {
    foundationId: v.id("foundations"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    const targetUserId = args.userId || user._id;

    const allNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("foundationId"), args.foundationId))
      .collect();
      
    // Filter notifications where user is a recipient
    const notifications = allNotifications.filter(notification => 
      notification.recipients?.includes(targetUserId) || 
      notification.recipientType === "all_users"
    );

    const totalCount = notifications.length;
    const unreadCount = notifications.filter(n => !n.readBy?.some(r => r.userId === targetUserId)).length;
    const urgentCount = notifications.filter(n => n.priority === "urgent" && !n.readBy?.some(r => r.userId === targetUserId)).length;

    // Count by type
    const typeBreakdown = {
      academic: notifications.filter(n => n.notificationType === "alert").length,
      financial: notifications.filter(n => n.notificationType === "alert").length,
      administrative: notifications.filter(n => n.notificationType === "announcement").length,
      system: notifications.filter(n => n.notificationType === "reminder").length,
      alert: notifications.filter(n => n.notificationType === "warning").length,
    };

    // Count by priority
    const priorityBreakdown = {
      low: notifications.filter(n => n.priority === "low").length,
      normal: notifications.filter(n => n.priority === "normal").length,
      high: notifications.filter(n => n.priority === "high").length,
      urgent: notifications.filter(n => n.priority === "urgent").length,
    };

    return {
      totalCount,
      unreadCount,
      urgentCount,
      typeBreakdown,
      priorityBreakdown,
    };
  },
});

/**
 * Create a new notification
 */
export const createNotification = mutation({
  args: {
    foundationId: v.id("foundations"),
    recipientId: v.id("users"),
    type: v.union(
      v.literal("academic"),
      v.literal("financial"),
      v.literal("administrative"),
      v.literal("system"),
      v.literal("alert")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    metadata: v.optional(v.object({
      beneficiaryId: v.optional(v.id("beneficiaries")),
      applicationId: v.optional(v.id("applications")),
      sessionId: v.optional(v.id("academicSessions")),
      alertId: v.optional(v.id("performanceAlerts")),
      invoiceId: v.optional(v.id("invoices")),
    })),
    expiresAt: v.optional(v.number()),
    channels: v.optional(v.array(v.union(
      v.literal("in_app"),
      v.literal("email"),
      v.literal("sms")
    ))),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      // System notifications don't require user role validation
    ]);

    const notificationId = await ctx.db.insert("notifications", {
      foundationId: args.foundationId,
      recipientType: "specific_users",
      recipients: [args.recipientId],
      title: args.title,
      message: args.message,
      notificationType: args.type === "academic" ? "reminder" : 
                       args.type === "financial" ? "alert" : 
                       args.type === "administrative" ? "announcement" : 
                       args.type === "alert" ? "warning" : "announcement",
      channels: args.channels || ["in_app"],
      sendAt: undefined,
      isScheduled: false,
      isSent: true,
      sentAt: Date.now(),
      readBy: [],
      priority: args.priority === "medium" ? "normal" : args.priority,
      requiresAction: !!args.actionUrl,
      actionUrl: args.actionUrl,
      actionText: args.actionText,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "notification_created",
      entityType: "notifications",
      entityId: notificationId,
      description: `Created notification: ${args.title}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Check if user is the recipient or has admin access
    if (!notification.recipients?.includes(user._id) && !["admin", "super_admin"].includes(user.role)) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.notificationId, {
      readBy: [...(notification.readBy || []), { userId: user._id, readAt: Date.now() }],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark multiple notifications as read
 */
export const markMultipleAsRead = mutation({
  args: {
    notificationIds: v.array(v.id("notifications")),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    let updatedCount = 0;

    for (const notificationId of args.notificationIds) {
      const notification = await ctx.db.get(notificationId);
      
      if (notification && 
          (notification.recipients?.includes(user._id) || ["admin", "super_admin"].includes(user.role))) {
        await ctx.db.patch(notificationId, {
          readBy: [...(notification.readBy || []), { userId: user._id, readAt: Date.now() }],
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
    }

    return { updatedCount };
  },
});

/**
 * Delete notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Check if user is the recipient or has admin access
    if (!notification.recipients?.includes(user._id) && !["admin", "super_admin"].includes(user.role)) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});

// ===================================
// NOTIFICATION GENERATION (INTERNAL)
// ===================================

/**
 * Internal function to create system notifications
 */
export const createSystemNotification = internalMutation({
  args: {
    foundationId: v.id("foundations"),
    recipientId: v.id("users"),
    type: v.union(
      v.literal("academic"),
      v.literal("financial"),
      v.literal("administrative"),
      v.literal("system"),
      v.literal("alert")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    metadata: v.optional(v.object({
      beneficiaryId: v.optional(v.id("beneficiaries")),
      applicationId: v.optional(v.id("applications")),
      sessionId: v.optional(v.id("academicSessions")),
      alertId: v.optional(v.id("performanceAlerts")),
      invoiceId: v.optional(v.id("invoices")),
    })),
    channels: v.optional(v.array(v.union(
      v.literal("in_app"),
      v.literal("email"),
      v.literal("sms")
    ))),
  },
  handler: async (ctx, args) => {
    // Get a system admin user for createdBy field
    const systemUser = await ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    const notificationId = await ctx.db.insert("notifications", {
      foundationId: args.foundationId,
      recipientType: "specific_users",
      recipients: [args.recipientId],
      title: args.title,
      message: args.message,
      notificationType: args.type === "academic" ? "reminder" : 
                       args.type === "financial" ? "alert" : 
                       args.type === "administrative" ? "announcement" : 
                       args.type === "alert" ? "warning" : "announcement",
      channels: args.channels || ["in_app"],
      sendAt: undefined,
      isScheduled: false,
      isSent: true,
      sentAt: Date.now(),
      readBy: [],
      priority: args.priority === "medium" ? "normal" : args.priority,
      requiresAction: !!args.actionUrl,
      actionUrl: args.actionUrl,
      actionText: args.actionText,
      createdBy: systemUser?._id || args.recipientId, // Use system admin or fallback to recipient
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Generate notifications for academic alerts
 */
export const generateAcademicNotifications = internalMutation({
  args: {
    foundationId: v.id("foundations"),
    alertId: v.id("performanceAlerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return;

    const beneficiary = await ctx.db.get(alert.beneficiaryId);
    if (!beneficiary) return;

    // Get all users who should be notified (admins, beneficiary, guardians)
    const foundationUsers = await ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const recipients = foundationUsers.filter(user => 
      ["admin", "super_admin"].includes(user.role) || 
      user._id === beneficiary.userId
      // Guardian relationship logic would need to be implemented based on relationships table
    );

    const notifications = [];

    for (const recipient of recipients) {
      const priority = alert.severity === "critical" ? "urgent" : 
                     alert.severity === "high" ? "high" : "normal";

      const notificationId = await ctx.db.insert("notifications", {
        foundationId: args.foundationId,
        recipientType: "specific_users",
        recipients: [recipient._id],
        title: alert.title,
        message: alert.description,
        notificationType: "alert",
        channels: recipient.communicationPreferences?.emailNotifications ? ["in_app", "email"] : ["in_app"],
        sendAt: undefined,
        isScheduled: false,
        isSent: true,
        sentAt: Date.now(),
        readBy: [],
        priority,
        requiresAction: true,
        actionUrl: `/academic/alerts?alert=${alert._id}`,
        actionText: "View Alert",
        createdBy: recipient._id, // Use the recipient as creator for now
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      notifications.push(notificationId);
    }

    return notifications;
  },
});

/**
 * Enhanced notification system with external communication integration
 */
export const createEnhancedNotification = internalMutation({
  args: {
    foundationId: v.id("foundations"),
    recipientId: v.id("users"),
    type: v.union(
      v.literal("academic"),
      v.literal("financial"),
      v.literal("administrative"),
      v.literal("system"),
      v.literal("alert")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    metadata: v.optional(v.object({})),
    autoSendExternal: v.optional(v.boolean()), // Auto-send based on user preferences
  },
  handler: async (ctx, args) => {
    // Get recipient user details
    const recipient = await ctx.db.get(args.recipientId);
    
    // Get a system admin user for createdBy field
    const systemUser = await ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    // Create in-app notification
    const notificationId = await ctx.db.insert("notifications", {
      foundationId: args.foundationId,
      recipientType: "specific_users",
      recipients: [args.recipientId],
      title: args.title,
      message: args.message,
      notificationType: args.type === "academic" ? "reminder" : 
                       args.type === "financial" ? "alert" : 
                       args.type === "administrative" ? "announcement" : 
                       args.type === "alert" ? "warning" : "announcement",
      channels: ["in_app"],
      sendAt: undefined,
      isScheduled: false,
      isSent: true,
      sentAt: Date.now(),
      readBy: [],
      priority: args.priority === "medium" ? "normal" : args.priority,
      requiresAction: !!args.actionUrl,
      actionUrl: args.actionUrl,
      actionText: args.actionText,
      createdBy: systemUser?._id || args.recipientId, // Use system admin or fallback to recipient
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Send external communications based on user preferences
    if (args.autoSendExternal && recipient.communicationPreferences) {
      const prefs = recipient.communicationPreferences;
      
      // Check if this type of notification should trigger external communication
      const shouldSendForType = 
        (args.type === "academic" && prefs.academicAlerts) ||
        (args.type === "financial" && prefs.financialAlerts) ||
        (args.type === "administrative" && prefs.administrativeNotifications) ||
        (args.type === "alert" && (prefs.academicAlerts || prefs.financialAlerts)) ||
        (args.type === "system" && prefs.administrativeNotifications);

      if (shouldSendForType) {
        // Send email if enabled and email provided
        if (prefs.emailNotifications && recipient.email) {
          try {
            await ctx.scheduler.runAfter(0, internal.communications.sendEmail, {
              foundationId: args.foundationId,
              to: recipient.email,
              subject: args.title,
              content: `
                <h2>${args.title}</h2>
                <p>${args.message}</p>
                ${args.actionUrl ? `<p><a href="${args.actionUrl}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${args.actionText || "View Details"}</a></p>` : ""}
                <br>
                <p style="font-size: 12px; color: #666;">
                  This is an automated notification from TheOyinbooke Foundation Management Platform.
                </p>
              `,
              priority: args.priority === "urgent" ? "urgent" : args.priority === "high" ? "high" : "normal",
            });

            // Update notification delivery status
            await ctx.db.patch(notificationId, {
              channels: ["in_app", "email"],
              updatedAt: Date.now(),
            });
          } catch (error) {
            console.error("Failed to send email notification:", error);
          }
        }

        // Send SMS if enabled, phone provided, and high/urgent priority
        if (prefs.smsNotifications && recipient.phone && 
            (args.priority === "high" || args.priority === "urgent")) {
          try {
            // Keep SMS messages short
            const smsMessage = `${args.title}: ${args.message.substring(0, 120)}${args.message.length > 120 ? "..." : ""}`;
            
            await ctx.scheduler.runAfter(0, internal.communications.sendSMS, {
              foundationId: args.foundationId,
              to: recipient.phone,
              message: smsMessage,
              priority: args.priority === "urgent" ? "urgent" : "high",
            });

            // Update notification delivery status
            const currentStatus = await ctx.db.get(notificationId);
            await ctx.db.patch(notificationId, {
              channels: [...(currentStatus?.channels || []), "sms"],
              updatedAt: Date.now(),
            });
          } catch (error) {
            console.error("Failed to send SMS notification:", error);
          }
        }
      }
    }

    return notificationId;
  },
});