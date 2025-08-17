"use client";

import { useEffect, useRef } from "react";

interface LiveKitWrapperProps {
  token: string;
  serverUrl: string;
  userName: string;
  initialSettings?: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    backgroundBlur: boolean;
  } | null;
  onDisconnected: () => void;
}

export function LiveKitWrapper({ 
  token, 
  serverUrl, 
  userName, 
  initialSettings,
  onDisconnected 
}: LiveKitWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initializeLiveKit = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Room, RoomEvent, RemoteVideoTrack, RemoteAudioTrack } = await import("livekit-client");
        
        if (!mounted || !containerRef.current) return;

        // Create room
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;

        // Create basic video container
        const videoContainer = document.createElement('div');
        videoContainer.style.cssText = `
          width: 100%;
          height: 100vh;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          background: #111;
          padding: 80px 20px 20px 20px;
          box-sizing: border-box;
        `;

        containerRef.current.appendChild(videoContainer);

        // Handle participant connection
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('Participant connected:', participant.identity);
          addParticipantVideo(participant, videoContainer);
        });

        // Handle track subscriptions
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === 'video') {
            const existingVideo = videoContainer.querySelector(`[data-participant="${participant.identity}"]`);
            if (existingVideo && track instanceof RemoteVideoTrack) {
              const videoElement = existingVideo.querySelector('video');
              if (videoElement) {
                track.attach(videoElement);
              }
            }
          }
        });

        // Handle disconnection
        room.on(RoomEvent.Disconnected, () => {
          console.log('Disconnected from room');
          onDisconnected();
        });

        // Connect to room
        await room.connect(serverUrl, token);
        console.log('Connected to room');

        // Enable camera and microphone based on initial settings
        await room.localParticipant.enableCameraAndMicrophone();
        
        // Add local participant video
        addLocalParticipantVideo(room.localParticipant, videoContainer);

        // Add existing participants
        room.remoteParticipants.forEach((participant) => {
          addParticipantVideo(participant, videoContainer);
        });

      } catch (error) {
        console.error('Failed to connect to LiveKit:', error);
        onDisconnected();
      }
    };

    const addParticipantVideo = (participant: any, container: HTMLElement) => {
      const participantDiv = document.createElement('div');
      participantDiv.setAttribute('data-participant', participant.identity);
      participantDiv.style.cssText = `
        position: relative;
        background: #222;
        border-radius: 8px;
        margin: 8px;
        flex: 1;
        min-width: 300px;
        max-width: 600px;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const video = document.createElement('video');
      video.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      `;
      video.autoplay = true;
      video.muted = participant.isLocal;

      const nameLabel = document.createElement('div');
      nameLabel.textContent = participant.identity;
      nameLabel.style.cssText = `
        position: absolute;
        bottom: 8px;
        left: 8px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      `;

      participantDiv.appendChild(video);
      participantDiv.appendChild(nameLabel);
      container.appendChild(participantDiv);

      // Attach video track if available
      participant.videoTrackPublications.forEach((publication: any) => {
        if (publication.track) {
          publication.track.attach(video);
        }
      });
    };

    const addLocalParticipantVideo = (participant: any, container: HTMLElement) => {
      addParticipantVideo(participant, container);
    };

    initializeLiveKit();

    return () => {
      mounted = false;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [token, serverUrl, userName, onDisconnected]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }} 
    />
  );
}