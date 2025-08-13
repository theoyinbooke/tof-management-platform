"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare,
  Send,
  Plus,
  Users,
  Search,
  Paperclip,
  Image,
  File,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  X,
  Phone,
  Video,
  Info,
  Smile,
  Settings,
  UserPlus,
  Edit3,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

interface MessagingDashboardProps {
  foundationId: Id<"foundations">;
  currentUserId: Id<"users">;
}

export function MessagingDashboard({ foundationId, currentUserId }: MessagingDashboardProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [chatTitle, setChatTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex queries
  const conversations = useQuery(api.messaging.getConversationsByUser, {
    foundationId,
    userId: currentUserId,
  });

  const messages = useQuery(
    selectedConversation ? api.messaging.getMessagesByConversation : "skip",
    selectedConversation ? {
      conversationId: selectedConversation as Id<"conversations">,
      foundationId,
    } : undefined
  );

  const messagingStats = useQuery(api.messaging.getMessagingStats, {
    foundationId,
    userId: currentUserId,
  });

  // Get foundation users for new chat
  const foundationUsers = useQuery(api.users.getByFoundation, {
    foundationId,
  });

  // Mutations
  const sendMessage = useMutation(api.messaging.sendMessage);
  const markAsRead = useMutation(api.messaging.markMessagesAsRead);
  const createConversation = useMutation(api.messaging.getOrCreateConversation);
  const generateUploadUrl = useMutation(api.messaging.generateUploadUrl);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && messages) {
      const unreadMessages = messages.filter(m => 
        m.senderId !== currentUserId && !m.readBy.includes(currentUserId)
      );
      
      if (unreadMessages.length > 0) {
        markAsRead({
          conversationId: selectedConversation as Id<"conversations">,
          foundationId,
        });
      }
    }
  }, [selectedConversation, messages, currentUserId, foundationId, markAsRead]);

  // Filter conversations based on search
  const filteredConversations = React.useMemo(() => {
    if (!conversations) return [];
    
    return conversations.filter(conversation => {
      const matchesSearch = searchTerm === "" || 
        conversation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.participants.some(p => 
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return matchesSearch;
    });
  }, [conversations, searchTerm]);

  // Get conversation title
  const getConversationTitle = (conversation: any) => {
    if (conversation.title) return conversation.title;
    if (conversation.type === "direct") {
      const otherParticipant = conversation.participants.find((p: any) => p._id !== currentUserId);
      return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : "Unknown User";
    }
    return `Group Chat (${conversation.participants.length})`;
  };

  // Format message time
  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      setIsLoading(true);
      await sendMessage({
        conversationId: selectedConversation as Id<"conversations">,
        foundationId,
        content: newMessage.trim(),
        type: "text",
      });
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!selectedConversation) return;

    try {
      const uploadUrl = await generateUploadUrl({ foundationId });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await sendMessage({
        conversationId: selectedConversation as Id<"conversations">,
        foundationId,
        content: `Shared a file: ${file.name}`,
        type: file.type.startsWith("image/") ? "image" : "file",
        attachmentId: storageId,
        fileName: file.name,
        fileSize: file.size,
      });

      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    }
  };

  // Handle create new conversation
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const conversationId = await createConversation({
        foundationId,
        participantIds: selectedUsers as Id<"users">[],
        title: selectedUsers.length > 1 ? chatTitle || undefined : undefined,
        type: selectedUsers.length === 1 ? "direct" : "group",
      });

      setSelectedConversation(conversationId);
      setIsNewChatOpen(false);
      setSelectedUsers([]);
      setChatTitle("");
      toast.success("Conversation created");
    } catch (error) {
      toast.error("Failed to create conversation");
    }
  };

  // Get message status icon
  const getMessageStatusIcon = (message: any) => {
    if (message.senderId !== currentUserId) return null;
    
    if (message.readBy.length > 1) { // More than just sender
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else if (message.deliveredTo.length > 0) {
      return <Check className="h-3 w-3 text-gray-500" />;
    } else {
      return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const selectedConversationData = conversations?.find(c => c._id === selectedConversation);

  if (!conversations || !messagingStats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                  <DialogDescription>Select users to start a conversation with</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Users</label>
                    <Select
                      value=""
                      onValueChange={(userId) => {
                        if (!selectedUsers.includes(userId)) {
                          setSelectedUsers([...selectedUsers, userId]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose users..." />
                      </SelectTrigger>
                      <SelectContent>
                        {foundationUsers?.filter(user => 
                          user._id !== currentUserId && !selectedUsers.includes(user._id)
                        ).map((user) => (
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

                  {selectedUsers.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Selected Users</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedUsers.map(userId => {
                          const user = foundationUsers?.find(u => u._id === userId);
                          return user ? (
                            <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                              {user.firstName} {user.lastName}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {selectedUsers.length > 1 && (
                    <div>
                      <label className="text-sm font-medium">Group Name (Optional)</label>
                      <Input
                        placeholder="Enter group name..."
                        value={chatTitle}
                        onChange={(e) => setChatTitle(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsNewChatOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateConversation}
                    disabled={selectedUsers.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Create Conversation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-0">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => setSelectedConversation(conversation._id)}
                className={cn(
                  "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                  selectedConversation === conversation._id && "bg-emerald-50 border-emerald-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {conversation.type === "group" ? (
                          <Users className="h-6 w-6" />
                        ) : (
                          conversation.participants
                            .find(p => p._id !== currentUserId)
                            ?.firstName?.charAt(0) || "?"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center bg-emerald-500">
                        {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {getConversationTitle(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.latestMessage ? 
                          formatMessageTime(conversation.latestMessage.createdAt) :
                          formatMessageTime(conversation.createdAt)
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.latestMessage ? (
                          <>
                            {conversation.latestMessage.senderId === currentUserId && "You: "}
                            {conversation.latestMessage.content}
                          </>
                        ) : (
                          "No messages yet"
                        )}
                      </p>
                      
                      {conversation.type === "group" && (
                        <Badge variant="outline" className="text-xs">
                          {conversation.participants.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredConversations.length === 0 && (
              <div className="text-center py-12 px-4">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No conversations found</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {searchTerm ? "No conversations match your search." : "Start a new conversation to get chatting!"}
                </p>
                <Button 
                  onClick={() => setIsNewChatOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedConversationData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedConversationData.type === "group" ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        selectedConversationData.participants
                          .find(p => p._id !== currentUserId)
                          ?.firstName?.charAt(0) || "?"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium text-gray-900">
                      {getConversationTitle(selectedConversationData)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversationData.type === "group" 
                        ? `${selectedConversationData.participants.length} participants`
                        : "Direct message"
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages?.map((message) => (
                  <div
                    key={message._id}
                    className={cn(
                      "flex gap-3",
                      message.senderId === currentUserId ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.senderId !== currentUserId && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {message.sender?.firstName?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                        message.senderId === currentUserId
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      {message.senderId !== currentUserId && selectedConversationData.type === "group" && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.sender?.firstName} {message.sender?.lastName}
                        </p>
                      )}
                      
                      <p className="text-sm">{message.content}</p>
                      
                      {message.attachmentUrl && (
                        <div className="mt-2">
                          {message.type === "image" ? (
                            <img 
                              src={message.attachmentUrl} 
                              alt="Shared image"
                              className="rounded max-w-full h-auto"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-white/20 rounded">
                              <File className="h-4 w-4" />
                              <span className="text-xs">{message.fileName}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {format(message.createdAt, "HH:mm")}
                        </span>
                        {getMessageStatusIcon(message)}
                      </div>
                    </div>

                    {message.senderId === currentUserId && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          You
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-3">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h2>
              <p className="text-gray-600 mb-6">Choose a conversation from the sidebar to start messaging</p>
              <Button 
                onClick={() => setIsNewChatOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}