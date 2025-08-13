"use client";

import React from "react";
import { QuickMessage } from "./quick-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, AlertTriangle, DollarSign, GraduationCap } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface ContextMessagingProps {
  foundationId: Id<"foundations">;
  currentUserId: Id<"users">;
  context: "academic" | "financial" | "alert" | "general";
  beneficiaryId?: Id<"beneficiaries">;
  adminIds?: Id<"users">[];
  metadata?: {
    alertId?: string;
    invoiceId?: string;
    sessionId?: string;
    performanceId?: string;
  };
}

/**
 * Context-aware messaging component that provides quick messaging
 * options based on the current context (academic, financial, alerts)
 */
export function ContextMessaging({ 
  foundationId, 
  currentUserId, 
  context, 
  beneficiaryId,
  adminIds = [],
  metadata 
}: ContextMessagingProps) {
  const getContextIcon = () => {
    switch (context) {
      case "academic":
        return <GraduationCap className="h-5 w-5 text-blue-600" />;
      case "financial":
        return <DollarSign className="h-5 w-5 text-emerald-600" />;
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-600" />;
    }
  };

  const getContextTitle = () => {
    switch (context) {
      case "academic":
        return "Academic Communication";
      case "financial":
        return "Financial Communication";
      case "alert":
        return "Alert Communication";
      default:
        return "General Communication";
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case "academic":
        return "Communicate about academic performance, attendance, or sessions";
      case "financial":
        return "Discuss payments, invoices, or financial matters";
      case "alert":
        return "Address urgent alerts and required interventions";
      default:
        return "General communication between stakeholders";
    }
  };

  const getQuickMessageTemplates = () => {
    switch (context) {
      case "academic":
        return [
          "Let's discuss your recent academic performance and how we can help improve it.",
          "I'd like to schedule a meeting to review your progress this term.",
          "Congratulations on your excellent performance! Keep up the great work.",
          "We've noticed some attendance concerns. Can we arrange a time to talk?",
        ];
      case "financial":
        return [
          "Your payment has been processed successfully. Thank you!",
          "We need to discuss your outstanding invoice. Please contact us.",
          "Your scholarship disbursement has been approved and will be processed soon.",
          "Please provide the required financial documentation for processing.",
        ];
      case "alert":
        return [
          "We need to address an urgent academic alert. Please respond as soon as possible.",
          "Your attendance rate requires immediate attention. Let's discuss how to improve it.",
          "An intervention may be needed. Can we schedule a meeting to discuss support options?",
          "Please review the alert and let us know your plan of action.",
        ];
      default:
        return [
          "Hi! I wanted to reach out regarding your foundation activities.",
          "Please let me know if you have any questions or concerns.",
          "I'm here to help with any support you might need.",
          "Thank you for your participation in our programs.",
        ];
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getContextIcon()}
          {getContextTitle()}
        </CardTitle>
        <CardDescription>
          {getContextDescription()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900">Quick Actions</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Message Admins */}
            {adminIds.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Contact Foundation Admins</p>
                <div className="flex flex-wrap gap-2">
                  {adminIds.slice(0, 3).map((adminId) => (
                    <QuickMessage
                      key={adminId}
                      foundationId={foundationId}
                      currentUserId={currentUserId}
                      recipientId={adminId}
                      triggerText="Message Admin"
                      triggerVariant="outline"
                      className="text-xs"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Message Beneficiary */}
            {beneficiaryId && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Contact Beneficiary</p>
                <QuickMessage
                  foundationId={foundationId}
                  currentUserId={currentUserId}
                  recipientId={beneficiaryId}
                  triggerText="Message Student"
                  triggerVariant="outline"
                  className="text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Template Messages */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900">Quick Message Templates</h4>
          
          <div className="grid gap-2">
            {getQuickMessageTemplates().slice(0, 2).map((template, index) => (
              <Button
                key={index}
                variant="ghost"
                className="text-left h-auto p-3 text-sm text-gray-700 hover:bg-gray-50 justify-start"
                onClick={() => {
                  // This would open the quick message dialog with pre-filled content
                  // Implementation depends on how you want to handle template selection
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />
                <span className="truncate">{template}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Context-Specific Information */}
        {metadata && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900">Related Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {metadata.alertId && (
                <p>Alert ID: <span className="font-mono text-xs">{metadata.alertId}</span></p>
              )}
              {metadata.invoiceId && (
                <p>Invoice ID: <span className="font-mono text-xs">{metadata.invoiceId}</span></p>
              )}
              {metadata.sessionId && (
                <p>Session ID: <span className="font-mono text-xs">{metadata.sessionId}</span></p>
              )}
              {metadata.performanceId && (
                <p>Performance ID: <span className="font-mono text-xs">{metadata.performanceId}</span></p>
              )}
            </div>
          </div>
        )}

        {/* General Messaging */}
        <div className="pt-3 border-t border-gray-200">
          <QuickMessage
            foundationId={foundationId}
            currentUserId={currentUserId}
            triggerText="Send Custom Message"
            triggerVariant="default"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage in different contexts
export function AcademicMessaging(props: Omit<ContextMessagingProps, "context">) {
  return <ContextMessaging {...props} context="academic" />;
}

export function FinancialMessaging(props: Omit<ContextMessagingProps, "context">) {
  return <ContextMessaging {...props} context="financial" />;
}

export function AlertMessaging(props: Omit<ContextMessagingProps, "context">) {
  return <ContextMessaging {...props} context="alert" />;
}