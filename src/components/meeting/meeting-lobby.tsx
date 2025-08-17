"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  Monitor,
  Volume2,
  Loader2,
  Users,
  Lock,
  Clock,
  Calendar,
  TestTube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface MeetingLobbyProps {
  meeting: any;
  userName: string;
  onJoin: (settings: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    backgroundBlur: boolean;
  }) => void;
  onCancel: () => void;
  isJoining?: boolean;
}

interface MediaDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export function MeetingLobby({ 
  meeting, 
  userName, 
  onJoin, 
  onCancel, 
  isJoining = false 
}: MeetingLobbyProps) {
  // Show loading state if meeting data is not available - MUST be before hooks
  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading meeting...</p>
        </Card>
      </div>
    );
  }

  // Media state
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [audioOption, setAudioOption] = useState<"computer" | "none">("computer");
  
  // Device management
  const [cameras, setCameras] = useState<MediaDevice[]>([]);
  const [microphones, setMicrophones] = useState<MediaDevice[]>([]);
  const [speakers, setSpeakers] = useState<MediaDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [audioVolume, setAudioVolume] = useState(50);
  const [noiseReduction, setNoiseReduction] = useState(true);
  
  // Media stream management
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize media devices
  useEffect(() => {
    let isMounted = true;
    
    const initializeMedia = async () => {
      try {
        // Request permissions first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        setPermissionGranted(true);
        
        // Get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        const audioDevices = devices.filter(d => d.kind === "audioinput");
        const outputDevices = devices.filter(d => d.kind === "audiooutput");
        
        if (isMounted) {
          setCameras(videoDevices.map(d => ({ 
            deviceId: d.deviceId, 
            label: d.label || `Camera ${videoDevices.indexOf(d) + 1}`,
            kind: d.kind
          })));
          
          setMicrophones(audioDevices.map(d => ({ 
            deviceId: d.deviceId, 
            label: d.label || `Microphone ${audioDevices.indexOf(d) + 1}`,
            kind: d.kind
          })));
          
          setSpeakers(outputDevices.map(d => ({ 
            deviceId: d.deviceId, 
            label: d.label || `Speaker ${outputDevices.indexOf(d) + 1}`,
            kind: d.kind
          })));
          
          // Set default devices
          if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId);
          if (audioDevices.length > 0) setSelectedMicrophone(audioDevices[0].deviceId);
          if (outputDevices.length > 0) setSelectedSpeaker(outputDevices[0].deviceId);
          
          // Start with initial stream
          setVideoStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
        
        setIsInitializing(false);
      } catch (err) {
        console.error("Failed to initialize media:", err);
        setIsInitializing(false);
        toast.error("Camera/microphone access denied. You can still join without media.");
      }
    };

    initializeMedia();

    // Cleanup
    return () => {
      isMounted = false;
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video stream when camera changes
  useEffect(() => {
    if (!selectedCamera || !permissionGranted || audioOption === "none") return;
    
    const updateVideoStream = async () => {
      try {
        // Stop current stream
        if (videoStream) {
          videoStream.getTracks().forEach(track => track.stop());
        }
        
        // Start new stream with selected camera
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
          audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true,
        });
        
        setVideoStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Failed to update video stream:", err);
        toast.error("Failed to switch camera");
      }
    };

    updateVideoStream();
  }, [selectedCamera, selectedMicrophone, permissionGranted, audioOption]);

  // Toggle video
  const toggleVideo = () => {
    if (videoStream) {
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    } else {
      setVideoEnabled(!videoEnabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (videoStream) {
      const audioTrack = videoStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
      }
    } else {
      setAudioEnabled(!audioEnabled);
    }
  };

  // Test speaker
  const testSpeaker = async () => {
    try {
      const audio = new Audio('/test-sound.mp3'); // You'd need to add a test sound file
      if (selectedSpeaker && 'setSinkId' in audio) {
        await (audio as any).setSinkId(selectedSpeaker);
      }
      audio.volume = audioVolume / 100;
      await audio.play();
      toast.success("Speaker test played");
    } catch (err) {
      // Fallback to system beep or notification
      toast.success("Speaker selected (test sound not available)");
    }
  };

  // Handle join
  const handleJoin = () => {
    // Stop preview stream before joining
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    
    onJoin({
      videoEnabled: audioOption === "computer" ? videoEnabled : false,
      audioEnabled: audioOption === "computer" ? audioEnabled : false,
      backgroundBlur,
    });
  };

  // Copy meeting link function
  const copyMeetingLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success("Meeting link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="bg-gray-50 p-4">
      <div className="max-w-7xl w-full mx-auto space-y-3">
        {/* Meeting Info Container */}
        <div className="text-center space-y-2 flex-shrink-0">
          {/* Row 1: Meeting Title */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {meeting.title || "Meeting Room"}
            </h1>
            {meeting.description && (
              <p className="text-gray-600 mt-1">{meeting.description}</p>
            )}
          </div>
          
          {/* Row 2: Meeting Details */}
          <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 text-sm text-gray-600">
            {meeting.host && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Host: {meeting.host.firstName || "Host"} {meeting.host.lastName || ""}</span>
              </div>
            )}
            
            {meeting.scheduledStartTime && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(meeting.scheduledStartTime), "PPP")}</span>
              </div>
            )}
            
            {meeting.scheduledStartTime && meeting.scheduledEndTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(meeting.scheduledStartTime), "p")} - {format(new Date(meeting.scheduledEndTime), "p")}</span>
              </div>
            )}
            
            {meeting.password && (
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Password protected</span>
              </div>
            )}
            
            {/* Copy Link Button */}
            <Button
              onClick={copyMeetingLink}
              variant="outline"
              size="sm"
            >
              Copy Link
            </Button>
          </div>
        </div>

        {/* Video Preview and Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Preview */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
                {videoEnabled && permissionGranted && !isInitializing ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-xl"
                    style={{ transform: "scaleX(-1)" }} // Mirror effect
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      {isInitializing ? (
                        <>
                          <Loader2 className="h-16 w-16 text-gray-400 mx-auto mb-2 animate-spin" />
                          <p className="text-gray-400">Initializing camera...</p>
                        </>
                      ) : !permissionGranted ? (
                        <>
                          <VideoOff className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400">Camera access denied</p>
                          <p className="text-gray-500 text-sm mt-2">
                            Grant permission to enable preview
                          </p>
                        </>
                      ) : (
                        <>
                          <VideoOff className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400">Your camera is turned off</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Control Bar */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-4 py-3">
                    <Button
                      variant={videoEnabled ? "secondary" : "destructive"}
                      size="icon"
                      onClick={toggleVideo}
                      className="rounded-full h-10 w-10"
                      disabled={!permissionGranted}
                    >
                      {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      variant={audioEnabled ? "secondary" : "destructive"}
                      size="icon"
                      onClick={toggleAudio}
                      className="rounded-full h-10 w-10"
                      disabled={!permissionGranted}
                    >
                      {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>

                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setBackgroundBlur(!backgroundBlur)}
                      className={cn("rounded-full h-10 w-10", backgroundBlur && "bg-emerald-600 text-white hover:bg-emerald-700")}
                    >
                      <Monitor className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Settings and Controls */}
          <div className="space-y-3">
            {/* Device Settings */}
            <Card>
              <CardContent className="py-2 px-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-sm">Device Settings</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Camera</Label>
                    <Select value={selectedCamera} onValueChange={setSelectedCamera} disabled={!permissionGranted}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {cameras.map((camera) => (
                          <SelectItem key={camera.deviceId} value={camera.deviceId}>
                            {camera.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Microphone</Label>
                    <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone} disabled={!permissionGranted}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select microphone" />
                      </SelectTrigger>
                      <SelectContent>
                        {microphones.map((mic) => (
                          <SelectItem key={mic.deviceId} value={mic.deviceId}>
                            {mic.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Speaker</Label>
                      <Button onClick={testSpeaker} size="sm" variant="outline" className="h-5 text-xs px-2">
                        <TestTube className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    </div>
                    <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select speaker" />
                      </SelectTrigger>
                      <SelectContent>
                        {speakers.map((speaker) => (
                          <SelectItem key={speaker.deviceId} value={speaker.deviceId}>
                            {speaker.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Volume</Label>
                      <Volume2 className="h-3 w-3 text-gray-500" />
                    </div>
                    <Slider
                      value={[audioVolume]}
                      onValueChange={([value]) => setAudioVolume(value)}
                      max={100}
                      step={1}
                      className="h-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="noise" className="text-xs font-medium">Noise reduction</Label>
                    <Switch 
                      id="noise" 
                      checked={noiseReduction}
                      onCheckedChange={setNoiseReduction}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Join/Cancel Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Meeting"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isJoining}
                className="w-full"
              >
                Cancel
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                Joining as {userName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}