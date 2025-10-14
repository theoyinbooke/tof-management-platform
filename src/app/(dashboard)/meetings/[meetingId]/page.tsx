"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Id } from "../../../../../convex/_generated/dataModel";

// This page redirects to the meeting details page
// The actual meeting room is at /meetings/[meetingId]/room
export default function MeetingRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.meetingId as Id<"meetings">;

  useEffect(() => {
    // Redirect to meeting details page
    router.replace(`/meetings/${meetingId}/details`);
  }, [meetingId, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Redirecting to meeting details...</h2>
        <p className="text-gray-600">You will be redirected shortly.</p>
      </div>
    </div>
  );
}