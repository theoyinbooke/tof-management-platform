"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Settings,
} from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export default function MeetingLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useCurrentUser();
  const meetingId = params.meetingId as Id<"meetings">;

  // UI State
  const [displayName, setDisplayName] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  // Queries
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });
  
  // Set default display name when user loads
  useEffect(() => {
    if (user && !displayName) {
      setDisplayName(`${user.firstName} ${user.lastName}`.trim());
    }
  }, [user, displayName]);

  // Handle join meeting
  const handleJoinMeeting = async () => {
    if (!displayName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsJoining(true);
    try {
      // Check camera/mic permissions first
      try {
        await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: audioEnabled,
        });
      } catch (error) {
        console.warn("Media permissions:", error);
        setShowPermissionsDialog(true);
        setIsJoining(false);
        return;
      }

      // Navigate to meeting room with settings
      const settings = {
        displayName: displayName.trim(),
        videoEnabled,
        audioEnabled,
      };
      
      router.push(`/meetings/${meetingId}/room?${new URLSearchParams({
        name: settings.displayName,
        video: settings.videoEnabled.toString(),
        audio: settings.audioEnabled.toString(),
      })}`);
    } catch (error: any) {
      console.error("Failed to join meeting:", error);
      toast.error(error.message || "Failed to join meeting");
      setIsJoining(false);
    }
  };

  // Loading state
  if (meeting === undefined) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin", "beneficiary", "guardian", "reviewer"]}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading meeting...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Meeting not found
  if (meeting === null) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin", "beneficiary", "guardian", "reviewer"]}>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Meeting Not Found</h2>
              <p className="text-gray-600 mb-4">
                The meeting you're trying to join doesn't exist or may have been deleted.
              </p>
              <Button onClick={() => router.push("/meetings")}>
                Back to Meetings
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const now = Date.now();
  const isLive = meeting.status === "live";
  const isScheduled = meeting.status === "scheduled";
  const isPastEndTime = now > meeting.scheduledEndTime;
  const isHost = meeting.hostId === user?._id;
  const isCoHost = meeting.coHosts.includes(user?._id || "");

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "beneficiary", "guardian", "reviewer"]}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          {/* Meeting Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{meeting.title}</CardTitle>
                  {meeting.description && (
                    <p className="text-gray-600">{meeting.description}</p>
                  )}
                </div>
                <Badge variant={isLive ? "destructive" : isScheduled ? "default" : "secondary"}>
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    isLive ? "bg-red-500 animate-pulse" : 
                    isScheduled ? "bg-blue-500" : "bg-gray-400"
                  )} />
                  {isLive ? "Live" : isScheduled ? "Scheduled" : "Past Meeting"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(meeting.scheduledStartTime), "PPP")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(meeting.scheduledStartTime), "p")} - {format(new Date(meeting.scheduledEndTime), "p")}
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Join Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={50}
                />
              </div>

              {/* Camera and Microphone Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {videoEnabled ? (
                      <Video className="h-5 w-5 text-green-600" />
                    ) : (
                      <VideoOff className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">Camera</div>
                      <div className="text-sm text-gray-500">
                        {videoEnabled ? "On" : "Off"}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={videoEnabled}
                    onCheckedChange={setVideoEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {audioEnabled ? (
                      <Mic className="h-5 w-5 text-green-600" />
                    ) : (
                      <MicOff className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">Microphone</div>
                      <div className="text-sm text-gray-500">
                        {audioEnabled ? "On" : "Off"}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={audioEnabled}
                    onCheckedChange={setAudioEnabled}
                  />
                </div>
              </div>

              {/* Join Button */}
              <div className="pt-4">
                {meeting.status === "ended" || meeting.status === "cancelled" ? (
                  <Button disabled className="w-full">
                    {meeting.status === "cancelled" ? "Meeting Cancelled" : "Meeting Ended"}
                  </Button>
                ) : !isLive && isScheduled && !isHost && !isCoHost ? (
                  <div className="text-center space-y-2">
                    <Button disabled className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Waiting for host to start
                    </Button>
                    <p className="text-sm text-gray-500">
                      The meeting host hasn't started the meeting yet.
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleJoinMeeting}
                    disabled={isJoining || !displayName.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        {isHost && !isLive ? "Start Meeting" : "Join Meeting"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Back to Meetings */}
          <div className="text-center">
            <Button variant="link" onClick={() => router.push("/meetings")}>
              ← Back to Meetings
            </Button>
          </div>
        </div>
      </div>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Camera and Microphone Access</DialogTitle>
            <DialogDescription>
              Please allow access to your camera and microphone to join the meeting.
              You can change these settings later during the meeting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowPermissionsDialog(false);
              handleJoinMeeting();
            }}>
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}