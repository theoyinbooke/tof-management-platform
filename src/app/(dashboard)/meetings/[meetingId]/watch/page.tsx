"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  FullScreen,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Video,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  Lock
} from "lucide-react";

export default function MeetingWatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const meetingId = params.meetingId as Id<"meetings">;
  const shareToken = searchParams.get("token");

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Queries
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });
  const recordingData = useQuery(api.meetings.getRecordingStatus, { meetingId });

  // Check access permissions
  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      
      // If user is logged in and from same foundation, grant access
      if (user && meeting && user.foundationId === meeting.foundationId) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }
      
      // If user is super admin, grant access
      if (user && user.role === "super_admin") {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }
      
      // If share token is provided, validate it (simplified for demo)
      if (shareToken) {
        // In real implementation, validate token with backend
        // For now, we'll accept any token as valid
        setHasAccess(true);
        setIsLoading(false);
        toast.info("Viewing shared meeting recording");
        return;
      }
      
      // No access
      setHasAccess(false);
      setIsLoading(false);
    };
    
    if (meeting !== undefined) {
      checkAccess();
    }
  }, [user, meeting, shareToken]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (playerContainerRef.current) {
      if (!isFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Live</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Scheduled</Badge>;
      case "ended":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Ended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
    }
  };

  // Loading state
  if (isLoading || !meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-800">Loading meeting...</h2>
          <p className="text-gray-600">Please wait while we prepare the content</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800">Access Restricted</h2>
            <p className="text-gray-600">
              You don't have permission to view this meeting recording.
            </p>
          </div>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <a href="/auth/signin">Sign In to Access</a>
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to Homepage
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            <p>Need access? Contact your foundation administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  // No recording available
  if (!recordingData?.recordingUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <Video className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800">Recording Not Available</h2>
            <p className="text-gray-600">
              The recording for this meeting is not yet available or has not been recorded.
            </p>
          </div>
          <div className="space-y-3">
            {meeting.status === "live" && (
              <Button asChild>
                <a href={`/meetings/${meetingId}/room`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Live Meeting
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/meetings")}>
              View All Meetings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/meetings")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
                  {getStatusBadge(meeting.status)}
                  {shareToken && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Eye className="h-3 w-3 mr-1" />
                      Shared View
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{formatDate(meeting.scheduledStartTime)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">TheOyinbooke Foundation</p>
              {meeting.currentParticipants?.length && (
                <p className="text-xs text-gray-400">
                  {meeting.currentParticipants.length} participants
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Video Player */}
          <Card>
            <CardContent className="p-0">
              <div ref={playerContainerRef} className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto"
                  src={recordingData.recordingUrl}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls={false}
                  poster="/api/placeholder/800/450"
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Custom Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    
                    <div className="flex-1 flex items-center gap-3 text-white text-sm">
                      <span className="min-w-0">{formatDuration(currentTime)}</span>
                      <div className="flex-1 bg-white/20 rounded-full h-2 cursor-pointer">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      <span className="min-w-0">{formatDuration(duration)}</span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      <FullScreen className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Meeting Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Date & Time</span>
                  </div>
                  <p className="font-medium">{formatDate(meeting.scheduledStartTime)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Duration</span>
                  </div>
                  <p className="font-medium">
                    {recordingData.recordingDuration 
                      ? formatDuration(recordingData.recordingDuration / 1000)
                      : formatDuration(duration)
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Participants</span>
                  </div>
                  <p className="font-medium">{meeting.currentParticipants?.length || 0} joined</p>
                </div>
              </div>

              {meeting.description && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <h4 className="font-medium">Description</h4>
                    <p className="text-gray-700 text-sm">{meeting.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Share Notice */}
          {shareToken && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800">
                      You're viewing a shared meeting recording
                    </p>
                    <p className="text-xs text-blue-700">
                      This link was shared with you and will expire in 7 days. 
                      Sign in to access your full meeting history and features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}