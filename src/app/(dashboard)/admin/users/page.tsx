"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ShieldOff, 
  Shield, 
  Mail,
  ArrowLeft,
  UserPlus,
  Download,
  Eye,
  MailX,
  RefreshCw,
  Clock,
  Ban
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { UserDetailsDialog } from "@/components/users/user-details-dialog";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import { BlockUserDialog } from "@/components/admin/block-user-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Id } from "../../../../../convex/_generated/dataModel";

type UserRole = "super_admin" | "admin" | "reviewer" | "beneficiary" | "guardian";

export default function UsersPage() {
  const router = useRouter();
  const currentUserData = useCurrentUser();  // Get the entire object with computed properties
  const currentUser = currentUserData.user;  // Extract the user for backward compatibility
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<any>(null);

  // Fetch data
  const users = useQuery(api.admin.getAllUsers);
  const deactivateUser = useMutation(api.admin.deactivateUser);
  const reactivateUser = useMutation(api.admin.reactivateUser);
  const blockUser = useMutation(api.admin.blockUser);
  const deleteUser = useMutation(api.admin.deleteUser);
  const updateUserRole = useMutation(api.admin.updateUserRole);
  const revokeInvitation = useMutation(api.users.revokeInvitation);
  const resendInvitation = useMutation(api.users.resendInvitation);

  // Filter users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const handleDeactivateUser = async (userId: Id<"users">, reason?: string) => {
    try {
      await deactivateUser({ userId, reason });
      toast.success("User deactivated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate user");
    }
  };

  const handleReactivateUser = async (userId: Id<"users">, reason?: string) => {
    try {
      await reactivateUser({ userId, reason });
      toast.success("User reactivated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to reactivate user");
    }
  };

  const handleBlockUser = async (userId: Id<"users">, reason: string) => {
    try {
      await blockUser({ userId, reason });
      toast.success("User blocked successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to block user");
    }
  };

  const handleDeleteUser = async (userId: Id<"users">, reason: string) => {
    try {
      await deleteUser({ userId, reason });
      toast.success("User deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleEditUser = (userId: Id<"users">) => {
    setSelectedUser(userId);
    setEditDialogOpen(true);
  };

  const handleViewUser = (userId: Id<"users">) => {
    setSelectedUser(userId);
    setDetailsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: any) => {
    setSelectedUserForAction(user);
    setDeleteDialogOpen(true);
  };

  const handleOpenBlockDialog = (user: any) => {
    setSelectedUserForAction(user);
    setBlockDialogOpen(true);
  };

  const handleRevokeInvitation = async (userId: Id<"users">) => {
    if (!currentUser?.foundationId) {
      toast.error("User foundation not found");
      return;
    }
    
    try {
      await revokeInvitation({
        foundationId: currentUser.foundationId,
        userId: userId,
      });
      toast.success("Invitation revoked successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke invitation");
    }
  };

  const handleResendInvitation = async (userId: Id<"users">) => {
    if (!currentUser?.foundationId) {
      toast.error("User foundation not found");
      return;
    }
    
    try {
      await resendInvitation({
        foundationId: currentUser.foundationId,
        userId: userId,
      });
      toast.success("Invitation resent successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invitation");
    }
  };

  // User status detection functions
  const isInvitationPending = (userRecord: any) => {
    // True invitation pending: no clerkId, not active, has invitation token
    return !userRecord.clerkId && !userRecord.isActive && !!userRecord.invitationToken;
  };

  const isDeactivated = (userRecord: any) => {
    // Deactivated: has clerkId (completed setup), not active, no invitation token
    return !!userRecord.clerkId && !userRecord.isActive && !userRecord.invitationToken;
  };

  const getUserStatus = (userRecord: any) => {
    if (userRecord.isActive) return "active";
    if (isInvitationPending(userRecord)) return "invitation_pending";
    if (isDeactivated(userRecord)) return "deactivated";
    return "unknown";
  };

  const getRoleColor = (role: UserRole) => {
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

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-gray-600 mt-1">
                Manage user accounts and permissions ({filteredUsers.length} users)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <InviteUserDialog />
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={(value: UserRole | "all") => setRoleFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="beneficiary">Beneficiary</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No users found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all" 
                      ? "Try adjusting your filters" 
                      : "Get started by inviting your first user"
                    }
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback className="bg-primary text-white">
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {user.firstName} {user.lastName}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={getRoleColor(user.role)}
                          >
                            {user.role.replace("_", " ").toUpperCase()}
                          </Badge>
                          {!user.isActive && (
                            <Badge 
                              variant="secondary" 
                              className={
                                getUserStatus(user) === "invitation_pending" 
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {getUserStatus(user) === "invitation_pending" 
                                ? "Invitation Pending" 
                                : "Deactivated"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span>{user.phone}</span>
                          )}
                          <span>
                            Joined {formatDate(new Date(user.createdAt))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user._id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditUser(user._id)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          
                          {/* Invitation Management - only show for pending invitations */}
                          {isInvitationPending(user) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleResendInvitation(user._id)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRevokeInvitation(user._id)}
                                className="text-red-600"
                              >
                                <MailX className="w-4 h-4 mr-2" />
                                Revoke Invitation
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {/* Regular user management - only show for users who completed setup */}
                          {!isInvitationPending(user) && (
                            <>
                              <DropdownMenuSeparator />
                              {user.isActive ? (
                                <DropdownMenuItem 
                                  onClick={() => handleDeactivateUser(user._id)}
                                  className="text-orange-600"
                                >
                                  <ShieldOff className="w-4 h-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleReactivateUser(user._id)}>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                              
                              {/* Debug: Fixed - using currentUserData for computed properties */}
                              <div className="text-xs text-green-600 px-2 py-1 border-t">
                                <div>✅ FIXED Debug Info:</div>
                                <div>Raw role: {currentUser?.role || 'none'}</div>
                                <div>isSuperAdmin: {currentUserData?.isSuperAdmin ? 'true' : 'false'}</div>
                                <div>isAdmin: {currentUserData?.isAdmin ? 'true' : 'false'}</div>
                              </div>
                              
                              {/* Super admin only actions - FIXED */}
                              {currentUserData?.isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleOpenBlockDialog(user)}
                                    className="text-red-600"
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Block User
                                  </DropdownMenuItem>
                                  
                                  {user.role !== "super_admin" && (
                                    <DropdownMenuItem 
                                      onClick={() => handleOpenDeleteDialog(user)}
                                      className="text-red-800"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Permanently
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        {selectedUser && (
          <>
            <EditUserDialog
              userId={selectedUser}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
            />
            <UserDetailsDialog
              userId={selectedUser}
              open={detailsDialogOpen}
              onOpenChange={setDetailsDialogOpen}
            />
          </>
        )}

        {/* Action Dialogs */}
        {selectedUserForAction && (
          <>
            <BlockUserDialog
              open={blockDialogOpen}
              onOpenChange={setBlockDialogOpen}
              onConfirm={(reason) => handleBlockUser(selectedUserForAction._id, reason)}
              userName={`${selectedUserForAction.firstName} ${selectedUserForAction.lastName}`}
              userEmail={selectedUserForAction.email}
            />
            <DeleteUserDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onConfirm={(reason) => handleDeleteUser(selectedUserForAction._id, reason)}
              userName={`${selectedUserForAction.firstName} ${selectedUserForAction.lastName}`}
              userEmail={selectedUserForAction.email}
            />
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}