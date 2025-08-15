"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Shield,
  Calendar,
  MoreVertical,
  UserPlus,
  Edit,
  UserX,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";

export default function FoundationTeamPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch team members
  const teamMembers = useQuery(
    api.users.getByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch pending invitations
  const pendingInvitations = useQuery(
    api.users.getPendingInvitations,
    foundationId ? { foundationId } : "skip"
  );

  // Mutations
  const updateUserRole = useMutation(api.users.updateRole);
  const deactivateUser = useMutation(api.users.deactivate);
  const reactivateUser = useMutation(api.users.reactivate);

  // Filter team members
  const filteredMembers = teamMembers?.filter(member => {
    const matchesSearch = searchTerm === "" || 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-emerald-100 text-emerald-800">Admin</Badge>;
      case "reviewer":
        return <Badge className="bg-blue-100 text-blue-800">Reviewer</Badge>;
      case "beneficiary":
        return <Badge className="bg-orange-100 text-orange-800">Beneficiary</Badge>;
      case "guardian":
        return <Badge className="bg-yellow-100 text-yellow-800">Guardian</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole({
        userId: userId as Id<"users">,
        newRole: newRole as any,
      });
      toast.success("User role updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateUser({ userId: userId as Id<"users"> });
        toast.success("User deactivated successfully");
      } else {
        await reactivateUser({ userId: userId as Id<"users"> });
        toast.success("User reactivated successfully");
      }
    } catch (error) {
      toast.error(`Failed to ${isActive ? 'deactivate' : 'reactivate'} user`);
    }
  };

  // Calculate team statistics
  const teamStats = {
    total: teamMembers?.length || 0,
    admins: teamMembers?.filter(m => m.role === "admin" || m.role === "super_admin").length || 0,
    reviewers: teamMembers?.filter(m => m.role === "reviewer").length || 0,
    beneficiaries: teamMembers?.filter(m => m.role === "beneficiary").length || 0,
    guardians: teamMembers?.filter(m => m.role === "guardian").length || 0,
    active: teamMembers?.filter(m => m.isActive).length || 0,
    inactive: teamMembers?.filter(m => !m.isActive).length || 0,
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/foundation")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Team Management</h1>
              <p className="text-gray-600 mt-1">Manage your foundation team members and roles</p>
            </div>
          </div>
          <Button onClick={() => router.push("/users/invite")}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* Team Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{teamStats.total}</div>
                <p className="text-xs text-gray-600 mt-1">Total Members</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{teamStats.admins}</div>
                <p className="text-xs text-gray-600 mt-1">Admins</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{teamStats.reviewers}</div>
                <p className="text-xs text-gray-600 mt-1">Reviewers</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{teamStats.beneficiaries}</div>
                <p className="text-xs text-gray-600 mt-1">Beneficiaries</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{teamStats.guardians}</div>
                <p className="text-xs text-gray-600 mt-1">Guardians</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{teamStats.active}</div>
                <p className="text-xs text-gray-600 mt-1">Active</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{teamStats.inactive}</div>
                <p className="text-xs text-gray-600 mt-1">Inactive</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Clock className="w-5 h-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription className="text-yellow-700">
                These users have been invited but haven't accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation._id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {invitation.firstName[0]}{invitation.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {invitation.firstName} {invitation.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{invitation.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(invitation.role)}
                      <Badge variant="outline" className="text-xs">
                        Invited {formatDate(new Date(invitation.createdAt))}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </CardTitle>
                <CardDescription>All users in your foundation</CardDescription>
              </div>
              
              {/* Filters */}
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="beneficiary">Beneficiary</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-gray-700">Member</th>
                    <th className="text-left p-2 font-medium text-gray-700">Role</th>
                    <th className="text-left p-2 font-medium text-gray-700">Status</th>
                    <th className="text-left p-2 font-medium text-gray-700">Joined</th>
                    <th className="text-left p-2 font-medium text-gray-700">Contact</th>
                    <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers?.map((member) => (
                    <tr key={member._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {member.firstName[0]}{member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        {getRoleBadge(member.role)}
                      </td>
                      <td className="p-2">
                        {getStatusBadge(member.isActive)}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(new Date(member.createdAt))}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="space-y-1">
                          {member.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(member);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleUserStatus(member._id, member.isActive)}
                            >
                              {member.isActive ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Reactivate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredMembers?.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No team members found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the role for {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Current Role</p>
                {selectedUser && getRoleBadge(selectedUser.role)}
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Select New Role</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedUser?.role === "admin" ? "default" : "outline"}
                    onClick={() => handleUpdateRole(selectedUser?._id, "admin")}
                    disabled={selectedUser?.role === "admin"}
                  >
                    Admin
                  </Button>
                  <Button
                    variant={selectedUser?.role === "reviewer" ? "default" : "outline"}
                    onClick={() => handleUpdateRole(selectedUser?._id, "reviewer")}
                    disabled={selectedUser?.role === "reviewer"}
                  >
                    Reviewer
                  </Button>
                  <Button
                    variant={selectedUser?.role === "beneficiary" ? "default" : "outline"}
                    onClick={() => handleUpdateRole(selectedUser?._id, "beneficiary")}
                    disabled={selectedUser?.role === "beneficiary"}
                  >
                    Beneficiary
                  </Button>
                  <Button
                    variant={selectedUser?.role === "guardian" ? "default" : "outline"}
                    onClick={() => handleUpdateRole(selectedUser?._id, "guardian")}
                    disabled={selectedUser?.role === "guardian"}
                  >
                    Guardian
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}