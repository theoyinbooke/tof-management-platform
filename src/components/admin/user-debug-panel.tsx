"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, User, AlertCircle } from "lucide-react";

export function UserDebugPanel() {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  
  const userStatus = useQuery(
    api.users.debugUserStatus,
    searchEmail ? { email: searchEmail } : "skip"
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSearchEmail(email.trim().toLowerCase());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          User Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email to debug user status"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit">
              <Search className="w-4 h-4 mr-1" />
              Search
            </Button>
          </div>
        </form>

        {userStatus && userStatus.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">User Records Found ({userStatus.length})</h3>
            {userStatus.map((user, index) => (
              <div key={user._id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Email:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {user.role}
                  </div>
                  <div>
                    <span className="font-medium">Clerk ID:</span> {user.clerkId}
                  </div>
                  <div>
                    <span className="font-medium">Has Invitation Token:</span> 
                    {user.hasInvitationToken ? " ✅ Yes" : " ❌ No"}
                  </div>
                  <div>
                    <span className="font-medium">Invitation Accepted:</span> 
                    {user.invitationAcceptedAt ? new Date(user.invitationAcceptedAt).toLocaleDateString() : "No"}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> 
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Status Analysis */}
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                  {user.isActive && user.clerkId !== "empty" && (
                    <div className="text-green-700">✅ <strong>Status:</strong> Fully activated user</div>
                  )}
                  {!user.isActive && user.hasInvitationToken && user.clerkId === "empty" && (
                    <div className="text-yellow-700">⏳ <strong>Status:</strong> Invitation pending</div>
                  )}
                  {!user.isActive && !user.hasInvitationToken && user.clerkId !== "empty" && (
                    <div className="text-red-700">❌ <strong>Status:</strong> Deactivated user</div>
                  )}
                  {!user.isActive && !user.hasInvitationToken && user.clerkId === "empty" && (
                    <div className="text-red-700">⚠️ <strong>Status:</strong> Incomplete invitation (possible bug)</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {userStatus && userStatus.length === 0 && searchEmail && (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            No user found with email: {searchEmail}
          </div>
        )}
      </CardContent>
    </Card>
  );
}