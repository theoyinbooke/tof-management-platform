"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Share2,
  Copy,
  Calendar,
  Clock,
  Users,
  Video,
  FileText,
  MessageSquare,
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  ExternalLink,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  Phone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MeetingNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  type: "text" | "file" | "system";
}

interface MeetingTranscript {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
  confidence: number;
}

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const meetingId = params.meetingId as Id<"meetings">;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Queries
  const meeting = useQuery(api.meetings.getMeeting, { meetingId });
  const recordingData = useQuery(api.meetings.getRecordingStatus, { meetingId });
  const meetingNotes = useQuery(api.meetings.getMeetingNotes, { meetingId });
  const meetingChat = useQuery(api.meetings.getMeetingChat, { meetingId });
  const meetingTranscript = useQuery(api.meetings.getMeetingTranscript, { meetingId });

  // Mutations
  const addMeetingNote = useMutation(api.meetings.addMeetingNote);
  const updateMeetingNote = useMutation(api.meetings.updateMeetingNote);
  const deleteMeetingNote = useMutation(api.meetings.deleteMeetingNote);

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (playerContainerRef.current) {
      if (!isFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    const shareToken = Math.random().toString(36).substring(7);
    const url = `${baseUrl}/meetings/${meetingId}/watch?token=${shareToken}`;
    setShareUrl(url);
    setShowShareDialog(true);
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await addMeetingNote({
        meetingId,
        content: newNote,
        timestamp: currentTime,
      });
      setNewNote("");
      toast.success("Note added successfully");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const handleEditNote = (note: MeetingNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;
    
    try {
      await updateMeetingNote({
        noteId,
        content: editingNoteContent,
      });
      setEditingNoteId(null);
      setEditingNoteContent("");
      toast.success("Note updated successfully");
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setNoteToDelete(noteId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      await deleteMeetingNote({ noteId: noteToDelete });
      toast.success("Note deleted successfully");
      setShowDeleteDialog(false);
      setNoteToDelete(null);
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteContent("");
  };

  const downloadRecording = () => {
    if (recordingData?.recordingUrl) {
      const link = document.createElement('a');
      link.href = recordingData.recordingUrl;
      link.download = recordingData.recordingFilename || 'meeting-recording.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Live</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Scheduled</Badge>;
      case "ended":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Ended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "beneficiary", "guardian", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/meetings")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
              <p className="text-gray-600">{formatDate(meeting.scheduledStartTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(meeting.status)}
            {meeting.status === "live" && (
              <Button asChild>
                <a href={`/meetings/${meetingId}/room`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Meeting
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Meeting Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Date & Time</span>
                </div>
                <p className="font-medium">{formatDate(meeting.scheduledStartTime)}</p>
                {meeting.scheduledEndTime && (
                  <p className="text-sm text-gray-600">
                    Ends at {new Date(meeting.scheduledEndTime).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <p className="font-medium">
                  {meeting.actualStartTime && meeting.actualEndTime 
                    ? formatDuration((meeting.actualEndTime - meeting.actualStartTime) / 1000)
                    : meeting.actualStartTime && meeting.status === "live"
                    ? formatDuration((Date.now() - meeting.actualStartTime) / 1000)
                    : "Not started"
                  }
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Participants</span>
                </div>
                <p className="font-medium">{meeting.currentParticipants?.length || 0} joined</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recording Player */}
        {recordingData?.recordingUrl && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Meeting Recording
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={downloadRecording}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateShareUrl}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={playerContainerRef} className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto"
                  src={recordingData.recordingUrl}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls={false}
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Custom Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    
                    <div className="flex-1 flex items-center gap-2 text-white text-sm">
                      <span>{formatDuration(currentTime)}</span>
                      <div className="flex-1 bg-white/20 rounded-full h-1 cursor-pointer">
                        <div 
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      <span>{formatDuration(duration)}</span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Notes, Chat, Transcript */}
        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Meeting Notes
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat History
            </TabsTrigger>
            <TabsTrigger value="transcript" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Transcript
            </TabsTrigger>
          </TabsList>

          {/* Meeting Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Meeting Notes</CardTitle>
                  <Button onClick={() => setIsEditingNotes(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditingNotes && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
                    <Textarea
                      placeholder="Add your meeting notes here..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <div className="flex items-center gap-2">
                      <Button onClick={handleAddNote}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Note
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsEditingNotes(false);
                        setNewNote("");
                      }}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                <ScrollArea className="h-[400px]">
                  {meetingNotes && meetingNotes.length > 0 ? (
                    <div className="space-y-4">
                      {meetingNotes.map((note: MeetingNote) => (
                        <div key={note.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {note.authorName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{note.authorName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(note.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {(note.authorId === user?._id || user?.role === "admin" || user?.role === "super_admin") && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditNote(note)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {editingNoteId === note.id ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editingNoteContent}
                                onChange={(e) => setEditingNoteContent(e.target.value)}
                                className="min-h-[100px]"
                                placeholder="Edit your note..."
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateNote(note.id)}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No meeting notes yet</p>
                      <p className="text-sm">Add notes to capture important points from the meeting</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat History Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chat History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {meetingChat && meetingChat.length > 0 ? (
                    <div className="space-y-4">
                      {meetingChat.map((message: ChatMessage) => (
                        <div key={message.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {message.senderName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{message.senderName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{message.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No chat messages</p>
                      <p className="text-sm">Chat messages from the meeting will appear here</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcript Tab */}
          <TabsContent value="transcript" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Transcript</CardTitle>
                <p className="text-sm text-gray-600">
                  AI-generated transcript will be available after the meeting ends
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {meetingTranscript && meetingTranscript.length > 0 ? (
                    <div className="space-y-4">
                      {meetingTranscript.map((entry: MeetingTranscript) => (
                        <div key={entry.id} className="border-l-2 border-emerald-200 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{entry.speakerName}</span>
                            <span className="text-xs text-gray-500">
                              {formatDuration(entry.timestamp)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(entry.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{entry.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No transcript available</p>
                      <p className="text-sm">
                        {meeting.status === "live" 
                          ? "Transcript will be generated after the meeting ends"
                          : "AI transcript generation will be implemented soon"
                        }
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Note Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Meeting Note</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this note? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteNote}>
                Delete Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Meeting Recording</DialogTitle>
              <DialogDescription>
                Generate a secure link to share this meeting recording with others
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-url">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyShareUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• This link will expire in 7 days</p>
                <p>• Viewers must be logged in to access the recording</p>
                <p>• Only members of your foundation can view this recording</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}