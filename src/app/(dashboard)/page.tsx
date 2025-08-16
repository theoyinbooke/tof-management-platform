"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { BeneficiaryDashboard } from "@/components/dashboards/beneficiary-dashboard";
import { ReviewerDashboard } from "@/components/dashboards/reviewer-dashboard";
import { GuardianDashboard } from "@/components/dashboards/guardian-dashboard";

export default function DashboardPage() {
  const { user } = useCurrentUser();

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case "super_admin":
      case "admin":
        return <AdminDashboard />;
      case "reviewer":
        return <ReviewerDashboard />;
      case "beneficiary":
        return <BeneficiaryDashboard />;
      case "guardian":
        return <GuardianDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return renderDashboard();
}