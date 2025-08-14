"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield,
  Activity,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface UserDetailsDialogProps {
  userId: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ userId, open, onOpenChange }: UserDetailsDialogProps) {
  // Fetch user data and related information
  const user = useQuery(api.admin.getUserById, { userId });
  const auditLogs = useQuery(api.admin.getUserAuditLogs, { userId });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-red-100 text-red-800 border-red-200";
      case "admin": return "bg-blue-100 text-blue-800 border-blue-200";
      case "reviewer": return "bg-purple-100 text-purple-800 border-purple-200";
      case "beneficiary": return "bg-green-100 text-green-800 border-green-200";
      case "guardian": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "high": return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "medium": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "low": return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="bg-primary text-white">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{user.firstName} {user.lastName}</span>
                <Badge variant="outline" className={getRoleColor(user.role)}>
                  {user.role.replace("_", " ").toUpperCase()}
                </Badge>
                {!user.isActive && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{user.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete user profile and activity overview
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">First Name</label>
                    <p className="text-base">{user.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Name</label>
                    <p className="text-base">{user.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email Address</label>
                    <p className="text-base flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </p>
                  </div>
                  {user.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone Number</label>
                      <p className="text-base flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {user.phone}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Role</label>
                    <p className="text-base">
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        {user.role.replace("_", " ").toUpperCase()}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="text-base">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Member Since</label>
                    <p className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(new Date(user.createdAt))}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(new Date(user.updatedAt))}
                    </p>
                  </div>
                </div>

                {user.notes && (
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-600">Admin Notes</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{user.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Foundation Information */}
            {user.foundationId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Foundation Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Foundation ID</label>
                      <p className="text-base font-mono text-sm">{user.foundationId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Access Level</label>
                      <p className="text-base">{user.role.replace("_", " ")} access</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest actions and system events for this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs && auditLogs.length > 0 ? (
                    auditLogs.slice(0, 10).map((log) => (
                      <div key={log._id} className="flex items-start gap-3 border-b pb-3 last:border-b-0">
                        <div className="mt-1">
                          {getRiskLevelIcon(log.riskLevel)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{log.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                            <span>Action: {log.action.replace("_", " ")}</span>
                            <span>Entity: {log.entityType}</span>
                            <span>Risk: {log.riskLevel}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(new Date(log.createdAt))}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No recent activity found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        User activity will appear here once they start using the system
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Role Permissions
                </CardTitle>
                <CardDescription>
                  What this user can access based on their role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.role === "super_admin" && (
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-800 mb-2">Super Administrator</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>• System-wide administrative access</li>
                          <li>• Can manage all foundations</li>
                          <li>• Can promote/demote other administrators</li>
                          <li>• Full access to audit logs and system settings</li>
                          <li>• Can modify critical system configurations</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {user.role === "admin" && (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Administrator</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Full foundation management access</li>
                          <li>• User management and role assignment</li>
                          <li>• Financial management and reporting</li>
                          <li>• Application review and approval</li>
                          <li>• Document management and verification</li>
                          <li>• Program creation and management</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {user.role === "reviewer" && (
                    <div className="space-y-3">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-800 mb-2">Reviewer</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• Application review and evaluation</li>
                          <li>• Beneficiary profile management</li>
                          <li>• Document verification</li>
                          <li>• Report generation and viewing</li>
                          <li>• Communication with applicants</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {user.role === "beneficiary" && (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">Beneficiary</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• View own profile and academic progress</li>
                          <li>• Upload and manage personal documents</li>
                          <li>• Access educational programs</li>
                          <li>• Receive and view notifications</li>
                          <li>• Communicate with foundation staff</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {user.role === "guardian" && (
                    <div className="space-y-3">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-800 mb-2">Guardian</h4>
                        <ul className="text-sm text-orange-700 space-y-1">
                          <li>• View child's academic progress</li>
                          <li>• Access financial information and invoices</li>
                          <li>• Communicate with foundation staff</li>
                          <li>• Receive notifications about child's activities</li>
                          <li>• Help manage child's documents</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}