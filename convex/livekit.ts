"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { AccessToken } from "livekit-server-sdk";

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