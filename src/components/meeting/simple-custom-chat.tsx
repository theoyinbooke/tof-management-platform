"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, useLocalParticipant } from "@livekit/components-react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SimpleChatProps {
  className?: string;
  userName?: string;
}

export function SimpleCustomChat({ className, userName }: SimpleChatProps) {
  const { send, chatMessages } = useChat();
  const localParticipant = useLocalParticipant();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  return (
    <div className={cn("flex flex-col h-full bg-gradient-to-b from-white to-gray-50", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          Meeting Chat
          <span className="inline-flex h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {chatMessages.length} messages
        </p>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {chatMessages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">No messages yet</p>
            <p className="text-gray-500 text-sm mt-1">Start the conversation! 👋</p>
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
                  isOwnMessage && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md",
                  isOwnMessage ? "bg-emerald-600" : "bg-sky-500"
                )}>
                  {senderName.charAt(0).toUpperCase()}
                </div>

                {/* Message */}
                <div className={cn(
                  "flex-1 max-w-[75%]",
                  isOwnMessage && "text-right"
                )}>
                  <div className={cn(
                    "text-xs font-medium text-gray-600 mb-1",
                    isOwnMessage && "text-right"
                  )}>
                    {isOwnMessage ? "You" : senderName}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 break-words shadow-sm transition-all duration-200 hover:shadow-md",
                      isOwnMessage 
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-tr-sm" 
                        : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-tl-sm border border-gray-200"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts..."
              className={cn(
                "w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 placeholder-gray-400",
                "resize-none overflow-hidden focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500",
                "transition-all duration-200 text-sm leading-relaxed",
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

          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className={cn(
              "h-12 w-12 rounded-xl transition-all duration-200 shadow-md",
              message.trim() 
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white hover:shadow-lg hover:scale-105" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <Send className={cn(
              "h-5 w-5 transition-transform duration-200",
              message.trim() && "rotate-[-25deg]"
            )} />
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}