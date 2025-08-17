"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Calendar,
  Users,
  MapPin,
  Clock,
  BookOpen,
  Award,
  Plus,
  Eye,
  Edit,
  UserPlus,
  Target,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  User,
  GraduationCap,
  Video
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ProgramCard } from "@/components/programs/program-card";
import { EnrollmentDialog } from "@/components/programs/enrollment-dialog";
import { useRouter } from "next/navigation";

export default function ProgramsPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Fetch data
  const programs = useQuery(
    api.programs.getByFoundation,
    user?.foundationId ? {
      foundationId: user.foundationId,
      status: filterStatus === "all" ? undefined : filterStatus,
      type: filterType === "all" ? undefined : filterType,
    } : "skip"
  );

  const statistics = useQuery(
    api.programs.getStatistics,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );

  const canManagePrograms = user?.role === "admin" || user?.role === "super_admin";
  const canEnroll = user?.role === "beneficiary" || user?.role === "guardian";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Planning</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800"><Activity className="w-3 h-3 mr-1" />Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      workshop: { icon: BookOpen, label: "Workshop", color: "bg-purple-100 text-purple-800" },
      mentorship: { icon: User, label: "Mentorship", color: "bg-blue-100 text-blue-800" },
      tutoring: { icon: GraduationCap, label: "Tutoring", color: "bg-green-100 text-green-800" },
      scholarship: { icon: Award, label: "Scholarship", color: "bg-yellow-100 text-yellow-800" },
      career_guidance: { icon: Target, label: "Career Guidance", color: "bg-indigo-100 text-indigo-800" },
      life_skills: { icon: TrendingUp, label: "Life Skills", color: "bg-pink-100 text-pink-800" },
      other: { icon: BookOpen, label: "Other", color: "bg-gray-100 text-gray-800" },
    };

    const config = typeMap[type as keyof typeof typeMap] || typeMap.other;
    const IconComponent = config.icon;

    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "beneficiary", "guardian", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Programs</h1>
            <p className="text-gray-600 mt-1">
              Educational and development programs
            </p>
          </div>
          <div className="flex gap-2">
            {canEnroll && (
              <Button variant="outline" onClick={() => setEnrollDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll in Program
              </Button>
            )}
            {canManagePrograms && (
              <Button onClick={() => router.push("/programs/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Program
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Programs</CardTitle>
                <BookOpen className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalPrograms || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                {statistics?.activePrograms || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Enrollments</CardTitle>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalEnrollments || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                Across all programs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Sessions</CardTitle>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalSessions || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                {statistics?.completedSessions || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.attendanceRate || 0}%</div>
              <p className="text-xs text-gray-600 mt-1">
                Average across sessions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All Status
            </Button>
            <Button
              variant={filterStatus === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("active")}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === "planning" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("planning")}
            >
              Planning
            </Button>
            <Button
              variant={filterStatus === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("completed")}
            >
              Completed
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All Types
            </Button>
            <Button
              variant={filterType === "workshop" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("workshop")}
            >
              Workshops
            </Button>
            <Button
              variant={filterType === "mentorship" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("mentorship")}
            >
              Mentorship
            </Button>
            <Button
              variant={filterType === "tutoring" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("tutoring")}
            >
              Tutoring
            </Button>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs?.map((program) => (
            <Card key={program._id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {getStatusBadge(program.status)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Starts {formatDate(new Date(program.startDate))}</span>
                  </div>
                  
                  {program.venue && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{program.venue}</span>
                    </div>
                  )}
                  
                  {program.isVirtual && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <Video className="w-4 h-4" />
                      <span>Online Program</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {program.currentParticipants || 0} enrolled
                      {program.maxParticipants && ` / ${program.maxParticipants} max`}
                    </span>
                  </div>
                  
                  {program.coordinator && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>
                        {program.coordinator.firstName} {program.coordinator.lastName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  {program.isVirtual && program.status === "active" && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => router.push("/meetings")}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Join Online
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className={program.isVirtual && program.status === "active" ? "" : "flex-1"}
                    onClick={() => window.open(`/programs/${program._id}`, '_self')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  {canManagePrograms && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/programs/${program._id}/edit`, '_self')}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) || (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No programs found</p>
              {canManagePrograms && (
                <Button className="mt-4" onClick={() => router.push("/programs/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Program
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Create Program Dialog - removed as we're using router navigation */}

        {/* Enrollment Dialog */}
        <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enroll in Program</DialogTitle>
              <DialogDescription>
                Select a program to enroll in
              </DialogDescription>
            </DialogHeader>
            <EnrollmentDialog
              foundationId={user?.foundationId!}
              beneficiaryId={user?.role === "beneficiary" ? user._id : undefined}
              onSuccess={() => setEnrollDialogOpen(false)}
              onCancel={() => setEnrollDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}