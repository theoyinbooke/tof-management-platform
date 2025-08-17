"use client";

import { useEffect, useState } from "react";
import "./meeting-room.css";
import "./livekit-override.css";
import {
  LiveKitRoom,
  VideoTrack,
  AudioTrack,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
  useParticipants,
  ConnectionState,
  useConnectionState,
  useLocalParticipant,
  GridLayout,
  ParticipantTile,
  ControlBar,
  Chat,
} from "@livekit/components-react";
// Removed default LiveKit styles to use custom styles
// import "@livekit/components-styles";
import { Track as LKTrack } from "livekit-client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  Loader2, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Phone,
  PhoneOff,
  MoreVertical,
  Settings,
  LayoutGrid,
  Maximize2,
  Hand,
  ChevronUp,
  ChevronDown,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomChat } from "./custom-chat";

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
    <div style={{ height: "100vh", width: "100vw", position: "relative", overflow: "hidden" }}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={livekitUrl}
        connectOptions={{
          autoSubscribe: true,
        }}
        onDisconnected={handleDisconnected}
        style={{ height: "100%", width: "100%", position: "absolute" }}
      >
        <div className="meeting-interface-wrapper">
          <MeetingInterface 
            meeting={meeting}
            userRole={userRole}
            onEndMeeting={handleEndMeeting}
            userName={userName}
          />
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

// Custom meeting interface with Teams-like layout
function MeetingInterface({ 
  meeting, 
  userRole,
  onEndMeeting,
  userName 
}: { 
  meeting: any;
  userRole: string;
  onEndMeeting: () => void;
  userName: string;
}) {
  const room = useRoomContext();
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const localParticipant = useLocalParticipant();
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [layout, setLayout] = useState<"grid" | "focus" | "presenter">("grid");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [gridColumns, setGridColumns] = useState(6); // For gallery view
  
  // Track screen share
  const screenShareTracks = useTracks([{ source: LKTrack.Source.ScreenShare, withPlaceholder: false }]);
  const cameraTracks = useTracks([{ source: LKTrack.Source.Camera, withPlaceholder: true }]);
  const isAnyoneScreenSharing = screenShareTracks.length > 0;
  
  // Update mic and camera states based on local participant
  useEffect(() => {
    if (localParticipant.localParticipant) {
      setIsMicMuted(!localParticipant.localParticipant.isMicrophoneEnabled);
      setIsCameraEnabled(localParticipant.localParticipant.isCameraEnabled);
    }
  }, [localParticipant]);

  // Calculate elapsed time
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-switch to presenter mode when someone shares screen
  useEffect(() => {
    if (isAnyoneScreenSharing && layout === "grid") {
      setLayout("presenter");
    } else if (!isAnyoneScreenSharing && layout === "presenter") {
      setLayout("grid");
    }
  }, [isAnyoneScreenSharing]);

  // Calculate optimal grid size for gallery view
  useEffect(() => {
    const participantCount = participants.length;
    if (participantCount <= 2) setGridColumns(2);
    else if (participantCount <= 4) setGridColumns(2);
    else if (participantCount <= 6) setGridColumns(3);
    else if (participantCount <= 9) setGridColumns(3);
    else if (participantCount <= 12) setGridColumns(4);
    else if (participantCount <= 16) setGridColumns(4);
    else if (participantCount <= 20) setGridColumns(5);
    else if (participantCount <= 25) setGridColumns(5);
    else setGridColumns(6); // Max 6 columns for 30 participants
  }, [participants.length]);

  // Handle screen share
  const handleScreenShare = async () => {
    try {
      const enabled = !room.localParticipant.isScreenShareEnabled;
      await room.localParticipant.setScreenShareEnabled(enabled);
      setIsScreenSharing(enabled);
      if (enabled) {
        toast.success("Screen sharing started");
      } else {
        toast.success("Screen sharing stopped");
      }
    } catch (err) {
      console.error("Failed to toggle screen share:", err);
      toast.error("Failed to share screen");
    }
  };

  // Handle microphone toggle
  const handleMicToggle = async () => {
    try {
      if (localParticipant.localParticipant) {
        const enabled = !isMicMuted;
        await localParticipant.localParticipant.setMicrophoneEnabled(enabled);
        setIsMicMuted(!enabled);
      }
    } catch (err) {
      console.error("Failed to toggle microphone:", err);
      toast.error("Failed to toggle microphone");
    }
  };

  // Handle camera toggle
  const handleCameraToggle = async () => {
    try {
      if (localParticipant.localParticipant) {
        const enabled = !isCameraEnabled;
        await localParticipant.localParticipant.setCameraEnabled(enabled);
        setIsCameraEnabled(enabled);
      }
    } catch (err) {
      console.error("Failed to toggle camera:", err);
      toast.error("Failed to toggle camera");
    }
  };

  // Handle leave meeting
  const handleLeave = () => {
    room.disconnect();
  };

  return (
    <TooltipProvider>
      <div className="fixed inset-0 flex flex-col bg-white" style={{ zIndex: 9999 }}>
        {/* Top Navigation Bar - Teams Style */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm relative z-50">
          <div className="flex items-center justify-between">
            {/* Left section - Meeting info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-800">{meeting.title}</h1>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                  Live • {elapsedTime}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
              </div>

              {connectionState === ConnectionState.Connected ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Wifi className="h-4 w-4" />
                      <span className="text-xs">Connected</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Connection is stable</TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex items-center gap-1 text-red-500">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs">Connecting...</span>
                </div>
              )}
            </div>

            {/* Right section - Layout controls */}
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
                onClick={() => setLayout("presenter")}
                className={cn(
                  "gap-2",
                  layout === "presenter" && "bg-emerald-50 text-emerald-700",
                  isAnyoneScreenSharing && "animate-pulse"
                )}
              >
                <Monitor className="h-4 w-4" />
                {isAnyoneScreenSharing ? "Screen Share" : "Presenter"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Video area */}
          <div className="flex-1 p-4">
            <div className="h-full bg-gray-800 rounded-xl overflow-hidden relative shadow-2xl">
              {/* Presenter Mode - Screen share with sidebar */}
              {layout === "presenter" && isAnyoneScreenSharing ? (
                <div className="screen-share-layout">
                  {/* Main screen share area */}
                  <div className="screen-share-main">
                    {screenShareTracks[0] && (
                      <VideoTrack trackRef={screenShareTracks[0]} className="w-full h-full object-contain" />
                    )}
                  </div>
                  {/* Sidebar with participant videos */}
                  <div className="screen-share-sidebar">
                    {participants.slice(0, 5).map((participant, index) => (
                      <div key={participant.sid} className="sidebar-participant">
                        {participant.videoTrackPublications.size > 0 ? (
                          <VideoTrack 
                            participant={participant} 
                            source={LKTrack.Source.Camera}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {participant.name?.charAt(0) || participant.identity?.charAt(0) || "?"}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="sidebar-participant-name">
                          {participant.name || participant.identity || `Participant ${index + 1}`}
                        </div>
                      </div>
                    ))}
                    {participants.length > 5 && (
                      <div className="text-center text-gray-400 text-xs py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowParticipants(true)}
                          className="text-gray-400 hover:text-white"
                        >
                          +{participants.length - 5} more participants
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : layout === "grid" ? (
                /* Gallery View - Show up to 30 participants */
                <div className="h-full">
                  <div 
                    className={cn(
                      "gallery-grid",
                      participants.length <= 25 
                        ? `participants-${participants.length}`
                        : "participants-large"
                    )}
                  >
                    {participants.slice(0, 30).map((participant) => (
                      <div key={participant.sid} className="participant-tile-wrapper">
                        <div className="participant-tile-content">
                          {participant.videoTrackPublications.size > 0 ? (
                            <VideoTrack 
                              participant={participant} 
                              source={LKTrack.Source.Camera}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700">
                              <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                  {participant.name?.charAt(0) || participant.identity?.charAt(0) || "?"}
                                </span>
                              </div>
                              <div className="absolute bottom-2 left-2 right-2 text-center">
                                <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                                  {participant.name || participant.identity}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {participants.length > 30 && (
                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                      <Users className="inline h-4 w-4 mr-2" />
                      Showing 30 of {participants.length} participants
                    </div>
                  )}
                </div>
              ) : (
                /* Focus View - Active speaker */
                <div className="h-full p-4">
                  <div className="h-full relative">
                    {participants[0] && (
                      <>
                        {participants[0].videoTrackPublications.size > 0 ? (
                          <VideoTrack 
                            participant={participants[0]} 
                            source={LKTrack.Source.Camera}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full bg-emerald-600 flex items-center justify-center">
                              <span className="text-5xl font-bold text-white">
                                {participants[0].name?.charAt(0) || "?"}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                          {participants[0].name || participants[0].identity}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Screen share notification */}
              {isAnyoneScreenSharing && layout !== "presenter" && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                  <Monitor className="h-4 w-4 animate-bounce" />
                  <span className="font-medium">Screen is being shared</span>
                  <Button
                    size="sm"
                    onClick={() => setLayout("presenter")}
                    className="ml-2 bg-white text-emerald-700 hover:bg-gray-100"
                  >
                    View Screen
                  </Button>
                </div>
              )}
              
              {/* Participant count indicator for gallery view */}
              {layout === "grid" && participants.length > 6 && (
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-medium">
                  {participants.length <= 30 
                    ? `${participants.length} participants in gallery`
                    : `Showing 30/${participants.length} participants`
                  }
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar - Chat or Participants */}
          {(showChat || showParticipants) && (
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl">
              {/* Sidebar tabs */}
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

              {/* Sidebar content */}
              <div className="flex-1 overflow-hidden">
                {showChat && (
                  <div className="h-full">
                    <CustomChat userName={userName} />
                  </div>
                )}
                {showParticipants && (
                  <div className="p-4 space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.identity}
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
                            {participant.identity === room.localParticipant.identity && " (You)"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {participant.audioTrackPublications.size > 0 && 
                           Array.from(participant.audioTrackPublications.values())[0].isSubscribed ? (
                            <Mic className="h-4 w-4 text-gray-600" />
                          ) : (
                            <MicOff className="h-4 w-4 text-red-500" />
                          )}
                          {participant.videoTrackPublications.size > 0 && 
                           Array.from(participant.videoTrackPublications.values())[0].isSubscribed ? (
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

        {/* Bottom Control Bar - Teams Style */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 shadow-lg relative z-50 meeting-controls">
          <div className="flex items-center justify-between">
            {/* Left - Meeting duration */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 font-medium">
                {elapsedTime}
              </div>
            </div>

            {/* Center - Main controls */}
            <div className="flex items-center gap-2">
              {/* Microphone */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleMicToggle}
                    size="lg"
                    className={cn(
                      "rounded-full h-12 w-12 p-0",
                      isMicMuted 
                        ? "bg-red-500 hover:bg-red-600 text-white" 
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    )}
                  >
                    {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMicMuted ? "Unmute microphone" : "Mute microphone"}
                </TooltipContent>
              </Tooltip>

              {/* Camera */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCameraToggle}
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
                </TooltipTrigger>
                <TooltipContent>
                  {isCameraEnabled ? "Turn off camera" : "Turn on camera"}
                </TooltipContent>
              </Tooltip>

              {/* Screen Share */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleScreenShare}
                    size="lg"
                    className={cn(
                      "rounded-full h-12 w-12 p-0",
                      isScreenSharing 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse" 
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    )}
                  >
                    {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isScreenSharing ? "Stop presenting" : "Share screen"}
                </TooltipContent>
              </Tooltip>

              {/* Raise Hand */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setHandRaised(!handRaised)}
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
                </TooltipTrigger>
                <TooltipContent>
                  {handRaised ? "Lower hand" : "Raise hand"}
                </TooltipContent>
              </Tooltip>

              {/* More options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="lg"
                    className="rounded-full h-12 w-12 p-0 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <MoreVertical className="h-5 w-5" />
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
                  <DropdownMenuItem onClick={() => room.localParticipant.setCameraEnabled(false)}>
                    Turn off incoming video
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Leave button */}
              <Button
                onClick={handleLeave}
                size="lg"
                className="rounded-full px-6 ml-4 bg-red-500 hover:bg-red-600 text-white"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Leave
              </Button>
            </div>

            {/* Right - Additional controls */}
            <div className="flex items-center gap-2">
              {/* Chat toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Toggle chat</TooltipContent>
              </Tooltip>

              {/* Participants toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Show participants</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}