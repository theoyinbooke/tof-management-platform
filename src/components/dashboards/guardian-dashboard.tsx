"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProfileCompletionBanner } from "@/components/profile/profile-completion-banner";
import { ProfileSetupWizard } from "@/components/profile/profile-setup-wizard";
import {
  GraduationCap,
  Calendar,
  FileText,
  DollarSign,
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export function GuardianDashboard() {
  const { user } = useCurrentUser();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  // Real-time data queries
  const profileCompletion = useQuery(
    api.users.checkProfileCompletion,
    user ? { userId: user._id } : "skip"
  );

  // If showing profile setup wizard
  if (showProfileSetup && user) {
    return (
      <ProfileSetupWizard
        userId={user._id}
        userRole={user.role}
        userName={`${user.firstName} ${user.lastName}`}
        onComplete={() => setShowProfileSetup(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner onSetupProfile={() => setShowProfileSetup(true)} />
      
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Guardian Dashboard</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Welcome, {user?.firstName}
          </p>
        </div>
        {!profileCompletion?.isComplete && (
          <Button 
            onClick={() => setShowProfileSetup(true)}
            variant="outline"
            size="sm"
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 h-8 text-xs"
          >
            Complete Profile
          </Button>
        )}
      </div>

      {/* Ward Overview - Compact */}
      <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider">Your Ward</p>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5">Mary Johnson</h2>
              <div className="flex gap-2 mt-2">
                <Badge className="text-xs px-1.5 py-0 bg-emerald-600 text-white">JSS 3</Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-emerald-300 text-emerald-700">Active</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 uppercase tracking-wider">Performance</p>
              <p className="text-3xl font-bold text-emerald-700 mt-0.5">88%</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-600">+5% this term</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats - Compact & Beautiful */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="group hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden relative">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance</p>
                <p className="text-2xl font-bold mt-1">95%</p>
              </div>
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Programs Attended</p>
                <p className="text-2xl font-bold mt-1">8</p>
              </div>
              <Calendar className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Payment</p>
                <p className="text-lg font-bold mt-1">Jan 15</p>
              </div>
              <DollarSign className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages</p>
                <p className="text-2xl font-bold mt-1">2</p>
              </div>
              <MessageSquare className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Progress and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Academic Progress</CardTitle>
            <CardDescription>Current term performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Mathematics</span>
                  <span className="text-sm font-bold">85%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "85%" }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">English</span>
                  <span className="text-sm font-bold">92%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "92%" }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Sciences</span>
                  <span className="text-sm font-bold">88%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "88%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>Latest activities and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-2 w-2 bg-success rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Excellent Performance</p>
                  <p className="text-xs text-gray-600">Scored 95% in Mathematics test</p>
                  <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-2 w-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Program Attendance</p>
                  <p className="text-xs text-gray-600">Attended Career Guidance Workshop</p>
                  <p className="text-xs text-gray-400 mt-1">1 week ago</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-2 w-2 bg-warning rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment Reminder</p>
                  <p className="text-xs text-gray-600">School fees payment due in 2 weeks</p>
                  <p className="text-xs text-gray-400 mt-1">Important</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}