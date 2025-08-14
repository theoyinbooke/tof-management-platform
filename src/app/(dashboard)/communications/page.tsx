"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Mail,
  MessageSquare,
  Send,
  Filter,
  Search,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
  MessageCircle,
  Phone,
  Megaphone,
  Bell,
  Calendar,
  FileText,
  TrendingUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ComposeMessage } from "@/components/communications/compose-message";
import { MessageThread } from "@/components/communications/message-thread";
import { CommunicationStats } from "@/components/communications/communication-stats";

export default function CommunicationsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<Id<"communicationLogs"> | null>(null);

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch communication data
  const communications = useQuery(
    api.communications.getByFoundation,
    foundationId ? {
      foundationId,
      type: typeFilter !== "all" ? typeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    } : "skip"
  );

  // Fetch communication statistics
  const stats = useQuery(
    api.communications.getStatistics,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch notifications
  const notifications = useQuery(
    api.communications.getNotifications,
    foundationId ? { foundationId, unreadOnly: true } : "skip"
  );

  const resendCommunication = useMutation(api.communications.resendCommunication);
  const markAsRead = useMutation(api.communications.markAsRead);

  const handleResend = async (communicationId: Id<"communicationLogs">) => {
    try {
      await resendCommunication({ communicationId });
      toast.success("Communication resent successfully");
    } catch (error) {
      toast.error("Failed to resend communication");
    }
  };

  const handleMarkAsRead = async (communicationId: Id<"communicationLogs">) => {
    try {
      await markAsRead({ communicationId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "delivered":
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <MessageSquare className="w-4 h-4" />;
      case "in_app":
        return <Bell className="w-4 h-4" />;
      case "announcement":
        return <Megaphone className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "email":
        return "text-blue-600";
      case "sms":
        return "text-green-600";
      case "in_app":
        return "text-purple-600";
      case "announcement":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 font-semibold";
      case "high":
        return "text-orange-600 font-medium";
      case "normal":
        return "text-gray-600";
      case "low":
        return "text-gray-500";
      default:
        return "text-gray-600";
    }
  };

  // Filter communications based on search
  const filteredCommunications = communications?.filter(comm => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      comm.subject?.toLowerCase().includes(searchLower) ||
      comm.recipient.toLowerCase().includes(searchLower) ||
      comm.content.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Communications</h1>
            <p className="text-gray-600 mt-1">Manage messages, notifications, and announcements</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/communications/templates")}>
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button onClick={() => setIsComposeOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Compose Message
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.totalMessages || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.todayMessages || 0} sent today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Emails Sent</CardTitle>
                    <Mail className="w-4 h-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.emailsSent || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {((stats?.emailDeliveryRate || 0) * 100).toFixed(1)}% delivery rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">SMS Sent</CardTitle>
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.smsSent || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {((stats?.smsDeliveryRate || 0) * 100).toFixed(1)}% delivery rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats?.pendingMessages || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Awaiting delivery</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Communications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Communications</CardTitle>
                <CardDescription>Latest messages and notifications sent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCommunications.slice(0, 5).map((comm) => (
                    <div key={comm._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-gray-100 ${getTypeColor(comm.type)}`}>
                          {getTypeIcon(comm.type)}
                        </div>
                        <div>
                          <div className="font-medium">{comm.subject || "No subject"}</div>
                          <div className="text-sm text-gray-600">
                            To: {comm.recipient} • {formatDate(new Date(comm.createdAt))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(comm.status)}
                        <span className={`text-xs ${getPriorityColor(comm.priority)}`}>
                          {comm.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredCommunications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No communications found</p>
                      <p className="text-sm mt-1">Start sending messages to see them here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="in_app">In-App</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Messages List */}
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  {filteredCommunications.length} message{filteredCommunications.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-gray-700">Type</th>
                        <th className="text-left p-2 font-medium text-gray-700">Subject</th>
                        <th className="text-left p-2 font-medium text-gray-700">Recipient</th>
                        <th className="text-left p-2 font-medium text-gray-700">Status</th>
                        <th className="text-left p-2 font-medium text-gray-700">Priority</th>
                        <th className="text-left p-2 font-medium text-gray-700">Sent</th>
                        <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommunications.map((comm) => (
                        <tr key={comm._id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className={`flex items-center gap-2 ${getTypeColor(comm.type)}`}>
                              {getTypeIcon(comm.type)}
                              <span className="capitalize text-sm">{comm.type}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{comm.subject || "No subject"}</div>
                            <div className="text-xs text-gray-600 truncate max-w-xs">
                              {comm.content}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">{comm.recipient}</div>
                          </td>
                          <td className="p-2">
                            {getStatusBadge(comm.status)}
                          </td>
                          <td className="p-2">
                            <span className={`text-xs capitalize ${getPriorityColor(comm.priority)}`}>
                              {comm.priority}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              {comm.sentAt ? formatDate(new Date(comm.sentAt)) : formatDate(new Date(comm.createdAt))}
                            </div>
                          </td>
                          <td className="p-2">
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
                                  onClick={() => setSelectedMessageId(comm._id)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {comm.status === "failed" && (
                                  <DropdownMenuItem
                                    onClick={() => handleResend(comm._id)}
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Resend
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredCommunications.length === 0 && (
                    <div className="text-center py-12">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No messages found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {communications?.length === 0 
                          ? "Send your first message to get started"
                          : "Try adjusting your search or filters"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            {/* Unread Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Unread Notifications ({notifications?.length || 0})
                </CardTitle>
                <CardDescription>
                  Recent notifications requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications?.slice(0, 10).map((notification) => (
                    <div 
                      key={notification._id} 
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{notification.subject}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {notification.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(new Date(notification.createdAt))}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No unread notifications</p>
                      <p className="text-sm mt-1">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <CommunicationStats foundationId={foundationId!} />
          </TabsContent>
        </Tabs>

        {/* Compose Message Dialog */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
              <DialogDescription>
                Send a message to beneficiaries, guardians, or team members
              </DialogDescription>
            </DialogHeader>
            <ComposeMessage
              foundationId={foundationId!}
              onMessageSent={() => {
                setIsComposeOpen(false);
                toast.success("Message sent successfully!");
              }}
              onCancel={() => setIsComposeOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Message Details Dialog */}
        <Dialog 
          open={selectedMessageId !== null} 
          onOpenChange={(open) => !open && setSelectedMessageId(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Message Details</DialogTitle>
            </DialogHeader>
            {selectedMessageId && (
              <MessageThread 
                messageId={selectedMessageId}
                className="border-0 shadow-none"
              />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMessageId(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}