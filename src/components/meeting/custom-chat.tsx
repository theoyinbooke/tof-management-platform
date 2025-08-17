"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Send, Smile, Paperclip, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface CustomChatProps {
  className?: string;
  userName?: string;
}

export function CustomChat({ className, userName }: CustomChatProps) {
  console.log("CustomChat component is rendering!"); // Debug log
  const { send, chatMessages } = useChat();
  const room = useRoomContext();
  const localParticipant = useLocalParticipant();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSend = async () => {
    if (message.trim()) {
      await send(message.trim());
      setMessage("");
      setIsTyping(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageTime = (timestamp?: number) => {
    if (!timestamp) return "now";
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const getSenderInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getSenderColor = (participantId?: string) => {
    const colors = [
      "bg-emerald-500",
      "bg-sky-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-rose-500",
    ];
    
    if (!participantId) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < participantId.length; i++) {
      hash = participantId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={cn("flex flex-col h-full bg-gradient-to-b from-white to-gray-50", className)}>
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              Meeting Chat
              <span className="inline-flex h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Messages can only be seen by people in the meeting
            </p>
          </div>
          <div className="text-xs text-gray-400">
            {chatMessages.length} messages
          </div>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-3 chat-scrollbar">
        <div className="space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
              </div>
              <p className="text-gray-700 text-base font-medium">No messages yet</p>
              <p className="text-gray-500 text-sm mt-2">Be the first to say hello! 👋</p>
              <div className="mt-6 flex justify-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  Share ideas
                </span>
                <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                  Ask questions
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Collaborate
                </span>
              </div>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              const isOwnMessage = msg.from?.identity === localParticipant.localParticipant?.identity;
              const senderName = msg.from?.name || msg.from?.identity || "Unknown";
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    isOwnMessage ? "flex-row-reverse chat-message-own-enter" : "chat-message-enter"
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback 
                      className={cn(
                        "text-white text-xs font-semibold",
                        getSenderColor(msg.from?.identity)
                      )}
                    >
                      {getSenderInitials(senderName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message content */}
                  <div className={cn(
                    "flex-1 max-w-[75%]",
                    isOwnMessage && "items-end"
                  )}>
                    {/* Sender name and time */}
                    <div className={cn(
                      "flex items-baseline gap-2 mb-1",
                      isOwnMessage && "flex-row-reverse"
                    )}>
                      <span className="text-xs font-medium text-gray-700">
                        {isOwnMessage ? "You" : senderName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {getMessageTime(msg.timestamp)}
                      </span>
                    </div>

                    {/* Message bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 break-words transition-all duration-200 hover:shadow-md group relative",
                        isOwnMessage 
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-tr-sm hover:from-emerald-700 hover:to-emerald-600" 
                          : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-tl-sm hover:from-gray-200 hover:to-gray-100 border border-gray-200"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      
                      {/* Quick reactions (placeholder) */}
                      <div className={cn(
                        "absolute -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                        isOwnMessage ? "left-0" : "right-0"
                      )}>
                        <div className="flex gap-1 bg-white rounded-full shadow-lg px-1 py-0.5 border border-gray-200">
                          <button className="hover:scale-125 transition-transform duration-150 text-xs">👍</button>
                          <button className="hover:scale-125 transition-transform duration-150 text-xs">❤️</button>
                          <button className="hover:scale-125 transition-transform duration-150 text-xs">😊</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
            <span className="text-xs text-gray-500">Someone is typing...</span>
          </div>
        </div>
      )}

      {/* Message input area */}
      <div className="border-t border-gray-200 p-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex gap-2 chat-input-focus rounded-xl">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setIsTyping(e.target.value.length > 0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts..."
              className={cn(
                "w-full px-5 py-4 rounded-xl border-2",
                "bg-white text-gray-800 placeholder-gray-400",
                "resize-none overflow-hidden",
                "focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500",
                "transition-all duration-200",
                "text-sm leading-relaxed font-medium",
                message.length > 0 ? "border-emerald-300" : "border-gray-200"
              )}
              rows={1}
              style={{ minHeight: "52px", maxHeight: "120px" }}
            />
            
            {/* Character count */}
            {message.length > 0 && (
              <span className={cn(
                "absolute bottom-3 right-4 text-xs font-medium transition-colors duration-200",
                message.length > 400 ? "text-orange-500" : message.length > 300 ? "text-yellow-500" : "text-emerald-500"
              )}>
                {message.length}/500
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-end gap-1">
            {/* Emoji button (placeholder) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg hover:bg-gray-200"
              title="Add emoji"
            >
              <Smile className="h-5 w-5 text-gray-500" />
            </Button>

            {/* Attachment button (placeholder) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg hover:bg-gray-200"
              title="Attach file"
            >
              <Paperclip className="h-5 w-5 text-gray-500" />
            </Button>

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              className={cn(
                "h-12 w-12 rounded-xl transition-all duration-200 shadow-md",
                message.trim() 
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white hover:shadow-lg hover:scale-105" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
              size="icon"
            >
              <Send className={cn(
                "h-5 w-5 transition-transform duration-200",
                message.trim() && "rotate-[-25deg]"
              )} />
            </Button>
          </div>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}