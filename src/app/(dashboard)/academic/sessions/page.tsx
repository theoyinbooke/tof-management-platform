"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Plus,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  GraduationCap,
  School,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AcademicSessionsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState("all");

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch academic sessions
  const academicSessions = useQuery(
    api.academicSessions.getByFoundation,
    foundationId ? { foundationId, status: statusFilter !== "all" ? statusFilter as any : undefined } : "skip"
  );

  // Fetch academic levels for context
  const academicLevels = useQuery(
    api.academic.getActiveByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  const updateSessionStatus = useMutation(api.academicSessions.updateStatus);

  const handleStatusUpdate = async (sessionId: Id<"academicSessions">, status: string, isPromoted?: boolean) => {
    try {
      await updateSessionStatus({
        sessionId,
        status: status as any,
        isPromoted,
      });
      toast.success(`Session status updated to ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update session status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "planned":
        return <Badge className="bg-yellow-100 text-yellow-800">Planned</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="w-4 h-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "planned":
        return <Calendar className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredSessions = academicSessions?.filter(session => {
    const matchesSearch = searchQuery === "" || 
      session.sessionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.beneficiaryUser?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.beneficiaryUser?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.schoolName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = selectedTab === "all" || session.status === selectedTab;

    return matchesSearch && matchesTab;
  });

  const sessionStats = {
    total: academicSessions?.length || 0,
    active: academicSessions?.filter(s => s.status === "active").length || 0,
    completed: academicSessions?.filter(s => s.status === "completed").length || 0,
    planned: academicSessions?.filter(s => s.status === "planned").length || 0,
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Academic Sessions</h1>
            <p className="text-gray-600 mt-1">Manage beneficiary academic sessions and track progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/academic")}>
              <GraduationCap className="w-4 h-4 mr-2" />
              Academic Dashboard
            </Button>
            <Button onClick={() => router.push("/academic/sessions/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{sessionStats.total}</div>
              <p className="text-xs text-gray-600 mt-1">All academic sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Active Sessions</CardTitle>
                <Clock className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{sessionStats.active}</div>
              <p className="text-xs text-gray-600 mt-1">Currently ongoing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{sessionStats.completed}</div>
              <p className="text-xs text-gray-600 mt-1">Successfully finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Planned</CardTitle>
                <Calendar className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{sessionStats.planned}</div>
              <p className="text-xs text-gray-600 mt-1">Upcoming sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search sessions, beneficiaries, or schools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Sessions ({sessionStats.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({sessionStats.active})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({sessionStats.completed})</TabsTrigger>
            <TabsTrigger value="planned">Planned ({sessionStats.planned})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            {filteredSessions && filteredSessions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredSessions.map((session) => (
                  <Card key={session._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Session Header */}
                          <div className="flex items-center gap-3">
                            {getStatusIcon(session.status)}
                            <div>
                              <h3 className="text-lg font-semibold">{session.sessionName}</h3>
                              <p className="text-sm text-gray-600">
                                {session.sessionType === "term" ? "Term" : "Semester"} • 
                                {formatDate(new Date(session.startDate))} - {formatDate(new Date(session.endDate))}
                              </p>
                            </div>
                            {getStatusBadge(session.status)}
                          </div>

                          {/* Session Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Beneficiary Info */}
                            <div className="flex items-center gap-3">
                              <Users className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">
                                  {session.beneficiaryUser?.firstName} {session.beneficiaryUser?.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {session.beneficiary?.beneficiaryNumber}
                                </p>
                              </div>
                            </div>

                            {/* Academic Level */}
                            <div className="flex items-center gap-3">
                              <GraduationCap className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">{session.academicLevel?.name}</p>
                                <p className="text-sm text-gray-600 capitalize">
                                  {session.academicLevel?.category}
                                </p>
                              </div>
                            </div>

                            {/* School Info */}
                            <div className="flex items-center gap-3">
                              <School className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">{session.schoolName}</p>
                                {session.schoolAddress && (
                                  <p className="text-sm text-gray-600">{session.schoolAddress}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Contact Info */}
                          {session.schoolContact && (
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              {session.schoolContact.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {session.schoolContact.phone}
                                </div>
                              )}
                              {session.schoolContact.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {session.schoolContact.email}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/academic/sessions/${session._id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => router.push(`/academic/sessions/${session._id}/edit`)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Session
                              </DropdownMenuItem>
                              {session.status === "active" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(session._id, "completed", true)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Complete & Promote
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(session._id, "completed", false)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Complete (No Promotion)
                                  </DropdownMenuItem>
                                </>
                              )}
                              {session.status === "planned" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(session._id, "active")}
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Start Session
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => router.push(`/academic/performance?session=${session._id}`)}
                              >
                                <GraduationCap className="w-4 h-4 mr-2" />
                                Record Performance
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Academic Sessions Found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery 
                      ? `No sessions match your search criteria.`
                      : selectedTab === "all" 
                      ? "Create your first academic session to start tracking beneficiary progress."
                      : `No ${selectedTab} sessions found.`
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => router.push("/academic/sessions/create")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Session
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}