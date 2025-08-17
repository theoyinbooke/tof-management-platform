"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { 
  Building2, 
  Users, 
  Settings, 
  Bell, 
  Shield, 
  CreditCard,
  FileText,
  Palette,
  Building
} from "lucide-react";

const getSettingsNavigation = (isSuperAdmin: boolean) => {
  const baseNavigation = [
    {
      name: "Foundation",
      href: "/settings/foundation",
      icon: Building2,
      description: "Foundation details and configuration",
      roles: ["admin", "super_admin"]
    },
    {
      name: "Users",
      href: "/settings/users", 
      icon: Users,
      description: "Manage team members and roles",
      roles: ["admin", "super_admin"]
    },
    {
      name: "Notifications",
      href: "/settings/notifications",
      icon: Bell,
      description: "Email and SMS notification settings",
      roles: ["admin", "super_admin"]
    },
    {
      name: "Security",
      href: "/settings/security",
      icon: Shield,
      description: "Security settings and audit logs",
      roles: ["admin", "super_admin"]
    },
    {
      name: "Billing",
      href: "/settings/billing",
      icon: CreditCard,
      description: "Subscription and payment settings",
      roles: ["admin", "super_admin"]
    },
    {
      name: "Documents",
      href: "/settings/documents",
      icon: FileText,
      description: "Document types and requirements",
      roles: ["admin", "super_admin"]
    },
    {
      name: "Appearance",
      href: "/settings/appearance",
      icon: Palette,
      description: "Customize the platform appearance",
      roles: ["admin", "super_admin"]
    }
  ];

  // Add super admin only menu items
  if (isSuperAdmin) {
    baseNavigation.unshift({
      name: "All Foundations",
      href: "/settings/foundations",
      icon: Building,
      description: "Manage all foundations in the system",
      roles: ["super_admin"]
    });
  }

  return baseNavigation;
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSuperAdmin } = useCurrentUser();
  
  const settingsNavigation = getSettingsNavigation(isSuperAdmin);

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-gray-900">Settings</h2>
            </div>
            
            <nav className="space-y-1">
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-emerald-100 text-emerald-700 font-medium"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 hidden lg:block">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}