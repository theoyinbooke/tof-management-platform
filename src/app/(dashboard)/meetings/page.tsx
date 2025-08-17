"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateMeetingDialog } from "@/components/meeting/create-meeting-dialog";
import { CalendarView } from "@/components/meeting/calendar-view";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Link2,
  Copy,
  MoreHorizontal,
  Loader2,
  UserPlus,
  Edit,
  Trash2,
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export default function MeetingsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("meetings");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInstantMeetingDialog, setShowInstantMeetingDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [instantMeetingTitle, setInstantMeetingTitle] = useState("");
  const [meetingCodeToJoin, setMeetingCodeToJoin] = useState("");
  const [isCreating, setIsCreating] = useState(false);


  // Queries
  const meetings = useQuery(
    api.meetings.getMeetingsByFoundation,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );

  const createInstantMeeting = useMutation(api.meetings.createInstantMeeting);
  const startMeeting = useMutation(api.meetings.startMeeting);
  const deleteMeeting = useMutation(api.meetings.deleteMeeting);

  // Handle create instant meeting
  const handleCreateInstantMeeting = async () => {
    if (!user?.foundationId) {
      toast.error("Foundation ID not found");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createInstantMeeting({
        foundationId: user.foundationId,
        title: instantMeetingTitle || "Quick Meeting",
      });

      toast.success("Meeting created! Redirecting...");
      setShowInstantMeetingDialog(false);
      
      // Copy meeting link to clipboard
      if (result.meetingLink) {
        navigator.clipboard.writeText(result.meetingLink);
        toast.success("Meeting link copied to clipboard!");
      }
      
      router.push(`/meetings/${result.meetingId}/room`);
    } catch (error: any) {
      console.error("Failed to create instant meeting:", error);
      toast.error(error.message || "Failed to create meeting");
    } finally {
      setIsCreating(false);
    }
  };


  // Handle join meeting
  const handleJoinMeeting = (meetingId: Id<"meetings">) => {
    router.push(`/meetings/${meetingId}/room`);
  };

  // Handle join with code
  const handleJoinWithCode = () => {
    if (!meetingCodeToJoin) {
      toast.error("Please enter a meeting ID");
      return;
    }
    // Navigate to join page with code
    router.push(`/meetings/join/${meetingCodeToJoin.replace(/\s/g, "")}`);
  };

  // Copy meeting link
  const copyMeetingLink = (meeting: any) => {
    const link = meeting.meetingLink || `${window.location.origin}/meetings/${meeting._id}/room`;
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied!");
  };

  // Handle delete meeting
  const handleDeleteMeeting = async (meetingId: Id<"meetings">) => {
    try {
      await deleteMeeting({ meetingId });
      toast.success("Meeting deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete meeting:", error);
      toast.error(error.message || "Failed to delete meeting");
    }
  };


  const canManageMeetings = user?.role === "admin" || user?.role === "super_admin" || user?.role === "reviewer";

  // Group meetings by status
  const liveMeetings = meetings?.filter(m => m.status === "live") || [];
  const upcomingMeetings = meetings?.filter(m => m.status === "scheduled") || [];
  const pastMeetings = meetings?.filter(m => m.status === "ended" || m.status === "cancelled") || [];

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "beneficiary", "guardian", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Meet</h1>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Create Meeting Link */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-emerald-500"
            onClick={() => setShowInstantMeetingDialog(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Link2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Create a meeting link</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Quickly create, save, and share links with anyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Meeting */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-sky-500"
            onClick={() => setShowCreateDialog(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Schedule a meeting</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Plan and organize meetings in advance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join with Meeting ID */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-500"
            onClick={() => setShowJoinDialog(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserPlus className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Join with a meeting ID</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter a meeting ID to join instantly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meeting Links Section */}
        {liveMeetings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Live Meetings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMeetings.map((meeting) => (
                <Card key={meeting._id} className="hover:shadow-lg transition-all border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <h3 className="font-semibold line-clamp-1">{meeting.title}</h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              // TODO: Add edit functionality
                              toast.info("Edit meeting coming soon");
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Meeting
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMeeting(meeting._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            End Meeting
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{meeting.participantCount || 0} participants</span>
                      </div>
                      {meeting.host && (
                        <div className="flex items-center gap-2">
                          <span>Host: {meeting.host.firstName} {meeting.host.lastName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleJoinMeeting(meeting._id)}
                      >
                        Join Meeting
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => copyMeetingLink(meeting)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Meetings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Scheduled meetings</h2>
            <Button 
              variant="link" 
              className="text-emerald-600"
              onClick={() => setShowCalendarView(!showCalendarView)}
            >
              {showCalendarView ? "View as grid" : "View in calendar"}
            </Button>
          </div>

          {showCalendarView ? (
            <CalendarView
              meetings={upcomingMeetings}
              onMeetingClick={(meeting) => {
                // Handle meeting click - could open details or join
                if (meeting.hostId === user?._id) {
                  startMeeting({ meetingId: meeting._id as Id<"meetings"> });
                  handleJoinMeeting(meeting._id as Id<"meetings">);
                } else {
                  toast.info("Meeting has not started yet");
                }
              }}
              onBackToGrid={() => setShowCalendarView(false)}
            />
          ) : upcomingMeetings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMeetings.map((meeting) => (
                <Card key={meeting._id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold line-clamp-1">{meeting.title}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              // TODO: Add edit functionality
                              toast.info("Edit meeting coming soon");
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Meeting
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMeeting(meeting._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Meeting
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {meeting.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(meeting.scheduledStartTime), "PPP")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(meeting.scheduledStartTime), "p")} - {format(new Date(meeting.scheduledEndTime), "p")}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {meeting.hostId === user?._id ? (
                        <Button 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            startMeeting({ meetingId: meeting._id });
                            handleJoinMeeting(meeting._id);
                          }}
                        >
                          Start Meeting
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1"
                          variant="outline"
                          disabled
                        >
                          Not started
                        </Button>
                      )}
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => copyMeetingLink(meeting)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !showCalendarView ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">You don't have anything scheduled.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Instant Meeting Dialog */}
        <Dialog open={showInstantMeetingDialog} onOpenChange={setShowInstantMeetingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Give your meeting a title</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Meeting title"
                value={instantMeetingTitle}
                onChange={(e) => setInstantMeetingTitle(e.target.value)}
                className="text-lg"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInstantMeetingDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateInstantMeeting}
                disabled={isCreating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create and copy link"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join Meeting Dialog */}
        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Join a meeting with an ID</DialogTitle>
              <DialogDescription>Meeting ID</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Type a meeting ID"
                value={meetingCodeToJoin}
                onChange={(e) => setMeetingCodeToJoin(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-gray-600">
                Type a meeting passcode if required
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleJoinWithCode}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Join meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Meeting Dialog */}
        <CreateMeetingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          foundationId={user?.foundationId!}
          userId={user?._id!}
          onSuccess={() => {
            // Meetings will refresh automatically due to Convex subscription
          }}
        />
      </div>
    </ProtectedRoute>
  );
}