"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  Calendar,
  School
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: FileText },
  pending_review: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  returned: { label: "Returned", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
};

export default function ApplicationsPage() {
  const applications = useQuery(api.applications.getMyApplications);
  const stats = useQuery(api.applications.getApplicationStats);
  
  const getStatusBadge = (status: keyof typeof statusConfig) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={cn("flex items-center gap-1", config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };
  
  const EmptyState = () => (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
        <p className="text-gray-500 text-center mb-6 max-w-sm">
          You haven't submitted any scholarship applications. Start your journey to educational support today!
        </p>
        <Button asChild>
          <Link href="/beneficiary/apply">
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-gray-600 mt-1">Track and manage your scholarship applications</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/beneficiary/apply">
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Link>
        </Button>
      </div>
      
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Applications List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Applications</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {!applications || applications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {application.foundation?.name || "Unknown Foundation"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Application ID: {application._id.slice(0, 8)}...
                        </CardDescription>
                      </div>
                      {getStatusBadge(application.status as keyof typeof statusConfig)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted: {format(new Date(application.submittedAt), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <School className="w-4 h-4" />
                        <span>Level: {application.currentAcademicLevel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>School: {application.schoolName}</span>
                      </div>
                    </div>
                    
                    {application.reviewNotes && application.reviewNotes.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <p className="text-sm font-medium text-blue-900 mb-1">Latest Review Note:</p>
                        <p className="text-sm text-blue-700">
                          {application.reviewNotes[application.reviewNotes.length - 1]}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/beneficiary/applications/${application._id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                      
                      {application.status === "approved" && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download Letter
                        </Button>
                      )}
                      
                      {(application.status === "draft" || application.status === "returned") && (
                        <Button size="sm" asChild>
                          <Link href={`/beneficiary/applications/${application._id}/edit`}>
                            Continue Application
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {!applications || applications.filter(a => a.status === "pending_review").length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications
                .filter(a => a.status === "pending_review")
                .map((application) => (
                  <Card key={application._id} className="hover:shadow-md transition-shadow">
                    {/* Same card content as above */}
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="approved">
          {!applications || applications.filter(a => a.status === "approved").length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No approved applications yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications
                .filter(a => a.status === "approved")
                .map((application) => (
                  <Card key={application._id} className="hover:shadow-md transition-shadow">
                    {/* Same card content as above */}
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rejected">
          {!applications || applications.filter(a => a.status === "rejected").length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center py-8">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No rejected applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications
                .filter(a => a.status === "rejected")
                .map((application) => (
                  <Card key={application._id} className="hover:shadow-md transition-shadow">
                    {/* Same card content as above */}
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}