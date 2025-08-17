import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Id } from "./_generated/dataModel";

// Helper to generate unique room names
function generateRoomName(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ROOM-${result}`;
}

// Helper to generate short meeting codes
function generateMeetingCode(): string {
  const chars = "0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 2 || i === 5) result += " "; // Format: 123 456 7890
  }
  return result;
}

/**
 * Create a new meeting
 */
export const createMeeting = mutation({
  args: {
    foundationId: v.id("foundations"),
    programId: v.optional(v.id("programs")),
    programSessionId: v.optional(v.id("programSessions")),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("instant"),
      v.literal("scheduled"),
      v.literal("recurring")
    )),
    scheduledStartTime: v.number(),
    scheduledEndTime: v.number(),
    password: v.optional(v.string()),
    waitingRoomEnabled: v.optional(v.boolean()),
    maxParticipants: v.optional(v.number()),
    recordingEnabled: v.optional(v.boolean()),
    coHosts: v.optional(v.array(v.id("users"))),
    invitedParticipants: v.optional(v.array(v.id("users"))),
    allowUninvitedJoin: v.optional(v.boolean()),
    lobbyBypassType: v.optional(v.union(
      v.literal("everyone"),
      v.literal("invited"),
      v.literal("organization"),
      v.literal("nobody")
    )),
    allowedPresenters: v.optional(v.union(
      v.literal("everyone"),
      v.literal("organization"),
      v.literal("specific"),
      v.literal("host_only")
    )),
    allowedPresentersIds: v.optional(v.array(v.id("users"))),
    recurrence: v.optional(v.object({
      pattern: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      ),
      interval: v.number(),
      daysOfWeek: v.optional(v.array(v.number())),
      dayOfMonth: v.optional(v.number()),
      endDate: v.optional(v.number()),
      occurrences: v.optional(v.number())
    })),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    const roomName = generateRoomName();
    const meetingCode = generateMeetingCode();
    const meetingLink = `${process.env.NEXT_PUBLIC_APP_URL || ""}/meetings/join/${meetingCode.replace(/\s/g, "")}`;

    const meetingId = await ctx.db.insert("meetings", {
      foundationId: args.foundationId,
      programId: args.programId,
      programSessionId: args.programSessionId,
      roomName,
      meetingCode,
      meetingLink,
      title: args.title,
      description: args.description,
      type: args.type || "scheduled",
      scheduledStartTime: args.scheduledStartTime,
      scheduledEndTime: args.scheduledEndTime,
      hostId: user._id,
      coHosts: args.coHosts || [],
      invitedParticipants: args.invitedParticipants,
      allowUninvitedJoin: args.allowUninvitedJoin ?? true,
      password: args.password,
      waitingRoomEnabled: args.waitingRoomEnabled ?? false,
      maxParticipants: args.maxParticipants,
      recordingEnabled: args.recordingEnabled ?? false,
      chatEnabled: true,
      screenShareEnabled: true,
      whiteboardEnabled: true,
      lobbyBypassType: args.lobbyBypassType,
      allowedPresenters: args.allowedPresenters,
      allowedPresentersIds: args.allowedPresentersIds,
      recurrence: args.recurrence,
      status: "scheduled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "meeting_created",
      entityType: "meetings",
      entityId: meetingId,
      description: `Created meeting: ${args.title}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return meetingId;
  },
});

/**
 * Create an instant meeting (Meet Now)
 */
export const createInstantMeeting = mutation({
  args: {
    foundationId: v.id("foundations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    const roomName = generateRoomName();
    const meetingCode = generateMeetingCode();
    const meetingLink = `${process.env.NEXT_PUBLIC_APP_URL || ""}/meetings/join/${meetingCode.replace(/\s/g, "")}`;

    const now = Date.now();
    const meetingId = await ctx.db.insert("meetings", {
      foundationId: args.foundationId,
      roomName,
      meetingCode,
      meetingLink,
      title: args.title,
      type: "instant",
      scheduledStartTime: now,
      scheduledEndTime: now + (4 * 60 * 60 * 1000), // 4 hours default
      hostId: user._id,
      coHosts: [],
      waitingRoomEnabled: false,
      recordingEnabled: false,
      chatEnabled: true,
      screenShareEnabled: true,
      whiteboardEnabled: true,
      status: "live",
      actualStartTime: now,
      createdAt: now,
      updatedAt: now,
    });

    return { 
      meetingId, 
      roomName, 
      meetingCode,
      meetingLink 
    };
  },
});

/**
 * Join meeting by code
 */
export const getMeetingByCode = query({
  args: {
    meetingCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Format the meeting code to match storage format (with spaces)
    const cleanCode = args.meetingCode.replace(/\s/g, "");
    const formattedCode = cleanCode.slice(0, 3) + " " + cleanCode.slice(3, 6) + " " + cleanCode.slice(6);
    
    const meeting = await ctx.db
      .query("meetings")
      .withIndex("by_meeting_code", (q) => q.eq("meetingCode", formattedCode))
      .first();

    if (!meeting) return null;

    // Get host details
    const host = await ctx.db.get(meeting.hostId);

    return {
      ...meeting,
      host,
    };
  },
});

/**
 * Start a meeting
 */
export const startMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const user = await authenticateAndAuthorize(ctx, meeting.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    // Check if user is host or co-host
    if (meeting.hostId !== user._id && !meeting.coHosts.includes(user._id)) {
      throw new Error("Only hosts can start the meeting");
    }

    await ctx.db.patch(args.meetingId, {
      status: "live",
      actualStartTime: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, roomName: meeting.roomName };
  },
});

/**
 * Join a meeting
 */
export const joinMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const user = await authenticateAndAuthorize(ctx, meeting.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    // Check password if required
    if (meeting.password && meeting.password !== args.password) {
      throw new Error("Invalid meeting password");
    }

    // Check if user is invited (if invite-only meeting)
    const isHost = meeting.hostId === user._id;
    const isCoHost = meeting.coHosts.includes(user._id);
    const isInvited = meeting.invitedParticipants?.includes(user._id) ?? false;
    
    // Check if user should go to waiting room
    const shouldGoToWaitingRoom = meeting.waitingRoomEnabled && 
                                  !isHost && 
                                  !isCoHost &&
                                  meeting.status === "scheduled";
    
    if (shouldGoToWaitingRoom || (!meeting.allowUninvitedJoin && !isHost && !isCoHost && !isInvited)) {
      // User is not invited and meeting doesn't allow uninvited participants
      // Add to waiting room for host approval
      const existingRequest = await ctx.db
        .query("meetingParticipants")
        .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
        .filter((q) => 
          q.eq(q.field("userId"), user._id)
        )
        .first();
      
      if (!existingRequest) {
        await ctx.db.insert("meetingParticipants", {
          meetingId: args.meetingId,
          userId: user._id,
          joinTime: Date.now(),
          role: "participant",
          hasAudio: false,
          hasVideo: false,
          createdAt: Date.now(),
        });
      }
      
      const message = shouldGoToWaitingRoom 
        ? "This meeting has a waiting room enabled. Your request to join has been sent to the host for approval."
        : "You are not invited to this meeting. Your request to join has been sent to the host for approval.";
      
      return {
        success: false,
        error: message,
        requiresApproval: true,
        roomName: ""
      };
    }

    // Check if meeting is accessible
    // Allow joining if:
    // 1. Meeting is live
    // 2. User is the host or co-host
    // 3. Meeting is scheduled and within 15 minutes of start time
    if (meeting.status === "scheduled") {
      const isHost = meeting.hostId === user._id || meeting.coHosts.includes(user._id);
      const now = Date.now();
      const scheduledTime = meeting.scheduledStartTime;
      const timeUntilStart = scheduledTime - now;
      const canJoinEarly = timeUntilStart <= 15 * 60 * 1000; // 15 minutes early
      
      if (!isHost && !canJoinEarly) {
        const minutesUntilStart = Math.ceil(timeUntilStart / 60000);
        throw new Error(`Meeting has not started yet. You can join ${minutesUntilStart} minutes before the scheduled time.`);
      }
      
      // Auto-start meeting if host is joining
      if (isHost && meeting.status === "scheduled") {
        await ctx.db.patch(args.meetingId, {
          status: "live",
          actualStartTime: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    
    // Check if meeting has ended
    if (meeting.status === "ended") {
      return {
        success: false,
        error: "This meeting has ended",
        roomName: ""
      };
    }

    // Check max participants
    if (meeting.maxParticipants) {
      const participants = await ctx.db
        .query("meetingParticipants")
        .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
        .filter((q) => q.eq(q.field("leaveTime"), undefined))
        .collect();

      if (participants.length >= meeting.maxParticipants) {
        throw new Error("Meeting is full");
      }
    }

    // Determine role
    let role: "host" | "co_host" | "moderator" | "participant" = "participant";
    if (meeting.hostId === user._id) {
      role = "host";
    } else if (meeting.coHosts.includes(user._id)) {
      role = "co_host";
    } else if (user.role === "reviewer") {
      role = "moderator";
    }

    // Check if already in meeting
    const existingParticipant = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting_user", (q) =>
        q.eq("meetingId", args.meetingId).eq("userId", user._id)
      )
      .filter((q) => q.eq(q.field("leaveTime"), undefined))
      .unique();

    if (!existingParticipant) {
      // Add participant record
      await ctx.db.insert("meetingParticipants", {
        meetingId: args.meetingId,
        userId: user._id,
        joinTime: Date.now(),
        role,
        hasVideo: true,
        hasAudio: true,
        createdAt: Date.now(),
      });
    }

    // Return meeting details - token generation will be handled client-side
    const participantName = `${user.firstName} ${user.lastName}`.trim() || user.email;

    return {
      success: true,
      roomName: meeting.roomName,
      role,
      userName: participantName,
      // Client will call the token generation action separately
      needsToken: true,
    };
  },
});

/**
 * Leave a meeting
 */
export const leaveMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Find participant record
    const participant = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting_user", (q) =>
        q.eq("meetingId", args.meetingId).eq("userId", user._id)
      )
      .filter((q) => q.eq(q.field("leaveTime"), undefined))
      .unique();

    if (participant) {
      const duration = Date.now() - participant.joinTime;
      await ctx.db.patch(participant._id, {
        leaveTime: Date.now(),
        duration,
      });
    }

    // Check if this was the host and no one else is in the meeting
    if (meeting.hostId === user._id) {
      const remainingParticipants = await ctx.db
        .query("meetingParticipants")
        .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
        .filter((q) => q.eq(q.field("leaveTime"), undefined))
        .collect();

      if (remainingParticipants.length === 0) {
        // End the meeting if host leaves and no one else is there
        await ctx.db.patch(args.meetingId, {
          status: "ended",
          actualEndTime: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

/**
 * End a meeting (host only)
 */
export const endMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const user = await authenticateAndAuthorize(ctx, meeting.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    // Check if user is host
    if (meeting.hostId !== user._id && !meeting.coHosts.includes(user._id)) {
      throw new Error("Only hosts can end the meeting");
    }

    // End all participant sessions
    const participants = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .filter((q) => q.eq(q.field("leaveTime"), undefined))
      .collect();

    for (const participant of participants) {
      const duration = Date.now() - participant.joinTime;
      await ctx.db.patch(participant._id, {
        leaveTime: Date.now(),
        duration,
      });
    }

    await ctx.db.patch(args.meetingId, {
      status: "ended",
      actualEndTime: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a meeting
 */
export const deleteMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const user = await authenticateAndAuthorize(ctx, meeting.foundationId, [
      "admin",
      "super_admin",
    ]);

    // Only allow deletion if user is the host or has admin permissions
    if (meeting.hostId !== user._id && user.role !== "admin" && user.role !== "super_admin") {
      throw new Error("Only the meeting host or admins can delete this meeting");
    }

    // Don't allow deleting live meetings
    if (meeting.status === "live") {
      throw new Error("Cannot delete a live meeting. Please end the meeting first.");
    }

    // Delete related meeting participants
    const participants = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .collect();

    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }

    // Delete the meeting
    await ctx.db.delete(args.meetingId);

    // Audit log
    await ctx.db.insert("auditLogs", {
      foundationId: meeting.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "delete",
      entityType: "meeting",
      entityId: args.meetingId,
      description: `Deleted meeting: ${meeting.title}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get meeting details
 */
export const getMeeting = query({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) return null;

    // Get host details
    const host = await ctx.db.get(meeting.hostId);

    // Get co-hosts
    const coHosts = await Promise.all(
      meeting.coHosts.map((id) => ctx.db.get(id))
    );

    // Get current participants
    const participants = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .filter((q) => q.eq(q.field("leaveTime"), undefined))
      .collect();

    const participantDetails = await Promise.all(
      participants.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
          user,
        };
      })
    );

    return {
      ...meeting,
      host,
      coHosts: coHosts.filter(Boolean),
      participants: participantDetails,
      participantCount: participantDetails.length,
    };
  },
});

/**
 * Get meetings for a foundation
 */
export const getMeetingsByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("live"),
      v.literal("ended"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    let query = ctx.db
      .query("meetings")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const meetings = await query
      .order("desc")
      .take(args.limit || 50);

    return Promise.all(
      meetings.map(async (meeting) => {
        const host = await ctx.db.get(meeting.hostId);
        const participantCount = await ctx.db
          .query("meetingParticipants")
          .withIndex("by_meeting", (q) => q.eq("meetingId", meeting._id))
          .filter((q) => q.eq(q.field("leaveTime"), undefined))
          .collect()
          .then((p) => p.length);

        return {
          ...meeting,
          host,
          participantCount,
        };
      })
    );
  },
});

/**
 * Send chat message
 */
export const sendChatMessage = mutation({
  args: {
    meetingId: v.id("meetings"),
    message: v.string(),
    type: v.optional(v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("system")
    )),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if user is in the meeting
    const participant = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting_user", (q) =>
        q.eq("meetingId", args.meetingId).eq("userId", user._id)
      )
      .filter((q) => q.eq(q.field("leaveTime"), undefined))
      .unique();

    if (!participant && meeting.hostId !== user._id) {
      throw new Error("You must be in the meeting to send messages");
    }

    const messageId = await ctx.db.insert("meetingChat", {
      meetingId: args.meetingId,
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      message: args.message,
      type: args.type || "text",
      fileUrl: args.fileUrl,
      fileName: args.fileName,
      timestamp: Date.now(),
    });

    return messageId;
  },
});

/**
 * Get chat messages for a meeting
 */
export const getChatMessages = query({
  args: {
    meetingId: v.id("meetings"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("meetingChat")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .order("asc")
      .take(args.limit || 100);

    return Promise.all(
      messages.map(async (message) => {
        const user = await ctx.db.get(message.userId);
        return {
          ...message,
          user,
        };
      })
    );
  },
});

/**
 * Update participant status (mute/unmute, video on/off)
 */
export const updateParticipantStatus = mutation({
  args: {
    meetingId: v.id("meetings"),
    hasAudio: v.optional(v.boolean()),
    hasVideo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const participant = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting_user", (q) =>
        q.eq("meetingId", args.meetingId).eq("userId", user._id)
      )
      .filter((q) => q.eq(q.field("leaveTime"), undefined))
      .unique();

    if (!participant) throw new Error("Not in meeting");

    const updates: any = {};
    if (args.hasAudio !== undefined) updates.hasAudio = args.hasAudio;
    if (args.hasVideo !== undefined) updates.hasVideo = args.hasVideo;

    await ctx.db.patch(participant._id, updates);

    return { success: true };
  },
});