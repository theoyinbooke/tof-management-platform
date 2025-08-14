"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface QuickMessageProps {
  foundationId: Id<"foundations">;
  currentUserId: Id<"users">;
  recipientId?: Id<"users">; // Pre-selected recipient
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  className?: string;
}

export function QuickMessage({ 
  foundationId, 
  currentUserId, 
  recipientId, 
  triggerText = "Send Message",
  triggerVariant = "outline",
  className 
}: QuickMessageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>(recipientId || "");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get foundation users
  const foundationUsers = useQuery(api.users.getByFoundation, {
    foundationId,
  });

  // Mutations
  const getOrCreateConversation = useMutation(api.messaging.getOrCreateConversation);
  const sendMessage = useMutation(api.messaging.sendMessage);

  // Handle send message
  const handleSendMessage = async () => {
    if (!selectedRecipient || !message.trim()) {
      toast.error("Please select a recipient and enter a message");
      return;
    }

    try {
      setIsLoading(true);

      // Get or create conversation
      const conversationId = await getOrCreateConversation({
        foundationId,
        participantIds: [selectedRecipient as Id<"users">],
        type: "direct",
      });

      // Send message
      await sendMessage({
        conversationId,
        foundationId,
        content: message.trim(),
        type: "text",
      });

      toast.success("Message sent successfully");
      setMessage("");
      setIsOpen(false);
      
      // Reset recipient if not pre-selected
      if (!recipientId) {
        setSelectedRecipient("");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = foundationUsers?.find(u => u._id === selectedRecipient);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={className}>
          <MessageSquare className="h-4 w-4 mr-2" />
          {triggerText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Quick Message</DialogTitle>
          <DialogDescription>
            Send a direct message to a foundation member
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Recipient Selection */}
          {!recipientId && (
            <div>
              <label className="text-sm font-medium">To</label>
              <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent>
                  {foundationUsers?.filter(user => user._id !== currentUserId).map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.firstName} {user.lastName}</span>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show selected recipient if pre-selected */}
          {recipientId && selectedUser && (
            <div>
              <label className="text-sm font-medium">To</label>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <Badge variant="outline" className="text-xs">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!selectedRecipient || !message.trim() || isLoading || message.length > 500}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for using quick message functionality
export function useQuickMessage(foundationId: Id<"foundations">, currentUserId: Id<"users">) {
  const getOrCreateConversation = useMutation(api.messaging.getOrCreateConversation);
  const sendMessage = useMutation(api.messaging.sendMessage);

  const sendQuickMessage = async (recipientId: Id<"users">, content: string) => {
    try {
      const conversationId = await getOrCreateConversation({
        foundationId,
        participantIds: [recipientId],
        type: "direct",
      });

      await sendMessage({
        conversationId,
        foundationId,
        content: content.trim(),
        type: "text",
      });

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return { sendQuickMessage };
}