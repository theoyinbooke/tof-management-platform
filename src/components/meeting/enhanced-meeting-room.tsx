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
import { Room, RoomEvent, Track } from "livekit-client";
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
  
  // Screen sharing state
  const [screenShareTrack, setScreenShareTrack] = useState<any>(null);
  const [screenShareParticipant, setScreenShareParticipant] = useState<any>(null);
  
  // Debug: Log screen share state changes
  useEffect(() => {
    console.log('Screen share state changed:', { 
      hasScreenShareTrack: !!screenShareTrack, 
      isScreenSharing, 
      participantIdentity: screenShareParticipant?.identity 
    });
  }, [screenShareTrack, screenShareParticipant, isScreenSharing]);

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

  // LiveKit container refs - separate refs for different layouts
  const livekitContainer = useRef<HTMLDivElement>(null);
  const participantThumbnailsContainer = useRef<HTMLDivElement>(null);
  const roomRef = useRef<any>(null);

  // Convex queries and mutations
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });
  const joinMeeting = useMutation(api.meetings.joinMeeting);
  const leaveMeeting = useMutation(api.meetings.leaveMeeting);
  const endCurrentSessionMutation = useMutation(api.meetings.endCurrentSession);
  const generateTokenAction = useAction(api.livekit.generateToken);
  const terminateRoomAction = useAction(api.livekit.terminateRoom);

  // Ensure proper mounting and cleanup
  useEffect(() => {
    setMounted(true);
    
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
            participantIdentity: `${userName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
            participantName: userName,
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
      await room.connect(serverUrl, token);
      
      // Add local participant first
      addLocalParticipant(room.localParticipant, videoGrid);
      
      // Enable initial media settings and attach tracks
      if (isCameraEnabled) {
        try {
          await room.localParticipant.enableCameraAndMicrophone();
          
          // Wait for local video track to be published and attach it
          setTimeout(() => {
            const videoPublication = Array.from(room.localParticipant.videoTrackPublications.values())[0];
            if (videoPublication?.track) {
              const localVideoElement = videoGrid.querySelector(`[data-participant="${room.localParticipant.identity}"] video`);
              if (localVideoElement) {
                videoPublication.track.attach(localVideoElement as HTMLVideoElement);
                console.log('Local video track attached');
              }
            }
          }, 500);
        } catch (error) {
          console.error('Failed to enable camera/microphone:', error);
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
    if (!roomRef.current) return;
    
    try {
      if (isMicEnabled) {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
        setIsMicEnabled(false);
        toast.success("Microphone muted");
      } else {
        await roomRef.current.localParticipant.setMicrophoneEnabled(true);
        setIsMicEnabled(true);
        toast.success("Microphone unmuted");
      }
    } catch (error) {
      console.error("Failed to toggle microphone:", error);
      toast.error("Failed to toggle microphone");
    }
  };

  const toggleCamera = async () => {
    if (!roomRef.current) return;
    
    try {
      if (isCameraEnabled) {
        await roomRef.current.localParticipant.setCameraEnabled(false);
        setIsCameraEnabled(false);
        toast.success("Camera turned off");
      } else {
        await roomRef.current.localParticipant.setCameraEnabled(true);
        setIsCameraEnabled(true);
        toast.success("Camera turned on");
      }
    } catch (error) {
      console.error("Failed to toggle camera:", error);
      toast.error("Failed to toggle camera");
    }
  };

  const toggleScreenShare = async () => {
    if (!roomRef.current) return;
    
    try {
      if (isScreenSharing) {
        await roomRef.current.localParticipant.setScreenShareEnabled(false);
        setIsScreenSharing(false);
        toast.success("Screen sharing stopped");
      } else {
        await roomRef.current.localParticipant.setScreenShareEnabled(true);
        setIsScreenSharing(true);
        toast.success("Screen sharing started");
      }
    } catch (error) {
      console.error("Failed to toggle screen share:", error);
      toast.error("Failed to toggle screen share");
    }
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
                onClick={() => { setShowChat(true); setShowParticipants(false); }}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 rounded-none border-b-2 h-10",
                  showChat ? "border-emerald-500 text-emerald-600" : "border-transparent"
                )}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="text-sm">Chat</span>
              </Button>
              <Button
                onClick={() => { setShowParticipants(true); setShowChat(false); }}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 rounded-none border-b-2 h-10",
                  showParticipants ? "border-emerald-500 text-emerald-600" : "border-transparent"
                )}
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm">People ({participants.length})</span>
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

      {/* Bottom Controls - Stick to bottom */}
      <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0">
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
          </div>

          {/* Right Controls - Absolute positioned */}
          <div className="absolute right-0 flex items-center gap-2">
            <Button
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat) setShowParticipants(false);
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
                if (!showParticipants) setShowChat(false);
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
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="text-sm">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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