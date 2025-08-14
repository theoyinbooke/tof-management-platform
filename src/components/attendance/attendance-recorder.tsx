"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Users, 
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  Edit,
  Eye,
  BookOpen,
  Timer
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface AttendanceRecorderProps {
  foundationId: Id<"foundations">;
}

interface AttendanceRecord {
  enrollmentId: Id<"programEnrollments">;
  status: "present" | "absent" | "late";
  notes?: string;
}

export function AttendanceRecorder({ foundationId }: AttendanceRecorderProps) {
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Convex queries
  const programs = useQuery(api.programs.getByFoundation, {
    foundationId,
  });

  const programSessions = useQuery(
    selectedProgram ? api.programs.getSessionsByProgram : "skip",
    selectedProgram ? {
      programId: selectedProgram as Id<"programs">,
      foundationId,
    } : undefined
  );

  const sessionAttendance = useQuery(
    selectedSession ? api.attendance.getSessionAttendance : "skip",
    selectedSession ? {
      sessionId: selectedSession as Id<"programSessions">,
      foundationId,
    } : undefined
  );

  // Mutations
  const recordAttendance = useMutation(api.attendance.recordSessionAttendance);
  const updateAttendance = useMutation(api.attendance.updateAttendanceRecord);

  // Filter session attendance based on search and status
  const filteredAttendance = React.useMemo(() => {
    if (!sessionAttendance) return [];
    
    return sessionAttendance.filter(record => {
      const matchesSearch = searchTerm === "" || 
        (record.beneficiaryUser?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         record.beneficiaryUser?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         record.beneficiary?.beneficiaryNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter = filterStatus === "all" || record.attendanceStatus === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [sessionAttendance, searchTerm, filterStatus]);

  // Handle attendance status change
  const handleAttendanceChange = (enrollmentId: string, status: "present" | "absent" | "late", notes?: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [enrollmentId]: {
        enrollmentId: enrollmentId as Id<"programEnrollments">,
        status,
        notes: notes || prev[enrollmentId]?.notes,
      }
    }));
  };

  // Handle notes change
  const handleNotesChange = (enrollmentId: string, notes: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        enrollmentId: enrollmentId as Id<"programEnrollments">,
        status: prev[enrollmentId]?.status || "present",
        notes,
      }
    }));
  };

  // Get attendance status for display
  const getAttendanceStatus = (enrollmentId: string, currentStatus: string) => {
    const localStatus = attendanceData[enrollmentId];
    if (localStatus) return localStatus.status;
    if (currentStatus !== "not_recorded") return currentStatus as "present" | "absent" | "late";
    return "present"; // Default to present for new records
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    if (!selectedSession || !sessionAttendance) {
      toast.error("Please select a session first");
      return;
    }

    try {
      // Prepare attendance data for all students
      const attendanceRecords = sessionAttendance.map(record => {
        const localData = attendanceData[record.enrollmentId];
        return {
          enrollmentId: record.enrollmentId,
          status: localData?.status || (record.attendanceStatus !== "not_recorded" ? record.attendanceStatus as "present" | "absent" | "late" : "present"),
          notes: localData?.notes,
        };
      });

      await recordAttendance({
        sessionId: selectedSession as Id<"programSessions">,
        foundationId,
        attendanceData: attendanceRecords,
      });

      toast.success("Attendance recorded successfully!");
      setAttendanceData({}); // Clear local changes
    } catch (error) {
      toast.error("Failed to save attendance");
      console.error("Error saving attendance:", error);
    }
  };

  // Mark all as present
  const handleMarkAllPresent = () => {
    if (!sessionAttendance) return;
    
    const newData: Record<string, AttendanceRecord> = {};
    sessionAttendance.forEach(record => {
      newData[record.enrollmentId] = {
        enrollmentId: record.enrollmentId,
        status: "present",
        notes: attendanceData[record.enrollmentId]?.notes,
      };
    });
    setAttendanceData(newData);
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "late":
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Present</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>;
      case "late":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Late</Badge>;
      default:
        return <Badge variant="outline">Not Recorded</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Recording</h1>
          <p className="text-gray-600">Record and manage attendance for program sessions</p>
        </div>
      </div>

      {/* Session Selection */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Select Session
          </CardTitle>
          <CardDescription>Choose a program and session to record attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map((program) => (
                    <SelectItem key={program._id} value={program._id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {program.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Session</Label>
              <Select 
                value={selectedSession} 
                onValueChange={setSelectedSession}
                disabled={!selectedProgram}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {programSessions?.map((session) => (
                    <SelectItem key={session._id} value={session._id}>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.sessionDate).toLocaleDateString()} - {session.startTime}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Recording */}
      {selectedSession && sessionAttendance && (
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Record Attendance
                </CardTitle>
                <CardDescription>
                  {sessionAttendance.length} students enrolled in this session
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllPresent}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
                <Button
                  onClick={handleSaveAttendance}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or beneficiary number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="not_recorded">Not Recorded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Beneficiary ID</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => {
                    const currentAttendanceStatus = getAttendanceStatus(record.enrollmentId, record.attendanceStatus);
                    const hasLocalChanges = !!attendanceData[record.enrollmentId];
                    
                    return (
                      <TableRow key={record.enrollmentId} className={cn(
                        "hover:bg-gray-50",
                        hasLocalChanges && "bg-blue-50 border-l-2 border-l-blue-500"
                      )}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                              currentAttendanceStatus === "present" ? "bg-emerald-500" :
                              currentAttendanceStatus === "absent" ? "bg-red-500" :
                              currentAttendanceStatus === "late" ? "bg-amber-500" : "bg-gray-400"
                            )}>
                              {record.beneficiaryUser?.firstName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {record.beneficiaryUser?.firstName} {record.beneficiaryUser?.lastName}
                              </p>
                              {hasLocalChanges && (
                                <p className="text-xs text-blue-600 font-medium">Modified</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {record.beneficiary?.beneficiaryNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.attendanceStatus)}
                            {getStatusBadge(record.attendanceStatus)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant={currentAttendanceStatus === "present" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleAttendanceChange(record.enrollmentId, "present")}
                              className={cn(
                                currentAttendanceStatus === "present" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                              )}
                            >
                              <UserCheck className="h-3 w-3" />
                            </Button>
                            <Button
                              variant={currentAttendanceStatus === "late" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleAttendanceChange(record.enrollmentId, "late")}
                              className={cn(
                                currentAttendanceStatus === "late" && "bg-amber-600 hover:bg-amber-700"
                              )}
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                            <Button
                              variant={currentAttendanceStatus === "absent" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleAttendanceChange(record.enrollmentId, "absent")}
                              className={cn(
                                currentAttendanceStatus === "absent" && "bg-red-600 hover:bg-red-700"
                              )}
                            >
                              <UserX className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Add notes..."
                            value={attendanceData[record.enrollmentId]?.notes || record.notes || ""}
                            onChange={(e) => handleNotesChange(record.enrollmentId, e.target.value)}
                            className="max-w-48"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredAttendance.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== "all" 
                    ? "No students match your current filters." 
                    : "No students are enrolled in this session."
                  }
                </p>
              </div>
            )}

            {/* Summary */}
            {sessionAttendance.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{sessionAttendance.length}</div>
                  <p className="text-xs text-gray-600">Total Students</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-lg font-bold text-emerald-600">
                    {sessionAttendance.filter(r => getAttendanceStatus(r.enrollmentId, r.attendanceStatus) === "present").length}
                  </div>
                  <p className="text-xs text-emerald-700">Present</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-lg font-bold text-amber-600">
                    {sessionAttendance.filter(r => getAttendanceStatus(r.enrollmentId, r.attendanceStatus) === "late").length}
                  </div>
                  <p className="text-xs text-amber-700">Late</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {sessionAttendance.filter(r => getAttendanceStatus(r.enrollmentId, r.attendanceStatus) === "absent").length}
                  </div>
                  <p className="text-xs text-red-700">Absent</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedSession && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Session</h3>
            <p className="text-gray-600 mb-4">
              Choose a program and session to start recording attendance for students.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}