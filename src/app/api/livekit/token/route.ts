import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { auth, currentUser } from "@clerk/nextjs/server";

// For development, we'll use LiveKit Cloud's free tier
// In production, you'd self-host LiveKit server
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "APIkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://tof-demo.livekit.cloud";

export async function POST(request: NextRequest) {
  try {
    console.log("LiveKit token request received");
    console.log("LIVEKIT_API_KEY:", LIVEKIT_API_KEY ? "Set" : "Not set");
    console.log("LIVEKIT_API_SECRET:", LIVEKIT_API_SECRET ? "Set" : "Not set");
    console.log("LIVEKIT_URL:", LIVEKIT_URL);
    
    // Get auth context first
    const authResult = await auth();
    console.log("Auth result:", authResult ? "Authenticated" : "Not authenticated");
    
    if (!authResult || !authResult.userId) {
      console.error("No authenticated user found in auth()");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get full user details
    const user = await currentUser();
    
    if (!user) {
      console.error("No user details found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = user.id;
    console.log("User authenticated:", userId);

    const body = await request.json();
    const { roomName, userName, role = "participant", meetingSettings } = body;
    console.log("Request body:", { roomName, userName, role, meetingSettings });

    if (!roomName || !userName) {
      return NextResponse.json(
        { error: "Room name and user name are required" },
        { status: 400 }
      );
    }

    // Check if we have valid API credentials
    if (!LIVEKIT_API_KEY || LIVEKIT_API_KEY === "APIkey" || 
        !LIVEKIT_API_SECRET || LIVEKIT_API_SECRET === "secret") {
      console.error("LiveKit API credentials not properly configured");
      return NextResponse.json(
        { error: "LiveKit API credentials not configured" },
        { status: 500 }
      );
    }

    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: userName,
      // Token expires in 6 hours
      ttl: 6 * 60 * 60,
    });

    // Grant permissions based on role and meeting settings
    const canRecord = meetingSettings?.recordingEnabled && (role === "host" || role === "co_host");
    
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
      hidden: false,
      recorder: canRecord, // Only allow recording if meeting has it enabled AND user is host/co-host
    });

    const token = await at.toJwt();
    console.log("Token generated successfully");

    return NextResponse.json({
      token,
      url: LIVEKIT_URL,
    });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    
    return NextResponse.json(
      { 
        error: "Failed to generate token",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}