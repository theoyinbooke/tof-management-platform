"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  MonitorOff,
  MessageSquare,
  Settings,
  MoreVertical,
  Send,
  Hand,
  UserPlus,
  Copy,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnhancedMeetingRoomProps {
  meetingId: Id<"meetings">;
  userName: string;
  userRole: "host" | "co_host" | "moderator" | "participant";
  initialSettings?: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    backgroundBlur: boolean;
  } | null;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
}

interface Participant {
  id: string;
  name: string;
  role: string;
  hasAudio: boolean;
  hasVideo: boolean;
  isHandRaised: boolean;
}

export function EnhancedMeetingRoom({ meetingId, userName, userRole, initialSettings }: EnhancedMeetingRoomProps) {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [livekitUrl, setLivekitUrl] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // UI State
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [layout, setLayout] = useState<"grid" | "focus">("grid");
  
  // Media controls
  const [isMicEnabled, setIsMicEnabled] = useState(initialSettings?.audioEnabled ?? true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(initialSettings?.videoEnabled ?? true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Participants (mock data for now)
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "1",
      name: userName,
      role: userRole,
      hasAudio: isMicEnabled,
      hasVideo: isCameraEnabled,
      isHandRaised: handRaised,
    }
  ]);

  // LiveKit container ref
  const livekitContainer = useRef<HTMLDivElement>(null);

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

  // Initialize meeting
  useEffect(() => {
    if (!mounted || !meeting) return;

    const initializeMeeting = async () => {
      try {
        if (meeting.status === "ended") {
          setError("This meeting has ended");
          setIsConnecting(false);
          toast.error("This meeting has ended");
          setTimeout(() => router.push("/meetings"), 2000);
          return;
        }

        const joinResult = await joinMeeting({ meetingId });
        
        if (joinResult.success && joinResult.needsToken) {
          const tokenData = await generateTokenAction({
            roomName: joinResult.roomName,
            participantIdentity: `user_${Date.now()}`,
            participantName: joinResult.userName,
            canPublish: true,
            canSubscribe: true,
          });
          
          setToken(tokenData.token);
          setLivekitUrl(tokenData.url);
          
          // Initialize LiveKit after getting credentials
          await initializeLiveKit(tokenData.token, tokenData.url, joinResult.roomName);
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
  }, [mounted, meeting, meetingId, joinMeeting, router, generateTokenAction]);

  // Initialize LiveKit
  const initializeLiveKit = async (token: string, serverUrl: string, roomName: string) => {
    if (!livekitContainer.current) return;

    try {
      const { Room, RoomEvent, Track } = await import("livekit-client");
      
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Create video grid container
      const videoGrid = document.createElement('div');
      videoGrid.className = 'video-grid w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4';
      livekitContainer.current.appendChild(videoGrid);

      // Handle events
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
        addParticipantVideo(participant, videoGrid);
        updateParticipantsList();
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Video) {
          const videoElement = videoGrid.querySelector(`[data-participant="${participant.identity}"] video`);
          if (videoElement) {
            track.attach(videoElement as HTMLVideoElement);
          }
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        handleDisconnected();
      });

      // Connect to room
      await room.connect(serverUrl, token);
      
      // Enable initial media settings
      if (isCameraEnabled) {
        await room.localParticipant.enableCameraAndMicrophone();
      }
      
      // Add local participant
      addLocalParticipant(room.localParticipant, videoGrid);
      
    } catch (error) {
      console.error('Failed to initialize LiveKit:', error);
      setError("Failed to connect to meeting room");
    }
  };

  const addParticipantVideo = (participant: any, container: HTMLElement) => {
    const participantDiv = document.createElement('div');
    participantDiv.setAttribute('data-participant', participant.identity);
    participantDiv.className = 'relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center';

    const video = document.createElement('video');
    video.className = 'w-full h-full object-cover';
    video.autoplay = true;
    video.muted = participant.isLocal;

    const nameLabel = document.createElement('div');
    nameLabel.textContent = participant.metadata?.name || participant.identity;
    nameLabel.className = 'absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm';

    participantDiv.appendChild(video);
    participantDiv.appendChild(nameLabel);
    container.appendChild(participantDiv);
  };

  const addLocalParticipant = (participant: any, container: HTMLElement) => {
    addParticipantVideo({ ...participant, isLocal: true }, container);
  };

  const updateParticipantsList = () => {
    // Update participants list for UI
    setParticipants(prev => [
      ...prev,
      // Add new participants as needed
    ]);
  };

  // Media controls
  const toggleMic = () => {
    setIsMicEnabled(!isMicEnabled);
    toast.success(isMicEnabled ? "Microphone muted" : "Microphone unmuted");
  };

  const toggleCamera = () => {
    setIsCameraEnabled(!isCameraEnabled);
    toast.success(isCameraEnabled ? "Camera turned off" : "Camera turned on");
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast.success(isScreenSharing ? "Screen sharing stopped" : "Screen sharing started");
  };

  const toggleHandRaise = () => {
    setHandRaised(!handRaised);
    toast.success(handRaised ? "Hand lowered" : "Hand raised");
  };

  // Chat functions
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: userName,
      message: newMessage,
      timestamp: Date.now(),
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage("");
    
    // Scroll to bottom
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // Meeting controls
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

  const copyMeetingLink = () => {
    const meetingLink = `${window.location.origin}/meetings/${meetingId}/room`;
    navigator.clipboard.writeText(meetingLink);
    toast.success("Meeting link copied to clipboard");
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

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col relative">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">{meeting?.title || "Meeting"}</h1>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
            Live
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={copyMeetingLink}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-800"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative">
          <div 
            ref={livekitContainer} 
            className="w-full h-full bg-gray-900"
          />
          
          {/* Layout Controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Button
              onClick={() => setLayout(layout === "grid" ? "focus" : "grid")}
              variant="secondary"
              size="sm"
              className="bg-black/20 hover:bg-black/30 text-white border-0"
            >
              {layout === "grid" ? "Focus View" : "Grid View"}
            </Button>
          </div>
        </div>

        {/* Right Sidebar - Chat/Participants */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Sidebar Tabs */}
            <div className="border-b border-gray-200 flex">
              <Button
                onClick={() => { setShowChat(true); setShowParticipants(false); }}
                variant="ghost"
                className={cn(
                  "flex-1 rounded-none border-b-2",
                  showChat ? "border-emerald-500 text-emerald-600" : "border-transparent"
                )}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <Button
                onClick={() => { setShowParticipants(true); setShowChat(false); }}
                variant="ghost"
                className={cn(
                  "flex-1 rounded-none border-b-2",
                  showParticipants ? "border-emerald-500 text-emerald-600" : "border-transparent"
                )}
              >
                <Users className="h-4 w-4 mr-2" />
                People ({participants.length})
              </Button>
            </div>

            {/* Chat Panel */}
            {showChat && (
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  <div className="space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{msg.sender}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                            {msg.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                {/* Chat Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants Panel */}
            {showParticipants && (
              <div className="flex-1 p-4">
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-emerald-600">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{participant.name}</span>
                          {participant.role === "host" && (
                            <Shield className="h-3 w-3 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {participant.hasAudio ? (
                            <Mic className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <MicOff className="h-3 w-3 text-red-500" />
                          )}
                          {participant.hasVideo ? (
                            <Video className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <VideoOff className="h-3 w-3 text-red-500" />
                          )}
                          {participant.isHandRaised && (
                            <Hand className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleMic}
              variant={isMicEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full h-12 w-12 p-0"
            >
              {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={toggleCamera}
              variant={isCameraEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full h-12 w-12 p-0"
            >
              {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
              onClick={toggleScreenShare}
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              className="rounded-full h-12 w-12 p-0"
            >
              {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            </Button>

            <Button
              onClick={toggleHandRaise}
              variant={handRaised ? "default" : "secondary"}
              size="lg"
              className="rounded-full h-12 w-12 p-0"
            >
              <Hand className="h-5 w-5" />
            </Button>
          </div>

          {/* Center - Meeting Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600">{userName}</p>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat) setShowParticipants(false);
              }}
              variant="ghost"
              size="lg"
              className={cn(
                "rounded-lg h-12 px-4",
                showChat && "bg-emerald-50 text-emerald-700"
              )}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Chat
            </Button>

            <Button
              onClick={() => {
                setShowParticipants(!showParticipants);
                if (!showParticipants) setShowChat(false);
              }}
              variant="ghost"
              size="lg"
              className={cn(
                "rounded-lg h-12 px-4",
                showParticipants && "bg-emerald-50 text-emerald-700"
              )}
            >
              <Users className="h-5 w-5 mr-2" />
              {participants.length}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-lg h-12 px-4"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnected}>
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Leave Meeting
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}