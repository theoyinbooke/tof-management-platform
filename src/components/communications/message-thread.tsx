"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User,
  Calendar,
  Tag,
  Flag,
  ExternalLink
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface MessageThreadProps {
  messageId: Id<"communicationLogs">;
  className?: string;
}

export function MessageThread({ messageId, className }: MessageThreadProps) {
  // Fetch message details
  const message = useQuery(
    api.communications.getCommunicationById,
    messageId ? { communicationId: messageId } : "skip"
  );

  if (message === undefined) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (message === null) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Message not found</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case "delivered":
        return <Badge className="bg-blue-100 text-blue-800">Delivered</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4 text-blue-600" />;
      case "sms":
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case "in_app":
        return <Bell className="w-4 h-4 text-purple-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 font-semibold";
      case "high":
        return "text-orange-600 font-medium";
      case "normal":
        return "text-gray-600";
      case "low":
        return "text-gray-500";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "normal":
        return <Badge className="bg-gray-100 text-gray-800">Normal</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-600">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{message.subject || "No Subject"}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              {getTypeIcon(message.type)}
              <span className="capitalize">{message.type}</span>
              <span>•</span>
              <span>To: {message.recipient}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(message.status)}
            {getStatusBadge(message.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Message Metadata */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">{formatDate(new Date(message.createdAt))}</span>
            </div>
            
            {message.sentAt && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Sent:</span>
                <span className="font-medium">{formatDate(new Date(message.sentAt))}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Flag className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Priority:</span>
              {getPriorityBadge(message.priority)}
            </div>
          </div>

          <div className="space-y-3">
            {message.template && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Template:</span>
                <span className="font-medium">{message.template}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Attempts:</span>
              <span className="font-medium">{message.attemptCount || 1}</span>
            </div>

            {message.externalId && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">External ID:</span>
                <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                  {message.externalId}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Message Content */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Message Content</h4>
          <div className="p-4 bg-white border rounded-lg">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: message.content.replace(/\n/g, '<br>') 
              }}
            />
          </div>
        </div>

        {/* Template Data */}
        {message.templateData && Object.keys(message.templateData).length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Template Variables</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(message.templateData).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-600">{key}:</span>
                    <span className="text-sm text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Error Information */}
        {message.status === "failed" && message.errorMessage && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Error Details
              </h4>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{message.errorMessage}</p>
                {message.lastAttemptAt && (
                  <p className="text-xs text-red-600 mt-1">
                    Last attempt: {formatDate(new Date(message.lastAttemptAt))}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Delivery Timeline */}
        <Separator />
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Delivery Timeline</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Message Created</div>
                <div className="text-xs text-gray-600">{formatDate(new Date(message.createdAt))}</div>
              </div>
            </div>

            {message.sentAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Message Sent</div>
                  <div className="text-xs text-gray-600">{formatDate(new Date(message.sentAt))}</div>
                </div>
              </div>
            )}

            {message.status === "failed" && message.lastAttemptAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Delivery Failed</div>
                  <div className="text-xs text-gray-600">{formatDate(new Date(message.lastAttemptAt))}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}