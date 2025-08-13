"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getInitials } from "@/lib/utils";
import {
  Home,
  Users,
  FileText,
  DollarSign,
  GraduationCap,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Menu,
  UserCheck,
  ClipboardList,
  BookOpen,
  MessageSquare,
  Shield,
  Building2,
  Plus,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["super_admin", "admin", "reviewer", "beneficiary", "guardian"],
  },
  {
    title: "Applications",
    href: "/applications",
    icon: FileText,
    roles: ["super_admin", "admin", "reviewer", "guardian"],
  },
  {
    title: "My Applications",
    href: "/beneficiary/applications",
    icon: FileText,
    roles: ["beneficiary"],
  },
  {
    title: "Apply Now",
    href: "/beneficiary/apply",
    icon: Plus,
    roles: ["beneficiary"],
  },
  {
    title: "Beneficiaries",
    href: "/beneficiaries",
    icon: Users,
    roles: ["super_admin", "admin", "reviewer"],
  },
  {
    title: "Reviews",
    href: "/reviews",
    icon: UserCheck,
    roles: ["reviewer", "admin", "super_admin"],
    badge: "3",
  },
  {
    title: "Academic",
    href: "/academic",
    icon: GraduationCap,
    roles: ["super_admin", "admin", "beneficiary", "guardian"],
  },
  {
    title: "Financial",
    href: "/financial",
    icon: DollarSign,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Programs",
    href: "/programs",
    icon: Calendar,
    roles: ["super_admin", "admin", "beneficiary"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["super_admin", "admin", "reviewer"],
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageSquare,
    roles: ["super_admin", "admin", "reviewer", "beneficiary", "guardian"],
  },
  {
    title: "Resources",
    href: "/resources",
    icon: BookOpen,
    roles: ["super_admin", "admin", "beneficiary", "guardian"],
  },
];

const adminItems: NavItem[] = [
  {
    title: "Admin Dashboard",
    href: "/admin",
    icon: Shield,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Foundations",
    href: "/admin/foundations",
    icon: Building2,
    roles: ["super_admin"],
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Configuration",
    href: "/configuration",
    icon: Settings,
    roles: ["super_admin", "admin"],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const filteredNavItems = navigationItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  const filteredAdminItems = adminItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-sidebar font-bold text-sm">TOF</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-white font-semibold text-sm">TheOyinbooke</h2>
              <p className="text-white/60 text-xs">Foundation</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex text-white/70 hover:text-white hover:bg-white/10"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="bg-primary text-white">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white hover:bg-white/30 text-xs"
                  >
                    {user.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 group relative",
                isActive && "bg-white/15 text-white",
                collapsed && "justify-center"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white rounded-r-full" />
              )}
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  {item.badge && (
                    <Badge className="bg-primary text-white h-5 px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Admin Section */}
        {filteredAdminItems.length > 0 && (
          <>
            <div className="pt-4 mt-4 border-t border-white/10">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                  Administration
                </p>
              )}
              {filteredAdminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 group relative",
                      isActive && "bg-white/15 text-white",
                      collapsed && "justify-center"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white rounded-r-full" />
                    )}
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="flex-1 text-sm font-medium">{item.title}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/help"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200",
            collapsed && "justify-center"
          )}
        >
          <HelpCircle className="h-5 w-5" />
          {!collapsed && <span className="text-sm font-medium">Help & Support</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar text-white rounded-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar h-screen transition-all duration-300 fixed left-0 top-0 z-30",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden flex flex-col bg-sidebar h-screen w-64 fixed left-0 top-0 z-50 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}