"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Eye, 
  Filter, 
  Search, 
  Target,
  TrendingDown,
  UserX,
  GraduationCap,
  Calendar,
  MessageSquare,
  Users,
  Settings,
  RefreshCw,
  XCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface AcademicAlertsProps {
  foundationId: Id<"foundations">;
}

export function AcademicAlerts({ foundationId }: AcademicAlertsProps) {
  const [selectedAlert, setSelectedAlert] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>("all");
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState("");

  // Convex queries
  const alerts = useQuery(api.academic.getPerformanceAlerts, {
    foundationId,
    severity: severityFilter !== "all" ? severityFilter as any : undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  });

  const alertsAnalytics = useQuery(api.academic.getAlertsAnalytics, {
    foundationId,
  });

  // Mutations
  const resolveAlert = useMutation(api.academic.resolvePerformanceAlert);
  const updateAlertStatus = useMutation(api.academic.updateAlertStatus);
  const generateAcademicAlerts = useMutation(api.academic.generateAcademicAlerts);
  const generateAttendanceAlerts = useMutation(api.attendance.generateAttendanceAlerts);

  // Filter alerts based on search term
  const filteredAlerts = React.useMemo(() => {
    if (!alerts) return [];
    
    return alerts.filter(alert => {
      const matchesSearch = searchTerm === "" || 
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.beneficiary?.beneficiaryNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [alerts, searchTerm]);

  // Get severity color and icon
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-red-500 bg-red-50 border-red-200";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-200";
      case "low": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "high": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "medium": return <Clock className="h-4 w-4 text-amber-600" />;
      case "low": return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case "performance_low": return <TrendingDown className="h-4 w-4" />;
      case "attendance_low": return <UserX className="h-4 w-4" />;
      case "grade_drop": return <GraduationCap className="h-4 w-4" />;
      case "session_missed": return <Calendar className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Active</Badge>;
      case "acknowledged":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Acknowledged</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle alert action
  const handleAlertAction = async (alertId: string, action: "acknowledge" | "in_progress" | "resolve") => {
    try {
      if (action === "resolve") {
        await resolveAlert({
          alertId: alertId as Id<"performanceAlerts">,
          foundationId,
          resolutionNotes: actionNotes,
        });
        toast.success("Alert resolved successfully");
      } else {
        await updateAlertStatus({
          alertId: alertId as Id<"performanceAlerts">,
          status: action,
          actionTaken: actionNotes,
        });
        toast.success(`Alert marked as ${action.replace("_", " ")}`);
      }
      
      setIsActionDialogOpen(false);
      setActionNotes("");
      setSelectedAlert("");
    } catch (error) {
      toast.error("Failed to update alert");
      console.error("Error updating alert:", error);
    }
  };

  // Generate alerts
  const handleGenerateAlerts = async () => {
    try {
      const [academicResult, attendanceResult] = await Promise.all([
        generateAcademicAlerts({ foundationId }),
        generateAttendanceAlerts({ foundationId }),
      ]);

      const totalGenerated = academicResult.alertsCreated + attendanceResult.alertsCreated;
      toast.success(`Generated ${totalGenerated} new alerts`);
    } catch (error) {
      toast.error("Failed to generate alerts");
      console.error("Error generating alerts:", error);
    }
  };

  if (!alerts || !alertsAnalytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="p-6">
                <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded mb-2" />
                <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Academic Alerts</h1>
          <p className="text-gray-600">Monitor and respond to academic performance alerts</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleGenerateAlerts}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Alerts
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <div className="text-2xl font-bold text-red-600">
                  {alertsAnalytics.totalActive}
                </div>
                <p className="text-xs text-gray-500">Requiring attention</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <div className="text-2xl font-bold text-red-700">
                  {alertsAnalytics.criticalCount}
                </div>
                <p className="text-xs text-gray-500">Immediate action required</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <div className="text-2xl font-bold text-blue-600">
                  {alertsAnalytics.inProgressCount}
                </div>
                <p className="text-xs text-gray-500">Being addressed</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {alertsAnalytics.resolvedToday}
                </div>
                <p className="text-xs text-gray-500">Completed actions</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Management */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-emerald-600" />
                    Active Alerts ({filteredAlerts.filter(a => a.status === "active").length})
                  </CardTitle>
                  <CardDescription>Alerts requiring immediate attention</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by beneficiary, title, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="performance_low">Low Performance</SelectItem>
                    <SelectItem value="attendance_low">Poor Attendance</SelectItem>
                    <SelectItem value="grade_drop">Grade Drop</SelectItem>
                    <SelectItem value="session_missed">Missed Sessions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alerts List */}
              <div className="space-y-3">
                {filteredAlerts
                  .filter(alert => alert.status === "active")
                  .map((alert) => (
                    <Card key={alert._id} className={cn("border-l-4", getSeverityColor(alert.severity))}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getSeverityIcon(alert.severity)}
                              <div className="flex items-center gap-2">
                                {getAlertTypeIcon(alert.alertType)}
                                <h3 className="font-medium text-gray-900">{alert.title}</h3>
                              </div>
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Beneficiary: {alert.beneficiary?.beneficiaryNumber}</span>
                              <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                              {alert.session && (
                                <span>Session: {alert.session.sessionName}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAlert(alert._id);
                                setIsActionDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Take Action
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {filteredAlerts.filter(alert => alert.status === "active").length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
                    <p className="text-gray-600">
                      Great! There are no active alerts requiring attention.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in_progress">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                In Progress Alerts ({filteredAlerts.filter(a => a.status === "in_progress").length})
              </CardTitle>
              <CardDescription>Alerts currently being addressed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAlerts
                  .filter(alert => alert.status === "in_progress")
                  .map((alert) => (
                    <Card key={alert._id} className="border-l-4 border-l-blue-500 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <h3 className="font-medium text-gray-900">{alert.title}</h3>
                              <Badge className="bg-blue-100 text-blue-800">IN PROGRESS</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                            <div className="text-xs text-gray-500">
                              Beneficiary: {alert.beneficiary?.beneficiaryNumber} • 
                              Started: {new Date(alert.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAlert(alert._id);
                              setIsActionDialogOpen(true);
                            }}
                          >
                            Update Status
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {filteredAlerts.filter(alert => alert.status === "in_progress").length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts In Progress</h3>
                    <p className="text-gray-600">No alerts are currently being addressed.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Resolved Alerts ({filteredAlerts.filter(a => a.status === "resolved").length})
              </CardTitle>
              <CardDescription>Successfully addressed alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAlerts
                  .filter(alert => alert.status === "resolved")
                  .slice(0, 10)
                  .map((alert) => (
                    <Card key={alert._id} className="border-l-4 border-l-emerald-500 bg-emerald-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <h3 className="font-medium text-gray-900">{alert.title}</h3>
                              <Badge className="bg-emerald-100 text-emerald-800">RESOLVED</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                            {alert.resolutionNotes && (
                              <p className="text-sm text-emerald-700 mb-2">
                                Resolution: {alert.resolutionNotes}
                              </p>
                            )}
                            <div className="text-xs text-gray-500">
                              Beneficiary: {alert.beneficiary?.beneficiaryNumber} • 
                              Resolved: {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString() : "N/A"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {filteredAlerts.filter(alert => alert.status === "resolved").length === 0 && (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Resolved Alerts</h3>
                    <p className="text-gray-600">No alerts have been resolved yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Alert Distribution</CardTitle>
                <CardDescription>Breakdown by severity and type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-red-600">Critical</span>
                    <span className="text-sm font-bold">{alertsAnalytics.criticalCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-red-500">High</span>
                    <span className="text-sm font-bold">{alertsAnalytics.highCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-amber-600">Medium</span>
                    <span className="text-sm font-bold">{alertsAnalytics.mediumCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-600">Low</span>
                    <span className="text-sm font-bold">{alertsAnalytics.lowCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Alert Types</CardTitle>
                <CardDescription>Common alert categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Low Performance</span>
                    </div>
                    <span className="text-sm font-bold">{alertsAnalytics.performanceAlerts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium">Poor Attendance</span>
                    </div>
                    <span className="text-sm font-bold">{alertsAnalytics.attendanceAlerts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Action on Alert</DialogTitle>
            <DialogDescription>
              Update the status or resolve this alert
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Add notes about actions taken..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={4}
            />
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAlertAction(selectedAlert, "acknowledge")}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Acknowledge
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAlertAction(selectedAlert, "in_progress")}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Mark In Progress
            </Button>
            <Button
              onClick={() => handleAlertAction(selectedAlert, "resolve")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}