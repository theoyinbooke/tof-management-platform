"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Settings,
  MoreVertical,
  Maximize,
  Minimize,
  Hand,
  Volume2,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Copy,
  Calendar,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  Chat,
  useParticipants,
  useTracks,
  ConnectionState,
  useConnectionState,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";

interface MeetingRoomV2Props {
  meetingId: Id<"meetings">;
  userName: string;
  userRole: "host" | "co_host" | "moderator" | "participant";
}

export function MeetingRoomV2({ meetingId, userName, userRole }: MeetingRoomV2Props) {
  const router = useRouter();
  const [showLobby, setShowLobby] = useState(true);
  const [token, setToken] = useState<string>("");
  const [livekitUrl, setLivekitUrl] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Lobby states
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Meeting states
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Queries and mutations
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });
  const joinMeeting = useMutation(api.meetings.joinMeeting);
  const leaveMeeting = useMutation(api.meetings.leaveMeeting);
  const endMeetingMutation = useMutation(api.meetings.endMeeting);

  // Initialize media preview in lobby
  useEffect(() => {
    if (showLobby) {
      initializeMediaPreview();
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showLobby]);

  const initializeMediaPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled,
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Failed to initialize media:", err);
      toast.error("Failed to access camera/microphone");
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
      }
    }
  };

  const handleJoinMeeting = async () => {
    setIsConnecting(true);
    try {
      // Stop local preview
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      // Join meeting in Convex
      const joinResult = await joinMeeting({ meetingId });
      if (!joinResult.success) {
        throw new Error(joinResult.error || "Failed to join meeting");
      }

      // Get LiveKit token with meeting settings
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: joinResult.roomName,
          userName: userName,
          role: userRole,
          meetingSettings: {
            recordingEnabled: meeting.recordingEnabled,
            waitingRoomEnabled: meeting.waitingRoomEnabled,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get meeting token");
      }

      const data = await response.json();
      setToken(data.token);
      setLivekitUrl(data.url);
      setShowLobby(false);
    } catch (err: any) {
      console.error("Failed to join meeting:", err);
      toast.error(err.message || "Failed to join meeting");
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLeaveMeeting = async () => {
    try {
      await leaveMeeting({ meetingId });
      toast.success("You have left the meeting");
      router.push("/meetings");
    } catch (err) {
      console.error("Failed to leave meeting:", err);
      toast.error("Failed to leave meeting");
    }
  };

  const handleEndMeeting = async () => {
    try {
      await endMeetingMutation({ meetingId });
      toast.success("Meeting ended");
      router.push("/meetings");
    } catch (err) {
      console.error("Failed to end meeting:", err);
      toast.error("Failed to end meeting");
    }
  };

  if (!meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Lobby View
  if (showLobby) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Video Preview */}
              <div className="bg-gray-900 relative">
                <div className="aspect-video md:aspect-auto md:h-full">
                  {videoEnabled ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover mirror"
                      style={{ transform: "scaleX(-1)" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl font-bold text-white">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-400">Camera is off</p>
                      </div>
                    </div>
                  )}

                  {/* Media Controls */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    <Button
                      size="icon"
                      variant={videoEnabled ? "secondary" : "destructive"}
                      className="rounded-full"
                      onClick={toggleVideo}
                    >
                      {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant={audioEnabled ? "secondary" : "destructive"}
                      className="rounded-full"
                      onClick={toggleAudio}
                    >
                      {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant={backgroundBlur ? "secondary" : "outline"}
                      className="rounded-full bg-white/10 backdrop-blur"
                      onClick={() => setBackgroundBlur(!backgroundBlur)}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Meeting Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{meeting.title}</h2>
                  {meeting.description && (
                    <p className="text-gray-600 text-sm mb-4">{meeting.description}</p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {meeting.host && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Host: {meeting.host.firstName} {meeting.host.lastName}</span>
                    </div>
                  )}
                  {meeting.scheduledStartTime && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(meeting.scheduledStartTime), "PPP")}</span>
                    </div>
                  )}
                  {meeting.scheduledStartTime && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(meeting.scheduledStartTime), "p")} - 
                        {format(new Date(meeting.scheduledEndTime), "p")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Volume2 className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">Computer Audio</p>
                      <p className="text-xs text-gray-500">Join with computer audio</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/meetings")}
                    disabled={isConnecting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleJoinMeeting}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join now"
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
                  Joining as <span className="font-medium">{userName}</span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Meeting Room View
  if (token && livekitUrl) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        video={videoEnabled}
        audio={audioEnabled}
        onDisconnected={() => {
          handleLeaveMeeting();
        }}
      >
        <MeetingRoomLayout
          meeting={meeting}
          userName={userName}
          userRole={userRole}
          onLeave={handleLeaveMeeting}
          onEnd={handleEndMeeting}
        />
      </LiveKitRoom>
    );
  }

  return null;
}

// Compact Meeting Room Layout
function MeetingRoomLayout({ meeting, userName, userRole, onLeave, onEnd }: any) {
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare],
    { onlySubscribed: false }
  );

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-white">{meeting.title}</h3>
          <Badge variant="outline" className="text-gray-300 border-gray-600">
            {format(new Date(), "HH:mm:ss")}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-300 hover:text-white"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="h-4 w-4 mr-2" />
            {participants.length}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-300 hover:text-white"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <GridLayout tracks={tracks}>
            <ParticipantTile />
          </GridLayout>
        </div>

        {/* Sidebar */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            {showChat && <Chat />}
            {showParticipants && (
              <div className="p-4">
                <h3 className="font-semibold text-white mb-4">Participants</h3>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.sid} className="flex items-center gap-2 text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {participant.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm">{participant.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <ControlBar variation="minimal" />
          <Button
            size="icon"
            variant="destructive"
            className="rounded-full"
            onClick={userRole === "host" ? onEnd : onLeave}
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <RoomAudioRenderer />
    </div>
  );
}