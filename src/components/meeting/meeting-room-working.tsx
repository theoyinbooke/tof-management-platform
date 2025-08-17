"use client";

import { useEffect, useState } from "react";
import "./meeting-room.css";
import "./meeting-responsive.css";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
} from "@livekit/components-react";
// Removed default LiveKit styles to use custom styles
import { Track } from "livekit-client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  Loader2, 
  AlertCircle,
  Users,
  LayoutGrid,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  PhoneOff,
  Hand,
  Settings,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SimpleCustomChat } from "./simple-custom-chat";

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

// Separate component for the meeting UI that runs inside LiveKitRoom context
function MeetingUI({ 
  meeting, 
  userRole, 
  onEndMeeting,
  userName,
  initialSettings 
}: { 
  meeting: any; 
  userRole: string;
  onEndMeeting: () => void;
  userName?: string;
  initialSettings?: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    backgroundBlur: boolean;
  } | null;
}) {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [layout, setLayout] = useState<"grid" | "focus">("grid");
  const [isMicEnabled, setIsMicEnabled] = useState(initialSettings?.audioEnabled ?? true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(initialSettings?.videoEnabled ?? true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  
  // LiveKit hooks with error handling
  let participants, localParticipant, room;
  try {
    participants = useParticipants();
    localParticipant = useLocalParticipant();
    room = useRoomContext();
  } catch (error) {
    console.error("LiveKit hooks error:", error);
    return (
      <div className="meeting-room-container bg-white flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-800">Meeting Connection Error</h2>
          <p className="text-gray-600">There was an issue connecting to the meeting room.</p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }

  // Toggle microphone
  const toggleMic = async () => {
    try {
      if (localParticipant.localParticipant) {
        await localParticipant.localParticipant.setMicrophoneEnabled(!isMicEnabled);
        setIsMicEnabled(!isMicEnabled);
        toast.success(isMicEnabled ? "Microphone muted" : "Microphone unmuted");
      }
    } catch (err) {
      console.error("Failed to toggle microphone:", err);
      toast.error("Failed to toggle microphone");
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    try {
      if (localParticipant.localParticipant) {
        await localParticipant.localParticipant.setCameraEnabled(!isCameraEnabled);
        setIsCameraEnabled(!isCameraEnabled);
        toast.success(isCameraEnabled ? "Camera turned off" : "Camera turned on");
      }
    } catch (err) {
      console.error("Failed to toggle camera:", err);
      toast.error("Failed to toggle camera");
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    try {
      if (localParticipant.localParticipant) {
        await localParticipant.localParticipant.setScreenShareEnabled(!isScreenSharing);
        setIsScreenSharing(!isScreenSharing);
        toast.success(isScreenSharing ? "Screen sharing stopped" : "Screen sharing started");
      }
    } catch (err) {
      console.error("Failed to toggle screen share:", err);
      toast.error("Failed to toggle screen share");
    }
  };

  // Leave meeting
  const leaveMeeting = () => {
    room.disconnect();
  };

  return (
    <div className="meeting-room-container bg-white">
      {/* Top Header Bar */}
      <div className="meeting-header bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">{meeting.title}</h1>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              Live
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
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
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="meeting-content">
        {/* Video Grid Area */}
        <div className={cn(
          "meeting-video-area bg-gray-100",
          !(showChat || showParticipants) && "meeting-video-area-fullscreen"
        )}>
          <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
            <div className="h-full w-full grid gap-2 p-2" style={{
              gridTemplateColumns: participants.length === 1 ? '1fr' : 
                                 participants.length === 2 ? 'repeat(2, 1fr)' :
                                 participants.length <= 4 ? 'repeat(2, 1fr)' :
                                 participants.length <= 9 ? 'repeat(3, 1fr)' :
                                 'repeat(4, 1fr)',
              gridTemplateRows: participants.length <= 2 ? '1fr' :
                               participants.length <= 4 ? 'repeat(2, 1fr)' :
                               participants.length <= 9 ? 'repeat(3, 1fr)' :
                               'repeat(4, 1fr)'
            }}>
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div key={participant.sid} className="bg-gray-800 rounded-lg overflow-hidden relative">
                    {participant.videoTrackPublications.size > 0 ? (
                      <VideoTrack 
                        participant={participant} 
                        source={Track.Source.Camera}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        <div className="text-center text-white">
                          <div className="w-12 h-12 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <span className="text-lg font-bold">
                              {participant.name?.charAt(0) || participant.identity?.charAt(0) || "?"}
                            </span>
                          </div>
                          <p className="text-xs">{participant.name || participant.identity}</p>
                        </div>
                      </div>
                    )}
                    {/* Participant name overlay */}
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {participant.name || participant.identity}
                      {participant.isLocal && " (You)"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <p className="text-gray-300">Waiting for participants...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Side Panel - Chat or Participants */}
        {(showChat || showParticipants) && (
          <div className="meeting-side-panel bg-white border-l border-gray-200 flex flex-col shadow-xl">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium transition-colors",
                  showChat && !showParticipants
                    ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50"
                    : "text-gray-600 hover:text-gray-800"
                )}
                onClick={() => {
                  setShowChat(true);
                  setShowParticipants(false);
                }}
              >
                Chat
              </button>
              <button
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium transition-colors",
                  showParticipants && !showChat
                    ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50"
                    : "text-gray-600 hover:text-gray-800"
                )}
                onClick={() => {
                  setShowParticipants(true);
                  setShowChat(false);
                }}
              >
                People ({participants.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {showChat && (
                <div className="h-full">
                  <SimpleCustomChat userName={userName} />
                </div>
              )}
              {showParticipants && (
                <div className="p-4 space-y-2 overflow-y-auto">
                  {participants.map((participant) => (
                    <div
                      key={participant.sid}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-emerald-700">
                          {participant.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {participant.name || "Unknown"}
                          {participant.isLocal && " (You)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {participant.isMicrophoneEnabled ? (
                          <Mic className="h-4 w-4 text-gray-600" />
                        ) : (
                          <MicOff className="h-4 w-4 text-red-500" />
                        )}
                        {participant.isCameraEnabled ? (
                          <Video className="h-4 w-4 text-gray-600" />
                        ) : (
                          <VideoOff className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="meeting-controls bg-white border-t border-gray-200 px-3 md:px-6 py-2 md:py-3 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Left - Empty for balance */}
          <div className="w-32"></div>

          {/* Center - Main Controls */}
          <div className="flex items-center gap-2">
            {/* Microphone */}
            <Button
              onClick={toggleMic}
              size="lg"
              className={cn(
                "rounded-full h-12 w-12 p-0",
                !isMicEnabled 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            {/* Camera */}
            <Button
              onClick={toggleCamera}
              size="lg"
              className={cn(
                "rounded-full h-12 w-12 p-0",
                !isCameraEnabled 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            {/* Screen Share */}
            <Button
              onClick={toggleScreenShare}
              size="lg"
              className={cn(
                "rounded-full h-12 w-12 p-0",
                isScreenSharing 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            </Button>

            {/* Raise Hand */}
            <Button
              onClick={() => {
                setHandRaised(!handRaised);
                toast.success(handRaised ? "Hand lowered" : "Hand raised");
              }}
              size="lg"
              className={cn(
                "rounded-full h-12 w-12 p-0",
                handRaised 
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              <Hand className="h-5 w-5" />
            </Button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full h-10 w-10 md:h-12 md:w-12 p-0 bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Device settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(userRole === "host" || userRole === "co_host") && (
                  <>
                    <DropdownMenuItem 
                      onClick={onEndMeeting}
                      className="text-red-600 focus:text-red-600"
                    >
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End meeting for all
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Leave Button */}
            <Button
              onClick={leaveMeeting}
              size="lg"
              className="rounded-full px-6 ml-4 bg-red-500 hover:bg-red-600 text-white"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Leave
            </Button>
          </div>

          {/* Right - Additional Controls */}
          <div className="flex items-center gap-2 w-32 justify-end">
            {/* Chat Toggle */}
            <Button
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat) setShowParticipants(false);
              }}
              variant="ghost"
              size="lg"
              className={cn(
                "rounded-lg h-10 px-3",
                showChat && "bg-emerald-50 text-emerald-700"
              )}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            {/* Participants Toggle */}
            <Button
              onClick={() => {
                setShowParticipants(!showParticipants);
                if (!showParticipants) setShowChat(false);
              }}
              variant="ghost"
              size="lg"
              className={cn(
                "rounded-lg h-10 px-3",
                showParticipants && "bg-emerald-50 text-emerald-700"
              )}
            >
              <Users className="h-5 w-5" />
              <span className="ml-2 text-sm">{participants.length}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MeetingRoom({ meetingId, userName, userRole, initialSettings }: MeetingRoomProps) {
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
  }, [meeting, meetingId, joinMeeting, router, userName, userRole]);

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
    <div className="meeting-room-wrapper">
      <LiveKitRoom
        video={initialSettings?.videoEnabled ?? true}
        audio={initialSettings?.audioEnabled ?? true}
        token={token}
        serverUrl={livekitUrl}
        connectOptions={{
          autoSubscribe: true,
        }}
      onDisconnected={handleDisconnected}
      style={{ height: "100vh", width: "100vw" }}
    >
      <MeetingUI 
        meeting={meeting}
        userRole={userRole}
        onEndMeeting={handleEndMeeting}
        userName={userName}
        initialSettings={initialSettings}
      />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}