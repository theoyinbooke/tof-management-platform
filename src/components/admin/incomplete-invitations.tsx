"use client";

import { useQuery, useMutation } from "convex/react";
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
  const incompleteInvitations = useQuery(
    api.users.getIncompleteInvitations,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );
  const resendInvitation = useMutation(api.users.resendInvitation);
  const revokeInvitation = useMutation(api.users.revokeInvitation);

  if (!user?.isAdmin) {
    return null;
  }

  const handleResendInvitation = async (userId: string) => {
    if (!user.foundationId) return;
    
    try {
      await resendInvitation({
        foundationId: user.foundationId,
        userId: userId as any,
      });
      toast.success("Invitation resent successfully");
    } catch (error) {
      toast.error("Failed to resend invitation");
      console.error("Resend invitation error:", error);
    }
  };

  const handleRevokeInvitation = async (userId: string) => {
    if (!user.foundationId) return;
    
    try {
      await revokeInvitation({
        foundationId: user.foundationId,
        userId: userId as any,
      });
      toast.success("Invitation revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke invitation");
      console.error("Revoke invitation error:", error);
    }
  };

  const getInvitationStatus = (invitation: any) => {
    const now = Date.now();
    
    if (invitation.invitationExpiresAt && invitation.invitationExpiresAt < now) {
      return { status: "expired", variant: "destructive" as const };
    }
    
    const daysSinceInvitation = Math.floor((now - invitation.invitationSentAt) / (1000 * 60 * 60 * 24));
    
    if (daysSinceInvitation > 7) {
      return { status: "overdue", variant: "destructive" as const };
    } else if (daysSinceInvitation > 3) {
      return { status: "pending", variant: "secondary" as const };
    }
    
    return { status: "recent", variant: "default" as const };
  };

  if (incompleteInvitations === undefined) {
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

  if (!incompleteInvitations || incompleteInvitations.length === 0) {
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
          Incomplete Invitations ({incompleteInvitations.length})
        </CardTitle>
        <CardDescription>
          Users who were invited but haven't completed their account setup. 
          They cannot sign in until they complete the invitation process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Authentication Issue:</strong> These users have records in your system but no Clerk accounts. 
            If they try to sign in, it will fail. They need to complete their invitation or have it resent.
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
              {incompleteInvitations.map((invitation) => {
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
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(invitation.invitationSentAt, { addSuffix: true })}
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