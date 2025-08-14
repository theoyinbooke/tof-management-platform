"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Users, 
  UserCheck, 
  Send, 
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface ComposeMessageProps {
  foundationId: Id<"foundations">;
  onMessageSent?: () => void;
  onCancel?: () => void;
}

interface Recipient {
  userId: Id<"users">;
  email?: string;
  phone?: string;
  name: string;
  role: string;
}

export function ComposeMessage({ foundationId, onMessageSent, onCancel }: ComposeMessageProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<string[]>(["email"]);
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [category, setCategory] = useState<"academic" | "financial" | "administrative" | "alert" | "announcement">("administrative");
  const [recipientType, setRecipientType] = useState<"individual" | "group" | "role" | "all">("individual");
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users for recipient selection
  const users = useQuery(
    api.users.getByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch communication templates
  const templates = useQuery(
    api.communications.getTemplates,
    foundationId ? { foundationId } : "skip"
  );

  const sendBulkNotification = useMutation(api.communications.sendBulkNotification);

  const handleChannelToggle = (channel: string) => {
    setChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleUserSelection = (userId: Id<"users">) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getRecipients = (): Recipient[] => {
    if (!users) return [];

    switch (recipientType) {
      case "individual":
        return users
          .filter(user => selectedUsers.includes(user._id))
          .map(user => ({
            userId: user._id,
            email: user.email,
            phone: user.phone,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          }));

      case "role":
        return users
          .filter(user => user.role === selectedRole)
          .map(user => ({
            userId: user._id,
            email: user.email,
            phone: user.phone,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          }));

      case "all":
        return users.map(user => ({
          userId: user._id,
          email: user.email,
          phone: user.phone,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        }));

      default:
        return [];
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    if (channels.length === 0) {
      toast.error("Please select at least one communication channel");
      return;
    }

    const recipients = getRecipients();
    if (recipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    setIsLoading(true);
    try {
      await sendBulkNotification({
        foundationId,
        recipients: recipients.map(r => ({
          userId: r.userId,
          email: r.email,
          phone: r.phone,
        })),
        channels: channels as ("email" | "sms" | "in_app")[],
        subject,
        message,
        priority,
        category,
      });

      toast.success(`Message sent to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`);
      
      // Reset form
      setSubject("");
      setMessage("");
      setSelectedUsers([]);
      setRecipientType("individual");
      
      onMessageSent?.();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRecipients = getRecipients();

  return (
    <div className="space-y-6">
      {/* Message Details */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter message subject..."
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            rows={6}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Channels</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={channels.includes("email")}
                  onCheckedChange={() => handleChannelToggle("email")}
                />
                <Label htmlFor="email" className="text-sm flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={channels.includes("sms")}
                  onCheckedChange={() => handleChannelToggle("sms")}
                />
                <Label htmlFor="sms" className="text-sm flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  SMS
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="in_app"
                  checked={channels.includes("in_app")}
                  onCheckedChange={() => handleChannelToggle("in_app")}
                />
                <Label htmlFor="in_app" className="text-sm flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  In-App
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Recipient Selection */}
      <div className="space-y-4">
        <Label>Recipients</Label>
        
        <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual Users</SelectItem>
            <SelectItem value="role">By Role</SelectItem>
            <SelectItem value="all">All Users</SelectItem>
          </SelectContent>
        </Select>

        {recipientType === "individual" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Select Individual Users</CardTitle>
              <CardDescription>Choose specific users to send the message to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users?.map((user) => (
                  <div key={user._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user._id}
                      checked={selectedUsers.includes(user._id)}
                      onCheckedChange={() => handleUserSelection(user._id)}
                    />
                    <Label htmlFor={user._id} className="text-sm flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span>{user.firstName} {user.lastName}</span>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {recipientType === "role" && (
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beneficiary">Beneficiaries</SelectItem>
              <SelectItem value="guardian">Guardians</SelectItem>
              <SelectItem value="reviewer">Reviewers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Recipients Preview */}
        {selectedRecipients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Selected Recipients ({selectedRecipients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                Message will be sent to {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''} via {channels.join(", ")}
              </div>
              {selectedRecipients.length <= 10 && (
                <div className="mt-2 space-y-1">
                  {selectedRecipients.map((recipient) => (
                    <div key={recipient.userId} className="flex justify-between items-center text-xs">
                      <span>{recipient.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {recipient.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSend} disabled={isLoading || selectedRecipients.length === 0}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Send Message
        </Button>
      </div>
    </div>
  );
}