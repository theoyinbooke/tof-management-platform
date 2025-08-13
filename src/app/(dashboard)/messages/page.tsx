import { MessagingDashboard } from "@/components/messaging/messaging-dashboard";

// This would normally come from authentication context
const FOUNDATION_ID = "foundation123" as any; // Replace with actual foundation ID
const CURRENT_USER_ID = "user123" as any; // Replace with actual user ID

export default function MessagesPage() {
  return (
    <div className="h-screen">
      <MessagingDashboard 
        foundationId={FOUNDATION_ID} 
        currentUserId={CURRENT_USER_ID}
      />
    </div>
  );
}