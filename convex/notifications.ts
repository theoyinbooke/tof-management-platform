// convex/notifications.ts
// Notification System - Convex Functions
// TheOyinbooke Foundation Management Platform

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

/**
 * Generate email content using appropriate template based on notification type
 */
function generateNotificationEmailContent(
  type: string,
  title: string,
  message: string,
  recipientName: string,
  foundationName: string,
  priority: "low" | "medium" | "high" | "urgent",
  actionUrl?: string,
  actionText?: string,
  additionalData?: any
): string {
  // Determine category based on type and priority
  const category = 
    type === "academic" ? (priority === "high" || priority === "urgent" ? "warning" : "information") :
    type === "financial" ? (priority === "high" || priority === "urgent" ? "warning" : "information") :
    type === "alert" ? "warning" :
    type === "success" ? "success" :
    type === "error" ? "error" : "information";

  // Use the generic system notification template
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${
        category === 'success' ? '#16a34a' :
        category === 'error' ? '#dc2626' :
        category === 'warning' ? '#f59e0b' : '#374151'
      }; color: white; padding: 20px; text-align: center;">
        <h1>
          ${category === 'success' ? '✅' :
            category === 'error' ? '❌' :
            category === 'warning' ? '⚠️' : 'ℹ️'} ${title}
        </h1>
        <p>TheOyinbooke Foundation${priority === 'urgent' ? ' - URGENT' : ''}</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${recipientName},</h2>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${
          category === 'success' ? '#16a34a' :
          category === 'error' ? '#dc2626' :
          category === 'warning' ? '#f59e0b' : '#374151'
        };">
          <div style="margin-bottom: 15px;">
            <span style="background-color: ${
              priority === 'urgent' ? '#dc2626' :
              priority === 'high' ? '#f59e0b' :
              priority === 'medium' ? '#0ea5e9' : '#6b7280'
            }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
              ${priority} Priority
            </span>
          </div>
          
          <div style="color: #374151; line-height: 1.6;">
            ${message}
          </div>
          
          <div style="margin-top: 15px; font-size: 14px; color: #6b7280;">
            <strong>Timestamp:</strong> ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
          </div>
        </div>
        
        ${actionUrl && actionText ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" style="background-color: ${
            category === 'success' ? '#16a34a' :
            category === 'error' ? '#dc2626' :
            category === 'warning' ? '#f59e0b' : '#374151'
          }; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            ${actionText}
          </a>
        </div>
        ` : ''}
        
        <p>This notification was sent to keep you informed about important updates regarding your ${foundationName} account.</p>
        
        <p>Best regards,<br>
        The ${foundationName} Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

/**
 * Send application submission acknowledgement email
 */
export const sendApplicationSubmissionEmail = internalMutation({
  args: {
    foundationId: v.id("foundations"),
    applicantEmail: v.string(),
    applicantName: v.string(),
    applicationId: v.string(),
    submissionDate: v.string(),
    expectedReviewTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get foundation details
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) throw new Error("Foundation not found");

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0ea5e9; color: white; padding: 20px; text-align: center;">
          <h1>Application Submitted!</h1>
          <p>TheOyinbooke Foundation</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2>Dear ${args.applicantName},</h2>
          
          <p>Thank you for submitting your application to ${foundation.name}. We have successfully received your application and it is now under review.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <h3 style="margin-top: 0; color: #0ea5e9;">Application Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Application ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${args.applicationId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Submission Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${args.submissionDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span style="color: #0ea5e9; font-weight: bold;">Under Review</span></td>
              </tr>
              ${args.expectedReviewTime ? `
              <tr>
                <td style="padding: 8px 0;"><strong>Expected Review Time:</strong></td>
                <td style="padding: 8px 0;">${args.expectedReviewTime}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">What Happens Next?</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
              <li>Our review team will evaluate your application</li>
              <li>You may be contacted for additional information or documents</li>
              <li>We will notify you via email when a decision is made</li>
              <li>Keep your application ID for reference</li>
            </ul>
          </div>
          
          <p>Please save this email for your records. If you have any questions about your application, please contact us and reference your application ID.</p>
          
          <p>Best regards,<br>
          The ${foundation.name} Admissions Team</p>
        </div>
        
        <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    // Send email
    await ctx.scheduler.runAfter(0, internal.communications.sendEmail, {
      foundationId: args.foundationId,
      to: args.applicantEmail,
      subject: `Application Submitted Successfully - ${args.applicationId}`,
      content: emailContent,
    });
  },
});

/**
 * Send new user welcome email
 */
export const sendNewUserWelcomeEmail = internalMutation({
  args: {
    foundationId: v.id("foundations"),
    userEmail: v.string(),
    userName: v.string(),
    userRole: v.string(),
  },
  handler: async (ctx, args) => {
    // Get foundation details
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) throw new Error("Foundation not found");

    const dashboardUrl = `${process.env.SITE_URL || 'https://theoyinbookefoundation.com'}/dashboard`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1>Welcome to TheOyinbooke Foundation!</h1>
          <p>Your account has been created successfully</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2>Hello ${args.userName}!</h2>
          
          <p>Congratulations! Your account has been successfully created for <strong>${foundation.name}</strong>.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0; color: #16a34a;">Account Details</h3>
            <p><strong>Role:</strong> ${args.userRole.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Foundation:</strong> ${foundation.name}</p>
            <p><strong>Account Status:</strong> Active</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="background-color: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #0ea5e9;">What's Next?</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #0369a1;">
              <li>Complete your profile information</li>
              <li>Explore the dashboard features</li>
              <li>Check your notification preferences</li>
              ${args.userRole === 'beneficiary' ? '<li>Upload required documents</li>' : ''}
              ${args.userRole === 'guardian' ? '<li>Add your dependent beneficiaries</li>' : ''}
              ${args.userRole === 'reviewer' ? '<li>Review your assigned applications</li>' : ''}
              ${args.userRole === 'admin' ? '<li>Set up foundation configuration</li>' : ''}
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please contact our support team.</p>
          
          <p>Best regards,<br>
          The ${foundation.name} Team</p>
        </div>
        
        <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    // Send email
    await ctx.scheduler.runAfter(0, internal.communications.sendEmail, {
      foundationId: args.foundationId,
      to: args.userEmail,
      subject: `Welcome to ${foundation.name} - Account Created Successfully`,
      content: emailContent,
    });
  },
});

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
            // Get foundation details for email template
            const foundation = await ctx.db.get(args.foundationId);
            const foundationName = foundation?.name || "TheOyinbooke Foundation";
            
            // Generate professional email content using template
            const emailContent = generateNotificationEmailContent(
              args.type,
              args.title,
              args.message,
              `${recipient.firstName} ${recipient.lastName}`,
              foundationName,
              args.priority,
              args.actionUrl,
              args.actionText
            );

            await ctx.scheduler.runAfter(0, internal.communications.sendEmail, {
              foundationId: args.foundationId,
              to: recipient.email,
              subject: `${args.priority === 'urgent' ? '🚨 URGENT: ' : args.priority === 'high' ? '⚠️ ' : ''}${args.title}`,
              content: emailContent,
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