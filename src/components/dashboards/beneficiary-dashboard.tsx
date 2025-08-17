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
  BookOpen,
  MessageSquare,
  Trophy,
  Target,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { formatAcademicLevel } from "@/lib/profile-utils";

export function BeneficiaryDashboard() {
  const { user } = useCurrentUser();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  // Real-time data queries
  const profileCompletion = useQuery(
    api.users.checkProfileCompletion,
    user ? { userId: user._id } : "skip"
  );

  // Query for user's applications (using existing endpoint)
  const userApplications = useQuery(
    api.applications.getAll,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );

  // Mock data for now - these endpoints need to be created
  const userPrograms = null; // TODO: Create api.programs.getByUserId
  const userMessages = null; // TODO: Create api.notifications.getUnreadByUserId  
  const academicRecords = null; // TODO: Create api.academic.getByUserId
  const availableResources = null; // TODO: Create api.resources.getAvailable

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
      
      {/* Welcome Section - Compact */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Welcome back, {user?.firstName}!</h1>
            <p className="mt-1 text-sm text-white/90">
              {profileCompletion?.isComplete 
                ? "Keep up the great work on your academic journey!"
                : "Complete your profile to unlock all features."
              }
            </p>
          </div>
          {!profileCompletion?.isComplete && (
            <Button 
              onClick={() => setShowProfileSetup(true)}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs"
            >
              Complete Profile
            </Button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-xs text-white/70 uppercase tracking-wider">Level</p>
            <p className="text-base font-bold mt-0.5">
              {user?.profile?.beneficiaryInfo?.currentLevel 
                ? formatAcademicLevel(user.profile.beneficiaryInfo.currentLevel)
                : "Not Set"
              }
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-xs text-white/70 uppercase tracking-wider">Profile</p>
            <p className="text-base font-bold mt-0.5">
              {profileCompletion?.isComplete ? "✓ Complete" : `${profileCompletion?.completionPercentage || 0}%`}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-xs text-white/70 uppercase tracking-wider">School</p>
            <p className="text-base font-bold mt-0.5 truncate">
              {user?.profile?.beneficiaryInfo?.currentSchool || "Not Set"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats - Compact & Beautiful */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="group hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden relative">
          <CardContent className="p-4">
            <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Programs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:scale-105 transition-transform duration-300 origin-left">
                  {userPrograms ? userPrograms.filter(p => new Date(p.startDate) > new Date()).length : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Upcoming events</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden relative">
          <CardContent className="p-4">
            <div className="absolute inset-0 bg-sky-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Resources</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:scale-105 transition-transform duration-300 origin-left">
                  {availableResources ? availableResources.length : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Study materials</p>
              </div>
              <div className="p-2 rounded-lg bg-sky-50 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-4 w-4 text-sky-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden relative">
          <CardContent className="p-4">
            <div className="absolute inset-0 bg-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Messages</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:scale-105 transition-transform duration-300 origin-left">
                  {userMessages ? userMessages.length : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Unread notifications</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Progress - Compact */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Academic Progress</CardTitle>
            <CardDescription className="text-xs">Your performance this term</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {academicRecords && academicRecords.length > 0 ? (
              <div className="space-y-3">
                {academicRecords.slice(0, 1).map((record) => (
                  <div key={record._id}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Performance</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-emerald-600">
                          {record.overallGrade || record.percentage || "0"}%
                        </span>
                        <span className="text-xs text-gray-500">overall</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500" 
                        style={{ width: `${record.percentage || 0}%` }}
                      />
                    </div>
                    
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <span className="text-xs text-gray-600">Attendance</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 text-green-700 border-green-300 bg-green-50">
                          {record.attendance || "N/A"}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <span className="text-xs text-gray-600">Session</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {record.session || "Current"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <span className="text-xs text-gray-600">Term</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 text-emerald-700 border-emerald-300 bg-emerald-50">
                          {record.term || "Current"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <GraduationCap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No Academic Records</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Your academic performance data will appear here once uploaded.
                </p>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Upload Report Card
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Programs - Compact */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Upcoming Programs</CardTitle>
                <CardDescription className="text-xs">Don't miss these events</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {userPrograms?.filter(p => new Date(p.startDate) > new Date()).length > 0 ? (
              <div className="space-y-2">
                {userPrograms
                  .filter(p => new Date(p.startDate) > new Date())
                  .slice(0, 3)
                  .map((program) => (
                    <div key={program._id} className="group flex gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer">
                      <div className="h-8 w-8 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Trophy className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{program.title}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(program.startDate).toLocaleDateString('en-NG', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No Upcoming Programs</h3>
                <p className="text-xs text-gray-600 mb-3">
                  You don't have any scheduled programs at the moment.
                </p>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Browse Programs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resources Section - Compact */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Learning Resources</CardTitle>
              <CardDescription className="text-xs">Materials to support your studies</CardDescription>
            </div>
            {availableResources && availableResources.length > 6 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {availableResources && availableResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {availableResources.slice(0, 6).map((resource) => (
                <Button 
                  key={resource._id} 
                  variant="outline" 
                  className="h-auto p-3 justify-start hover:bg-sky-50 hover:border-sky-300 transition-colors group"
                >
                  <FileText className="mr-2 h-4 w-4 text-sky-600 group-hover:scale-110 transition-transform" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resource.title}</p>
                    <p className="text-xs text-gray-500">{resource.type || "Document"}</p>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No Resources Available</h3>
              <p className="text-xs text-gray-600 mb-3">
                Learning resources will be made available by your foundation.
              </p>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Contact Administrator
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}