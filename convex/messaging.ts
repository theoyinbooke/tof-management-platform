// convex/messaging.ts
// Messaging System - Convex Functions
// TheOyinbooke Foundation Management Platform

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ===================================
// CONVERSATION MANAGEMENT
// ===================================

/**
 * Get conversations for a user
 */
export const getConversationsByUser = query({
  args: {
    foundationId: v.id("foundations"),
    userId: v.optional(v.id("users")),
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

    const targetUserId = args.userId || user._id;

    // Get all conversations for the foundation and filter by participant
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Filter conversations where user is a participant or creator
    const conversations = allConversations
      .filter(conv => 
        conv.participantIds.includes(targetUserId) || conv.createdBy === targetUserId
      )
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, args.limit || 50);

    // Enrich with participant details and latest message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Get participant details
        const participants = await Promise.all(
          conversation.participantIds.map(async (participantId) => {
            const participant = await ctx.db.get(participantId);
            return participant;
          })
        );

        // Get latest message
        const latestMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .order("desc")
          .first();

        // Get unread count for current user
        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .filter((q) => 
            q.and(
              q.neq(q.field("senderId"), targetUserId),
              q.eq(q.field("isRead"), false)
            )
          )
          .collect()
          .then(messages => messages.length);

        return {
          ...conversation,
          participants: participants.filter(Boolean),
          latestMessage,
          unreadCount,
        };
      })
    );

    return enrichedConversations.sort((a, b) => {
      const aTime = a.latestMessage?.createdAt || a.createdAt;
      const bTime = b.latestMessage?.createdAt || b.createdAt;
      return bTime - aTime;
    });
  },
});

/**
 * Get or create conversation between users
 */
export const getOrCreateConversation = mutation({
  args: {
    foundationId: v.id("foundations"),
    participantIds: v.array(v.id("users")),
    title: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("direct"),
      v.literal("group"),
      v.literal("program"),
      v.literal("announcement")
    )),
    metadata: v.optional(v.object({
      beneficiaryId: v.optional(v.id("beneficiaries")),
      programId: v.optional(v.id("programs")),
      sessionId: v.optional(v.id("academicSessions")),
    })),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    // Ensure current user is in participant list
    const participantIds = Array.from(new Set([user._id, ...args.participantIds]));

    // For direct conversations, check if one already exists
    if (args.type === "direct" || (!args.type && participantIds.length === 2)) {
      const existingConversation = await ctx.db
        .query("conversations")
        .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
        .filter((q) => 
          q.and(
            q.eq(q.field("type"), "direct"),
            q.eq(q.field("participantIds"), participantIds.sort())
          )
        )
        .first();

      if (existingConversation) {
        return existingConversation._id;
      }
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      foundationId: args.foundationId,
      participantIds,
      createdBy: user._id,
      title: args.title || (args.type === "direct" ? undefined : `Group Chat`),
      type: args.type || (participantIds.length === 2 ? "direct" : "group"),
      metadata: args.metadata,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "conversation_created",
      entityType: "conversations",
      entityId: conversationId,
      description: `Created ${args.type || "direct"} conversation with ${participantIds.length} participants`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return conversationId;
  },
});

/**
 * Add participants to group conversation
 */
export const addParticipants = mutation({
  args: {
    conversationId: v.id("conversations"),
    foundationId: v.id("foundations"),
    participantIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.foundationId !== args.foundationId) {
      throw new Error("Conversation not found");
    }

    if (conversation.type === "direct") {
      throw new Error("Cannot add participants to direct conversation");
    }

    // Add new participants
    const updatedParticipants = Array.from(new Set([
      ...conversation.participantIds,
      ...args.participantIds
    ]));

    await ctx.db.patch(args.conversationId, {
      participantIds: updatedParticipants,
      updatedAt: Date.now(),
    });

    // Create system message about added participants
    const addedUsers = await Promise.all(
      args.participantIds.map(id => ctx.db.get(id))
    );
    const addedNames = addedUsers
      .filter(Boolean)
      .map(u => `${u!.firstName} ${u!.lastName}`)
      .join(", ");

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      foundationId: args.foundationId,
      senderId: user._id,
      content: `Added ${addedNames} to the conversation`,
      type: "system",
      isRead: false,
      deliveredTo: [],
      readBy: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ===================================
// MESSAGE MANAGEMENT
// ===================================

/**
 * Get messages for a conversation
 */
export const getMessagesByConversation = query({
  args: {
    conversationId: v.id("conversations"),
    foundationId: v.id("foundations"),
    limit: v.optional(v.number()),
    before: v.optional(v.number()), // For pagination
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    // Verify user has access to conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.foundationId !== args.foundationId) {
      throw new Error("Conversation not found");
    }

    if (!conversation.participantIds.includes(user._id)) {
      throw new Error("Access denied to conversation");
    }

    // Get messages
    let query = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId));

    if (args.before) {
      query = query.filter((q) => q.lt(q.field("createdAt"), args.before!));
    }

    const messages = await query
      .order("desc")
      .take(args.limit || 50);

    // Enrich with sender details and attachment info
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = message.senderId ? await ctx.db.get(message.senderId) : null;
        
        // Get attachment details if present
        let attachment = null;
        if (message.attachmentId) {
          attachment = await ctx.storage.getUrl(message.attachmentId);
        }

        return {
          ...message,
          sender,
          attachmentUrl: attachment,
        };
      })
    );

    return enrichedMessages.reverse(); // Return in chronological order
  },
});

/**
 * Send a new message
 */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    foundationId: v.id("foundations"),
    content: v.string(),
    type: v.optional(v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("image"),
      v.literal("system")
    )),
    attachmentId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    // Verify conversation access
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.foundationId !== args.foundationId) {
      throw new Error("Conversation not found");
    }

    if (!conversation.participantIds.includes(user._id)) {
      throw new Error("Not a participant in this conversation");
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      foundationId: args.foundationId,
      senderId: user._id,
      content: args.content,
      type: args.type || "text",
      attachmentId: args.attachmentId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      replyToId: args.replyToId,
      isRead: false,
      deliveredTo: [],
      readBy: [user._id], // Sender automatically has read status
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update conversation's last activity
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    // Create notifications for other participants
    const otherParticipants = conversation.participantIds.filter(id => id !== user._id);
    
    for (const participantId of otherParticipants) {
      const recipient = await ctx.db.get(participantId);
      if (recipient) {
        await ctx.scheduler.runAfter(0, internal.notifications.createSystemNotification, {
          foundationId: args.foundationId,
          recipientId: participantId,
          type: "administrative",
          priority: "low",
          title: `New message from ${user.firstName} ${user.lastName}`,
          message: args.content.length > 100 ? `${args.content.substring(0, 100)}...` : args.content,
          actionUrl: `/messages/${args.conversationId}`,
          actionText: "View Message",
          relatedEntityType: "conversations",
          relatedEntityId: args.conversationId,
          // metadata: {
          //   messageId, // messageId not in metadata schema
          // },
          channels: ["in_app"],
        });
      }
    }

    return messageId;
  },
});

/**
 * Mark messages as read
 */
export const markMessagesAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    foundationId: v.id("foundations"),
    messageIds: v.optional(v.array(v.id("messages"))),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer", 
      "beneficiary",
      "guardian",
    ]);

    // Verify conversation access
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(user._id)) {
      throw new Error("Access denied");
    }

    // Get messages to mark as read
    let messagesToUpdate;
    if (args.messageIds) {
      messagesToUpdate = await Promise.all(
        args.messageIds.map(id => ctx.db.get(id))
      );
      messagesToUpdate = messagesToUpdate.filter(Boolean);
    } else {
      // Mark all unread messages in conversation as read
      messagesToUpdate = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
        .filter((q) => 
          q.and(
            q.neq(q.field("senderId"), user._id),
            q.eq(q.field("isRead"), false)
          )
        )
        .collect();
    }

    // Update each message
    for (const message of messagesToUpdate) {
      if (message && !message.readBy.includes(user._id)) {
        await ctx.db.patch(message._id, {
          isRead: true,
          readBy: [...message.readBy, user._id],
          updatedAt: Date.now(),
        });
      }
    }

    return { messagesUpdated: messagesToUpdate.length };
  },
});

/**
 * Delete a message
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
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

    const message = await ctx.db.get(args.messageId);
    if (!message || message.foundationId !== args.foundationId) {
      throw new Error("Message not found");
    }

    // Only sender or admins can delete messages
    if (message.senderId !== user._id && !["admin", "super_admin"].includes(user.role)) {
      throw new Error("Access denied");
    }

    // Soft delete by updating content
    await ctx.db.patch(args.messageId, {
      content: "[Message deleted]",
      isDeleted: true,
      deletedBy: user._id,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ===================================
// FILE UPLOAD SUPPORT
// ===================================

/**
 * Generate upload URL for message attachments
 */
export const generateUploadUrl = mutation({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary", 
      "guardian",
    ]);

    return await ctx.storage.generateUploadUrl();
  },
});

// ===================================
// CONVERSATION ANALYTICS
// ===================================

/**
 * Get messaging statistics
 */
export const getMessagingStats = query({
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

    // Get user's conversations
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Filter conversations where user is a participant or creator
    const conversations = allConversations.filter(conv => 
      conv.participantIds.includes(targetUserId) || conv.createdBy === targetUserId
    );

    const conversationIds = conversations.map(c => c._id);

    // Get total messages
    const allMessages = await Promise.all(
      conversationIds.map(async (id) => 
        ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", id))
          .collect()
      )
    );
    const totalMessages = allMessages.flat().length;

    // Get unread messages
    const unreadMessages = await Promise.all(
      conversationIds.map(async (id) =>
        ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", id))
          .filter((q) => 
            q.and(
              q.neq(q.field("senderId"), targetUserId),
              q.eq(q.field("isRead"), false)
            )
          )
          .collect()
      )
    );
    const totalUnread = unreadMessages.flat().length;

    return {
      totalConversations: conversations.length,
      activeConversations: conversations.filter(c => c.isActive).length,
      totalMessages,
      unreadMessages: totalUnread,
      directConversations: conversations.filter(c => c.type === "direct").length,
      groupConversations: conversations.filter(c => c.type === "group").length,
    };
  },
});