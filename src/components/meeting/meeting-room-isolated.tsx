"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface MeetingRoomProps {
  meetingId: Id<"meetings">;
  userName: string;
  userRole: "host" | "co_host" | "moderator" | "participant";
  initialSettings?: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    backgroundBlur: boolean;
  } | null;
}

// Completely isolated LiveKit wrapper
const LiveKitWrapper = lazy(() => 
  import("./livekit-wrapper").then(module => ({ default: module.LiveKitWrapper }))
);

export function IsolatedMeetingRoom({ meetingId, userName, userRole, initialSettings }: MeetingRoomProps) {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [livekitUrl, setLivekitUrl] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Convex queries and mutations
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });
  const joinMeeting = useMutation(api.meetings.joinMeeting);
  const leaveMeeting = useMutation(api.meetings.leaveMeeting);
  const endMeetingMutation = useMutation(api.meetings.endMeeting);
  const generateTokenAction = useAction(api.livekit.generateToken);

  // Ensure proper mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Join meeting and get token
  useEffect(() => {
    if (!mounted || !meeting) return;

    const initializeMeeting = async () => {
      try {
        // Check if meeting has ended
        if (meeting.status === "ended") {
          setError("This meeting has ended");
          setIsConnecting(false);
          toast.error("This meeting has ended");
          setTimeout(() => router.push("/meetings"), 2000);
          return;
        }

        // Join the meeting in Convex
        const joinResult = await joinMeeting({ meetingId });
        
        if (joinResult.success && joinResult.needsToken) {
          // Generate LiveKit token
          const tokenData = await generateTokenAction({
            roomName: joinResult.roomName,
            participantIdentity: `user_${Date.now()}`, // Use a unique identifier
            participantName: joinResult.userName,
            canPublish: true,
            canSubscribe: true,
          });
          
          setToken(tokenData.token);
          setLivekitUrl(tokenData.url);
        } else {
          throw new Error("Failed to join meeting");
        }

        setIsConnecting(false);
      } catch (err: any) {
        console.error("Failed to initialize meeting:", err);
        setError(err.message || "Failed to connect to meeting");
        setIsConnecting(false);
        toast.error("Failed to join meeting");
      }
    };

    initializeMeeting();
  }, [mounted, meeting, meetingId, joinMeeting, router]);

  // Handle leaving the meeting
  const handleLeaveMeeting = async () => {
    try {
      await leaveMeeting({ meetingId });
      toast.success("You have left the meeting");
      router.push("/meetings");
    } catch (err) {
      console.error("Failed to leave meeting:", err);
      router.push("/meetings");
    }
  };

  // Handle ending the meeting (host only)
  const handleEndMeeting = async () => {
    if (userRole === "host" || userRole === "co_host") {
      try {
        await endMeetingMutation({ meetingId });
        toast.success("Meeting ended");
        router.push("/meetings");
      } catch (err) {
        console.error("Failed to end meeting:", err);
        toast.error("Failed to end meeting");
      }
    }
  };

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  // Loading state
  if (isConnecting || !meeting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-800">Connecting to meeting...</h2>
          <p className="text-gray-600">Preparing your audio and video</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-800">Connection Failed</h2>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => router.push("/meetings")} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // No token yet
  if (!token || !livekitUrl) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-800">Preparing meeting room...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 relative">
      {/* Meeting Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-white text-lg font-semibold">{meeting?.title || "Meeting"}</h1>
          <div className="px-2 py-1 bg-emerald-500 text-white rounded text-sm">
            🔴 Live
          </div>
        </div>
        
        <div className="flex gap-2">
          {(userRole === "host" || userRole === "co_host") && (
            <Button
              onClick={handleEndMeeting}
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Meeting
            </Button>
          )}
          
          <Button
            onClick={handleLeaveMeeting}
            size="sm"
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Leave
          </Button>
        </div>
      </div>

      {/* LiveKit Component in Suspense */}
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>Loading meeting room...</p>
          </div>
        </div>
      }>
        <LiveKitWrapper
          token={token}
          serverUrl={livekitUrl}
          userName={userName}
          initialSettings={initialSettings}
          onDisconnected={handleLeaveMeeting}
        />
      </Suspense>
    </div>
  );
}