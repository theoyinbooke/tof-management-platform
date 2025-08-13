import { NotificationDashboard } from "@/components/notifications/notification-dashboard";

// This would normally come from authentication context
const FOUNDATION_ID = "foundation123" as any; // Replace with actual foundation ID

export default function NotificationsPage() {
  return (
    <div className="container mx-auto p-6">
      <NotificationDashboard foundationId={FOUNDATION_ID} />
    </div>
  );
}