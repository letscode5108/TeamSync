// socketHandlers/meetingSocketHandler.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

 const meetingSocket = (io, socket) => {
  // Join a meeting room
  socket.on('joinMeetingRoom', async (meetingId) => {
    socket.join(meetingId);
    try {
      const { userId } = socket.user;
      
      // Check if user is an attendee
      const attendee = await prisma.meetingAttendee.findFirst({
        where: {
          meetingId,
          userId
        }
      });
      
      if (!attendee) {
        socket.emit('error', 'You are not authorized to join this meeting');
        return;
      }
      
      // Join the meeting socket room
      const meetingRoomId = `meeting:${meetingId}`;
      socket.join(meetingRoomId);
      
      // Notify others that user has joined
      socket.to(meetingRoomId).emit('userJoined', {
        userId,
        name: socket.user.name
      });
      
      // Update attendee status to 'accepted' if it wasn't already
      if (attendee.status !== 'accepted') {
        await prisma.meetingAttendee.update({
          where: {
            id: attendee.id
          },
          data: {
            status: 'accepted'
          }
        });
      }
      
      // Get all current attendees to send back to the joining user
      const meetingAttendees = await prisma.meetingAttendee.findMany({
        where: {
          meetingId,
          status: 'accepted'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      // Format attendees list
      const attendeesList = meetingAttendees.map(att => ({
        userId: att.user.id,
        name: att.user.name
      }));
      
      // Emit success event with current attendees
      socket.emit('joinedMeeting', {
        meetingId,
        attendees: attendeesList
      });
      
      console.log(`User ${socket.user.userId} joined meeting room: ${meetingId}`);
    } catch (error) {
      console.error('Error joining meeting room:', error);
      socket.emit('error', 'Failed to join meeting room');
    }
  });
  
  // Leave a meeting room
  socket.on('leaveMeetingRoom', (meetingId) => {
    const meetingRoomId = `meeting:${meetingId}`;
    socket.leave(meetingRoomId);
    
    // Notify others that user has left
    socket.to(meetingRoomId).emit('userLeft', {
      userId: socket.user.userId,
      name: socket.user.name
    });
    
    console.log(`User ${socket.user.userId} left meeting room: ${meetingId}`);
  });
  
  // WebRTC signaling
  
  // When a user offers to connect to another user
  socket.on('rtcOffer', (data) => {
    const { targetUserId, offer, meetingId } = data;
    
    // Forward the offer to the target user
    socket.to(targetUserId).emit('rtcOffer', {
      offer,
      fromUserId: socket.user.userId,
      fromUserName: socket.user.name,
      meetingId
    });
  });
  
  // When a user answers an offer
  socket.on('rtcAnswer', (data) => {
    const { targetUserId, answer } = data;
    
    // Forward the answer to the target user
    socket.to(targetUserId).emit('rtcAnswer', {
      answer,
      fromUserId: socket.user.userId
    });
  });
  
  // When a user sends an ICE candidate
  socket.on('rtcIceCandidate', (data) => {
    const { targetUserId, candidate } = data;
    
    // Forward the ICE candidate to the target user
    socket.to(targetUserId).emit('rtcIceCandidate', {
      candidate,
      fromUserId: socket.user.userId
    });
  });
  
  // Handle user media status changes (mute/unmute video/audio)
  socket.on('mediaStatusChange', (data) => {
    const { meetingId, mediaType, enabled } = data;
    const meetingRoomId = `meeting:${meetingId}`;
    
    // Broadcast status change to all users in the meeting
    socket.to(meetingRoomId).emit('userMediaStatusChange', {
      userId: socket.user.userId,
      mediaType, // 'audio' or 'video'
      enabled    // true or false
    });
  });
  
  // Meeting ended by organizer
  socket.on('endMeeting', async (meetingId) => {
    try {
      const { userId } = socket.user;
      
      // Check if user is meeting creator or team manager
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          team: true,
          attendees: {
            orderBy: {
              joinedAt: 'asc'
            },
            take: 1
          }
        }
      });
      
      if (!meeting) {
        socket.emit('error', 'Meeting not found');
        return;
      }
      
      // Check if user is meeting creator (first attendee) or team manager
      const isCreator = meeting.attendees[0]?.userId === userId;
      const isTeamManager = meeting.team.managerId === userId;
      
      if (!isCreator && !isTeamManager) {
        socket.emit('error', 'Only the meeting organizer or team manager can end this meeting');
        return;
      }
      
      // Update meeting to ended state
      await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          endTime: new Date()
        }
      });
      
      // Delete the meeting chat messages (they are temporary)
      const chat = await prisma.chat.findFirst({
        where: {
          meetingId,
          type: 'MEETING'
        }
      });
      
      if (chat) {
        // Delete all messages in the chat
        await prisma.chatMessage.deleteMany({
          where: {
            chatId: chat.id
          }
        });
      }
      
      // Notify all users in the meeting that it has ended
      const meetingRoomId = `meeting:${meetingId}`;
      io.to(meetingRoomId).emit('meetingEnded', {
        meetingId,
        endedBy: {
          userId,
          name: socket.user.name
        }
      });
      
      console.log(`Meeting ${meetingId} ended by user ${userId}`);
    } catch (error) {
      console.error('Error ending meeting via socket:', error);
      socket.emit('error', 'Failed to end meeting');
    }
  });
  
  // Screen sharing
  socket.on('startScreenShare', (meetingId) => {
    const meetingRoomId = `meeting:${meetingId}`;
    
    // Notify all users in the meeting that this user started screen sharing
    socket.to(meetingRoomId).emit('userStartedScreenShare', {
      userId: socket.user.userId,
      name: socket.user.name
    });
  });
  
  socket.on('stopScreenShare', (meetingId) => {
    const meetingRoomId = `meeting:${meetingId}`;
    
    // Notify all users in the meeting that this user stopped screen sharing
    socket.to(meetingRoomId).emit('userStoppedScreenShare', {
      userId: socket.user.userId
    });
  });
};
export default meetingSocket;