"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Shield, 
  GraduationCap,
  DollarSign,
  Settings,
  Save,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface CommunicationPreferencesProps {
  foundationId: Id<"foundations">;
  userId: Id<"users">;
}

export function CommunicationPreferences({ foundationId, userId }: CommunicationPreferencesProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current user data
  const user = useQuery(api.users.getById, { userId });

  // Mutations
  const updatePreferences = useMutation(api.communications.updateUserPreferences);

  // Initialize preferences with defaults
  const defaultPreferences = {
    emailNotifications: true,
    smsNotifications: true,
    academicAlerts: true,
    financialAlerts: true,
    administrativeNotifications: true,
    marketingCommunications: false,
  };

  const currentPreferences = user?.communicationPreferences || defaultPreferences;
  const [preferences, setPreferences] = useState(currentPreferences);

  // Handle preference change
  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updatePreferences({
        foundationId,
        userId,
        preferences,
      });
      toast.success("Communication preferences updated successfully");
    } catch (error) {
      toast.error("Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  // Check if preferences have changed
  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(currentPreferences);

  const preferenceItems = [
    {
      category: "Notification Channels",
      description: "Choose how you want to receive notifications",
      icon: Bell,
      items: [
        {
          key: "emailNotifications" as const,
          label: "Email Notifications",
          description: "Receive notifications via email",
          icon: Mail,
          enabled: preferences.emailNotifications,
        },
        {
          key: "smsNotifications" as const,
          label: "SMS Notifications",
          description: "Receive notifications via text message",
          icon: MessageSquare,
          enabled: preferences.smsNotifications,
        },
      ],
    },
    {
      category: "Alert Types",
      description: "Control which types of alerts you receive",
      icon: AlertTriangle,
      items: [
        {
          key: "academicAlerts" as const,
          label: "Academic Alerts",
          description: "Performance, attendance, and academic progress alerts",
          icon: GraduationCap,
          enabled: preferences.academicAlerts,
          critical: true,
        },
        {
          key: "financialAlerts" as const,
          label: "Financial Alerts",
          description: "Payment reminders, invoice notifications, and financial updates",
          icon: DollarSign,
          enabled: preferences.financialAlerts,
          critical: true,
        },
        {
          key: "administrativeNotifications" as const,
          label: "Administrative Notifications",
          description: "System updates, announcements, and general communications",
          icon: Settings,
          enabled: preferences.administrativeNotifications,
        },
      ],
    },
    {
      category: "Optional Communications",
      description: "Non-essential communications you can opt into",
      icon: Shield,
      items: [
        {
          key: "marketingCommunications" as const,
          label: "Marketing Communications",
          description: "Newsletters, program updates, and promotional content",
          icon: Mail,
          enabled: preferences.marketingCommunications,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communication Preferences</h2>
          <p className="text-gray-600">Manage how and when you receive notifications</p>
        </div>
        {hasChanges && (
          <Button 
            onClick={handleSavePreferences} 
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      {/* Current Status */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-emerald-900">Current Status</span>
            </div>
            <div className="flex items-center gap-2">
              {preferences.emailNotifications && (
                <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                  Email On
                </Badge>
              )}
              {preferences.smsNotifications && (
                <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                  SMS On
                </Badge>
              )}
              {!preferences.emailNotifications && !preferences.smsNotifications && (
                <Badge variant="outline" className="text-red-700 border-red-300">
                  All Disabled
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preference Categories */}
      <div className="space-y-6">
        {preferenceItems.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <category.icon className="h-5 w-5 text-gray-600" />
                <div>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <item.icon className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={item.key} className="font-medium text-gray-900">
                            {item.label}
                          </Label>
                          {item.critical && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                              Important
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      id={item.key}
                      checked={item.enabled}
                      onCheckedChange={(checked) => handlePreferenceChange(item.key, checked)}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                  {itemIndex < category.items.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900 mb-1">Important Notice</h3>
              <p className="text-sm text-orange-800">
                Critical alerts (Academic and Financial) are highly recommended to stay enabled. 
                Disabling these may cause you to miss important updates about your foundation activities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
            <CardDescription>Your current contact details for notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Address</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone Number</p>
                  <p className="text-sm text-gray-600">{user.phone || "Not provided"}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              To update your contact information, please contact your foundation administrator.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSavePreferences} 
            disabled={isSaving}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}