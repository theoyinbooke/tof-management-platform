"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle,
  Send,
  Search,
  Plus,
  MoreVertical,
  Paperclip,
  Image,
  FileText,
  Users,
  Check,
  CheckCheck,
  Clock,
  User,
  Hash,
  Bell,
  MessageSquare,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function MessagesPage() {
  const { user } = useCurrentUser();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [newConversationType, setNewConversationType] = useState<"direct" | "group">("direct");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [conversationTitle, setConversationTitle] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch conversations
  const conversations = useQuery(
    api.messages.getConversations,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch messages for selected conversation
  const messages = useQuery(
    api.messages.getMessages,
    selectedConversation ? { conversationId: selectedConversation as Id<"conversations"> } : "skip"
  );

  // Search users for new conversation
  const searchedUsers = useQuery(
    api.messages.searchUsers,
    foundationId && userSearchTerm ? { foundationId, searchTerm: userSearchTerm } : "skip"
  );

  // Get unread count
  const unreadCount = useQuery(
    api.messages.getUnreadCount,
    foundationId ? { foundationId } : "skip"
  );

  // Mutations
  const sendMessage = useMutation(api.messages.sendMessage);
  const markMessagesAsRead = useMutation(api.messages.markMessagesAsRead);
  const createConversation = useMutation(api.messages.createConversation);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      markMessagesAsRead({ 
        conversationId: selectedConversation as Id<"conversations"> 
      }).catch(console.error);
    }
  }, [selectedConversation, markMessagesAsRead]);

  // Filter conversations based on search
  const filteredConversations = conversations?.filter(conv => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Search in title
    if (conv.title?.toLowerCase().includes(searchLower)) return true;
    
    // Search in participant names
    const participantMatch = conv.participants.some(p => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchLower)
    );
    
    // Search in last message
    if (conv.lastMessage?.content.toLowerCase().includes(searchLower)) return true;
    
    return participantMatch;
  });

  const selectedConv = conversations?.find(c => c._id === selectedConversation);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      await sendMessage({
        conversationId: selectedConversation as Id<"conversations">,
        content: messageInput.trim(),
      });
      setMessageInput("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleCreateConversation = async () => {
    if (!foundationId) return;
    
    if (selectedParticipants.length === 0) {
      toast.error("Please select at least one participant");
      return;
    }

    if (newConversationType === "group" && !conversationTitle) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      const conversationId = await createConversation({
        foundationId,
        participantIds: selectedParticipants as Id<"users">[],
        title: newConversationType === "group" ? conversationTitle : undefined,
        type: newConversationType,
      });
      
      setSelectedConversation(conversationId);
      setIsNewConversationOpen(false);
      setSelectedParticipants([]);
      setConversationTitle("");
      setUserSearchTerm("");
      toast.success("Conversation created successfully");
    } catch (error) {
      toast.error("Failed to create conversation");
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getConversationIcon = (type: string) => {
    switch (type) {
      case "direct": return <User className="w-4 h-4" />;
      case "group": return <Users className="w-4 h-4" />;
      case "program": return <Hash className="w-4 h-4" />;
      case "announcement": return <Bell className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getConversationName = (conv: any) => {
    if (conv.title) return conv.title;
    
    if (conv.type === "direct") {
      const otherParticipant = conv.participants.find((p: any) => p._id !== user?._id);
      return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : "Direct Message";
    }
    
    return `${conv.participants.length} participants`;
  };

  const getMessageStatus = (message: any) => {
    if (message.senderId !== user?._id) return null;
    
    if (message.readBy.length === message.deliveredTo.length) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (message.deliveredTo.length > 0) {
      return <Check className="w-4 h-4 text-gray-400" />;
    } else {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!user?.foundationId) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer", "beneficiary", "guardian"]}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Loading user information...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer", "beneficiary", "guardian"]}>
      <div className="container mx-auto p-6 h-[calc(100vh-6rem)]">
        <div className="flex gap-6 h-full">
          {/* Conversations List */}
          <div className="w-96 flex flex-col bg-white rounded-lg border">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">Messages</h2>
                  {unreadCount ? (
                    <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsNewConversationOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
              {filteredConversations?.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv._id)}
                  className={cn(
                    "p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedConversation === conv._id && "bg-emerald-50 border-l-4 border-l-emerald-600"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {getConversationIcon(conv.type)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm truncate">
                          {getConversationName(conv)}
                        </h3>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      
                      {conv.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage.sender && conv.lastMessage.senderId !== user?._id && (
                            <span className="font-medium">
                              {conv.lastMessage.sender.firstName}: 
                            </span>
                          )}
                          {conv.lastMessage.content}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {conv.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredConversations?.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No conversations yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsNewConversationOpen(true)}
                  >
                    Start a conversation
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col bg-white rounded-lg border">
            {selectedConv ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {getConversationIcon(selectedConv.type)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{getConversationName(selectedConv)}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedConv.participants.length} participants
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages?.map((message) => {
                      const isOwn = message.senderId === user?._id;
                      
                      return (
                        <div
                          key={message._id}
                          className={cn(
                            "flex gap-3",
                            isOwn && "justify-end"
                          )}
                        >
                          {!isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={cn(
                            "max-w-[70%] space-y-1",
                            isOwn && "items-end"
                          )}>
                            {!isOwn && (
                              <p className="text-xs text-gray-600">
                                {message.sender?.firstName} {message.sender?.lastName}
                              </p>
                            )}
                            
                            <div className={cn(
                              "p-3 rounded-lg",
                              isOwn 
                                ? "bg-emerald-600 text-white" 
                                : message.type === "system"
                                ? "bg-gray-100 text-gray-600 italic text-sm"
                                : "bg-gray-100 text-gray-900"
                            )}>
                              <p className="text-sm">{message.content}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </span>
                              {getMessageStatus(message)}
                            </div>
                          </div>
                          
                          {isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Conversation Dialog */}
        <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
              <DialogDescription>
                Start a new direct message or group conversation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Conversation Type */}
              <div>
                <Label>Conversation Type</Label>
                <Select
                  value={newConversationType}
                  onValueChange={(value: "direct" | "group") => setNewConversationType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct Message</SelectItem>
                    <SelectItem value="group">Group Conversation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group Title */}
              {newConversationType === "group" && (
                <div>
                  <Label>Group Name</Label>
                  <Input
                    placeholder="Enter group name..."
                    value={conversationTitle}
                    onChange={(e) => setConversationTitle(e.target.value)}
                  />
                </div>
              )}

              {/* User Search */}
              <div>
                <Label>Add Participants</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Selected Participants */}
              {selectedParticipants.length > 0 && (
                <div>
                  <Label>Selected Participants</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedParticipants.map((participantId) => {
                      const participant = searchedUsers?.find(u => u._id === participantId);
                      return participant ? (
                        <Badge key={participantId} variant="secondary">
                          {participant.firstName} {participant.lastName}
                          <button
                            onClick={() => toggleParticipant(participantId)}
                            className="ml-2"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* User List */}
              {searchedUsers && searchedUsers.length > 0 && (
                <div>
                  <Label>Available Users</Label>
                  <ScrollArea className="h-48 border rounded-lg mt-2">
                    {searchedUsers.map((searchUser) => (
                      <div
                        key={searchUser._id}
                        onClick={() => toggleParticipant(searchUser._id)}
                        className={cn(
                          "p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between",
                          selectedParticipants.includes(searchUser._id) && "bg-emerald-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {searchUser.firstName[0]}{searchUser.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {searchUser.firstName} {searchUser.lastName}
                            </p>
                            <p className="text-xs text-gray-600">{searchUser.role}</p>
                          </div>
                        </div>
                        {selectedParticipants.includes(searchUser._id) && (
                          <Check className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewConversationOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateConversation}
                disabled={selectedParticipants.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}