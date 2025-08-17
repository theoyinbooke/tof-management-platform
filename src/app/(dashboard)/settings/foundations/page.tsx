"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { FoundationManagement } from "@/components/settings/foundation-management";

export default function FoundationsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <FoundationManagement />
    </ProtectedRoute>
  );
}