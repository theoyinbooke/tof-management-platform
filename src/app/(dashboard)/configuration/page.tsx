import { ConfigurationDashboard } from "@/components/configuration/configuration-dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ConfigurationPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <ConfigurationDashboard />
    </ProtectedRoute>
  );
}