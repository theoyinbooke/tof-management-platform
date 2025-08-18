"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { format, addHours, startOfDay, endOfDay } from "date-fns";
import { Loader2, Video, MapPin, Users, Calendar, Clock } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { ParticipantSelector } from "./participant-selector";

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foundationId: Id<"foundations">;
  userId: Id<"users">;
  onSuccess?: () => void;
}

export function CreateMeetingDialog({
  open,
  onOpenChange,
  foundationId,
  userId,
  onSuccess,
}: CreateMeetingDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize with current date/time rounded to next hour
  const now = new Date();
  const defaultStartTime = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
  const defaultEndTime = addHours(defaultStartTime, 1);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: format(defaultStartTime, "yyyy-MM-dd"),
    startTime: format(defaultStartTime, "HH:mm"),
    endTime: format(defaultEndTime, "HH:mm"),
    allDay: false,
    location: "",
    meetingType: "online" as "online" | "inPerson" | "hybrid",
    maxParticipants: 100,
    recordingEnabled: true,
    waitingRoomEnabled: true,
    lobbyBypassType: "invited" as "everyone" | "invited" | "organization" | "nobody",
    allowedPresenters: "everyone" as "everyone" | "organization" | "specific" | "host_only",
    invitedParticipants: [] as Id<"users">[],
    allowUninvitedJoin: true,
  });

  const createMeeting = useMutation(api.meetings.createMeeting);

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error("Meeting title is required");
      return;
    }

    if ((formData.meetingType === "inPerson" || formData.meetingType === "hybrid") && !formData.location) {
      toast.error("Location is required for in-person meetings");
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse date and time
      const [year, month, day] = formData.date.split("-").map(Number);
      const [startHour, startMinute] = formData.startTime.split(":").map(Number);
      const [endHour, endMinute] = formData.endTime.split(":").map(Number);

      let scheduledStartTime = new Date(year, month - 1, day, startHour, startMinute);
      let scheduledEndTime = new Date(year, month - 1, day, endHour, endMinute);

      // Handle all-day events
      if (formData.allDay) {
        scheduledStartTime = startOfDay(scheduledStartTime);
        scheduledEndTime = endOfDay(scheduledStartTime);
      }

      // If end time is before start time, assume it's the next day
      if (scheduledEndTime <= scheduledStartTime) {
        scheduledEndTime = new Date(scheduledEndTime.setDate(scheduledEndTime.getDate() + 1));
      }

      const meetingId = await createMeeting({
        foundationId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: "scheduled",
        scheduledStartTime: scheduledStartTime.getTime(),
        scheduledEndTime: scheduledEndTime.getTime(),
        location: formData.location || undefined,
        maxParticipants: formData.maxParticipants,
        recordingEnabled: formData.recordingEnabled,
        waitingRoomEnabled: formData.waitingRoomEnabled,
        lobbyBypassType: formData.lobbyBypassType,
        allowedPresenters: formData.allowedPresenters,
        invitedParticipants: formData.invitedParticipants.length > 0 ? formData.invitedParticipants : undefined,
        allowUninvitedJoin: formData.allowUninvitedJoin,
      });

      toast.success("Meeting scheduled successfully!");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        date: format(defaultStartTime, "yyyy-MM-dd"),
        startTime: format(defaultStartTime, "HH:mm"),
        endTime: format(defaultEndTime, "HH:mm"),
        allDay: false,
        location: "",
        meetingType: "online",
        maxParticipants: 100,
        recordingEnabled: true,
        waitingRoomEnabled: true,
        lobbyBypassType: "invited",
        allowedPresenters: "everyone",
        invitedParticipants: [],
        allowUninvitedJoin: true,
      });
    } catch (error: any) {
      console.error("Failed to create meeting:", error);
      toast.error(error.message || "Failed to create meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDuration = (duration: string) => {
    const [hours, minutes] = formData.startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const durationMinutes = {
      "30m": 30,
      "1h": 60,
      "1h30m": 90,
      "2h": 120,
      "3h": 180,
    }[duration] || 60;
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    setFormData({
      ...formData,
      endTime: format(endDate, "HH:mm"),
    });
  };

  const getDuration = () => {
    const [startHour, startMinute] = formData.startTime.split(":").map(Number);
    const [endHour, endMinute] = formData.endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    
    // Handle next day
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const diff = endMinutes - startMinutes;
    
    if (diff === 30) return "30m";
    if (diff === 60) return "1h";
    if (diff === 90) return "1h30m";
    if (diff === 120) return "2h";
    if (diff === 180) return "3h";
    return "custom";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting for your foundation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Meeting Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Weekly Team Sync"
              />
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  disabled={formData.allDay}
                />
              </div>
            </div>

            {/* End Time and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  disabled={formData.allDay}
                />
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={getDuration()} onValueChange={updateDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30m">30 minutes</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="1h30m">1.5 hours</SelectItem>
                    <SelectItem value="2h">2 hours</SelectItem>
                    <SelectItem value="3h">3 hours</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* All Day Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allDay"
                checked={formData.allDay}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, allDay: checked as boolean })
                }
              />
              <Label htmlFor="allDay" className="cursor-pointer">
                All day event
              </Label>
            </div>

            {/* Meeting Type */}
            <div className="space-y-2">
              <Label>Meeting Type</Label>
              <Select
                value={formData.meetingType}
                onValueChange={(value: any) => setFormData({ ...formData, meetingType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Online Meeting
                    </div>
                  </SelectItem>
                  <SelectItem value="inPerson">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      In-Person
                    </div>
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Hybrid
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location (for in-person/hybrid) */}
            {(formData.meetingType === "inPerson" || formData.meetingType === "hybrid") && (
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Conference Room A, Building 2"
                />
              </div>
            )}

            {/* Participant Selection */}
            <ParticipantSelector
              foundationId={foundationId}
              selectedParticipants={formData.invitedParticipants}
              onParticipantsChange={(participants) => 
                setFormData({ ...formData, invitedParticipants: participants })
              }
              allowUninvitedJoin={formData.allowUninvitedJoin}
              onAllowUninvitedChange={(allow) => 
                setFormData({ ...formData, allowUninvitedJoin: allow })
              }
              currentUserId={userId}
            />

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add meeting agenda, topics to discuss, etc."
                rows={3}
              />
            </div>

            {/* Meeting Options */}
            <div className="space-y-3">
              <Label>Meeting Options</Label>
              
              {/* Recording */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recording"
                  checked={formData.recordingEnabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, recordingEnabled: checked as boolean })
                  }
                />
                <Label htmlFor="recording" className="cursor-pointer font-normal">
                  Allow recording
                </Label>
              </div>

              {/* Waiting Room */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="waitingRoom"
                  checked={formData.waitingRoomEnabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, waitingRoomEnabled: checked as boolean })
                  }
                />
                <Label htmlFor="waitingRoom" className="cursor-pointer font-normal">
                  Enable waiting room
                </Label>
              </div>
            </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Meeting"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}