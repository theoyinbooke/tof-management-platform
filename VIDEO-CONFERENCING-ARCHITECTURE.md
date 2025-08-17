# TOF Video Conferencing System Architecture
## Comprehensive Online Meeting Platform for Educational Programs

---

## Executive Summary

This document outlines the architecture and implementation strategy for a fully-integrated video conferencing system within TheOyinbooke Foundation platform. The system will provide Google Meet-like capabilities specifically tailored for educational programs in the Nigerian context.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Phases](#implementation-phases)
5. [Database Schema](#database-schema)
6. [Security & Compliance](#security-compliance)
7. [Nigerian Context Considerations](#nigerian-context)
8. [Cost Optimization](#cost-optimization)

---

## System Overview

### Vision
Create a seamless, integrated video conferencing solution that enables high-quality online education delivery while considering Nigerian internet infrastructure constraints and educational requirements.

### Key Objectives
- **Zero External Dependencies**: No reliance on Zoom, Google Meet, or other third-party services
- **Educational Focus**: Features specifically for teaching and learning
- **Low Bandwidth Optimization**: Works on 2G/3G networks common in Nigeria
- **Recording & Playback**: All sessions recorded for later review
- **Integrated Experience**: Seamless with existing program management

---

## Core Features

### 1. Meeting Management
```typescript
interface MeetingFeatures {
  // Pre-Meeting
  scheduling: {
    recurringMeetings: boolean;
    calendarIntegration: boolean;
    automaticReminders: boolean;
    waitingRoom: boolean;
    meetingPasswords: boolean;
  };
  
  // During Meeting
  inMeeting: {
    video: {
      HD: boolean;
      virtualBackgrounds: boolean;
      blurBackground: boolean;
      multipleLayouts: GridView | SpeakerView | GalleryView;
    };
    audio: {
      noiseCancellation: boolean;
      echoCancellation: boolean;
      backgroundNoiseSupression: boolean;
    };
    collaboration: {
      screenSharing: boolean;
      whiteBoard: boolean;
      documentSharing: boolean;
      breakoutRooms: boolean;
      polls: boolean;
      quizzes: boolean;
      raiseHand: boolean;
    };
    chat: {
      publicChat: boolean;
      privateMessages: boolean;
      fileSharing: boolean;
      emojiReactions: boolean;
      savedChatTranscripts: boolean;
    };
  };
  
  // Post-Meeting
  postMeeting: {
    cloudRecording: boolean;
    localRecording: boolean;
    transcription: boolean;
    attendanceReports: boolean;
    engagementAnalytics: boolean;
    automaticHighlights: boolean;
  };
}
```

### 2. Educational Features

#### Interactive Learning Tools
- **Virtual Whiteboard**: Real-time collaborative drawing and annotation
- **Screen Annotation**: Teachers can draw on shared screens
- **Breakout Rooms**: Small group discussions with timer
- **Live Quizzes**: In-meeting assessment tools
- **Attendance Tracking**: Automatic attendance recording
- **Hand Raising Queue**: Organized Q&A management
- **Focus Mode**: Minimize distractions for students

#### Content Delivery
- **Document Sharing**: PDF, PPT viewer in-meeting
- **Video Playback**: Share educational videos with synchronized viewing
- **Code Editor**: Live coding sessions for programming classes
- **Math Equation Editor**: For STEM subjects

### 3. Administrative Controls

#### Host Controls
- Mute/unmute participants
- Remove participants
- Lock meeting
- Disable participant video
- Control screen sharing permissions
- Manage chat permissions
- Record start/stop
- End meeting for all

#### Security Features
- End-to-end encryption option
- Meeting passwords
- Waiting room approval
- Domain restrictions
- IP whitelisting
- Participant verification

---

## Technical Architecture

### 1. Technology Stack

```yaml
Frontend:
  Core:
    - Next.js 15 (existing)
    - TypeScript
    - React 19
  
  WebRTC:
    - LiveKit React SDK
    - MediaStream API
    - WebRTC Data Channels
  
  UI Components:
    - Custom video grid layouts
    - Floating video controls
    - Chat interface
    - Whiteboard canvas
    - Screen share viewer

Backend:
  Media Server:
    - LiveKit OSS (self-hosted)
    - Alternative: Jitsi Meet (self-hosted)
    
  Signaling:
    - WebSocket server (Socket.io)
    - Convex real-time subscriptions
    
  Recording:
    - LiveKit Egress for cloud recording
    - FFmpeg for processing
    
  Storage:
    - Convex file storage for small files
    - S3-compatible storage for recordings
    - CDN for playback

Infrastructure:
  Servers:
    - Media Server: Dedicated VPS/Cloud
    - TURN/STUN: Coturn servers
    - Recording: Background workers
    
  Deployment:
    - Docker containers
    - Kubernetes for scaling
    - Auto-scaling based on load
```

### 2. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    Client (Browser)                       │
├──────────────────────────────────────────────────────────┤
│  Next.js App                                              │
│  ├── Meeting UI Components                                │
│  ├── WebRTC Client (LiveKit SDK)                         │
│  ├── Real-time Chat (Convex)                            │
│  └── Recording Playback                                  │
└────────────┬─────────────────────────────────────────────┘
             │
             ├────── WebRTC Media ──────┐
             │                           │
             ├────── Signaling ─────┐    │
             │                      │    │
┌────────────▼──────────┐  ┌───────▼────▼────────┐
│   Convex Backend       │  │   LiveKit Server     │
├────────────────────────┤  ├─────────────────────┤
│ • Meeting Management   │  │ • Media Routing      │
│ • User Authentication  │  │ • Recording          │
│ • Chat & Messaging     │  │ • Transcoding        │
│ • Analytics            │  │ • Bandwidth Adapt.   │
│ • Scheduling           │  └─────────────────────┘
└────────────────────────┘           │
             │                        │
             ▼                        ▼
    ┌─────────────────┐      ┌──────────────┐
    │  Convex Storage │      │  S3 Storage  │
    │  • Documents    │      │  • Recordings│
    │  • Chat History │      │  • Streams   │
    └─────────────────┘      └──────────────┘
```

### 3. WebRTC Implementation

```typescript
// Core WebRTC Connection Manager
class MeetingConnection {
  private room: Room;
  private localTracks: LocalTrack[] = [];
  private participants: Map<string, RemoteParticipant> = new Map();
  
  async connectToMeeting(meetingId: string, token: string) {
    // Connect to LiveKit room
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
        facingMode: 'user',
      },
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    
    // Nigerian bandwidth optimization
    if (await this.detectSlowConnection()) {
      this.room.setVideoQuality(VideoQuality.LOW);
      this.enableDataSaver();
    }
    
    await this.room.connect(LIVEKIT_URL, token);
    
    // Handle events
    this.room.on(RoomEvent.ParticipantConnected, this.handleParticipantConnected);
    this.room.on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed);
    this.room.on(RoomEvent.Disconnected, this.handleDisconnected);
  }
  
  async enableScreenShare() {
    const tracks = await createLocalScreenTracks({
      audio: true,
      video: {
        displaySurface: 'monitor',
        logicalSurface: true,
        cursor: 'always',
      },
    });
    
    await this.room.localParticipant.publishTracks(tracks);
  }
  
  async startRecording() {
    // Trigger cloud recording via API
    await fetch('/api/meetings/record', {
      method: 'POST',
      body: JSON.stringify({
        roomName: this.room.name,
        format: 'mp4',
        quality: 'medium',
      }),
    });
  }
}
```

### 4. Real-time Collaboration Features

```typescript
// Whiteboard Implementation
interface WhiteboardState {
  drawings: DrawingElement[];
  participants: ParticipantCursor[];
  currentTool: 'pen' | 'eraser' | 'shape' | 'text';
}

class CollaborativeWhiteboard {
  private canvas: fabric.Canvas;
  private dataChannel: RTCDataChannel;
  
  initializeWhiteboard() {
    this.canvas = new fabric.Canvas('whiteboard');
    
    // Sync drawing operations
    this.canvas.on('path:created', (e) => {
      this.broadcastDrawing({
        type: 'path',
        data: e.path.toObject(),
        userId: this.userId,
      });
    });
    
    // Receive remote drawings
    this.dataChannel.onmessage = (event) => {
      const drawing = JSON.parse(event.data);
      this.renderRemoteDrawing(drawing);
    };
  }
}

// Live Quiz System
class LiveQuizManager {
  async launchQuiz(quiz: Quiz) {
    // Broadcast quiz to all participants
    await this.room.localParticipant.publishData(
      JSON.stringify({
        type: 'quiz',
        data: quiz,
      }),
      DataPacket_Kind.RELIABLE,
    );
    
    // Start timer
    this.startQuizTimer(quiz.duration);
    
    // Collect responses
    this.collectResponses();
  }
  
  async showResults() {
    const results = await this.calculateResults();
    
    // Display real-time results
    this.broadcastResults(results);
    
    // Save to database
    await this.saveQuizResults(results);
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
```typescript
// 1. Basic Meeting Infrastructure
- [ ] LiveKit server setup
- [ ] TURN/STUN server configuration
- [ ] Basic meeting creation/joining
- [ ] Video/Audio controls
- [ ] Participant grid view

// 2. Database Schema
- [ ] meetings table
- [ ] meetingParticipants table
- [ ] meetingRecordings table
- [ ] meetingChat table
```

### Phase 2: Core Features (Weeks 5-8)
```typescript
// 1. Essential Features
- [ ] Screen sharing
- [ ] Chat functionality
- [ ] Basic recording (local)
- [ ] Mute/unmute controls
- [ ] Participant management

// 2. UI/UX
- [ ] Meeting lobby/waiting room
- [ ] In-meeting controls overlay
- [ ] Participant list sidebar
- [ ] Chat panel
- [ ] Settings modal
```

### Phase 3: Educational Tools (Weeks 9-12)
```typescript
// 1. Interactive Features
- [ ] Whiteboard
- [ ] Breakout rooms
- [ ] Hand raising
- [ ] Live polls
- [ ] Screen annotation

// 2. Content Sharing
- [ ] Document viewer
- [ ] Video sharing
- [ ] Code editor integration
```

### Phase 4: Advanced Features (Weeks 13-16)
```typescript
// 1. Recording & Analytics
- [ ] Cloud recording
- [ ] Automatic transcription
- [ ] Meeting analytics
- [ ] Attendance reports
- [ ] Engagement metrics

// 2. Optimization
- [ ] Bandwidth adaptation
- [ ] Virtual backgrounds
- [ ] Noise cancellation
- [ ] Network resilience
```

---

## Database Schema

### Convex Schema Extensions

```typescript
// meetings table
meetings: defineTable({
  foundationId: v.id("foundations"),
  programId: v.optional(v.id("programs")),
  programSessionId: v.optional(v.id("programSessions")),
  
  // Meeting Details
  meetingId: v.string(), // Unique meeting ID
  title: v.string(),
  description: v.optional(v.string()),
  
  // Schedule
  scheduledStartTime: v.number(),
  scheduledEndTime: v.number(),
  actualStartTime: v.optional(v.number()),
  actualEndTime: v.optional(v.number()),
  
  // Access
  hostId: v.id("users"),
  coHosts: v.array(v.id("users")),
  password: v.optional(v.string()),
  waitingRoomEnabled: v.boolean(),
  
  // Settings
  recordingEnabled: v.boolean(),
  chatEnabled: v.boolean(),
  screenShareEnabled: v.boolean(),
  whiteboardEnabled: v.boolean(),
  breakoutRoomsEnabled: v.boolean(),
  
  // Status
  status: v.union(
    v.literal("scheduled"),
    v.literal("live"),
    v.literal("ended"),
    v.literal("cancelled")
  ),
  
  // Recording
  recordingUrl: v.optional(v.string()),
  recordingDuration: v.optional(v.number()),
  recordingSize: v.optional(v.number()),
  
  // Analytics
  maxParticipants: v.optional(v.number()),
  totalDuration: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_foundation", ["foundationId"])
.index("by_program", ["programId"])
.index("by_host", ["hostId"])
.index("by_status", ["status"])
.index("by_scheduled_time", ["scheduledStartTime"]),

// meetingParticipants table
meetingParticipants: defineTable({
  meetingId: v.id("meetings"),
  userId: v.id("users"),
  foundationId: v.id("foundations"),
  
  // Participation
  joinTime: v.number(),
  leaveTime: v.optional(v.number()),
  duration: v.optional(v.number()),
  
  // Role
  role: v.union(
    v.literal("host"),
    v.literal("co_host"),
    v.literal("presenter"),
    v.literal("participant")
  ),
  
  // Permissions
  canShare: v.boolean(),
  canChat: v.boolean(),
  canAnnotate: v.boolean(),
  
  // Activity
  videoMinutes: v.optional(v.number()),
  audioMinutes: v.optional(v.number()),
  screenShareMinutes: v.optional(v.number()),
  chatMessageCount: v.optional(v.number()),
  
  // Device Info
  deviceType: v.optional(v.string()),
  browser: v.optional(v.string()),
  connectionQuality: v.optional(v.string()),
  
  createdAt: v.number(),
})
.index("by_meeting", ["meetingId"])
.index("by_user", ["userId"])
.index("by_meeting_user", ["meetingId", "userId"]),

// meetingRecordings table
meetingRecordings: defineTable({
  meetingId: v.id("meetings"),
  foundationId: v.id("foundations"),
  
  // Recording Details
  recordingId: v.string(),
  url: v.string(),
  thumbnailUrl: v.optional(v.string()),
  
  // Metadata
  duration: v.number(), // in seconds
  fileSize: v.number(), // in bytes
  format: v.string(), // mp4, webm
  resolution: v.string(), // 720p, 1080p
  
  // Chapters/Segments
  chapters: v.optional(v.array(v.object({
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    thumbnail: v.optional(v.string()),
  }))),
  
  // Transcription
  transcriptionUrl: v.optional(v.string()),
  captions: v.optional(v.array(v.object({
    language: v.string(),
    url: v.string(),
  }))),
  
  // Access
  isPublic: v.boolean(),
  password: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
  
  // Analytics
  viewCount: v.number(),
  lastViewedAt: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_meeting", ["meetingId"])
.index("by_foundation", ["foundationId"]),

// meetingChat table
meetingChat: defineTable({
  meetingId: v.id("meetings"),
  userId: v.id("users"),
  
  // Message
  message: v.string(),
  type: v.union(
    v.literal("text"),
    v.literal("file"),
    v.literal("poll"),
    v.literal("question"),
    v.literal("announcement")
  ),
  
  // File attachment
  fileUrl: v.optional(v.string()),
  fileName: v.optional(v.string()),
  fileSize: v.optional(v.number()),
  
  // Targeting
  isPrivate: v.boolean(),
  recipientId: v.optional(v.id("users")),
  
  // Metadata
  timestamp: v.number(),
  isDeleted: v.boolean(),
  
  createdAt: v.number(),
})
.index("by_meeting", ["meetingId"])
.index("by_user", ["userId"])
.index("by_timestamp", ["timestamp"]),

// breakoutRooms table
breakoutRooms: defineTable({
  meetingId: v.id("meetings"),
  
  // Room Details
  roomNumber: v.number(),
  name: v.string(),
  
  // Participants
  assignedParticipants: v.array(v.id("users")),
  maxParticipants: v.number(),
  
  // Timing
  duration: v.number(), // in minutes
  startTime: v.optional(v.number()),
  endTime: v.optional(v.number()),
  
  // Status
  status: v.union(
    v.literal("waiting"),
    v.literal("active"),
    v.literal("ended")
  ),
  
  createdAt: v.number(),
})
.index("by_meeting", ["meetingId"]),

// meetingPolls table
meetingPolls: defineTable({
  meetingId: v.id("meetings"),
  createdBy: v.id("users"),
  
  // Poll Details
  question: v.string(),
  type: v.union(
    v.literal("single_choice"),
    v.literal("multiple_choice"),
    v.literal("yes_no"),
    v.literal("rating"),
    v.literal("open_text")
  ),
  
  // Options
  options: v.optional(v.array(v.object({
    id: v.string(),
    text: v.string(),
    votes: v.number(),
  }))),
  
  // Settings
  isAnonymous: v.boolean(),
  showResults: v.boolean(),
  allowMultipleVotes: v.boolean(),
  
  // Timing
  launchedAt: v.number(),
  closedAt: v.optional(v.number()),
  duration: v.optional(v.number()),
  
  // Results
  totalVotes: v.number(),
  results: v.optional(v.object({
    summary: v.string(),
    breakdown: v.array(v.object({
      option: v.string(),
      count: v.number(),
      percentage: v.number(),
    })),
  })),
  
  createdAt: v.number(),
})
.index("by_meeting", ["meetingId"]),
```

---

## Security & Compliance

### 1. End-to-End Encryption (E2EE)
```typescript
class MeetingEncryption {
  // Implement WebRTC E2EE using Insertable Streams
  async enableE2EE(room: Room) {
    const encoder = new TransformStream({
      transform: async (chunk, controller) => {
        // Encrypt frame
        const encrypted = await this.encryptFrame(chunk);
        controller.enqueue(encrypted);
      },
    });
    
    const decoder = new TransformStream({
      transform: async (chunk, controller) => {
        // Decrypt frame
        const decrypted = await this.decryptFrame(chunk);
        controller.enqueue(decrypted);
      },
    });
    
    // Apply to all tracks
    room.localParticipant.tracks.forEach((track) => {
      if (track.isVideo) {
        track.sender.transform = encoder;
      }
    });
  }
}
```

### 2. Access Control
```typescript
interface MeetingAccessControl {
  // Authentication levels
  authentication: {
    requireSignIn: boolean;
    allowedDomains: string[];
    requireApproval: boolean;
  };
  
  // Participant restrictions
  restrictions: {
    maxParticipants: number;
    allowedRoles: UserRole[];
    requireInvitation: boolean;
    blockAnonymous: boolean;
  };
  
  // Content protection
  protection: {
    disableDownload: boolean;
    watermarkVideo: boolean;
    disableCopy: boolean;
    restrictRecording: boolean;
  };
}
```

### 3. Data Privacy
- GDPR compliance for EU participants
- Data residency options
- Automatic data deletion policies
- Consent management
- Activity audit logs

---

## Nigerian Context Considerations

### 1. Bandwidth Optimization

```typescript
class NigerianBandwidthOptimizer {
  // Adaptive bitrate based on network conditions
  async optimizeForNetwork() {
    const connectionSpeed = await this.measureBandwidth();
    
    if (connectionSpeed < 500) { // Less than 500 Kbps
      return {
        video: {
          resolution: '320x240',
          frameRate: 15,
          bitrate: 150000,
        },
        audio: {
          bitrate: 24000,
          channels: 'mono',
        },
        features: {
          virtualBackground: false,
          hdVideo: false,
          screenShare: 'low_quality',
        },
      };
    } else if (connectionSpeed < 1000) { // 500-1000 Kbps
      return {
        video: {
          resolution: '640x480',
          frameRate: 20,
          bitrate: 400000,
        },
        audio: {
          bitrate: 48000,
          channels: 'stereo',
        },
        features: {
          virtualBackground: false,
          hdVideo: false,
          screenShare: 'medium_quality',
        },
      };
    }
    // Higher quality for better connections
  }
  
  // Data saver mode
  enableDataSaver() {
    // Disable incoming video by default
    // Audio-only mode
    // Reduced chat image quality
    // Disable auto-play of shared videos
  }
}
```

### 2. Offline Support

```typescript
class OfflineCapabilities {
  // Download meetings for offline viewing
  async downloadMeeting(meetingId: string) {
    const recording = await this.fetchRecording(meetingId);
    const materials = await this.fetchMaterials(meetingId);
    
    // Store in IndexedDB
    await this.storeOffline({
      recording,
      materials,
      chat: await this.fetchChatTranscript(meetingId),
    });
  }
  
  // Sync when online
  async syncOfflineData() {
    const pendingData = await this.getPendingSync();
    
    if (navigator.onLine) {
      await this.uploadPendingData(pendingData);
    }
  }
}
```

### 3. Mobile-First Design

```typescript
// React Native app for mobile meetings
interface MobileApp {
  features: {
    portraitMode: boolean;
    landscapeMode: boolean;
    pictureInPicture: boolean;
    backgroundMode: boolean;
  };
  
  optimizations: {
    batteryOptimization: boolean;
    dataUsageMonitoring: boolean;
    autoQualityAdjustment: boolean;
  };
}
```

### 4. Local Infrastructure Support

```typescript
// Support for local server deployment
interface LocalDeployment {
  // On-premise installation
  onPremise: {
    dockerCompose: boolean;
    kubernetesHelm: boolean;
    bareMetalInstall: boolean;
  };
  
  // Hybrid cloud
  hybrid: {
    localMediaServer: boolean;
    cloudRecording: boolean;
    edgeCaching: boolean;
  };
}
```

---

## Cost Optimization

### 1. Infrastructure Costs

```yaml
Self-Hosted Option (Recommended):
  Media Server:
    - VPS: $40-100/month (DigitalOcean/Vultr)
    - Bandwidth: $0.01/GB
    - Storage: $0.02/GB/month
    
  Benefits:
    - No per-minute charges
    - Full control
    - Data sovereignty
    - Customization
    
Cloud Services Option:
  LiveKit Cloud:
    - $0.0004/participant-minute
    - Recording: $0.004/minute
    - Storage: $0.023/GB/month
    
  Daily.co:
    - $0.004/participant-minute
    - Recording: $0.01/minute
```

### 2. Optimization Strategies

```typescript
class CostOptimization {
  // Intelligent recording
  smartRecording() {
    // Only record important segments
    // Compress recordings
    // Auto-delete after period
    // Tiered storage (hot/cold)
  }
  
  // Resource management
  resourceManagement() {
    // Auto-scale servers
    // Shutdown idle rooms
    // Limit participant video quality
    // Optimize bandwidth usage
  }
  
  // Caching strategies
  caching() {
    // CDN for recordings
    // Edge servers for low latency
    // Browser caching for assets
  }
}
```

---

## Meeting UI Components

### 1. Main Meeting Interface

```typescript
// Main meeting component structure
interface MeetingUIComponents {
  // Core Layout
  MeetingContainer: {
    VideoGrid: Component;
    Sidebar: Component;
    ControlBar: Component;
    TopBar: Component;
  };
  
  // Video Components
  VideoTile: {
    LocalVideo: Component;
    RemoteVideo: Component;
    ScreenShare: Component;
    VideoOverlay: Component;
  };
  
  // Controls
  Controls: {
    MicButton: Component;
    CameraButton: Component;
    ScreenShareButton: Component;
    RecordButton: Component;
    ChatButton: Component;
    ParticipantsButton: Component;
    SettingsButton: Component;
    EndCallButton: Component;
  };
  
  // Panels
  Panels: {
    ChatPanel: Component;
    ParticipantsPanel: Component;
    WhiteboardPanel: Component;
    PollPanel: Component;
    BreakoutPanel: Component;
  };
  
  // Overlays
  Overlays: {
    WaitingRoom: Component;
    MeetingEnded: Component;
    ConnectionLost: Component;
    LowBandwidth: Component;
  };
}
```

### 2. Component Examples

```tsx
// Video Grid Component
export function VideoGrid({ participants }: VideoGridProps) {
  const gridLayout = useGridLayout(participants.length);
  
  return (
    <div className={cn(
      "grid gap-2 h-full w-full p-4",
      gridLayout.className
    )}>
      {participants.map((participant) => (
        <VideoTile
          key={participant.id}
          participant={participant}
          isSpeaking={participant.isSpeaking}
          isPinned={participant.isPinned}
          showControls={isHost}
        />
      ))}
    </div>
  );
}

// Meeting Control Bar
export function MeetingControlBar() {
  const { 
    isMuted, 
    isVideoOff, 
    toggleAudio, 
    toggleVideo,
    startScreenShare,
    openSettings 
  } = useMeeting();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-4">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full"
        >
          {isMuted ? <MicOff /> : <Mic />}
        </Button>
        
        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          onClick={toggleVideo}
          className="rounded-full"
        >
          {isVideoOff ? <VideoOff /> : <Video />}
        </Button>
        
        <Button
          variant="secondary"
          size="lg"
          onClick={startScreenShare}
          className="rounded-full"
        >
          <Monitor />
        </Button>
        
        <Button
          variant="destructive"
          size="lg"
          onClick={endMeeting}
          className="rounded-full px-8"
        >
          End Call
        </Button>
      </div>
    </div>
  );
}
```

---

## API Endpoints

### Meeting Management APIs

```typescript
// API Routes Structure
interface MeetingAPIs {
  // Meeting CRUD
  "/api/meetings": {
    POST: CreateMeeting;
    GET: ListMeetings;
  };
  
  "/api/meetings/:id": {
    GET: GetMeeting;
    PUT: UpdateMeeting;
    DELETE: DeleteMeeting;
  };
  
  // Meeting Actions
  "/api/meetings/:id/start": POST;
  "/api/meetings/:id/end": POST;
  "/api/meetings/:id/join": POST;
  "/api/meetings/:id/leave": POST;
  
  // Recording
  "/api/meetings/:id/record/start": POST;
  "/api/meetings/:id/record/stop": POST;
  "/api/meetings/:id/recordings": GET;
  
  // Participants
  "/api/meetings/:id/participants": GET;
  "/api/meetings/:id/participants/:userId/role": PUT;
  "/api/meetings/:id/participants/:userId/remove": DELETE;
  
  // Features
  "/api/meetings/:id/breakout-rooms": POST;
  "/api/meetings/:id/polls": POST;
  "/api/meetings/:id/whiteboard/save": POST;
}
```

---

## Performance Metrics

### Key Performance Indicators (KPIs)

```typescript
interface MeetingKPIs {
  // Quality Metrics
  quality: {
    averageVideoResolution: string;
    averageFrameRate: number;
    audioBitrate: number;
    packetLoss: number;
    jitter: number;
    roundTripTime: number;
  };
  
  // Engagement Metrics
  engagement: {
    averageMeetingDuration: number;
    participationRate: number;
    chatMessagesPerMeeting: number;
    pollParticipation: number;
    screenShareUsage: number;
    recordingViews: number;
  };
  
  // Technical Metrics
  technical: {
    joinSuccessRate: number;
    averageJoinTime: number;
    connectionDropRate: number;
    cpuUsage: number;
    bandwidthUsage: number;
    serverUptime: number;
  };
  
  // Educational Metrics
  educational: {
    studentAttendanceRate: number;
    averageEngagementScore: number;
    quizCompletionRate: number;
    handRaiseFrequency: number;
    breakoutRoomUsage: number;
  };
}
```

---

## Testing Strategy

### 1. Load Testing
```typescript
// Simulate Nigerian network conditions
const loadTests = {
  scenarios: [
    {
      name: "Peak Hours - Lagos",
      users: 500,
      bandwidth: "2G/3G mix",
      duration: "2 hours",
    },
    {
      name: "Rural Connection",
      users: 100,
      bandwidth: "Edge/2G",
      packetLoss: "5%",
    },
  ],
};
```

### 2. End-to-End Testing
```typescript
// Critical user journeys
const e2eTests = [
  "Schedule and join meeting",
  "Share screen and annotate",
  "Create breakout rooms",
  "Record and playback",
  "Low bandwidth fallback",
];
```

---

## Deployment Timeline

### Month 1-2: Foundation
- Set up LiveKit infrastructure
- Basic video/audio calling
- Simple meeting creation

### Month 3-4: Core Features  
- Screen sharing
- Chat functionality
- Recording capability
- Participant management

### Month 5-6: Educational Tools
- Whiteboard
- Breakout rooms
- Polls and quizzes
- Attendance tracking

### Month 7-8: Optimization & Polish
- Nigerian network optimization
- Mobile apps
- Analytics dashboard
- Performance tuning

---

## Conclusion

This comprehensive video conferencing system will provide TheOyinbooke Foundation with a powerful, integrated platform for delivering online education. By building this in-house, the foundation will have:

1. **Complete Control**: No dependency on external services
2. **Cost Efficiency**: One-time development vs ongoing subscriptions
3. **Customization**: Features tailored for Nigerian education
4. **Data Sovereignty**: All data remains within the foundation's control
5. **Scalability**: Can grow with the foundation's needs

The system is designed to work effectively in the Nigerian context while providing world-class video conferencing capabilities for educational programs.