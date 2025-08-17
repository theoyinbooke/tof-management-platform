"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  Monitor,
  Volume2,
  Loader2,
  AlertCircle,
  Users,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function JoinMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useCurrentUser();
  const meetingCode = params.code as string;

  // Media state
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMicrophone, setSelectedMicrophone] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [audioVolume, setAudioVolume] = useState(50);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [password, setPassword] = useState("");
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Query meeting by code
  const meeting = useQuery(api.meetings.getMeetingByCode, { 
    meetingCode: meetingCode || "" 
  });

  // Initialize media devices
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        // Request camera and microphone permissions
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: audioEnabled,
        });
        
        setVideoStream(stream);
        
        // Set video preview
        const videoElement = document.getElementById("videoPreview") as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }

        // Get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === "videoinput");
        const microphones = devices.filter(d => d.kind === "audioinput");
        const speakers = devices.filter(d => d.kind === "audiooutput");

        if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
        if (microphones.length > 0) setSelectedMicrophone(microphones[0].deviceId);
        if (speakers.length > 0) setSelectedSpeaker(speakers[0].deviceId);
      } catch (err) {
        console.error("Failed to initialize media:", err);
        toast.error("Failed to access camera or microphone");
      }
    };

    initializeMedia();

    // Cleanup on unmount
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle video
  const toggleVideo = () => {
    if (videoStream) {
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
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
    }
  };

  // Handle join meeting
  const handleJoinMeeting = async () => {
    if (!meeting) {
      toast.error("Meeting not found");
      return;
    }

    if (!user) {
      toast.error("Please sign in to join the meeting");
      return;
    }

    // Check if password is required
    if (meeting.password && !password) {
      toast.error("Please enter the meeting password");
      return;
    }

    setIsJoining(true);

    try {
      // Stop local media stream before joining
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }

      // Navigate to meeting room with parameters
      router.push(`/meetings/${meeting._id}/room?video=${videoEnabled}&audio=${audioEnabled}`);
    } catch (error: any) {
      console.error("Failed to join meeting:", error);
      toast.error(error.message || "Failed to join meeting");
      setIsJoining(false);
    }
  };

  if (!meeting && meetingCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Meeting not found</h2>
            <p className="text-gray-600 mb-6">
              The meeting ID {meetingCode} is invalid or has expired.
            </p>
            <Button 
              onClick={() => router.push("/meetings")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Back to Meetings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Preview */}
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-gray-900">
            {videoEnabled ? (
              <video
                id="videoPreview"
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Your camera is turned off</p>
                </div>
              </div>
            )}
            
            {/* Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={videoEnabled ? "secondary" : "destructive"}
                  size="icon"
                  onClick={toggleVideo}
                  className="rounded-full"
                >
                  {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant={audioEnabled ? "secondary" : "destructive"}
                  size="icon"
                  onClick={toggleAudio}
                  className="rounded-full"
                >
                  {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="rounded-full"
                >
                  <Settings className="h-5 w-5" />
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setBackgroundBlur(!backgroundBlur)}
                  className={cn("rounded-full", backgroundBlur && "bg-emerald-600 text-white")}
                >
                  <Monitor className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <CardContent className="p-4 space-y-4 border-t">
              <div className="space-y-2">
                <Label>Camera</Label>
                <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Camera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Microphone</Label>
                <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Microphone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Speaker</Label>
                <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select speaker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Speaker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Volume</Label>
                  <Volume2 className="h-4 w-4 text-gray-500" />
                </div>
                <Slider
                  value={[audioVolume]}
                  onValueChange={([value]) => setAudioVolume(value)}
                  max={100}
                  step={1}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="noise">Background noise suppression</Label>
                <Switch id="noise" />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Meeting Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">TheOyinbooke Foundation Meeting</h1>
            {meeting && (
              <div className="space-y-4">
                <h2 className="text-xl text-gray-700">{meeting.title}</h2>
                
                {meeting.description && (
                  <p className="text-gray-600">{meeting.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {meeting.host && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Host: {meeting.host.firstName} {meeting.host.lastName}</span>
                    </div>
                  )}
                  
                  {meeting.password && (
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Password required</span>
                    </div>
                  )}
                </div>

                {meeting.password && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Meeting Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter meeting password"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Computer audio</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-emerald-50 border-emerald-200">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <Volume2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Computer audio</p>
                    <p className="text-sm text-gray-600">Use your computer's microphone and speakers</p>
                  </div>
                  <div className="w-3 h-3 bg-emerald-600 rounded-full" />
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <MicOff className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Don't use audio</p>
                    <p className="text-sm text-gray-600">You won't be able to speak or hear others</p>
                  </div>
                  <div className="w-3 h-3 border-2 border-gray-300 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/meetings")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinMeeting}
              disabled={isJoining || !meeting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isJoining ? (
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
            Need help? Check our support documentation
          </p>
        </div>
      </div>
    </div>
  );
}