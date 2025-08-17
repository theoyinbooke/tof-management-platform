"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  ArrowRight,
} from "lucide-react";

export function ReviewerDashboard() {
  const { user } = useCurrentUser();

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Review Dashboard</h1>
          <p className="text-sm text-gray-600 mt-0.5">Welcome back, {user?.firstName}</p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 text-xs">
          5 pending reviews
        </Badge>
      </div>

      {/* Stats - Compact & Beautiful */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="group hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden relative">
          <CardContent className="p-4">
            <div className="absolute inset-0 bg-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:scale-105 transition-transform duration-300 origin-left">5</p>
                <p className="text-xs text-gray-500 mt-1">To review</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden relative">
          <CardContent className="p-4">
            <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:scale-105 transition-transform duration-300 origin-left">3</p>
                <p className="text-xs text-gray-500 mt-1">Reviewed</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden relative">
          <CardContent className="p-4">
            <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Urgent</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:scale-105 transition-transform duration-300 origin-left">2</p>
                <p className="text-xs text-gray-500 mt-1">Due soon</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden relative">
          <CardContent className="p-4">
            <div className="absolute inset-0 bg-sky-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:scale-105 transition-transform duration-300 origin-left">47</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="p-2 rounded-lg bg-sky-50 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-4 w-4 text-sky-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </CardContent>
        </Card>
      </div>

      {/* Applications to Review - Compact */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Applications Pending Review</CardTitle>
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                5 pending
              </Badge>
            </div>
            <Button size="sm" className="h-7 text-xs">
              Start Reviewing
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 bg-gradient-to-br from-sky-100 to-sky-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">Application #{1000 + item}</p>
                      <Badge 
                        variant={item <= 2 ? "destructive" : "outline"} 
                        className={`text-xs px-1.5 py-0 ${
                          item <= 2 ? "bg-red-50 text-red-700 border-red-300" : ""
                        }`}
                      >
                        {item <= 2 ? "Due Tomorrow" : "5 days left"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">Submitted 2 days ago</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-7 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  Review
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}