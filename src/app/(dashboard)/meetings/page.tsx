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
import { Switch } from "@/components/ui/switch";
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
  ChevronDown,
  ChevronRight,
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
  const [showPastMeetings, setShowPastMeetings] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
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

  // Handle join meeting via lobby
  const handleJoinMeetingViaLobby = (meetingId: Id<"meetings">) => {
    router.push(`/meetings/${meetingId}/lobby`);
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

  // Group meetings by status and time
  const now = Date.now();
  const liveMeetings = meetings?.filter(m => m.status === "live") || [];
  const upcomingMeetings = meetings?.filter(m => 
    m.status === "scheduled" && m.scheduledEndTime > now
  ) || [];
  
  // Past meetings: either explicitly ended/cancelled OR past their scheduled end time but still joinable
  // Show only the 6 most recent past meetings
  const pastMeetings = meetings?.filter(m => 
    m.status === "ended" || 
    m.status === "cancelled" || 
    (m.scheduledEndTime <= now && m.status !== "live")
  ).sort((a, b) => b.scheduledStartTime - a.scheduledStartTime) // Sort by most recent first
   .slice(0, 6) || []; // Limit to 6 most recent

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "beneficiary", "guardian", "reviewer"]}>
      <div className="container mx-auto p-4 space-y-3">
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

        {/* View Toggle */}
        <div className="flex items-center justify-between py-2">
          <h2 className="text-2xl font-bold">All meetings</h2>
          <div className="flex items-center gap-3">
            <Label htmlFor="calendar-toggle" className="text-sm font-medium cursor-pointer">
              Calendar View
            </Label>
            <Switch
              id="calendar-toggle"
              checked={showCalendarView}
              onCheckedChange={setShowCalendarView}
            />
          </div>
        </div>

        {showCalendarView ? (
          <CalendarView
            meetings={[...liveMeetings, ...upcomingMeetings, ...pastMeetings]}
            onMeetingClick={(meeting) => {
              // Show meeting details popup instead of directly joining
              setSelectedMeeting(meeting);
              setShowMeetingDetails(true);
            }}
            onBackToGrid={() => setShowCalendarView(false)}
          />
        ) : (
          <>
            {/* Live Meetings Section */}
            {liveMeetings.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Live Meetings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {liveMeetings.map((meeting) => (
                <Card key={meeting._id} className="hover:shadow-lg transition-all border-red-200 bg-red-50 py-3">
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mt-1 flex-shrink-0" />
                        <h3 className="text-sm font-medium line-clamp-2 leading-tight">{meeting.title}</h3>
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
                    
                    <div className="space-y-0.5 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{meeting.participantCount || 0} participants</span>
                      </div>
                      {meeting.host && (
                        <div className="truncate">
                          <span>Host: {meeting.host.firstName} {meeting.host.lastName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button 
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                        onClick={() => handleJoinMeeting(meeting._id)}
                      >
                        Join
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        variant="outline"
                        onClick={() => copyMeetingLink(meeting)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

            {/* Scheduled Meetings */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Scheduled meetings</h2>

              {upcomingMeetings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {upcomingMeetings.map((meeting) => (
                <Card key={meeting._id} className="hover:shadow-lg transition-all py-3">
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-medium line-clamp-2 leading-tight flex-1 min-w-0">{meeting.title}</h3>
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
                      <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                        {meeting.description}
                      </p>
                    )}

                    <div className="space-y-0.5 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">{format(new Date(meeting.scheduledStartTime), "MMM d")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="truncate">{format(new Date(meeting.scheduledStartTime), "p")}</span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {meeting.hostId === user?._id ? (
                        <Button 
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                          onClick={() => {
                            startMeeting({ meetingId: meeting._id });
                            handleJoinMeeting(meeting._id);
                          }}
                        >
                          Start
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          className="flex-1 text-xs"
                          variant="outline"
                          disabled
                        >
                          Pending
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        variant="outline"
                        onClick={() => copyMeetingLink(meeting)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">You don't have anything scheduled.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Past Meetings - Collapsible Section */}
            {pastMeetings.length > 0 && (
          <div className="space-y-2">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => setShowPastMeetings(!showPastMeetings)}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Past meetings ({pastMeetings.length}{pastMeetings.length === 6 ? ' recent' : ''})</h2>
                {showPastMeetings ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <span className="text-sm text-gray-500">
                {showPastMeetings ? "Hide" : "Show"} past meetings
              </span>
            </div>

            {showPastMeetings && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {pastMeetings.map((meeting) => {
                  const isPastTime = meeting.scheduledEndTime <= now;
                  const isExplicitlyEnded = meeting.status === "ended" || meeting.status === "cancelled";
                  
                  return (
                    <Card key={meeting._id} className="hover:shadow-lg transition-all border-gray-300 bg-gray-50 py-3">
                      <CardContent className="p-2">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-1 flex-shrink-0" />
                            <h3 className="text-sm font-medium line-clamp-2 leading-tight">{meeting.title}</h3>
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
                                onClick={() => copyMeetingLink(meeting)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
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
                          <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                            {meeting.description}
                          </p>
                        )}

                        <div className="space-y-0.5 text-xs text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="truncate">{format(new Date(meeting.scheduledStartTime), "MMM d")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="truncate">{format(new Date(meeting.scheduledStartTime), "p")}</span>
                          </div>
                          {meeting.host && (
                            <div className="truncate">
                              <span>Host: {meeting.host.firstName} {meeting.host.lastName}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <Button 
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                            onClick={() => handleJoinMeeting(meeting._id)}
                          >
                            Join
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            variant="outline"
                            onClick={() => copyMeetingLink(meeting)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
          </>
        )}

        {/* Meeting Details Dialog */}
        <Dialog open={showMeetingDetails} onOpenChange={setShowMeetingDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedMeeting?.title}</DialogTitle>
              {selectedMeeting?.description && (
                <DialogDescription>
                  {selectedMeeting.description}
                </DialogDescription>
              )}
            </DialogHeader>
            
            {selectedMeeting && (
              <div className="space-y-4">
                {/* Meeting Status Badge */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    selectedMeeting.status === "live" ? "bg-red-500 animate-pulse" :
                    selectedMeeting.status === "scheduled" ? "bg-blue-500" :
                    "bg-gray-400"
                  )} />
                  <Badge variant={
                    selectedMeeting.status === "live" ? "destructive" :
                    selectedMeeting.status === "scheduled" ? "default" :
                    "secondary"
                  }>
                    {selectedMeeting.status === "live" ? "Live Now" :
                     selectedMeeting.status === "scheduled" ? "Scheduled" :
                     selectedMeeting.status === "ended" ? "Ended" :
                     selectedMeeting.status === "cancelled" ? "Cancelled" :
                     "Past Meeting"}
                  </Badge>
                </div>

                {/* Meeting Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(selectedMeeting.scheduledStartTime), "PPP")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {format(new Date(selectedMeeting.scheduledStartTime), "p")} - {format(new Date(selectedMeeting.scheduledEndTime), "p")}
                    </span>
                  </div>

                  {selectedMeeting.host && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>Host: {selectedMeeting.host.firstName} {selectedMeeting.host.lastName}</span>
                    </div>
                  )}

                  {selectedMeeting.meetingCode && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Meeting ID:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {selectedMeeting.meetingCode}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowMeetingDetails(false)}>
                Close
              </Button>
              
              {selectedMeeting && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      copyMeetingLink(selectedMeeting);
                      setShowMeetingDetails(false);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  
                  {/* Join Button Logic */}
                  {selectedMeeting.status === "scheduled" && selectedMeeting.hostId !== user?._id ? (
                    <Button disabled>
                      Not Started
                    </Button>
                  ) : selectedMeeting.status === "scheduled" && selectedMeeting.hostId === user?._id ? (
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        startMeeting({ meetingId: selectedMeeting._id });
                        handleJoinMeetingViaLobby(selectedMeeting._id);
                        setShowMeetingDetails(false);
                      }}
                    >
                      Start & Join Meeting
                    </Button>
                  ) : (
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        handleJoinMeetingViaLobby(selectedMeeting._id);
                        setShowMeetingDetails(false);
                      }}
                    >
                      Join Meeting
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

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