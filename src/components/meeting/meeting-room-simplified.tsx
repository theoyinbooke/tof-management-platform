"use client";

import { useEffect, useState } from "react";
import "./meeting-room.css";
import "./livekit-override.css";
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  ControlBar,
  Chat,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  Loader2, 
  AlertCircle,
  Users,
  Monitor,
  LayoutGrid,
  Maximize2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface MeetingRoomProps {
  meetingId: Id<"meetings">;
  userName: string;
  userRole: "host" | "co_host" | "moderator" | "participant";
}

export function MeetingRoom({ meetingId, userName, userRole }: MeetingRoomProps) {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [livekitUrl, setLivekitUrl] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [layout, setLayout] = useState<"grid" | "focus">("grid");

  // Convex queries and mutations
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });
  const joinMeeting = useMutation(api.meetings.joinMeeting);
  const leaveMeeting = useMutation(api.meetings.leaveMeeting);
  const endMeetingMutation = useMutation(api.meetings.endMeeting);

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

        if (!joinResult.success) {
          setError(joinResult.error || "Failed to join meeting");
          setIsConnecting(false);
          toast.error(joinResult.error || "Failed to join meeting");
          if (joinResult.error === "This meeting has ended") {
            setTimeout(() => router.push("/meetings"), 2000);
          }
          return;
        }

        // Get LiveKit token
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName: joinResult.roomName,
            userName: userName || "Guest User",
            role: userRole,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Token error response:", errorData);
          throw new Error(errorData.error || "Failed to get meeting token");
        }

        const data = await response.json();
        setToken(data.token);
        setLivekitUrl(data.url);
        setIsConnecting(false);
      } catch (err: any) {
        console.error("Failed to initialize meeting:", err);
        setError(err.message || "Failed to connect to meeting");
        setIsConnecting(false);
        toast.error("Failed to join meeting");
      }
    };

    initializeMeeting();
  }, [meeting, meetingId]);

  // Handle leaving the meeting
  const handleDisconnected = async () => {
    try {
      await leaveMeeting({ meetingId });
      toast.success("You have left the meeting");
      router.push("/meetings");
    } catch (err) {
      console.error("Failed to leave meeting:", err);
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

  // Loading state - using bright colors
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

  // Error state - using bright colors
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

  // No token yet - using bright colors
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
    <div className="h-screen w-screen relative overflow-hidden bg-gray-50">
      {/* Custom Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">{meeting.title}</h1>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              Live
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{meeting.participantCount || 0} participants</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayout("grid")}
              className={cn(
                "gap-2",
                layout === "grid" && "bg-emerald-50 text-emerald-700"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Gallery
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayout("focus")}
              className={cn(
                "gap-2",
                layout === "focus" && "bg-emerald-50 text-emerald-700"
              )}
            >
              <Maximize2 className="h-4 w-4" />
              Focus
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "gap-2",
                showChat && "bg-emerald-50 text-emerald-700"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
          </div>
        </div>
      </div>

      {/* LiveKit Room with simplified layout */}
      <div className="pt-14 h-full">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={livekitUrl}
          connectOptions={{
            autoSubscribe: true,
          }}
          onDisconnected={handleDisconnected}
          data-lk-theme="default"
          style={{ height: "100%" }}
        >
          <div className="h-full flex">
            <div className="flex-1">
              {layout === "grid" ? (
                <div className="h-full p-4">
                  <div className="h-full bg-gray-800 rounded-lg overflow-hidden">
                    <GridLayout tracks={useTracks([
                      { source: Track.Source.Camera, withPlaceholder: true },
                      { source: Track.Source.ScreenShare, withPlaceholder: false },
                    ])}>
                      <ParticipantTile />
                    </GridLayout>
                  </div>
                </div>
              ) : (
                <VideoConference />
              )}
            </div>
            
            {showChat && (
              <div className="w-80 bg-white border-l border-gray-200">
                <Chat />
              </div>
            )}
          </div>

          {/* Control Bar with custom styling */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="flex justify-center">
              <ControlBar 
                variation="verbose"
                controls={{
                  microphone: true,
                  camera: true,
                  screenShare: true,
                  chat: false,
                  leave: true,
                }}
              />
              {(userRole === "host" || userRole === "co_host") && (
                <Button
                  onClick={handleEndMeeting}
                  className="ml-4 bg-red-600 hover:bg-red-700 text-white"
                >
                  End Meeting for All
                </Button>
              )}
            </div>
          </div>
          
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}