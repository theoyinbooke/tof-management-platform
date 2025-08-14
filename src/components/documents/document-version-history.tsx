"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  History,
  FileText,
  User,
  Calendar,
  Download,
  Eye,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface DocumentVersionHistoryProps {
  documentId: Id<"documents">;
  className?: string;
}

export function DocumentVersionHistory({ 
  documentId, 
  className 
}: DocumentVersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get document details
  const document = useQuery(
    api.documents.getById,
    { documentId }
  );

  // Get audit logs for this document
  const auditLogs = useQuery(
    api.auditLogs.getByEntity,
    document ? {
      foundationId: document.foundationId,
      entityType: "documents",
      entityId: documentId,
    } : "skip"
  );

  if (!document) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <History className="w-8 h-8 mx-auto mb-2" />
            <p>Loading version history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "document_uploaded":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "document_approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "document_rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "document_status_updated":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "document_reviewed":
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "document_uploaded":
        return "bg-blue-100 text-blue-800";
      case "document_approved":
        return "bg-green-100 text-green-800";
      case "document_rejected":
        return "bg-red-100 text-red-800";
      case "document_status_updated":
        return "bg-yellow-100 text-yellow-800";
      case "document_reviewed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionDescription = (action: string, description?: string) => {
    switch (action) {
      case "document_uploaded":
        return "Document uploaded to the system";
      case "document_approved":
        return "Document approved by reviewer";
      case "document_rejected":
        return "Document rejected by reviewer";
      case "document_status_updated":
        return "Document status changed";
      case "document_reviewed":
        return "Document reviewed";
      default:
        return description || "Document action performed";
    }
  };

  // Create timeline entries from audit logs and document data
  const timelineEntries = [
    // Document upload entry
    {
      id: "upload",
      action: "document_uploaded",
      user: document.uploadedByUser,
      timestamp: document.createdAt,
      description: `Document uploaded`,
      details: {
        fileSize: document.fileSize,
        fileType: document.fileType,
        documentType: document.documentType,
      }
    },
    // Review entry if document has been reviewed
    ...(document.reviewDate ? [{
      id: "review",
      action: document.status === "approved" ? "document_approved" : "document_rejected",
      user: document.reviewedByUser,
      timestamp: document.reviewDate,
      description: document.reviewNotes || getActionDescription(document.status === "approved" ? "document_approved" : "document_rejected"),
      details: {
        status: document.status,
        reviewNotes: document.reviewNotes,
      }
    }] : []),
    // Add audit log entries
    ...(auditLogs?.map(log => ({
      id: log._id,
      action: log.action,
      user: {
        firstName: log.userEmail.split('@')[0], // Fallback if user details not available
        lastName: "",
        email: log.userEmail,
      },
      timestamp: log.createdAt,
      description: log.description,
      details: log.details || {},
    })) || [])
  ].sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

  const visibleEntries = isExpanded ? timelineEntries : timelineEntries.slice(0, 3);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Version History
        </CardTitle>
        <CardDescription>
          Track all changes and actions performed on this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        {timelineEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No version history available</p>
            <p className="text-sm mt-1">Actions will appear here as they occur</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleEntries.map((entry, index) => (
              <div key={entry.id} className="relative">
                {/* Timeline line */}
                {index < visibleEntries.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200" />
                )}
                
                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {getActionIcon(entry.action)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getActionColor(entry.action)}>
                        {entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatDate(new Date(entry.timestamp))}
                      </span>
                    </div>
                    
                    <p 
                      className="text-sm font-medium text-gray-900 mb-1 break-words"
                      style={{ 
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        lineHeight: '1.4'
                      }}
                    >
                      {entry.description}
                    </p>
                    
                    {entry.user && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <User className="w-3 h-3" />
                        <span>
                          {entry.user.firstName} {entry.user.lastName}
                          {entry.user.email && ` (${entry.user.email})`}
                        </span>
                      </div>
                    )}
                    
                    {/* Additional details */}
                    {Object.keys(entry.details).length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-2">
                        <div className="space-y-1">
                          {Object.entries(entry.details).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                              </span>
                              <span className="text-gray-900 font-medium">
                                {typeof value === 'string' ? value : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show more/less button */}
            {timelineEntries.length > 3 && (
              <div className="text-center pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show {timelineEntries.length - 3} More
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}