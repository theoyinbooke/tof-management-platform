"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

interface MessagingWidgetProps {
  foundationId: Id<"foundations">;
  currentUserId: Id<"users">;
  className?: string;
}

export function MessagingWidget({ foundationId, currentUserId, className }: MessagingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Get recent conversations
  const conversations = useQuery(api.messaging.getConversationsByUser, {
    foundationId,
    userId: currentUserId,
    limit: 5,
  });

  const messagingStats = useQuery(api.messaging.getMessagingStats, {
    foundationId,
    userId: currentUserId,
  });

  const messages = useQuery(
    selectedConversation ? api.messaging.getMessagesByConversation : "skip",
    selectedConversation ? {
      conversationId: selectedConversation as Id<"conversations">,
      foundationId,
      limit: 20,
    } : undefined
  );

  // Mutations
  const sendMessage = useMutation(api.messaging.sendMessage);
  const markAsRead = useMutation(api.messaging.markMessagesAsRead);

  // Get conversation title
  const getConversationTitle = (conversation: any) => {
    if (conversation.title) return conversation.title;
    if (conversation.type === "direct") {
      const otherParticipant = conversation.participants.find((p: any) => p._id !== currentUserId);
      return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : "Unknown User";
    }
    return `Group Chat`;
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      await sendMessage({
        conversationId: selectedConversation as Id<"conversations">,
        foundationId,
        content: newMessage.trim(),
        type: "text",
      });
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  // Handle select conversation
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    
    // Mark messages as read
    markAsRead({
      conversationId: conversationId as Id<"conversations">,
      foundationId,
    });
  };

  const unreadCount = messagingStats?.unreadMessages || 0;
  const selectedConversationData = conversations?.find(c => c._id === selectedConversation);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative", className)}
        >
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center bg-emerald-500">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 h-96 p-0" align="end" sideOffset={4}>
        <Card className="h-full flex flex-col border-0 shadow-none">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Messages</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
                <Link href="/messages">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col">
            {selectedConversation ? (
              // Chat View
              <>
                {/* Chat Header */}
                <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {selectedConversationData?.type === "group" ? (
                          <Users className="h-3 w-3" />
                        ) : (
                          selectedConversationData?.participants
                            .find(p => p._id !== currentUserId)
                            ?.firstName?.charAt(0) || "?"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                      {selectedConversationData ? getConversationTitle(selectedConversationData) : ""}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages?.slice(-10).map((message) => (
                      <div
                        key={message._id}
                        className={cn(
                          "flex gap-2",
                          message.senderId === currentUserId ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.senderId !== currentUserId && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {message.sender?.firstName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={cn(
                            "max-w-[70%] px-3 py-2 rounded-lg text-xs",
                            message.senderId === currentUserId
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          <p>{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {format(message.createdAt, "HH:mm")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Conversations List
              <ScrollArea className="flex-1">
                <div className="p-0">
                  {conversations?.map((conversation) => (
                    <div
                      key={conversation._id}
                      onClick={() => handleSelectConversation(conversation._id)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {conversation.type === "group" ? (
                                <Users className="h-4 w-4" />
                              ) : (
                                conversation.participants
                                  .find(p => p._id !== currentUserId)
                                  ?.firstName?.charAt(0) || "?"
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {getConversationTitle(conversation)}
                            </p>
                            {conversation.latestMessage && (
                              <span className="text-xs text-gray-500">
                                {format(conversation.latestMessage.createdAt, "HH:mm")}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-600 truncate">
                            {conversation.latestMessage ? (
                              <>
                                {conversation.latestMessage.senderId === currentUserId && "You: "}
                                {conversation.latestMessage.content}
                              </>
                            ) : (
                              "No messages yet"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!conversations || conversations.length === 0) && (
                    <div className="p-6 text-center">
                      <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">No conversations yet</p>
                      <Link href="/messages">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          Start Chatting
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}