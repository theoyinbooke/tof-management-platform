"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { AccessToken, RoomServiceClient, EgressClient, EncodedFileOutput, S3Upload } from "livekit-server-sdk";

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
      console.log(`LiveKit room ${args.roomName} terminated successfully`);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Handle specific error cases
      if (error instanceof Error && error.message.includes('Not Found')) {
        console.log(`LiveKit room ${args.roomName} not found - already deleted or doesn't exist`);
        return { success: true, message: "Room already terminated" };
      }
      
      console.error("Failed to terminate LiveKit room:", error);
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
    meetingId: v.optional(v.string()),
    outputLocation: v.optional(v.string()), // S3 bucket path or local path
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
      
      // Generate unique filename for the recording
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = args.meetingId 
        ? `meeting-${args.meetingId}-${timestamp}.mp4`
        : `room-${args.roomName}-${timestamp}.mp4`;
      
      // For now, we'll use local file storage (can be extended to S3)
      const fileOutput = new EncodedFileOutput({
        filepath: args.outputLocation || `recordings/${filename}`,
        // Optional: Add S3 upload configuration
        // output: {
        //   case: 's3',
        //   value: new S3Upload({
        //     accessKey: process.env.AWS_ACCESS_KEY_ID || '',
        //     secret: process.env.AWS_SECRET_ACCESS_KEY || '',
        //     bucket: process.env.S3_RECORDINGS_BUCKET || 'livekit-recordings',
        //     region: process.env.AWS_REGION || 'us-east-1',
        //   }),
        // },
      });

      // Start the room composite recording
      const egressInfo = await egressClient.startRoomCompositeEgress(args.roomName, fileOutput, {
        layout: 'grid-light', // Options: 'speaker-light', 'speaker-dark', 'grid-light', 'grid-dark'
        audioOnly: false,
        videoOnly: false,
        customBaseUrl: undefined, // Can be used for custom layouts
      });

      console.log(`Recording started for room ${args.roomName}:`, {
        egressId: egressInfo.egressId,
        status: egressInfo.status,
        filename: filename,
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
      console.error("Failed to start recording:", error);
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