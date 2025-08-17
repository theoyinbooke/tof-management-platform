"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Users,
  Settings,
  MoreVertical,
  Hand,
  Grid3x3,
  Maximize,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  Share2,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  PenTool,
  Type,
  Square,
  Circle,
  Eraser,
  Download,
  Upload,
  Play,
  Pause,
  StopCircle,
  Wifi,
  WifiOff,
  BarChart,
  Clock,
  Calendar,
  FileText,
  Send,
  Smile,
  Paperclip,
  X,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Shield,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  UserCheck,
  Award,
  BookOpen,
  GraduationCap,
  Target,
  TrendingUp,
  Zap,
  Activity,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Sparkles,
  Layers,
  Layout,
  LayoutGrid,
  Sidebar,
  PictureInPicture,
  Fullscreen,
  Volume,
  Bell,
  BellOff,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Types
interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  isHost: boolean;
  isCoHost: boolean;
  hasRaisedHand: boolean;
  connectionQuality: "poor" | "fair" | "good" | "excellent";
  role: "host" | "co_host" | "presenter" | "participant";
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: "text" | "file" | "poll" | "announcement";
  fileUrl?: string;
  fileName?: string;
}

interface MeetingStats {
  duration: number;
  participantCount: number;
  messageCount: number;
  recordingSize?: number;
  networkQuality: "poor" | "fair" | "good" | "excellent";
  cpuUsage: number;
  bandwidth: {
    upload: number;
    download: number;
  };
}

// Main Meeting Component
export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const meetingId = params.meetingId as string;

  // State Management
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<"grid" | "speaker" | "sidebar">("grid");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"chat" | "participants" | "whiteboard" | "polls">("chat");
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [audioInputDevice, setAudioInputDevice] = useState("");
  const [audioOutputDevice, setAudioOutputDevice] = useState("");
  const [videoInputDevice, setVideoInputDevice] = useState("");
  const [videoQuality, setVideoQuality] = useState("auto");
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [virtualBackground, setVirtualBackground] = useState(false);
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const screenShareRef = useRef<HTMLVideoElement>(null);

  // Mock participants for demo
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "1",
      name: "You",
      isMuted: isMuted,
      isVideoOff: isVideoOff,
      isScreenSharing: false,
      isSpeaking: false,
      isHost: true,
      isCoHost: false,
      hasRaisedHand: false,
      connectionQuality: "excellent",
      role: "host",
    },
    {
      id: "2",
      name: "John Doe",
      avatar: "/avatars/john.jpg",
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isSpeaking: true,
      isHost: false,
      isCoHost: true,
      hasRaisedHand: false,
      connectionQuality: "good",
      role: "co_host",
    },
    {
      id: "3",
      name: "Jane Smith",
      avatar: "/avatars/jane.jpg",
      isMuted: true,
      isVideoOff: false,
      isScreenSharing: false,
      isSpeaking: false,
      isHost: false,
      isCoHost: false,
      hasRaisedHand: true,
      connectionQuality: "fair",
      role: "participant",
    },
  ]);

  // Mock stats for demo
  const [meetingStats, setMeetingStats] = useState<MeetingStats>({
    duration: 0,
    participantCount: 3,
    messageCount: 0,
    networkQuality: "excellent",
    cpuUsage: 45,
    bandwidth: {
      upload: 2.5,
      download: 4.2,
    },
  });

  // Simulate connection
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
      toast.success("Connected to meeting");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Update meeting duration
  useEffect(() => {
    const interval = setInterval(() => {
      setMeetingStats(prev => ({
        ...prev,
        duration: prev.duration + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Control Functions
  const toggleMute = () => {
    setIsMuted(!isMuted);
    setParticipants(prev => prev.map(p => 
      p.id === "1" ? { ...p, isMuted: !isMuted } : p
    ));
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    setParticipants(prev => prev.map(p => 
      p.id === "1" ? { ...p, isVideoOff: !isVideoOff } : p
    ));
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        // In real implementation, request screen share
        setIsScreenSharing(true);
        toast.success("Screen sharing started");
      } catch (error) {
        toast.error("Failed to share screen");
      }
    } else {
      setIsScreenSharing(false);
      toast.success("Screen sharing stopped");
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast.success("Recording started");
    } else {
      setIsRecording(false);
      toast.success("Recording saved");
    }
  };

  const raiseHand = () => {
    setHasRaisedHand(!hasRaisedHand);
    toast.success(hasRaisedHand ? "Hand lowered" : "Hand raised");
  };

  const endMeeting = () => {
    if (confirm("Are you sure you want to end the meeting for all participants?")) {
      toast.success("Meeting ended");
      router.push("/programs");
    }
  };

  const leaveMeeting = () => {
    toast.success("You left the meeting");
    router.push("/programs");
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        userId: "1",
        userName: "You",
        message: newMessage,
        timestamp: new Date(),
        type: "text",
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage("");
      setMeetingStats(prev => ({
        ...prev,
        messageCount: prev.messageCount + 1,
      }));
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionIcon = (quality: string) => {
    switch (quality) {
      case "excellent":
        return <SignalHigh className="h-4 w-4 text-green-500" />;
      case "good":
        return <SignalMedium className="h-4 w-4 text-green-500" />;
      case "fair":
        return <SignalLow className="h-4 w-4 text-yellow-500" />;
      case "poor":
        return <Signal className="h-4 w-4 text-red-500" />;
      default:
        return <Signal className="h-4 w-4 text-gray-500" />;
    }
  };

  // Loading State
  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-semibold text-white">Connecting to meeting...</h2>
          <p className="text-gray-400">Preparing your audio and video</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "beneficiary", "guardian", "reviewer"]}>
      <div className="fixed inset-0 bg-gray-900 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-semibold">Mathematics Tutoring Session</h1>
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
              {isRecording ? "Recording" : "Live"}
            </Badge>
            <span className="text-gray-400 text-sm">{formatDuration(meetingStats.duration)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Meeting Info */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Meeting link copied!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy meeting link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Badge variant="outline" className="text-gray-400">
              <Users className="h-3 w-3 mr-1" />
              {participants.length}
            </Badge>
            
            {/* Connection Quality */}
            {getConnectionIcon(meetingStats.networkQuality)}
            
            {/* Layout Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedLayout("grid")}>
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Grid View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedLayout("speaker")}>
                  <Maximize className="h-4 w-4 mr-2" />
                  Speaker View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedLayout("sidebar")}>
                  <Sidebar className="h-4 w-4 mr-2" />
                  Sidebar View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Fullscreen */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    <Fullscreen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle fullscreen</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Stats */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setShowStats(!showStats)}
                  >
                    <Activity className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connection stats</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Grid Area */}
          <div className="flex-1 relative bg-gray-900 p-4">
            {/* Stats Overlay */}
            {showStats && (
              <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg p-4 z-10 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Wifi className="h-4 w-4" />
                  <span>Quality: {meetingStats.networkQuality}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <TrendingUp className="h-4 w-4" />
                  <span>↑ {meetingStats.bandwidth.upload} Mbps</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <TrendingUp className="h-4 w-4 rotate-180" />
                  <span>↓ {meetingStats.bandwidth.download} Mbps</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Activity className="h-4 w-4" />
                  <span>CPU: {meetingStats.cpuUsage}%</span>
                </div>
              </div>
            )}

            {/* Video Grid */}
            <div className={cn(
              "h-full grid gap-2",
              selectedLayout === "grid" && participants.length <= 2 && "grid-cols-1 md:grid-cols-2",
              selectedLayout === "grid" && participants.length > 2 && participants.length <= 4 && "grid-cols-2",
              selectedLayout === "grid" && participants.length > 4 && "grid-cols-3",
              selectedLayout === "speaker" && "grid-cols-1",
              selectedLayout === "sidebar" && "grid-cols-1"
            )}>
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={cn(
                    "relative bg-gray-800 rounded-lg overflow-hidden group",
                    selectedLayout === "speaker" && pinnedParticipant === participant.id && "col-span-full",
                    participant.isSpeaking && "ring-2 ring-emerald-500"
                  )}
                >
                  {/* Video/Avatar */}
                  {participant.isVideoOff ? (
                    <div className="h-full flex items-center justify-center bg-gray-700">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="text-2xl bg-gray-600">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : (
                    <video
                      ref={el => {
                        if (el && participant.id !== "1") {
                          remoteVideoRefs.current[participant.id] = el;
                        }
                      }}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted={participant.id === "1"}
                    />
                  )}

                  {/* Participant Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{participant.name}</span>
                        {participant.isHost && (
                          <Badge className="bg-emerald-600 text-white text-xs">Host</Badge>
                        )}
                        {participant.isCoHost && (
                          <Badge className="bg-blue-600 text-white text-xs">Co-Host</Badge>
                        )}
                        {participant.hasRaisedHand && (
                          <Hand className="h-4 w-4 text-yellow-500 animate-bounce" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {participant.isMuted && <MicOff className="h-4 w-4 text-red-500" />}
                        {participant.isScreenSharing && <Monitor className="h-4 w-4 text-blue-500" />}
                        {getConnectionIcon(participant.connectionQuality)}
                      </div>
                    </div>
                  </div>

                  {/* Participant Controls (for host) */}
                  {participant.id !== "1" && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="bg-gray-800/80 hover:bg-gray-700">
                            <MoreVertical className="h-4 w-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Make Co-Host
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MicOff className="h-4 w-4 mr-2" />
                            Mute Participant
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <VideoOff className="h-4 w-4 mr-2" />
                            Stop Video
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPinnedParticipant(participant.id)}>
                            <Maximize className="h-4 w-4 mr-2" />
                            Pin Video
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove from Meeting
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Side Panel */}
          {isPanelOpen && (
            <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
              <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as any)} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-4 bg-gray-700">
                  <TabsTrigger value="chat" className="data-[state=active]:bg-gray-600">
                    <MessageSquare className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="participants" className="data-[state=active]:bg-gray-600">
                    <Users className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="whiteboard" className="data-[state=active]:bg-gray-600">
                    <PenTool className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="polls" className="data-[state=active]:bg-gray-600">
                    <BarChart className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>

                {/* Chat Panel */}
                <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
                  <ScrollArea className="flex-1 p-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {msg.userName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{msg.userName}</span>
                                <span className="text-xs text-gray-500">
                                  {msg.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 mt-1">{msg.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-4 border-t border-gray-700">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-700 border-gray-600 text-white"
                      />
                      <Button size="icon" onClick={sendMessage} className="bg-emerald-600 hover:bg-emerald-700">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Participants Panel */}
                <TabsContent value="participants" className="flex-1 p-4 mt-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-700 hover:bg-gray-600"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback className="text-sm">
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{participant.name}</span>
                                {participant.isHost && (
                                  <Badge className="bg-emerald-600 text-white text-xs">Host</Badge>
                                )}
                                {participant.hasRaisedHand && (
                                  <Hand className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {participant.isMuted ? (
                              <MicOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <Mic className="h-4 w-4 text-gray-400" />
                            )}
                            {participant.isVideoOff ? (
                              <VideoOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <Video className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Whiteboard Panel */}
                <TabsContent value="whiteboard" className="flex-1 flex flex-col p-4 mt-0">
                  <div className="flex gap-2 mb-4">
                    <Button size="sm" variant="outline" className="bg-gray-700">
                      <PenTool className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="bg-gray-700">
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="bg-gray-700">
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="bg-gray-700">
                      <Circle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="bg-gray-700">
                      <Eraser className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 bg-white rounded-lg">
                    {/* Whiteboard canvas would go here */}
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <p>Whiteboard Canvas</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Polls Panel */}
                <TabsContent value="polls" className="flex-1 p-4 mt-0">
                  <div className="space-y-4">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Poll
                    </Button>
                    <div className="text-center text-gray-500 py-8">
                      <BarChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active polls</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMuted ? "destructive" : "secondary"}
                      size="lg"
                      onClick={toggleMute}
                      className="rounded-full"
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isMuted ? "Unmute" : "Mute"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isVideoOff ? "destructive" : "secondary"}
                      size="lg"
                      onClick={toggleVideo}
                      className="rounded-full"
                    >
                      {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isVideoOff ? "Start Video" : "Stop Video"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Center Controls */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isScreenSharing ? "default" : "secondary"}
                      size="lg"
                      onClick={toggleScreenShare}
                      className="rounded-full"
                    >
                      {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isRecording ? "destructive" : "secondary"}
                      size="lg"
                      onClick={toggleRecording}
                      className="rounded-full"
                    >
                      {isRecording ? <StopCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isRecording ? "Stop Recording" : "Start Recording"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={hasRaisedHand ? "default" : "secondary"}
                      size="lg"
                      onClick={raiseHand}
                      className="rounded-full"
                    >
                      <Hand className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hasRaisedHand ? "Lower Hand" : "Raise Hand"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isPanelOpen && activePanel === "chat" ? "default" : "secondary"}
                      size="lg"
                      onClick={() => {
                        setActivePanel("chat");
                        setIsPanelOpen(!isPanelOpen);
                      }}
                      className="rounded-full relative"
                    >
                      <MessageSquare className="h-5 w-5" />
                      {chatMessages.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {chatMessages.length}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isPanelOpen && activePanel === "participants" ? "default" : "secondary"}
                      size="lg"
                      onClick={() => {
                        setActivePanel("participants");
                        setIsPanelOpen(!isPanelOpen);
                      }}
                      className="rounded-full"
                    >
                      <Users className="h-5 w-5" />
                      <span className="ml-2">{participants.length}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Participants</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => setShowSettings(true)}
                      className="rounded-full"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="lg"
                onClick={participants.find(p => p.id === "1")?.isHost ? endMeeting : leaveMeeting}
                className="rounded-full px-6"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                {participants.find(p => p.id === "1")?.isHost ? "End Meeting" : "Leave"}
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Meeting Settings</DialogTitle>
              <DialogDescription>
                Configure your audio, video, and meeting preferences
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="audio" className="mt-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="audio" className="space-y-4">
                <div className="space-y-2">
                  <Label>Microphone</Label>
                  <Select value={audioInputDevice} onValueChange={setAudioInputDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Microphone</SelectItem>
                      <SelectItem value="headset">Headset Microphone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Speaker</Label>
                  <Select value={audioOutputDevice} onValueChange={setAudioOutputDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select speaker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Speaker</SelectItem>
                      <SelectItem value="headset">Headset Speaker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="noise-cancellation">Noise Cancellation</Label>
                  <Switch
                    id="noise-cancellation"
                    checked={noiseCancellation}
                    onCheckedChange={setNoiseCancellation}
                  />
                </div>
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <div className="space-y-2">
                  <Label>Camera</Label>
                  <Select value={videoInputDevice} onValueChange={setVideoInputDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Camera</SelectItem>
                      <SelectItem value="external">External Camera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Video Quality</Label>
                  <Select value={videoQuality} onValueChange={setVideoQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="720p">HD (720p)</SelectItem>
                      <SelectItem value="480p">SD (480p)</SelectItem>
                      <SelectItem value="360p">Low (360p)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="virtual-bg">Virtual Background</Label>
                  <Switch
                    id="virtual-bg"
                    checked={virtualBackground}
                    onCheckedChange={setVirtualBackground}
                  />
                </div>
              </TabsContent>

              <TabsContent value="general" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="low-bandwidth">Low Bandwidth Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Optimize for slower connections (Nigerian 2G/3G)
                    </p>
                  </div>
                  <Switch
                    id="low-bandwidth"
                    checked={lowBandwidthMode}
                    onCheckedChange={setLowBandwidthMode}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-2">
                  <Label>Network Statistics</Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Upload Speed:</span>
                      <span>{meetingStats.bandwidth.upload} Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Download Speed:</span>
                      <span>{meetingStats.bandwidth.download} Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Packet Loss:</span>
                      <span>0.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span>45ms</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Settings saved");
                setShowSettings(false);
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}