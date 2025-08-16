import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get conversations for a user
export const getConversations = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) return [];

    // Get all conversations where user is a participant
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter for conversations where user is a participant
    const userConversations = conversations.filter(conv => 
      conv.participantIds.includes(user._id)
    );

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conv) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .take(1);
        
        const lastMessage = messages[0];
        
        // Get unread count
        const allMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();
        
        // Filter unread messages manually since readBy is an array of user IDs
        const unreadMessages = allMessages.filter(msg => 
          msg.senderId !== user._id && 
          (!msg.readBy || !msg.readBy.includes(user._id))
        );

        // Get participant details
        const participants = await Promise.all(
          conv.participantIds.map(async (participantId) => {
            const participant = await ctx.db.get(participantId);
            return participant ? {
              _id: participant._id,
              firstName: participant.firstName,
              lastName: participant.lastName,
              email: participant.email,
              role: participant.role,
            } : null;
          })
        );

        // Get sender details for last message
        let lastMessageSender = null;
        if (lastMessage) {
          lastMessageSender = await ctx.db.get(lastMessage.senderId);
        }

        return {
          ...conv,
          lastMessage: lastMessage ? {
            ...lastMessage,
            sender: lastMessageSender ? {
              firstName: lastMessageSender.firstName,
              lastName: lastMessageSender.lastName,
            } : null,
          } : null,
          unreadCount: unreadMessages.length,
          participants: participants.filter(p => p !== null),
        };
      })
    );

    // Sort by last message time
    return conversationsWithDetails.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return bTime - aTime;
    });
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    // Check if user is participant in conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(user._id)) {
      return [];
    }

    // Get messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    // Get sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender ? {
            _id: sender._id,
            firstName: sender.firstName,
            lastName: sender.lastName,
            email: sender.email,
            role: sender.role,
          } : null,
        };
      })
    );

    return messagesWithSenders;
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    type: v.optional(v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("image")
    )),
    attachmentId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if user is participant in conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(user._id)) {
      throw new Error("Access denied");
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      foundationId: conversation.foundationId,
      senderId: user._id,
      content: args.content,
      type: args.type || "text",
      attachmentId: args.attachmentId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      isRead: false,
      deliveredTo: conversation.participantIds,
      readBy: [user._id], // Sender has read their own message
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update conversation's updatedAt
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    // Create notifications for other participants
    const otherParticipants = conversation.participantIds.filter(id => id !== user._id);
    if (otherParticipants.length > 0) {
      await ctx.db.insert("notifications", {
        foundationId: conversation.foundationId,
        recipientType: "specific_users",
        recipients: otherParticipants,
        title: "New Message",
        message: `${user.firstName} ${user.lastName}: ${args.content.substring(0, 100)}${args.content.length > 100 ? '...' : ''}`,
        notificationType: "alert",
        channels: ["in_app"],
        isScheduled: false,
        isSent: true,
        sentAt: Date.now(),
        priority: "normal",
        requiresAction: false,
        createdBy: user._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return messageId;
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Get all unread messages in conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    // Update messages to mark as read by this user
    for (const message of messages) {
      // Check if user has already read this message
      const hasRead = message.readBy && message.readBy.includes(user._id);
      
      if (!hasRead && message.senderId !== user._id) {
        const updatedReadBy = [
          ...(message.readBy || []),
          user._id
        ];
        await ctx.db.patch(message._id, {
          readBy: updatedReadBy,
          isRead: message.deliveredTo ? updatedReadBy.length === message.deliveredTo.length : true,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// Create a new conversation
export const createConversation = mutation({
  args: {
    foundationId: v.id("foundations"),
    participantIds: v.array(v.id("users")),
    title: v.optional(v.string()),
    type: v.union(
      v.literal("direct"),
      v.literal("group"),
      v.literal("program"),
      v.literal("announcement")
    ),
    metadata: v.optional(v.object({
      beneficiaryId: v.optional(v.id("beneficiaries")),
      programId: v.optional(v.id("programs")),
      sessionId: v.optional(v.id("academicSessions")),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }

    // Ensure creator is in participants
    const participantIds = args.participantIds.includes(user._id) 
      ? args.participantIds 
      : [...args.participantIds, user._id];

    // Check for existing direct conversation if type is direct
    if (args.type === "direct" && participantIds.length === 2) {
      const existingConversations = await ctx.db
        .query("conversations")
        .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
        .filter((q) => 
          q.and(
            q.eq(q.field("type"), "direct"),
            q.eq(q.field("isActive"), true)
          )
        )
        .collect();

      const existing = existingConversations.find(conv => {
        return conv.participantIds.length === 2 &&
          conv.participantIds.includes(participantIds[0]) &&
          conv.participantIds.includes(participantIds[1]);
      });

      if (existing) {
        return existing._id;
      }
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      foundationId: args.foundationId,
      participantIds,
      createdBy: user._id,
      title: args.title,
      type: args.type,
      metadata: args.metadata,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Send initial system message
    await ctx.db.insert("messages", {
      conversationId,
      foundationId: args.foundationId,
      senderId: user._id,
      content: args.type === "direct" 
        ? "Conversation started" 
        : `${user.firstName} ${user.lastName} created this ${args.type} conversation`,
      type: "system",
      isRead: false,
      deliveredTo: participantIds,
      readBy: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

// Search users for new conversation
export const searchUsers = query({
  args: {
    foundationId: v.id("foundations"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) return [];

    // Search users in the same foundation
    const users = await ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    const filtered = users.filter(u => {
      if (u._id === user._id) return false; // Exclude self
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const email = u.email.toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });

    return filtered.map(u => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
    }));
  },
});

// Get unread message count
export const getUnreadCount = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) return 0;

    // Get all conversations where user is a participant
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const userConversations = conversations.filter(conv => 
      conv.participantIds.includes(user._id)
    );

    // Count unread messages
    let unreadCount = 0;
    for (const conv of userConversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();
      
      // Filter unread messages manually
      const unread = messages.filter(msg => 
        msg.senderId !== user._id && 
        (!msg.readBy || !msg.readBy.includes(user._id))
      );
      
      unreadCount += unread.length;
    }

    return unreadCount;
  },
});