"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

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