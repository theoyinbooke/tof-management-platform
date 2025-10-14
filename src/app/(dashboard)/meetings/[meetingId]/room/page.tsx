"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { EnhancedMeetingRoom } from "@/components/meeting/enhanced-meeting-room";
import { MeetingLobby } from "@/components/meeting/meeting-lobby";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import "@/app/globals-meeting.css";

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const meetingId = params.meetingId as Id<"meetings">;
  
  // State to track if user has joined from lobby
  const [hasJoinedFromLobby, setHasJoinedFromLobby] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [meetingSettings, setMeetingSettings] = useState<{
    videoEnabled: boolean;
    audioEnabled: boolean;
    backgroundBlur: boolean;
  } | null>(null);

  // Get meeting data
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });

  if (!user) {
    return null;
  }

  // Determine user role based on their system role
  const userRole = user.role === "admin" || user.role === "super_admin" 
    ? "host" 
    : user.role === "reviewer"
    ? "moderator"
    : "participant";

  // Construct username with fallback
  const userName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`.trim()
    : user.email || "Guest User";

  // Handle joining from lobby
  const handleJoinFromLobby = async (settings: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    backgroundBlur: boolean;
  }) => {
    setIsJoining(true);
    setMeetingSettings(settings);
    
    // Simulate a brief delay for joining
    setTimeout(() => {
      setHasJoinedFromLobby(true);
      setIsJoining(false);
    }, 1500);
  };

  // Handle cancel from lobby
  const handleCancelFromLobby = () => {
    router.push("/meetings");
  };

  // Ensure we have a stable key for React rendering
  const roomKey = `room-${meetingId}-${hasJoinedFromLobby}`;

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "beneficiary", "guardian", "reviewer"]}>
      <div key={roomKey}>
        {!hasJoinedFromLobby ? (
          // Show lobby first
          <MeetingLobby
            meeting={meeting}
            userName={userName}
            onJoin={handleJoinFromLobby}
            onCancel={handleCancelFromLobby}
            isJoining={isJoining}
          />
        ) : (
          // Show meeting room after joining from lobby
          <EnhancedMeetingRoom
            meetingId={meetingId}
            userName={userName}
            userRole={userRole as "host" | "co_host" | "moderator" | "participant"}
            initialSettings={meetingSettings}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}