"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  UserX,
  UserCheck,
  Crown,
  Eye,
  Settings,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  MailX,
  RefreshCw,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { UserDetailsDialog } from "@/components/users/user-details-dialog";

export default function UsersManagementPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    userId: Id<"users">;
    currentRole: string;
    userName: string;
  } | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<Id<"users"> | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch users for the foundation
  const users = useQuery(
    api.users.getByFoundation,
    foundationId ? {
      foundationId,
      search: searchQuery || undefined,
      role: roleFilter !== "all" ? roleFilter as any : undefined,
      isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
    } : "skip"
  );

  // Fetch user statistics
  const userStats = useQuery(
    api.users.getStatistics,
    foundationId ? { foundationId } : "skip"
  );

  // Mutations
  const updateUserRole = useMutation(api.auth.updateUserRole);
  const deactivateUser = useMutation(api.users.deactivate);
  const reactivateUser = useMutation(api.users.reactivate);
  const revokeInvitation = useMutation(api.users.revokeInvitation);
  const resendInvitation = useMutation(api.users.resendInvitation);

  const getRoleBadge = (role: string) => {
    const styles = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-red-100 text-red-800",
      reviewer: "bg-blue-100 text-blue-800",
      beneficiary: "bg-green-100 text-green-800",
      guardian: "bg-orange-100 text-orange-800"
    };
    
    const icons = {
      super_admin: <Crown className="w-3 h-3" />,
      admin: <ShieldCheck className="w-3 h-3" />,
      reviewer: <Shield className="w-3 h-3" />,
      beneficiary: <UserCheck className="w-3 h-3" />,
      guardian: <Users className="w-3 h-3" />
    };
    
    return (
      <Badge className={`${styles[role as keyof typeof styles] || "bg-gray-100 text-gray-800"} flex items-center gap-1`}>
        {icons[role as keyof typeof icons]}
        {role.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const handleRoleChange = async () => {
    if (!roleChangeDialog || !newRole) return;
    
    try {
      await updateUserRole({
        userId: roleChangeDialog.userId,
        newRole: newRole as any,
        foundationId
      });
      
      toast.success(`Role updated to ${newRole.replace("_", " ")}`);
      setRoleChangeDialog(null);
      setNewRole("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleDeactivateUser = async (userId: Id<"users">, userName: string) => {
    try {
      await deactivateUser({
        userId,
        reason: "Deactivated by admin"
      });
      toast.success(`${userName} has been deactivated`);
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate user");
    }
  };

  const handleReactivateUser = async (userId: Id<"users">, userName: string) => {
    try {
      await reactivateUser({ userId });
      toast.success(`${userName} has been reactivated`);
    } catch (error: any) {
      toast.error(error.message || "Failed to reactivate user");
    }
  };

  const handleRevokeInvitation = async (userId: Id<"users">, userName: string) => {
    try {
      await revokeInvitation({
        foundationId: foundationId!,
        userId: userId,
      });
      toast.success(`Invitation for ${userName} has been revoked`);
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke invitation");
    }
  };

  const handleResendInvitation = async (userId: Id<"users">, userName: string) => {
    try {
      await resendInvitation({
        foundationId: foundationId!,
        userId: userId,
      });
      toast.success(`Invitation resent to ${userName}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invitation");
    }
  };

  const isInvitationPending = (userRecord: any) => {
    return !userRecord.clerkId && !userRecord.isActive;
  };

  const handleViewUser = (userId: Id<"users">) => {
    setSelectedUserForDetails(userId);
    setDetailsDialogOpen(true);
  };

  const toggleUserSelection = (userId: Id<"users">) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (!users) return;
    
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-600 mt-1">Manage foundation staff and their roles</p>
          </div>
          <div className="flex gap-2">
            <InviteUserDialog onInviteSent={() => {
              // Refresh users list or show success message
              toast.success("User invitation sent successfully");
            }} />
            {selectedUsers.length > 0 && (
              <Button variant="outline">
                Bulk Actions ({selectedUsers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total}</div>
                <p className="text-xs text-gray-600 mt-1">{userStats.active} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
                  <ShieldCheck className="w-4 h-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {userStats.byRole.admin}
                </div>
                <p className="text-xs text-gray-600 mt-1">Foundation admins</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Reviewers</CardTitle>
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {userStats.byRole.reviewer}
                </div>
                <p className="text-xs text-gray-600 mt-1">Application reviewers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Beneficiaries</CardTitle>
                  <UserCheck className="w-4 h-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {userStats.byRole.beneficiary}
                </div>
                <p className="text-xs text-gray-600 mt-1">Students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Guardians</CardTitle>
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {userStats.byRole.guardian}
                </div>
                <p className="text-xs text-gray-600 mt-1">Parents/Guardians</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="beneficiary">Beneficiary</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Users ({users?.length || 0})</CardTitle>
                <CardDescription>
                  Manage foundation staff and their access levels
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={users?.length > 0 && selectedUsers.length === users.length}
                  onCheckedChange={selectAllUsers}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-gray-700 w-12">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="text-left p-2 font-medium text-gray-700">User</th>
                    <th className="text-left p-2 font-medium text-gray-700">Role</th>
                    <th className="text-left p-2 font-medium text-gray-700">Status</th>
                    <th className="text-left p-2 font-medium text-gray-700">Last Login</th>
                    <th className="text-left p-2 font-medium text-gray-700">Joined</th>
                    <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Checkbox
                          checked={selectedUsers.includes(user._id)}
                          onCheckedChange={() => toggleUserSelection(user._id)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : (isInvitationPending(user) ? "Invitation Pending" : "Inactive")}
                          </Badge>
                          {isInvitationPending(user) && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          {user.lastLogin ? (
                            formatDate(user.lastLogin)
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {/* View user details */}
                            <DropdownMenuItem
                              onClick={() => handleViewUser(user._id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {/* Role management - show for all users */}
                            <DropdownMenuItem
                              onClick={() => setRoleChangeDialog({
                                userId: user._id,
                                currentRole: user.role,
                                userName: `${user.firstName} ${user.lastName}`
                              })}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            
                            {/* Invitation Management - only show for pending invitations */}
                            {isInvitationPending(user) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleResendInvitation(user._id, `${user.firstName} ${user.lastName}`)}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Resend Invitation
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRevokeInvitation(user._id, `${user.firstName} ${user.lastName}`)}
                                  className="text-red-600"
                                >
                                  <MailX className="w-4 h-4 mr-2" />
                                  Revoke Invitation
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {/* User activation/deactivation - only show for activated users */}
                            {!isInvitationPending(user) && (
                              <>
                                <DropdownMenuSeparator />
                                {user.isActive ? (
                                  <DropdownMenuItem
                                    onClick={() => handleDeactivateUser(user._id, `${user.firstName} ${user.lastName}`)}
                                    className="text-red-600"
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleReactivateUser(user._id, `${user.firstName} ${user.lastName}`)}
                                    className="text-green-600"
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Reactivate
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users?.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Invite users to start managing your foundation team
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        {selectedUserForDetails && (
          <UserDetailsDialog
            userId={selectedUserForDetails}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
        )}

        {/* Role Change Dialog */}
        <Dialog open={roleChangeDialog !== null} onOpenChange={() => setRoleChangeDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update the role for {roleChangeDialog?.userName}. This will change their access permissions immediately.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Current Role</Label>
                <div className="mt-1">
                  {roleChangeDialog && getRoleBadge(roleChangeDialog.currentRole)}
                </div>
              </div>
              
              <div>
                <Label>New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="beneficiary">Beneficiary</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newRole === "admin" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Admin Role Warning</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Admins have full access to foundation settings, user management, and all data.
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleChangeDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleRoleChange}
                disabled={!newRole || newRole === roleChangeDialog?.currentRole}
              >
                Update Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}