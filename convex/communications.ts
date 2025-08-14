// convex/communications.ts
// External Communication System - Email/SMS Integration
// TheOyinbooke Foundation Management Platform

import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

// ===================================
// EMAIL COMMUNICATION
// ===================================

/**
 * Send email notification
 */
export const sendEmail = internalAction({
  args: {
    foundationId: v.id("foundations"),
    to: v.string(),
    subject: v.string(),
    content: v.string(),
    template: v.optional(v.string()),
    templateData: v.optional(v.any()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"), 
      v.literal("high"),
      v.literal("urgent")
    )),
    attachments: v.optional(v.array(v.object({
      filename: v.string(),
      contentType: v.string(),
      storageId: v.id("_storage"),
    }))),
  },
  handler: async (ctx: ActionCtx, args): Promise<{ success: boolean; messageId: Id<"communicationLogs">; externalId?: string }> => {
    console.log(`[EMAIL] Attempting to send email to ${args.to} with subject: ${args.subject}`);
    
    // Log email attempt using mutation
    const emailLogId: Id<"communicationLogs"> = await ctx.runMutation(internal.communications.logEmailAttempt, {
      foundationId: args.foundationId,
      type: "email",
      recipient: args.to,
      subject: args.subject,
      content: args.content,
      status: "pending",
      priority: args.priority || "normal",
      template: args.template,
      templateData: args.templateData,
      attemptCount: 1,
    });

    try {
      // Check if Resend API key is configured
      const resendApiKey = process.env.RESEND_API_KEY;
      const isSimulation = !resendApiKey || resendApiKey === "your_resend_api_key_here" || resendApiKey.startsWith('re_') === false;
      
      console.log(`[EMAIL] API Key validation:`, {
        hasKey: !!resendApiKey,
        keyLength: resendApiKey?.length,
        startsWithRe: resendApiKey?.startsWith('re_'),
        isSimulation
      });
      
      if (isSimulation) {
        console.log(`[EMAIL SIMULATION] To: ${args.to}, Subject: ${args.subject}`);
        console.log(`[EMAIL SIMULATION] RESEND_API_KEY configured: ${!!resendApiKey}`);
        console.log(`Content preview: ${args.content.substring(0, 200)}...`);
        
        // Update log as sent (simulation)
        await ctx.runMutation(internal.communications.updateEmailLog, {
          emailLogId,
          status: "sent",
          sentAt: Date.now(),
        });
        
        console.log(`[EMAIL SIMULATION] Email marked as sent in logs`);
        return { success: true, messageId: emailLogId };
      }

      // Real Resend integration
      console.log(`[EMAIL] Using real Resend API to send to ${args.to}`);
      
      const emailData: any = {
        from: 'TheOyinbooke Foundation <noreply@theoyinbookefoundation.com>',
        to: [args.to],
        subject: args.subject,
        html: args.content,
      };

      // Add attachments if provided
      if (args.attachments && args.attachments.length > 0) {
        emailData.attachments = await Promise.all(
          args.attachments.map(async (attachment) => {
            // Get file from Convex storage
            const fileUrl = await ctx.storage.getUrl(attachment.storageId);
            if (!fileUrl) throw new Error("File not found");
            
            // Fetch file content
            const response = await fetch(fileUrl);
            const buffer = await response.arrayBuffer();
            
            return {
              filename: attachment.filename,
              content: Array.from(new Uint8Array(buffer)),
              type: attachment.contentType,
            };
          })
        );
      }

      // Send email via Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error(`[EMAIL] Resend API error response:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          from: emailData.from,
          to: emailData.to
        });
        throw new Error(`Resend API error (${response.status}): ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      // Update log as sent
      await ctx.runMutation(internal.communications.updateEmailLog, {
        emailLogId,
        status: "sent",
        sentAt: Date.now(),
      });

      console.log(`[EMAIL] Successfully sent email to ${args.to} with Resend ID: ${result.id}`);
      return { success: true, messageId: emailLogId, externalId: result.id };
    } catch (error) {
      console.error(`[EMAIL] Failed to send email to ${args.to}:`, error);
      
      // Update log as failed
      await ctx.runMutation(internal.communications.updateEmailLog, {
        emailLogId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        lastAttemptAt: Date.now(),
      });

      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Helper mutation to log email attempts
 */
export const logEmailAttempt = internalMutation({
  args: {
    foundationId: v.id("foundations"),
    type: v.literal("email"),
    recipient: v.string(),
    subject: v.optional(v.string()),
    content: v.string(),
    status: v.literal("pending"),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"), 
      v.literal("high"),
      v.literal("urgent")
    )),
    template: v.optional(v.string()),
    templateData: v.optional(v.any()),
    attemptCount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("communicationLogs", {
      foundationId: args.foundationId,
      type: args.type,
      recipient: args.recipient,
      subject: args.subject,
      content: args.content,
      status: args.status,
      priority: args.priority || "normal",
      template: args.template,
      templateData: args.templateData,
      attemptCount: args.attemptCount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Helper mutation to update email logs
 */
export const updateEmailLog = internalMutation({
  args: {
    emailLogId: v.id("communicationLogs"),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("bounced")
    ),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    lastAttemptAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { emailLogId, ...updates } = args;
    await ctx.db.patch(emailLogId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Send SMS notification
 */
export const sendSMS = internalMutation({
  args: {
    foundationId: v.id("foundations"),
    to: v.string(), // Nigerian phone number
    message: v.string(),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"), 
      v.literal("urgent")
    )),
  },
  handler: async (ctx, args) => {
    // Validate Nigerian phone number format
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(args.to)) {
      throw new Error("Invalid Nigerian phone number format");
    }

    // Log SMS attempt
    const smsLogId = await ctx.db.insert("communicationLogs", {
      foundationId: args.foundationId,
      type: "sms",
      recipient: args.to,
      content: args.message,
      status: "pending",
      priority: args.priority || "normal",
      attemptCount: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    try {
      // TODO: Integrate with SMS service provider (Twilio, Termii, etc.)
      // This is a placeholder for actual SMS sending logic
      
      const isSimulation = process.env.NODE_ENV === "development";
      
      if (isSimulation) {
        console.log(`[SMS SIMULATION] To: ${args.to}, Message: ${args.message}`);
        
        // Update log as sent (simulation)
        await ctx.db.patch(smsLogId, {
          status: "sent",
          sentAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        return { success: true, messageId: smsLogId };
      }

      // Real SMS integration would go here
      // Example with Twilio:
      /*
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: args.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: args.to
      });
      */

      // Update log as sent
      await ctx.db.patch(smsLogId, {
        status: "sent",
        sentAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { success: true, messageId: smsLogId };
    } catch (error) {
      // Update log as failed
      await ctx.db.patch(smsLogId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        lastAttemptAt: Date.now(),
        updatedAt: Date.now(),
      });

      throw new Error(`Failed to send SMS: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// ===================================
// NOTIFICATION TEMPLATES
// ===================================

/**
 * Get communication templates
 */
export const getTemplates = query({
  args: {
    foundationId: v.id("foundations"),
    type: v.optional(v.union(v.literal("email"), v.literal("sms"))),
    category: v.optional(v.union(
      v.literal("academic"),
      v.literal("financial"),
      v.literal("administrative"),
      v.literal("alert"),
      v.literal("welcome")
    )),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    let query = ctx.db
      .query("communicationTemplates")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    return await query
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Create communication template
 */
export const createTemplate = mutation({
  args: {
    foundationId: v.id("foundations"),
    name: v.string(),
    type: v.union(v.literal("email"), v.literal("sms")),
    category: v.union(
      v.literal("academic"),
      v.literal("financial"),
      v.literal("administrative"),
      v.literal("alert"),
      v.literal("welcome")
    ),
    subject: v.optional(v.string()), // For email templates
    content: v.string(),
    variables: v.array(v.string()), // Available template variables
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    const templateId = await ctx.db.insert("communicationTemplates", {
      foundationId: args.foundationId,
      name: args.name,
      type: args.type,
      category: args.category,
      subject: args.subject,
      content: args.content,
      variables: args.variables,
      description: args.description,
      isActive: true,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "template_created",
      entityType: "communicationTemplates",
      entityId: templateId,
      description: `Created ${args.type} template: ${args.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return templateId;
  },
});

// ===================================
// BULK COMMUNICATION
// ===================================

/**
 * Send bulk notifications
 */
export const sendBulkNotification = mutation({
  args: {
    foundationId: v.id("foundations"),
    recipients: v.array(v.object({
      userId: v.id("users"),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
    })),
    channels: v.array(v.union(v.literal("email"), v.literal("sms"), v.literal("in_app"))),
    subject: v.optional(v.string()),
    message: v.string(),
    templateId: v.optional(v.id("communicationTemplates")),
    templateData: v.optional(v.any()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    )),
    category: v.union(
      v.literal("academic"),
      v.literal("financial"),
      v.literal("administrative"),
      v.literal("alert"),
      v.literal("announcement")
    ),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    // Create bulk communication record
    const bulkId = await ctx.db.insert("bulkCommunications", {
      foundationId: args.foundationId,
      createdBy: user._id,
      recipientCount: args.recipients.length,
      channels: args.channels,
      subject: args.subject,
      message: args.message,
      templateId: args.templateId,
      priority: args.priority || "normal",
      category: args.category,
      status: "processing",
      sentCount: 0,
      failedCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Process each recipient
    for (const recipient of args.recipients) {
      try {
        // Send in-app notification
        if (args.channels.includes("in_app")) {
          await ctx.scheduler.runAfter(0, internal.notifications.createSystemNotification, {
            foundationId: args.foundationId,
            recipientId: recipient.userId,
            type: args.category === "announcement" ? "administrative" : args.category,
            priority: args.priority === "normal" ? "low" : args.priority || "low",
            title: args.subject || "Foundation Notification",
            message: args.message,
            channels: ["in_app"],
          });
        }

        // Send email
        if (args.channels.includes("email") && recipient.email) {
          await ctx.scheduler.runAfter(0, internal.communications.sendEmail, {
            foundationId: args.foundationId,
            to: recipient.email,
            subject: args.subject || "Foundation Notification",
            content: args.message,
            priority: args.priority,
          });
        }

        // Send SMS
        if (args.channels.includes("sms") && recipient.phone) {
          await ctx.scheduler.runAfter(0, internal.communications.sendSMS, {
            foundationId: args.foundationId,
            to: recipient.phone,
            message: args.message,
            priority: args.priority,
          });
        }

        // Update sent count
        const bulk = await ctx.db.get(bulkId);
        if (bulk) {
          await ctx.db.patch(bulkId, {
            sentCount: bulk.sentCount + 1,
            updatedAt: Date.now(),
          });
        }
      } catch (error) {
        // Update failed count
        const bulk = await ctx.db.get(bulkId);
        if (bulk) {
          await ctx.db.patch(bulkId, {
            failedCount: bulk.failedCount + 1,
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Mark as completed
    await ctx.db.patch(bulkId, {
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "bulk_communication_sent",
      entityType: "bulkCommunications",
      entityId: bulkId,
      description: `Sent bulk notification to ${args.recipients.length} recipients via ${args.channels.join(", ")}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return bulkId;
  },
});

// ===================================
// COMMUNICATION LOGS & ANALYTICS
// ===================================

/**
 * Get communication logs
 */
export const getCommunicationLogs = query({
  args: {
    foundationId: v.id("foundations"),
    type: v.optional(v.union(v.literal("email"), v.literal("sms"))),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("delivered"),
      v.literal("bounced")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    let query = ctx.db
      .query("communicationLogs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  },
});

/**
 * Get communication statistics
 */
export const getCommunicationStats = query({
  args: {
    foundationId: v.id("foundations"),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    let query = ctx.db
      .query("communicationLogs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.dateRange) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), args.dateRange!.start),
          q.lte(q.field("createdAt"), args.dateRange!.end)
        )
      );
    }

    const logs = await query.collect();

    // Calculate statistics
    const emailLogs = logs.filter(log => log.type === "email");
    const smsLogs = logs.filter(log => log.type === "sms");

    return {
      total: {
        sent: logs.filter(log => log.status === "sent").length,
        failed: logs.filter(log => log.status === "failed").length,
        pending: logs.filter(log => log.status === "pending").length,
      },
      email: {
        sent: emailLogs.filter(log => log.status === "sent").length,
        failed: emailLogs.filter(log => log.status === "failed").length,
        pending: emailLogs.filter(log => log.status === "pending").length,
      },
      sms: {
        sent: smsLogs.filter(log => log.status === "sent").length,
        failed: smsLogs.filter(log => log.status === "failed").length,
        pending: smsLogs.filter(log => log.status === "pending").length,
      },
      successRate: {
        overall: logs.length > 0 ? (logs.filter(log => log.status === "sent").length / logs.length) * 100 : 0,
        email: emailLogs.length > 0 ? (emailLogs.filter(log => log.status === "sent").length / emailLogs.length) * 100 : 0,
        sms: smsLogs.length > 0 ? (smsLogs.filter(log => log.status === "sent").length / smsLogs.length) * 100 : 0,
      },
    };
  },
});

// ===================================
// USER PREFERENCES
// ===================================

/**
 * Update user communication preferences
 */
export const updateUserPreferences = mutation({
  args: {
    foundationId: v.id("foundations"),
    userId: v.optional(v.id("users")),
    preferences: v.object({
      emailNotifications: v.boolean(),
      smsNotifications: v.boolean(),
      academicAlerts: v.boolean(),
      financialAlerts: v.boolean(),
      administrativeNotifications: v.boolean(),
      marketingCommunications: v.boolean(),
    }),
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

    // Only admins can update other users' preferences
    if (targetUserId !== user._id && !["admin", "super_admin"].includes(user.role)) {
      throw new Error("Access denied");
    }

    // Update user preferences
    await ctx.db.patch(targetUserId, {
      communicationPreferences: args.preferences,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ===================================
// ADDITIONAL API FUNCTIONS FOR UI
// ===================================

/**
 * Get communication by ID
 */
export const getCommunicationById = query({
  args: {
    communicationId: v.id("communicationLogs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const communication = await ctx.db.get(args.communicationId);
    if (!communication) return null;

    // Get user to check foundation access
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== communication.foundationId) {
      return null;
    }

    return communication;
  },
});

/**
 * Get communications by foundation (for dashboard)
 */
export const getByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
    type: v.optional(v.union(v.literal("email"), v.literal("sms"))),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("delivered"),
      v.literal("bounced")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    let query = ctx.db
      .query("communicationLogs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  },
});

/**
 * Get communication statistics (for dashboard)
 */
export const getStatistics = query({
  args: {
    foundationId: v.id("foundations"),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    let query = ctx.db
      .query("communicationLogs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.dateRange) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), args.dateRange!.start),
          q.lte(q.field("createdAt"), args.dateRange!.end)
        )
      );
    }

    const logs = await query.collect();

    // Get today's logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter(log => log.createdAt >= today.getTime());

    const emailLogs = logs.filter(log => log.type === "email");
    const smsLogs = logs.filter(log => log.type === "sms");

    return {
      totalMessages: logs.length,
      todayMessages: todayLogs.length,
      emailsSent: emailLogs.filter(log => log.status === "sent").length,
      smsSent: smsLogs.filter(log => log.status === "sent").length,
      pendingMessages: logs.filter(log => log.status === "pending").length,
      emailDeliveryRate: emailLogs.length > 0 ? emailLogs.filter(log => log.status === "sent").length / emailLogs.length : 0,
      smsDeliveryRate: smsLogs.length > 0 ? smsLogs.filter(log => log.status === "sent").length / smsLogs.length : 0,
    };
  },
});

/**
 * Get notifications (for UI)
 */
export const getNotifications = query({
  args: {
    foundationId: v.id("foundations"),
    unreadOnly: v.optional(v.boolean()),
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

    // For now, return communication logs as notifications
    // In a full implementation, you'd have a separate notifications table
    let query = ctx.db
      .query("communicationLogs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.unreadOnly) {
      // Filter for recent high-priority messages
      query = query.filter((q) => 
        q.or(
          q.eq(q.field("priority"), "high"),
          q.eq(q.field("priority"), "urgent")
        )
      );
    }

    const logs = await query
      .order("desc")
      .take(args.limit || 20);

    return logs.map(log => ({
      _id: log._id,
      subject: log.subject || "Notification",
      content: log.content,
      createdAt: log.createdAt,
      priority: log.priority,
      status: log.status,
    }));
  },
});

/**
 * Resend failed communication
 */
export const resendCommunication = mutation({
  args: {
    communicationId: v.id("communicationLogs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const communication = await ctx.db.get(args.communicationId);
    if (!communication) throw new Error("Communication not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== communication.foundationId) {
      throw new Error("Access denied");
    }

    if (!["admin", "super_admin"].includes(user.role)) {
      throw new Error("Insufficient permissions");
    }

    // Only resend failed communications
    if (communication.status !== "failed") {
      throw new Error("Only failed communications can be resent");
    }

    // Update attempt count and status
    await ctx.db.patch(args.communicationId, {
      status: "pending",
      attemptCount: (communication.attemptCount || 1) + 1,
      updatedAt: Date.now(),
    });

    // Trigger resend via scheduler
    if (communication.type === "email") {
      await ctx.scheduler.runAfter(0, internal.communications.sendEmail, {
        foundationId: communication.foundationId,
        to: communication.recipient,
        subject: communication.subject || "Resent Message",
        content: communication.content,
        priority: communication.priority,
      });
    } else if (communication.type === "sms") {
      await ctx.scheduler.runAfter(0, internal.communications.sendSMS, {
        foundationId: communication.foundationId,
        to: communication.recipient,
        message: communication.content,
        priority: communication.priority,
      });
    }

    return { success: true };
  },
});

/**
 * Mark communication as read
 */
export const markAsRead = mutation({
  args: {
    communicationId: v.id("communicationLogs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const communication = await ctx.db.get(args.communicationId);
    if (!communication) throw new Error("Communication not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== communication.foundationId) {
      throw new Error("Access denied");
    }

    // Update communication as read (you might want to track this differently)
    await ctx.db.patch(args.communicationId, {
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});