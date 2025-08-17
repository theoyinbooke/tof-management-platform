import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Admin function to force-end all active meetings
export const forceEndAllMeetings = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all active meetings
    const activeMeetings = await ctx.db
      .query("meetings")
      .filter((q) => q.neq(q.field("status"), "ended"))
      .collect();

    console.log(`Found ${activeMeetings.length} active meetings to clean up`);

    // End each meeting
    for (const meeting of activeMeetings) {
      // Update meeting status
      await ctx.db.patch(meeting._id, {
        status: "ended",
        actualEndTime: Date.now(),
      });

      // Remove all participants
      const participants = await ctx.db
        .query("meetingParticipants")
        .withIndex("by_meeting", (q) => q.eq("meetingId", meeting._id))
        .filter((q) => q.eq(q.field("leaveTime"), undefined))
        .collect();

      for (const participant of participants) {
        await ctx.db.patch(participant._id, {
          leaveTime: Date.now(),
        });
      }

      console.log(`Cleaned up meeting: ${meeting.title}`);
    }

    return {
      success: true,
      cleanedMeetings: activeMeetings.length,
    };
  },
});

// Clean up a specific meeting
export const forceEndMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.status === "ended") {
      return { success: true, message: "Meeting already ended" };
    }

    // Update meeting status
    await ctx.db.patch(args.meetingId, {
      status: "ended",
      actualEndTime: Date.now(),
    });

    // Remove all participants
    const participants = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .filter((q) => q.eq(q.field("leaveTime"), undefined))
      .collect();

    for (const participant of participants) {
      await ctx.db.patch(participant._id, {
        leaveTime: Date.now(),
      });
    }

    return {
      success: true,
      message: `Meeting "${meeting.title}" has been force-ended`,
    };
  },
});