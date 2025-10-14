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
  MoreVertical,
  Send,
  Hand,
  UserPlus,
  Copy,
  Shield,
  Circle,
  Square,
  Smile,
  ThumbsUp,
  Heart,
  Laugh,
  Angry,
  Frown,
  Camera,
} from "lucide-react";
import { Room, RoomEvent, Track, DataPacket_Kind, LocalParticipant } from "livekit-client";
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

interface EmojiReaction {
  id: string;
  emoji: string;
  sender: string;
  senderName: string;
  timestamp: number;
  x?: number; // For positioning animation
  y?: number;
}

const EMOJI_REACTIONS = [
  { emoji: "👍", label: "Thumbs up", icon: ThumbsUp },
  { emoji: "👏", label: "Clap", icon: null },
  { emoji: "❤️", label: "Love", icon: Heart },
  { emoji: "😂", label: "Laugh", icon: Laugh },
  { emoji: "😮", label: "Wow", icon: null },
  { emoji: "😢", label: "Sad", icon: Frown },
] as const;

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
  const [isInitialized, setIsInitialized] = useState(false);

  // UI State
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [layout, setLayout] = useState<"grid" | "focus">("grid");
  
  // Media controls
  const [isMicEnabled, setIsMicEnabled] = useState(initialSettings?.audioEnabled ?? true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(initialSettings?.videoEnabled ?? true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<string>("idle");
  
  // Screen sharing state
  const [screenShareTrack, setScreenShareTrack] = useState<any>(null);
  const [screenShareParticipant, setScreenShareParticipant] = useState<any>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Reactions
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Device and Audio Settings
  const [availableDevices, setAvailableDevices] = useState<{
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }>({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });
  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: '',
    audioOutput: '',
    videoInput: '',
  });

  // Convex queries and mutations (declare early)
  const leaveMeeting = useMutation(api.meetings.leaveMeeting);
  const endCurrentSessionMutation = useMutation(api.meetings.endCurrentSession);
  const generateTokenAction = useAction(api.livekit.generateToken);
  const terminateRoomAction = useAction(api.livekit.terminateRoom);
  
  // Recording mutations and queries
  const recordingData = useQuery(api.meetings.getRecordingStatus, { meetingId });
  const startRecordingMutation = useMutation(api.meetings.startMeetingRecording);
  const stopRecordingMutation = useMutation(api.meetings.stopMeetingRecording);
  const startRecordingAction = useAction(api.livekit.startRecording);
  const stopRecordingAction = useAction(api.livekit.stopRecording);
  const enableRecordingForMeeting = useMutation(api.meetings.enableRecordingForMeeting);
  
  // Debug: Log screen share state changes
  useEffect(() => {
    console.log('Screen share state changed:', { 
      hasScreenShareTrack: !!screenShareTrack, 
      isScreenSharing, 
      participantIdentity: screenShareParticipant?.identity 
    });
  }, [screenShareTrack, screenShareParticipant, isScreenSharing]);

  // Sync recording status
  useEffect(() => {
    if (recordingData) {
      console.log("🎥 Recording data:", recordingData);
      setIsRecording(recordingData.recordingStatus === "recording");
      setRecordingStatus(recordingData.recordingStatus);
    }
  }, [recordingData]);

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showReactionPicker) {
        const target = event.target as HTMLElement;
        if (!target.closest('.reaction-picker') && !target.closest('.reaction-button')) {
          setShowReactionPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactionPicker]);

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

  // LiveKit container refs - separate refs for different layouts
  const livekitContainer = useRef<HTMLDivElement>(null);
  const participantThumbnailsContainer = useRef<HTMLDivElement>(null);
  const roomRef = useRef<any>(null);

  // Additional Convex queries
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });
  const joinMeeting = useMutation(api.meetings.joinMeeting);

  // Enumerate available devices
  const enumerateDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      
      setAvailableDevices({
        audioInputs,
        audioOutputs,
        videoInputs,
      });

      // Set default devices
      if (audioInputs.length > 0) {
        setSelectedDevices(prev => ({
          ...prev,
          audioInput: prev.audioInput || audioInputs[0].deviceId,
        }));
      }
      if (audioOutputs.length > 0) {
        setSelectedDevices(prev => ({
          ...prev,
          audioOutput: prev.audioOutput || audioOutputs[0].deviceId,
        }));
      }
      if (videoInputs.length > 0) {
        setSelectedDevices(prev => ({
          ...prev,
          videoInput: prev.videoInput || videoInputs[0].deviceId,
        }));
      }
    } catch (error) {
      console.error("Failed to enumerate devices:", error);
    }
  };


  // Ensure proper mounting and cleanup
  useEffect(() => {
    setMounted(true);
    enumerateDevices(); // Load available devices
    
    // Add beforeunload event to cleanup when user closes tab/browser
    const handleBeforeUnload = () => {
      if (roomRef.current) {
        console.log("Browser closing - cleaning up LiveKit room...");
        try {
          const localParticipant = roomRef.current.localParticipant;
          if (localParticipant) {
            const trackPublications = Array.from(localParticipant.trackPublications.values());
            trackPublications.forEach(publication => {
              if (publication.track) {
                publication.track.stop();
              }
            });
          }
          roomRef.current.disconnect();
        } catch (error) {
          console.error("Error during beforeunload cleanup:", error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // Remove event listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Comprehensive cleanup on unmount
      if (roomRef.current) {
        console.log("Cleaning up LiveKit room on component unmount...");
        
        try {
          // Stop all local tracks
          const localParticipant = roomRef.current.localParticipant;
          if (localParticipant) {
            const trackPublications = Array.from(localParticipant.trackPublications.values());
            trackPublications.forEach(publication => {
              if (publication.track) {
                publication.track.stop();
              }
            });
          }
          
          // Disconnect from room
          roomRef.current.disconnect();
          roomRef.current = null;
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      }
    };
  }, []);

  // Initialize meeting
  useEffect(() => {
    if (!mounted || !meeting || !isConnecting || isInitialized) return;

    const initializeMeeting = async () => {
      try {
        console.log("🎯 Initializing meeting:", { meetingId, meetingStatus: meeting.status });
        
        if (meeting.status === "ended") {
          setError("This meeting has ended");
          setIsConnecting(false);
          toast.error("This meeting has ended");
          setTimeout(() => router.push("/meetings"), 2000);
          return;
        }

        console.log("🔗 Joining meeting...");
        const joinResult = await joinMeeting({ meetingId });
        console.log("✅ Join result:", joinResult);
        
        if (joinResult.success && joinResult.needsToken) {
          console.log("🎫 Generating LiveKit token...");
          const tokenData = await generateTokenAction({
            roomName: joinResult.roomName,
            participantIdentity: `${userName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
            participantName: userName,
            canPublish: true,
            canSubscribe: true,
          });
          
          console.log("✅ Token generated:", { hasToken: !!tokenData.token, url: tokenData.url });
          setToken(tokenData.token);
          setLivekitUrl(tokenData.url);
          
          // Initialize LiveKit after getting credentials
          console.log("🏠 Initializing LiveKit room...");
          await initializeLiveKit(tokenData.token, tokenData.url, joinResult.roomName);
        } else {
          throw new Error("Failed to join meeting");
        }

        setIsConnecting(false);
        setIsInitialized(true);
        console.log("✅ Meeting initialization complete");
      } catch (err: any) {
        console.error("❌ Failed to initialize meeting:", err);
        setError(err.message || "Failed to connect to meeting");
        setIsConnecting(false);
        toast.error("Failed to join meeting");
      }
    };

    initializeMeeting();
  }, [mounted, meeting?.status, meetingId, joinMeeting, router, generateTokenAction, isConnecting, isInitialized]);

  // Initialize LiveKit
  const initializeLiveKit = async (token: string, serverUrl: string, roomName: string) => {
    if (!livekitContainer.current) return;

    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      
      // Store room reference for controls
      roomRef.current = room;

      // Create video grid container with dynamic layout
      const videoGrid = document.createElement('div');
      videoGrid.className = 'video-grid w-full h-full grid gap-3 p-4 overflow-hidden';
      videoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';
      videoGrid.style.gridTemplateRows = 'repeat(auto-fit, minmax(0, 1fr))';
      livekitContainer.current.appendChild(videoGrid);

      // Handle events
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
        // Don't add local participant here as it's already added below
        if (!participant.isLocal) {
          addParticipantVideo(participant, videoGrid);
          const currentParticipantCount = videoGrid.children.length;
          optimizeGridLayout(videoGrid, currentParticipantCount);
          updateParticipantsList();
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('Track subscribed:', track.kind, 'source:', publication.source, 'from', participant.identity);
        
        if (track.kind === Track.Kind.Video) {
          // Check if this is a screen share track
          if (publication.source === Track.Source.ScreenShare) {
            console.log('Screen share track received from', participant.identity);
            setScreenShareTrack(track);
            setScreenShareParticipant(participant);
            setIsScreenSharing(true);
            // Create participant thumbnails for sidebar
            setTimeout(() => {
              createParticipantThumbnails();
            }, 100);
          } else {
            // Regular video track
            const videoElement = videoGrid.querySelector(`[data-participant="${participant.identity}"] video`);
            if (videoElement) {
              track.attach(videoElement as HTMLVideoElement);
              console.log('Video track attached to', participant.identity);
            } else {
              console.warn('Video element not found for participant:', participant.identity);
            }
          }
        } else if (track.kind === Track.Kind.Audio) {
          track.attach();
          console.log('Audio track attached for', participant.identity);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, 'source:', publication.source, 'from', participant.identity);
        
        if (track.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) {
          console.log('Screen share ended');
          setScreenShareTrack(null);
          setScreenShareParticipant(null);
          setIsScreenSharing(false);
          // Clear participant thumbnails
          setTimeout(() => {
            clearParticipantThumbnails();
          }, 100);
        }
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity);
        const participantElement = videoGrid.querySelector(`[data-participant="${participant.identity}"]`);
        if (participantElement) {
          participantElement.remove();
          const currentParticipantCount = videoGrid.children.length;
          optimizeGridLayout(videoGrid, currentParticipantCount);
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        handleDisconnected();
      });

      // Handle incoming data messages (reactions)
      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant, kind) => {
        if (kind === DataPacket_Kind.RELIABLE) {
          try {
            const decoder = new TextDecoder();
            const message = JSON.parse(decoder.decode(payload));
            
            if (message.type === 'emoji_reaction') {
              const reaction: EmojiReaction = {
                id: `${participant?.identity || 'unknown'}_${Date.now()}_${Math.random()}`,
                emoji: message.emoji,
                sender: participant?.identity || 'unknown',
                senderName: participant?.name || participant?.identity || 'Unknown',
                timestamp: Date.now(),
                x: Math.random() * 300 + 50, // Random position for animation
                y: Math.random() * 200 + 100,
              };
              
              setReactions(prev => [...prev, reaction]);
              
              // Remove reaction after animation
              setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== reaction.id));
              }, 3000);
              
              console.log(`Reaction received: ${reaction.emoji} from ${reaction.senderName}`);
            }
          } catch (error) {
            console.error('Failed to parse data message:', error);
          }
        }
      });

      // Track media state changes
      room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
        console.log('Local track published:', publication.kind, 'source:', publication.source);
        if (publication.kind === Track.Kind.Video) {
          if (publication.source === Track.Source.ScreenShare) {
            setIsScreenSharing(true);
            setScreenShareTrack(publication.track);
            setScreenShareParticipant(participant);
            // Create participant thumbnails for sidebar
            setTimeout(() => {
              createParticipantThumbnails();
            }, 100);
          } else {
            setIsCameraEnabled(true);
          }
        } else if (publication.kind === Track.Kind.Audio) {
          setIsMicEnabled(true);
        }
      });

      room.on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
        console.log('Local track unpublished:', publication.kind, 'source:', publication.source);
        if (publication.kind === Track.Kind.Video) {
          if (publication.source === Track.Source.ScreenShare) {
            setIsScreenSharing(false);
            setScreenShareTrack(null);
            setScreenShareParticipant(null);
            // Move participants back to main grid
            setTimeout(() => {
              moveParticipantsToMainGrid();
            }, 100);
          } else {
            setIsCameraEnabled(false);
          }
        } else if (publication.kind === Track.Kind.Audio) {
          setIsMicEnabled(false);
        }
      });

      // Connect to room
      console.log("🔌 Connecting to LiveKit room...", { serverUrl, roomName });
      await room.connect(serverUrl, token);
      console.log("✅ Connected to LiveKit room successfully");
      
      // Add local participant first
      console.log("👤 Adding local participant...");
      addLocalParticipant(room.localParticipant, videoGrid);
      
      // Enable initial media settings and attach tracks
      if (isCameraEnabled) {
        try {
          console.log("📹 Enabling camera and microphone...");
          await room.localParticipant.enableCameraAndMicrophone();
          console.log("✅ Camera and microphone enabled");
          
          // Wait for local video track to be published and attach it
          setTimeout(() => {
            const videoPublication = Array.from(room.localParticipant.videoTrackPublications.values())[0];
            if (videoPublication?.track) {
              const localVideoElement = videoGrid.querySelector(`[data-participant="${room.localParticipant.identity}"] video`);
              if (localVideoElement) {
                videoPublication.track.attach(localVideoElement as HTMLVideoElement);
                console.log('✅ Local video track attached');
              } else {
                console.warn('⚠️ Local video element not found');
              }
            } else {
              console.warn('⚠️ No video track found');
            }
          }, 500);
        } catch (error) {
          console.error('❌ Failed to enable camera/microphone:', error);
          toast.error('Failed to enable camera/microphone. Please check permissions.');
        }
      }
      
      optimizeGridLayout(videoGrid, 1);
      
    } catch (error) {
      console.error('Failed to initialize LiveKit:', error);
      setError("Failed to connect to meeting room");
    }
  };

  const addParticipantVideo = (participant: any, container: HTMLElement) => {
    // Check if participant already exists to prevent duplicates
    const existingParticipant = container.querySelector(`[data-participant="${participant.identity}"]`);
    if (existingParticipant) {
      console.log('Participant already exists, skipping:', participant.identity);
      return;
    }

    const participantDiv = document.createElement('div');
    participantDiv.setAttribute('data-participant', participant.identity);
    participantDiv.className = 'relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center w-full h-full border border-gray-700';

    const video = document.createElement('video');
    video.className = 'w-full h-full object-cover';
    video.autoplay = true;
    video.muted = participant.isLocal;

    const nameLabel = document.createElement('div');
    // Extract user name from identity or use the participant name
    const displayName = participant.name || participant.metadata?.name || userName || participant.identity.split('_')[0];
    nameLabel.textContent = displayName;
    nameLabel.className = 'absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-sm font-medium';

    // Audio indicator
    const audioIndicator = document.createElement('div');
    audioIndicator.className = 'absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center';
    
    const micIcon = document.createElement('div');
    micIcon.innerHTML = participant.hasAudio ? '🎤' : '🚫';
    micIcon.className = 'text-xs';
    audioIndicator.appendChild(micIcon);

    participantDiv.appendChild(video);
    participantDiv.appendChild(nameLabel);
    participantDiv.appendChild(audioIndicator);
    container.appendChild(participantDiv);
    
    console.log('Added participant video:', participant.identity);
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

  const createParticipantThumbnails = () => {
    if (!livekitContainer.current) return;
    
    console.log('Creating participant thumbnails for screen share mode');
    
    const thumbnailContainer = document.getElementById('thumbnail-participants');
    if (!thumbnailContainer) return;
    
    // Clear existing thumbnails
    thumbnailContainer.innerHTML = '';
    
    // Clone participant video elements as thumbnails
    const participantElements = livekitContainer.current.querySelectorAll('[data-participant]');
    participantElements.forEach((element: any) => {
      const clone = element.cloneNode(true);
      
      // Update styling for thumbnail mode
      clone.style.width = '100%';
      clone.style.height = '100px';
      clone.style.aspectRatio = '16/9';
      clone.style.flexShrink = '0';
      clone.style.marginBottom = '8px';
      clone.style.borderRadius = '8px';
      clone.style.border = '2px solid #374151';
      
      // Find the video element in the clone and attach the same track
      const originalVideo = element.querySelector('video');
      const clonedVideo = clone.querySelector('video');
      
      if (originalVideo && clonedVideo && originalVideo.srcObject) {
        clonedVideo.srcObject = originalVideo.srcObject;
        clonedVideo.muted = true; // Always mute thumbnails to avoid echo
      }
      
      thumbnailContainer.appendChild(clone);
    });
  };

  const clearParticipantThumbnails = () => {
    const thumbnailContainer = document.getElementById('thumbnail-participants');
    if (thumbnailContainer) {
      thumbnailContainer.innerHTML = '';
    }
  };

  const optimizeGridLayout = (container: HTMLElement, participantCount: number) => {
    // Regular grid layout for normal meeting mode
    container.style.display = 'grid';
    container.style.flexDirection = '';
    
    let columns = 'repeat(auto-fit, minmax(240px, 1fr))';
    let rows = 'repeat(auto-fit, minmax(0, 1fr))';
    
    if (participantCount === 1) {
      columns = '1fr';
      rows = '1fr';
    } else if (participantCount === 2) {
      columns = 'repeat(2, 1fr)';
      rows = '1fr';
    } else if (participantCount <= 4) {
      columns = 'repeat(2, 1fr)';
      rows = 'repeat(2, 1fr)';
    } else if (participantCount <= 6) {
      columns = 'repeat(3, 1fr)';
      rows = 'repeat(2, 1fr)';
    } else if (participantCount <= 9) {
      columns = 'repeat(3, 1fr)';
      rows = 'repeat(3, 1fr)';
    } else {
      columns = 'repeat(4, 1fr)';
      rows = 'repeat(auto-fit, minmax(0, 1fr))';
    }
    
    container.style.gridTemplateColumns = columns;
    container.style.gridTemplateRows = rows;
  };

  // Media controls
  const toggleMic = async () => {
    console.log("🎤 Toggle mic clicked:", { hasRoom: !!roomRef.current, isMicEnabled });
    
    if (!roomRef.current) {
      console.error("❌ No room reference available");
      toast.error("Not connected to meeting room");
      return;
    }
    
    if (!roomRef.current.localParticipant) {
      console.error("❌ No local participant available");
      toast.error("Local participant not available");
      return;
    }
    
    try {
      console.log("🎤 Setting microphone enabled to:", !isMicEnabled);
      await roomRef.current.localParticipant.setMicrophoneEnabled(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
      toast.success(isMicEnabled ? "Microphone muted" : "Microphone unmuted");
    } catch (error) {
      console.error("❌ Failed to toggle microphone:", error);
      toast.error("Failed to toggle microphone");
    }
  };

  const toggleCamera = async () => {
    console.log("📹 Toggle camera clicked:", { hasRoom: !!roomRef.current, isCameraEnabled });
    
    if (!roomRef.current) {
      console.error("❌ No room reference available");
      toast.error("Not connected to meeting room");
      return;
    }
    
    if (!roomRef.current.localParticipant) {
      console.error("❌ No local participant available");
      toast.error("Local participant not available");
      return;
    }
    
    try {
      console.log("📹 Setting camera enabled to:", !isCameraEnabled);
      await roomRef.current.localParticipant.setCameraEnabled(!isCameraEnabled);
      setIsCameraEnabled(!isCameraEnabled);
      toast.success(isCameraEnabled ? "Camera turned off" : "Camera turned on");
    } catch (error) {
      console.error("❌ Failed to toggle camera:", error);
      toast.error("Failed to toggle camera");
    }
  };

  const toggleScreenShare = async () => {
    console.log("🖥️ Toggle screen share clicked:", { hasRoom: !!roomRef.current, isScreenSharing });
    
    if (!roomRef.current) {
      console.error("❌ No room reference available");
      toast.error("Not connected to meeting room");
      return;
    }
    
    if (!roomRef.current.localParticipant) {
      console.error("❌ No local participant available");
      toast.error("Local participant not available");
      return;
    }
    
    try {
      console.log("🖥️ Setting screen share enabled to:", !isScreenSharing);
      await roomRef.current.localParticipant.setScreenShareEnabled(!isScreenSharing);
      setIsScreenSharing(!isScreenSharing);
      toast.success(isScreenSharing ? "Screen sharing stopped" : "Screen sharing started");
    } catch (error) {
      console.error("❌ Failed to toggle screen share:", error);
      toast.error("Failed to toggle screen share");
    }
  };

  const toggleHandRaise = () => {
    console.log("✋ Toggle hand raise clicked:", { handRaised });
    setHandRaised(!handRaised);
    toast.success(handRaised ? "Hand lowered" : "Hand raised");
  };

  const startRecording = async () => {
    if (!meeting) return;
    
    // Check if LiveKit room is connected
    if (!roomRef.current || roomRef.current.state !== "connected") {
      toast.error("Please wait for the meeting to fully connect before starting recording");
      return;
    }
    
    try {
      setRecordingStatus("starting");
      
      // Start recording in database
      const result = await startRecordingMutation({ meetingId });
      
      if (result.success) {
        // Start LiveKit recording
        const livekitResult = await startRecordingAction({
          roomName: result.roomName,
          meetingId: meetingId,
        });
        
        if (livekitResult.success) {
          // Update the meeting with LiveKit egress ID
          setRecordingStatus("recording");
          setIsRecording(true);
          toast.success("Recording started successfully");
        } else {
          throw new Error(livekitResult.error || "Failed to start LiveKit recording");
        }
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      setRecordingStatus("idle");
      setIsRecording(false);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recordingStatus?.recordingEgressId) return;
    
    try {
      setRecordingStatus("stopping");
      
      // Stop LiveKit recording
      const livekitResult = await stopRecordingAction({
        egressId: recordingStatus.recordingEgressId,
      });
      
      if (livekitResult.success) {
        // Stop recording in database
        await stopRecordingMutation({ meetingId });
        
        setRecordingStatus("completed");
        setIsRecording(false);
        toast.success("Recording stopped successfully");
      } else {
        throw new Error(livekitResult.error || "Failed to stop LiveKit recording");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast.error("Failed to stop recording");
    }
  };

  // Reaction functions
  const sendReaction = async (emoji: string) => {
    if (!roomRef.current) return;
    
    try {
      const reactionMessage = {
        type: 'emoji_reaction',
        emoji: emoji,
        timestamp: Date.now(),
      };
      
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(reactionMessage));
      
      // Send reaction to all participants
      await roomRef.current.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
      
      // Add to local reactions immediately for instant feedback
      const localReaction: EmojiReaction = {
        id: `local_${Date.now()}_${Math.random()}`,
        emoji: emoji,
        sender: roomRef.current.localParticipant.identity,
        senderName: userName,
        timestamp: Date.now(),
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 100,
      };
      
      setReactions(prev => [...prev, localReaction]);
      
      // Remove after animation
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== localReaction.id));
      }, 3000);
      
      // Close reaction picker
      setShowReactionPicker(false);
      
      console.log(`Sent reaction: ${emoji}`);
    } catch (error) {
      console.error('Failed to send reaction:', error);
      toast.error('Failed to send reaction');
    }
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
      // Comprehensive room cleanup
      if (roomRef.current) {
        console.log("Disconnecting from LiveKit room...");
        
        // Stop all local tracks first
        const localParticipant = roomRef.current.localParticipant;
        if (localParticipant) {
          // Unpublish all tracks
          const trackPublications = Array.from(localParticipant.trackPublications.values());
          for (const publication of trackPublications) {
            if (publication.track) {
              publication.track.stop();
              await localParticipant.unpublishTrack(publication.track);
            }
          }
        }
        
        // Disconnect from room
        await roomRef.current.disconnect();
        roomRef.current = null;
        console.log("Successfully disconnected from LiveKit room");
      }
      
      // Always call leaveMeeting even if room cleanup fails
      const leaveResult = await leaveMeeting({ meetingId });
      
      // Smart LiveKit room management: terminate room when empty to save bandwidth
      if (leaveResult.roomIsEmpty && leaveResult.meetingIsWithinSchedule && leaveResult.roomName) {
        try {
          console.log("Room is empty - terminating LiveKit room to save bandwidth:", leaveResult.roomName);
          await terminateRoomAction({ roomName: leaveResult.roomName });
          console.log("Empty LiveKit room terminated successfully");
        } catch (error) {
          console.warn("Failed to terminate empty room:", error);
          // Don't break the flow if termination fails
        }
      }
      
      setIsInitialized(false);
      toast.success("You have left the meeting");
      router.push("/meetings");
    } catch (err) {
      console.error("Failed to leave meeting:", err);
      // Force navigation even if cleanup fails
      router.push("/meetings");
    }
  };

  const handleEndCurrentSession = async () => {
    if (userRole === "host" || userRole === "co_host") {
      try {
        // First cleanup local room connection
        if (roomRef.current) {
          try {
            const localParticipant = roomRef.current.localParticipant;
            if (localParticipant) {
              const trackPublications = Array.from(localParticipant.trackPublications.values());
              for (const publication of trackPublications) {
                if (publication.track) {
                  publication.track.stop();
                  await localParticipant.unpublishTrack(publication.track);
                }
              }
            }
            await roomRef.current.disconnect();
            roomRef.current = null;
          } catch (cleanupError) {
            console.error("Error during room cleanup:", cleanupError);
          }
        }
        
        // End current session (kicks everyone out but allows rejoining)
        const result = await endCurrentSessionMutation({ meetingId });
        
        // Terminate the LiveKit room (will be recreated when someone rejoins)
        if (result.roomName) {
          try {
            console.log("Terminating LiveKit room for session end:", result.roomName);
            await terminateRoomAction({ roomName: result.roomName });
            console.log("LiveKit room terminated successfully");
          } catch (error) {
            console.warn("Failed to terminate LiveKit room:", error);
            // Don't break the flow if termination fails
          }
        }
        
        toast.success(result.message || "Current session ended - participants can rejoin during scheduled time");
        router.push("/meetings");
      } catch (err) {
        console.error("Failed to end current session:", err);
        toast.error("Failed to end current session");
      }
    }
  };

  const copyMeetingLink = () => {
    const meetingLink = `${window.location.origin}/meetings/${meetingId}/room`;
    navigator.clipboard.writeText(meetingLink);
    toast.success("Meeting link copied to clipboard");
  };

  // Reaction Animation Component
  const ReactionAnimation = ({ reaction }: { reaction: EmojiReaction }) => {
    return (
      <div
        key={reaction.id}
        className="absolute pointer-events-none z-50 animate-pulse"
        style={{
          left: `${reaction.x}px`,
          top: `${reaction.y}px`,
          animation: 'reactionFloat 3s ease-out forwards',
        }}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{reaction.emoji}</span>
            <span className="text-xs font-medium text-gray-700">{reaction.senderName}</span>
          </div>
        </div>
      </div>
    );
  };

  // Reaction Picker Component
  const ReactionPicker = () => {
    if (!showReactionPicker) return null;

    return (
      <div className="reaction-picker absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50">
        <div className="flex items-center gap-1">
          {EMOJI_REACTIONS.map((reaction, index) => (
            <button
              key={index}
              onClick={() => sendReaction(reaction.emoji)}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors duration-200 flex flex-col items-center gap-1"
              title={reaction.label}
            >
              <span className="text-2xl">{reaction.emoji}</span>
              <span className="text-xs text-gray-600 font-medium">{reaction.label}</span>
            </button>
          ))}
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45"></div>
      </div>
    );
  };

  // Screen Share Display Component
  const ScreenShareDisplay = ({ track, participant }: { track: any, participant: any }) => {
    const screenShareRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      console.log('ScreenShareDisplay useEffect triggered', { track: !!track, hasVideoRef: !!screenShareRef.current });
      
      if (track && screenShareRef.current) {
        try {
          track.attach(screenShareRef.current);
          console.log('Screen share track attached to display successfully');
        } catch (error) {
          console.error('Failed to attach screen share track:', error);
        }
      }
      
      return () => {
        if (track && screenShareRef.current) {
          try {
            track.detach(screenShareRef.current);
            console.log('Screen share track detached');
          } catch (error) {
            console.error('Failed to detach screen share track:', error);
          }
        }
      };
    }, [track]);

    const presenterName = participant?.name || participant?.metadata?.name || userName || participant?.identity?.split('_')[0] || 'Unknown';

    // console.log('Rendering ScreenShareDisplay', { hasTrack: !!track, presenterName });

    return (
      <div className="w-full h-full relative bg-black">
        <video
          ref={screenShareRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain bg-black"
        />
        
        {/* Presenter Info */}
        <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          <span className="text-sm font-medium">{presenterName} is sharing</span>
        </div>
      </div>
    );
  };

  // Compact Participant List Component  
  const CompactParticipantList = () => {
    return (
      <>
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center gap-3 p-2">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {participant.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900 truncate">
                  {participant.name}
                </span>
                {participant.role === "host" && (
                  <Shield className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {participant.hasAudio ? (
                  <Mic className="h-3 w-3 text-emerald-600" />
                ) : (
                  <MicOff className="h-3 w-3 text-red-500" />
                )}
                {participant.hasVideo ? (
                  <Video className="h-3 w-3 text-emerald-600" />
                ) : (
                  <VideoOff className="h-3 w-3 text-gray-400" />
                )}
                {participant.isHandRaised && (
                  <Hand className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </>
    );
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
    <div className="h-[calc(100vh-4rem)] bg-gray-900 flex flex-col overflow-hidden -m-6">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-800 truncate">{meeting?.title || "Meeting"}</h1>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />
            Live
          </Badge>
          {/* Recording Status Indicator */}
          {isRecording && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
              <Circle className="w-2 h-2 fill-red-600 mr-1 animate-pulse" />
              Recording
            </Badge>
          )}
          {recordingData?.recordingStatus === "starting" && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
              <Circle className="w-2 h-2 fill-orange-600 mr-1 animate-spin" />
              Starting...
            </Badge>
          )}
          {recordingData?.recordingStatus === "stopping" && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
              <Square className="w-2 h-2 fill-orange-600 mr-1" />
              Stopping...
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            onClick={copyMeetingLink}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-800 h-7 px-2"
          >
            <Copy className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline text-xs">Copy</span>
          </Button>
          
          {/* Leave Meeting Button - Available to all users */}
          <Button
            onClick={handleDisconnected}
            variant="outline"
            size="sm"
            className="border-orange-200 text-orange-600 hover:bg-orange-50 h-7 px-2"
          >
            <Phone className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline text-xs">Leave</span>
          </Button>
          
          {/* End Current Session Button - Only for hosts */}
          {(userRole === "host" || userRole === "co_host") && (
            <Button
              onClick={handleEndCurrentSession}
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white h-7 px-2"
            >
              <PhoneOff className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline text-xs">End Session</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area - Takes remaining space between header and controls */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Video Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Always render the main video container */}
          <div 
            ref={livekitContainer} 
            className={cn(
              "w-full h-full bg-gray-900 overflow-hidden",
              screenShareTrack ? "hidden" : "block"
            )}
          />
          
          {/* Screen Share Layout - only shown when screen sharing */}
          {screenShareTrack && (
            <div className="absolute inset-0 flex gap-2 p-2">
              {/* Large Screen Share Area */}
              <div className="flex-1 relative overflow-hidden bg-black rounded-lg">
                <ScreenShareDisplay track={screenShareTrack} participant={screenShareParticipant} />
              </div>
              
              {/* Participant Video Thumbnails Sidebar */}
              <div className="w-64 flex flex-col gap-2 overflow-y-auto bg-gray-900 rounded-lg">
                <h3 className="text-xs font-medium text-gray-300 mb-1 px-2 pt-2">Participants</h3>
                <div 
                  className="flex-1 space-y-2 px-2"
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
                >
                  {/* Clone participant videos as thumbnails */}
                  <div id="thumbnail-participants" className="space-y-2">
                    {/* This will be populated by cloning the main participant videos */}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Layout Controls - only shown when not screen sharing */}
          {!screenShareTrack && (
            <div className="absolute top-4 left-4">
              <Button
                onClick={() => setLayout(layout === "grid" ? "focus" : "grid")}
                variant="secondary"
                size="sm"
                className="bg-black/20 hover:bg-black/30 text-white border-0 text-xs h-8 px-3"
              >
                {layout === "grid" ? "Focus" : "Grid"}
              </Button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat/Participants */}
        {(showChat || showParticipants) && (
          <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="border-b border-gray-200 flex flex-shrink-0">
              <Button
                onClick={() => { 
                  setShowChat(true); 
                  setShowParticipants(false); 
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 rounded-none border-b-2 h-10",
                  showChat ? "border-emerald-500 text-emerald-600" : "border-transparent"
                )}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                <span className="text-xs">Chat</span>
              </Button>
              <Button
                onClick={() => { 
                  setShowParticipants(true); 
                  setShowChat(false); 
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 rounded-none border-b-2 h-10",
                  showParticipants ? "border-emerald-500 text-emerald-600" : "border-transparent"
                )}
              >
                <Users className="h-4 w-4 mr-1" />
                <span className="text-xs">People</span>
              </Button>
            </div>

            {/* Chat Panel */}
            {showChat && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  <div className="space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No messages yet</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{msg.sender}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString([], { timeStyle: 'short' })}
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
                <div className="p-4 border-t border-gray-200 flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type message..."
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1 h-10"
                    />
                    <Button onClick={sendMessage} size="sm" className="h-10 px-4">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants Panel */}
            {showParticipants && (
              <div className="flex-1 p-4 overflow-auto">
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-emerald-600">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{participant.name}</span>
                          {participant.role === "host" && (
                            <Shield className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
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

      {/* Reaction Animations Overlay */}
      <div className="absolute inset-0 pointer-events-none z-40">
        {reactions.map((reaction) => (
          <ReactionAnimation key={reaction.id} reaction={reaction} />
        ))}
      </div>

      {/* Bottom Controls - Stick to bottom */}
      <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0 relative">
        {/* Reaction Picker */}
        <ReactionPicker />
        
        <div className="flex items-center justify-center max-w-full relative">
          {/* Main Controls - Centered */}
          <div className="flex items-center gap-3">
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


            {/* Recording Button - Only show for hosts and admins */}
            {(recordingData?.canStartRecording || recordingData?.canStopRecording) && (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "secondary"}
                size="lg"
                className={cn(
                  "rounded-full h-12 w-12 p-0",
                  isRecording && "bg-red-600 hover:bg-red-700 animate-pulse"
                )}
                disabled={recordingData?.recordingStatus === "starting" || recordingData?.recordingStatus === "stopping"}
              >
                {isRecording ? (
                  <Square className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Reaction Button */}
            <Button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              variant="secondary"
              size="lg"
              className="reaction-button rounded-full h-12 w-12 p-0"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>

          {/* Right Controls - Absolute positioned */}
          <div className="absolute right-0 flex items-center gap-2">
            <Button
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat) {
                  setShowParticipants(false);
                }
              }}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded h-9 px-3",
                showChat && "bg-emerald-50 text-emerald-700"
              )}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="text-sm hidden sm:inline">Chat</span>
            </Button>

            <Button
              onClick={() => {
                setShowParticipants(!showParticipants);
                if (!showParticipants) {
                  setShowChat(false);
                }
              }}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded h-9 px-3",
                showParticipants && "bg-emerald-50 text-emerald-700"
              )}
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="text-sm">{participants.length}</span>
            </Button>


            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded h-9 px-3"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDisconnected}>
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="text-sm">Leave Meeting</span>
                </DropdownMenuItem>
                {(userRole === "host" || userRole === "co_host") && (
                  <>
                    <DropdownMenuItem onClick={handleEndCurrentSession} className="text-red-600">
                      <PhoneOff className="h-4 w-4 mr-2" />
                      <span className="text-sm">End Current Session</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User name - Bottom left corner */}
          <div className="absolute left-0">
            <p className="text-sm text-gray-500 truncate">{userName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}