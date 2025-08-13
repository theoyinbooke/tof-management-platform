"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
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
} from "lucide-react";

export function BeneficiaryDashboard() {
  const { user } = useCurrentUser();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary-hover text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="mt-2 text-white/90">
          Keep up the great work! Your academic journey is progressing well.
        </p>
        <div className="mt-4 flex gap-4">
          <div>
            <p className="text-sm text-white/70">Current Level</p>
            <p className="text-lg font-semibold">SSS 2</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Academic Performance</p>
            <p className="text-lg font-semibold">85%</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Next Payment</p>
            <p className="text-lg font-semibold">Jan 15, 2025</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Programs</p>
                <p className="text-2xl font-bold mt-1">3</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resources Available</p>
                <p className="text-2xl font-bold mt-1">12</p>
              </div>
              <BookOpen className="h-8 w-8 text-secondary" />
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
              <MessageSquare className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Progress</CardTitle>
            <CardDescription>Your performance this term</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Performance</span>
                  <span className="text-sm font-bold text-primary">85%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "85%" }}></div>
                </div>
              </div>
              
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Attendance</span>
                  <Badge variant="outline" className="text-success">92%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Assignments Completed</span>
                  <Badge variant="outline">18/20</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Term Grade</span>
                  <Badge variant="outline" className="text-primary">A-</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Programs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Programs</CardTitle>
                <CardDescription>Don't miss these events</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Career Guidance Workshop</p>
                  <p className="text-sm text-gray-600">Tomorrow, 2:00 PM</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Mentorship Session</p>
                  <p className="text-sm text-gray-600">Friday, 10:00 AM</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Study Skills Training</p>
                  <p className="text-sm text-gray-600">Next Monday, 3:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources Section */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Resources</CardTitle>
          <CardDescription>Materials to support your studies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start">
              <FileText className="mr-3 h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Study Guides</p>
                <p className="text-xs text-gray-500">5 documents</p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 justify-start">
              <BookOpen className="mr-3 h-5 w-5 text-secondary" />
              <div className="text-left">
                <p className="font-medium">Past Questions</p>
                <p className="text-xs text-gray-500">12 sets available</p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 justify-start">
              <Trophy className="mr-3 h-5 w-5 text-warning" />
              <div className="text-left">
                <p className="font-medium">Career Resources</p>
                <p className="text-xs text-gray-500">8 guides</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}