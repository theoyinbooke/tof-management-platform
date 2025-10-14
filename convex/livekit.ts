"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { AccessToken, RoomServiceClient, EgressClient, EncodedFileOutput, EncodedFileType } from "livekit-server-sdk";

/**
 * Generate LiveKit access token for a meeting participant
 */
export const generateToken = action({
  args: {
    roomName: v.string(),
    participantIdentity: v.string(),
    participantName: v.string(),
    canPublish: v.optional(v.boolean()),
    canSubscribe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error("LiveKit credentials not configured");
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: args.participantIdentity,
      name: args.participantName,
    });

    token.addGrant({
      room: args.roomName,
      roomJoin: true,
      canPublish: args.canPublish ?? true,
      canSubscribe: args.canSubscribe ?? true,
    });

    return {
      token: await token.toJwt(),
      url: livekitUrl,
    };
  },
});

/**
 * Terminate a LiveKit room (admin/host action)
 */
export const terminateRoom = action({
  args: {
    roomName: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error("LiveKit credentials not configured");
    }

    try {
      const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
      
      // Delete/terminate the room
      await roomService.deleteRoom(args.roomName);
      console.log(`✅ LiveKit room ${args.roomName} terminated successfully`);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Handle specific error cases - check for various "not found" patterns
      const isNotFoundError = (
        (error instanceof Error && error.message.includes('Not Found')) ||
        (error as any)?.name === 'Not Found' ||
        (error as any)?.code === 'not_found' ||
        (error as any)?.status === 404
      );
      
      if (isNotFoundError) {
        console.log(`ℹ️ LiveKit room ${args.roomName} not found - already deleted or doesn't exist`);
        return { success: true, message: "Room already terminated" };
      }
      
      console.error("❌ Failed to terminate LiveKit room:", error);
      // Don't throw error to prevent breaking the frontend flow
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Start recording a LiveKit room (meeting)
 */
export const startRecording = action({
  args: {
    roomName: v.string(),
    meetingId: v.id("meetings"),
    outputLocation: v.optional(v.string()), // S3 bucket path or local path
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error("LiveKit credentials not configured");
    }

    // Generate unique filename for the recording
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = args.meetingId 
      ? `meeting-${args.meetingId}-${timestamp}.mp4`
      : `room-${args.roomName}-${timestamp}.mp4`;

    try {
      const egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
      
      // Create simple encoded file output for LiveKit Cloud
      // This will use LiveKit's default storage
      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
      });

      // Start the room composite recording with minimal configuration
      const egressInfo = await egressClient.startRoomCompositeEgress(
        args.roomName, 
        fileOutput
        // Use default options for now to avoid parameter issues
      );

      console.log(`Recording started for room ${args.roomName}:`, {
        egressId: egressInfo.egressId,
        status: egressInfo.status,
        filename: filename,
      });

      // Update meeting recording status to "recording"
      await ctx.runMutation(internal.meetings.updateRecordingStatus, {
        meetingId: args.meetingId,
        recordingStatus: "recording",
        egressId: egressInfo.egressId,
        recordingFilename: filename,
      });

      return {
        success: true,
        egressId: egressInfo.egressId,
        status: egressInfo.status,
        filename: filename,
        roomName: args.roomName,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to start recording:", {
        error: error,
        errorName: (error as any)?.name,
        errorStatus: (error as any)?.status,
        errorCode: (error as any)?.code,
        errorMetadata: (error as any)?.metadata,
        roomName: args.roomName,
        outputLocation: args.outputLocation || `recordings/${filename}`,
        filename: filename,
        method: "simplified recording without external storage"
      });
      
      // Update meeting recording status to "failed" 
      await ctx.runMutation(internal.meetings.updateRecordingStatus, {
        meetingId: args.meetingId,
        recordingStatus: "failed",
      });
      
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Stop recording a LiveKit room
 */
export const stopRecording = action({
  args: {
    egressId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error("LiveKit credentials not configured");
    }

    try {
      const egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
      
      // Stop the recording
      const egressInfo = await egressClient.stopEgress(args.egressId);

      console.log(`Recording stopped:`, {
        egressId: egressInfo.egressId,
        status: egressInfo.status,
        startedAt: egressInfo.startedAt,
        endedAt: egressInfo.endedAt,
      });

      return {
        success: true,
        egressId: egressInfo.egressId,
        status: egressInfo.status,
        startedAt: egressInfo.startedAt,
        endedAt: egressInfo.endedAt,
        fileUrl: (egressInfo as any).fileResults?.[0]?.location || (egressInfo as any).fileResults?.[0]?.downloadUrl || (egressInfo as any).file?.location,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to stop recording:", error);
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Get recording status and info
 */
export const getRecordingStatus = action({
  args: {
    egressId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error("LiveKit credentials not configured");
    }

    try {
      const egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
      
      // List egress to find the specific recording
      const egressList = await egressClient.listEgress({ egressId: args.egressId });
      const egressInfo = egressList.find(e => e.egressId === args.egressId);

      if (!egressInfo) {
        return { success: false, error: "Recording not found" };
      }

      return {
        success: true,
        egressId: egressInfo.egressId,
        status: egressInfo.status,
        startedAt: egressInfo.startedAt,
        endedAt: egressInfo.endedAt,
        fileUrl: (egressInfo as any).fileResults?.[0]?.location || (egressInfo as any).fileResults?.[0]?.downloadUrl || (egressInfo as any).file?.location,
        duration: egressInfo.endedAt && egressInfo.startedAt 
          ? Number(egressInfo.endedAt) - Number(egressInfo.startedAt)
          : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to get recording status:", error);
      return { success: false, error: errorMessage };
    }
  },
});