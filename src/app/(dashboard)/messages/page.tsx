"use client";

import { MessagingDashboard } from "@/components/messaging/messaging-dashboard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Id } from "../../../convex/_generated/dataModel";

export default function MessagesPage() {
  const { user } = useCurrentUser();

  if (!user?.foundationId) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer", "beneficiary", "guardian"]}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Loading user information...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer", "beneficiary", "guardian"]}>
      <div className="h-screen">
        <MessagingDashboard
          foundationId={user.foundationId as Id<"foundations">}
          currentUserId={user._id as Id<"users">}
        />
      </div>
    </ProtectedRoute>
  );
}