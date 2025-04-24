

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface User {
  userId: string;
  name: string;
}

const Meeting: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [attendees, setAttendees] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteStreams = useRef<Map<string, MediaStream>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);

  // Create a meeting on component mount if no meeting ID is provided
  useEffect(() => {
    if (!meetingId && isAuthenticated) {
      createMeeting();
    }
  }, [isAuthenticated]);

  // Create a new meeting
  const createMeeting = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/meetings`, 
        {
          teamId: 'c0d3e3d1-f527-40b9-affd-95ce1aa8ab9e', // Replace with actual team ID
          title: 'My Meeting',
          startTime: '2025-04-24T10:00:00Z',
          endTime: '2025-04-24T11:00:00Z',
          attendees: ['437c2f70-9e22-47f7-9475-1681e7565b89', 'a09dca9f-62d3-4e20-b349-e3cc72badf6b']
        }, 
        { withCredentials: true }
      );
      setMeetingId(res.data.meetingId);
    } catch (error) {
      console.error("Failed to create meeting", error);
      setError("Failed to create meeting");
    }
  };

  // Initialize socket connection when meeting ID is available
  useEffect(() => {
    if (!meetingId || !isAuthenticated) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true // This ensures cookies are sent with the request
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
      newSocket.emit('joinMeetingRoom', meetingId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('error', (errorMsg: string) => {
      setError(errorMsg);
      console.error('Socket error:', errorMsg);
    });

    newSocket.on('joinedMeeting', (data: { meetingId: string, attendees: User[] }) => {
      setAttendees(data.attendees);
      console.log('Joined meeting, attendees:', data.attendees);
      
      // Setup WebRTC for each existing attendee
      data.attendees.forEach(attendee => {
        if (attendee.userId !== user?.id) {
          createPeerConnection(attendee.userId);
        }
      });
    });

    newSocket.on('userJoined', (user: User) => {
      setAttendees(prev => [...prev, user]);
      console.log('User joined:', user);
      createPeerConnection(user.userId);
    });

    newSocket.on('userLeft', (user: User) => {
      setAttendees(prev => prev.filter(a => a.userId !== user.userId));
      console.log('User left:', user);
      
      // Close peer connection
      if (peerConnections.current.has(user.userId)) {
        peerConnections.current.get(user.userId)?.close();
        peerConnections.current.delete(user.userId);
      }
      
      // Remove remote stream
      if (remoteStreams.current.has(user.userId)) {
        remoteStreams.current.delete(user.userId);
      }
    });

    newSocket.on('meetingEnded', (data: { meetingId: string, endedBy: User }) => {
      alert(`Meeting ended by ${data.endedBy.name}`);
      cleanup();
    });

    newSocket.on('userMediaStatusChange', (data: { userId: string, mediaType: 'audio' | 'video', enabled: boolean }) => {
      console.log('User media status changed:', data);
      // Update UI to reflect media status change
    });

    newSocket.on('userStartedScreenShare', (user: User) => {
      console.log('User started screen sharing:', user);
      // Update UI to show screen share
    });

    newSocket.on('userStoppedScreenShare', (data: { userId: string }) => {
      console.log('User stopped screen sharing:', data.userId);
      // Update UI to hide screen share
    });

    // WebRTC signaling events
    newSocket.on('rtcOffer', async (data: { offer: RTCSessionDescriptionInit, fromUserId: string, fromUserName: string }) => {
      console.log('Received RTC offer from', data.fromUserName);
      
      // Create peer connection if it doesn't exist
      if (!peerConnections.current.has(data.fromUserId)) {
        createPeerConnection(data.fromUserId);
      }
      
      const pc = peerConnections.current.get(data.fromUserId)!;
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        newSocket.emit('rtcAnswer', {
          targetUserId: data.fromUserId,
          answer
        });
      } catch (error) {
        console.error('Error handling RTC offer:', error);
      }
    });

    newSocket.on('rtcAnswer', async (data: { answer: RTCSessionDescriptionInit, fromUserId: string }) => {
      console.log('Received RTC answer from', data.fromUserId);
      
      const pc = peerConnections.current.get(data.fromUserId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (error) {
          console.error('Error handling RTC answer:', error);
        }
      }
    });

    newSocket.on('rtcIceCandidate', (data: { candidate: RTCIceCandidateInit, fromUserId: string }) => {
      console.log('Received ICE candidate from', data.fromUserId);
      
      const pc = peerConnections.current.get(data.fromUserId);
      if (pc) {
        try {
          pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error handling ICE candidate:', error);
        }
      }
    });

    setSocket(newSocket);

    return () => {
      cleanup();
      newSocket.disconnect();
    };
  }, [meetingId, user?.id, isAuthenticated]);

  // Initialize local media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        
        localStream.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Add tracks to all existing peer connections
        peerConnections.current.forEach(pc => {
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
        });
        
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setError('Could not access camera or microphone');
      }
    };
    
    if (isConnected) {
      initializeMedia();
    }
    
    return () => {
      localStream.current?.getTracks().forEach(track => track.stop());
    };
  }, [isConnected]);

  const createPeerConnection = (userId: string) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    const pc = new RTCPeerConnection(configuration);
    
    // Add local tracks to peer connection
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('rtcIceCandidate', {
          targetUserId: userId,
          candidate: event.candidate
        });
      }
    };
    
    // Handle remote tracks
    pc.ontrack = (event) => {
      if (!remoteStreams.current.has(userId)) {
        remoteStreams.current.set(userId, new MediaStream());
      }
      
      const stream = remoteStreams.current.get(userId)!;
      event.streams[0].getTracks().forEach(track => {
        stream.addTrack(track);
      });
      
      // Update UI to show remote video
      const remoteVideo = document.getElementById(`remote-video-${userId}`) as HTMLVideoElement;
      if (remoteVideo) {
        remoteVideo.srcObject = stream;
      }
    };
    
    // Store peer connection
    peerConnections.current.set(userId, pc);
    
    // Create offer if we're the initiator
    if (user?.id && user.id < userId) {
      createOffer(userId);
    }
    
    return pc;
  };

  const createOffer = async (targetUserId: string) => {
    if (!socket || !meetingId) return;
    
    const pc = peerConnections.current.get(targetUserId);
    if (!pc) return;
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit('rtcOffer', {
        targetUserId,
        offer,
        meetingId
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        
        // Notify others about audio status change
        if (socket && meetingId) {
          socket.emit('mediaStatusChange', {
            meetingId,
            mediaType: 'audio',
            enabled: audioTrack.enabled
          });
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        
        // Notify others about video status change
        if (socket && meetingId) {
          socket.emit('mediaStatusChange', {
            meetingId,
            mediaType: 'video',
            enabled: videoTrack.enabled
          });
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!socket || !meetingId) return;
    
    if (screenSharing) {
      // Stop screen sharing
      screenStream.current?.getTracks().forEach(track => track.stop());
      
      // Replace screen share with camera video
      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }
      }
      
      socket.emit('stopScreenShare', meetingId);
      setScreenSharing(false);
    } else {
      try {
        // Start screen sharing
        screenStream.current = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        const screenTrack = screenStream.current.getVideoTracks()[0];
        
        // Replace camera video with screen share
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream.current;
        }
        
        // Handle screen share stop event
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        socket.emit('startScreenShare', meetingId);
        setScreenSharing(true);
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    }
  };

  const endMeeting = () => {
    if (socket && meetingId) {
      socket.emit('endMeeting', meetingId);
    }
  };

  const leaveMeeting = () => {
    if (socket && meetingId) {
      socket.emit('leaveMeetingRoom', meetingId);
      cleanup();
    }
  };

  const cleanup = () => {
    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    // Stop local media tracks
    localStream.current?.getTracks().forEach(track => track.stop());
    screenStream.current?.getTracks().forEach(track => track.stop());
    
    // Clear remote streams
    remoteStreams.current.clear();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Access Restricted</h2>
          <p className="text-gray-600">Please log in to join the meeting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Meeting Room</h1>
          <div className="text-sm text-gray-500">
            {meetingId && <span>Meeting ID: {meetingId.substring(0, 8)}...</span>}
          </div>
        </div>
      </header>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 mx-4 mt-4 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex-grow p-4 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full max-h-[calc(100vh-12rem)]">
          {/* Local video */}
          <div className="relative bg-black rounded-lg overflow-hidden shadow-lg h-64">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${audioEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-white font-medium truncate">{user?.name || 'You'}</span>
              </div>
            </div>
            {!videoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-white font-bold">
                  {(user?.name || 'You').charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
          
          {/* Remote videos */}
          {attendees.map(attendee => (
            user?.id !== attendee.userId && (
              <div key={attendee.userId} className="relative bg-black rounded-lg overflow-hidden shadow-lg h-64">
                <video 
                  id={`remote-video-${attendee.userId}`} 
                  autoPlay 
                  playsInline
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="text-white font-medium truncate">{attendee.name}</div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
      
      <footer className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-4">
          <div className="flex space-x-2">
            <button 
              onClick={toggleAudio}
              className={`p-3 rounded-full ${audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
            >
              {audioEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={toggleVideo}
              className={`p-3 rounded-full ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
            >
              {videoEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={toggleScreenShare}
              className={`p-3 rounded-full ${screenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'} text-white transition-colors`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={leaveMeeting}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
            >
              Leave Meeting
            </button>
            
            <button 
              onClick={endMeeting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              End Meeting
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Meeting;