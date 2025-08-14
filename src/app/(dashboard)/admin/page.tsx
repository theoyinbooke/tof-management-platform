"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings,
  Users,
  Database,
  Activity,
  Shield,
  Bell,
  FileText,
  BarChart3,
  Eye,
  AlertTriangle
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { IncompleteInvitations } from "@/components/admin/incomplete-invitations";
import { toast } from "sonner";

export default function AdminPage() {
  // Fetch admin data
  const users = useQuery(api.admin.getAllUsers);
  const auditLogs = useQuery(api.admin.getRecentAuditLogs);
  const systemStats = useQuery(api.admin.getSystemStats);
  
  const [activeTab, setActiveTab] = useState("overview");

  const handleInviteSent = () => {
    // The useQuery will automatically refetch when the data changes
    // due to the new invitation being created
    toast.success("User list will refresh automatically");
  };

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              System administration and management
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
            <InviteUserDialog onInviteSent={handleInviteSent} />
          </div>
        </div>

        {/* System Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.totalUsers || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                {systemStats?.activeUsers || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Beneficiaries</CardTitle>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.totalBeneficiaries || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                {systemStats?.activeBeneficiaries || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Documents</CardTitle>
                <FileText className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.totalDocuments || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                {systemStats?.pendingDocuments || 0} pending review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Security Alerts</CardTitle>
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{systemStats?.securityAlerts || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Incomplete Invitations Alert */}
            <IncompleteInvitations />
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>
                  Latest actions across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs?.slice(0, 10).map((log) => (
                    <div key={log._id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.riskLevel === "critical" ? "bg-red-500" :
                          log.riskLevel === "high" ? "bg-orange-500" :
                          log.riskLevel === "medium" ? "bg-yellow-500" :
                          "bg-green-500"
                        }`} />
                        <div>
                          <p className="font-medium">{log.description}</p>
                          <p className="text-sm text-gray-600">
                            by {log.userEmail} • {log.action.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatDate(new Date(log.createdAt))}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {log.riskLevel} risk
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-gray-600 py-8">No audit logs available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system status and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">Operational</div>
                    <p className="text-sm text-green-700">Database</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">Active</div>
                    <p className="text-sm text-green-700">File Storage</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">Connected</div>
                    <p className="text-sm text-green-700">Authentication</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage user accounts and permissions ({users?.length || 0} users)
                    </CardDescription>
                  </div>
                  <InviteUserDialog onInviteSent={handleInviteSent} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div key={user._id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium capitalize">{user.role.replace("_", " ")}</p>
                          <p className="text-xs text-gray-600">
                            {user.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-gray-600 py-8">No users found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Complete system activity and security logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs?.map((log) => (
                    <div key={log._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-2 ${
                            log.riskLevel === "critical" ? "bg-red-500" :
                            log.riskLevel === "high" ? "bg-orange-500" :
                            log.riskLevel === "medium" ? "bg-yellow-500" :
                            "bg-green-500"
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium">{log.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>User: {log.userEmail}</span>
                              <span>Action: {log.action.replace("_", " ")}</span>
                              <span>Entity: {log.entityType}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {formatDate(new Date(log.createdAt))}
                          </p>
                          <p className={`text-xs font-medium capitalize ${
                            log.riskLevel === "critical" ? "text-red-600" :
                            log.riskLevel === "high" ? "text-orange-600" :
                            log.riskLevel === "medium" ? "text-yellow-600" :
                            "text-green-600"
                          }`}>
                            {log.riskLevel} risk
                          </p>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-gray-600 py-8">No audit logs available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">System settings configuration</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Feature coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
                <CardDescription>
                  Security monitoring and threat detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Security monitoring dashboard</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Advanced security features coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}