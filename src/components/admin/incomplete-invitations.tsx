"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  UserX, 
  Mail, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function IncompleteInvitations() {
  const { user } = useCurrentUser();
  const pendingInvitations = useQuery(
    api.users.getPendingInvitations,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );
  const resendInvitation = useAction(api.users.resendInvitation);
  const revokeInvitation = useAction(api.users.revokeInvitation);

  if (!user?.isAdmin) {
    return null;
  }

  const handleResendInvitation = async (pendingInvitationId: string) => {
    if (!user.foundationId) return;
    
    try {
      await resendInvitation({
        foundationId: user.foundationId,
        pendingInvitationId: pendingInvitationId as any,
      });
      toast.success("Invitation resent successfully");
    } catch (error) {
      toast.error("Failed to resend invitation");
      console.error("Resend invitation error:", error);
    }
  };

  const handleRevokeInvitation = async (pendingInvitationId: string) => {
    if (!user.foundationId) return;
    
    try {
      await revokeInvitation({
        foundationId: user.foundationId,
        pendingInvitationId: pendingInvitationId as any,
      });
      toast.success("Invitation revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke invitation");
      console.error("Revoke invitation error:", error);
    }
  };

  const getInvitationStatus = (invitation: any) => {
    const now = Date.now();
    
    // For Clerk invitations, they expire after 7 days by default
    const daysSinceInvitation = Math.floor((now - invitation.invitationSentAt) / (1000 * 60 * 60 * 24));
    
    if (daysSinceInvitation > 7) {
      return { status: "expired", variant: "destructive" as const };
    } else if (daysSinceInvitation > 3) {
      return { status: "pending", variant: "secondary" as const };
    }
    
    return { status: "recent", variant: "default" as const };
  };

  if (pendingInvitations === undefined) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pendingInvitations || pendingInvitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Incomplete Invitations
          </CardTitle>
          <CardDescription>
            Users who were invited but haven't completed their account setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserX className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              All invited users have completed their account setup
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Pending Invitations ({pendingInvitations.length})
        </CardTitle>
        <CardDescription>
          Users who have been invited via Clerk but haven't accepted their invitation yet. 
          They will receive an email from Clerk with instructions to set up their account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pending Clerk Invitations:</strong> These users have been sent invitations through Clerk's system. 
            They will receive an email with a link to create their account and join your foundation.
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvitations.map((invitation) => {
                const statusInfo = getInvitationStatus(invitation);
                
                return (
                  <TableRow key={invitation._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {invitation.firstName} {invitation.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invitation.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {invitation.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          {formatDistanceToNow(invitation.invitationSentAt, { addSuffix: true })}
                        </div>
                        {invitation.invitedBy && (
                          <div className="text-xs text-muted-foreground">
                            by {invitation.invitedBy}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(invitation._id)}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeInvitation(invitation._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}