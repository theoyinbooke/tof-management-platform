"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Monitor,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// Import LiveKit components dynamically to prevent SSR issues
import dynamic from "next/dynamic";

const LiveKitRoom = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.LiveKitRoom),
  { ssr: false }
);

const RoomAudioRenderer = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.RoomAudioRenderer),
  { ssr: false }
);

const GridLayout = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.GridLayout),
  { ssr: false }
);

const ParticipantTile = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.ParticipantTile),
  { ssr: false }
);

const ControlBar = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.ControlBar),
  { ssr: false }
);

const Chat = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.Chat),
  { ssr: false }
);

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

function MeetingControls({ 
  meeting, 
  userRole, 
  onEndMeeting,
  onLeaveMeeting 
}: { 
  meeting: any; 
  userRole: string;
  onEndMeeting: () => void;
  onLeaveMeeting: () => void;
}) {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Meeting Info */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">{meeting?.title || "Meeting"}</h1>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
            Live
          </Badge>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowChat(!showChat)}
            variant="ghost"
            size="lg"
            className={cn(
              "rounded-lg h-10 px-3",
              showChat && "bg-emerald-50 text-emerald-700"
            )}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          {(userRole === "host" || userRole === "co_host") && (
            <Button
              onClick={onEndMeeting}
              size="lg"
              className="rounded-full px-6 bg-red-500 hover:bg-red-600 text-white"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Meeting
            </Button>
          )}

          <Button
            onClick={onLeaveMeeting}
            size="lg"
            className="rounded-full px-6 bg-gray-500 hover:bg-gray-600 text-white"
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            Leave
          </Button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute bottom-full right-4 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold">Chat</h3>
          </div>
          <div className="p-4 h-full">
            <Chat />
          </div>
        </div>
      )}
    </div>
  );
}

export function SimpleMeetingRoom({ meetingId, userName, userRole, initialSettings }: MeetingRoomProps) {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [livekitUrl, setLivekitUrl] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Convex queries and mutations
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });
  const joinMeeting = useMutation(api.meetings.joinMeeting);
  const leaveMeeting = useMutation(api.meetings.leaveMeeting);
  const endMeetingMutation = useMutation(api.meetings.endMeeting);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Join meeting and get token
  useEffect(() => {
    const initializeMeeting = async () => {
      try {
        if (!meeting) return;

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
        
        if (joinResult.token && joinResult.url) {
          setToken(joinResult.token);
          setLivekitUrl(joinResult.url);
        } else {
          throw new Error("Failed to get meeting credentials");
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
  }, [meeting, meetingId, joinMeeting, router]);

  // Handle leaving the meeting
  const handleDisconnected = async () => {
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

  // Client-side check - prevent hydration issues
  if (!isClient) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-800">Initializing...</h2>
        </div>
      </div>
    );
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
    <div className="relative h-screen w-screen bg-gray-900">
      <LiveKitRoom
        video={initialSettings?.videoEnabled ?? true}
        audio={initialSettings?.audioEnabled ?? true}
        token={token}
        serverUrl={livekitUrl}
        connectOptions={{
          autoSubscribe: true,
        }}
        onDisconnected={handleDisconnected}
        style={{ height: "100%", width: "100%" }}
      >
        {/* Main Video Grid */}
        <div className="h-full w-full relative">
          <GridLayout style={{ height: "calc(100% - 80px)" }}>
            <ParticipantTile />
          </GridLayout>
          
          {/* Built-in LiveKit Control Bar */}
          <div className="absolute bottom-0 left-0 right-0">
            <ControlBar />
          </div>
        </div>

        {/* Custom Controls Overlay */}
        <MeetingControls
          meeting={meeting}
          userRole={userRole}
          onEndMeeting={handleEndMeeting}
          onLeaveMeeting={handleDisconnected}
        />

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}