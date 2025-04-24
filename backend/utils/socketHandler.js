
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { verifyAccessToken } from'../middlewares/auth.middleware.js';

export const socketHandlers = (io) => {
  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = verifyAccessToken(token);
      
      if (!decoded) {
        return next(new Error('Invalid token'));
      }
      
      // Attach user data to socket
      socket.user = {
        userId: decoded.userId,
        role: decoded.role,
        name: decoded.name
      };
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId}`);
    
    // Join user to their chat rooms
    socket.on('joinChats', async () => {
      try {
        // Find all chats where user is a participant
        const userChats = await prisma.chatParticipant.findMany({
          where: {
            userId: socket.user.userId
          },
          select: {
            chatId: true
          }
        });
        
        // Join each chat room
        userChats.forEach(chat => {
          socket.join(chat.chatId);
          console.log(`User ${socket.user.userId} joined chat room: ${chat.chatId}`);
        });
      } catch (error) {
        console.error('Error joining chat rooms:', error);
      }
    });
    
    // Join a specific chat room
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.user.userId} joined chat room: ${chatId}`);
    });
    
    // Leave a specific chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.user.userId} left chat room: ${chatId}`);
    });
    
    // Handle new message
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content } = data;
        
        // Check if user is a participant in the chat
        const participant = await prisma.chatParticipant.findFirst({
          where: {
            chatId,
            userId: socket.user.userId
          }
        });
        
        if (!participant) {
          socket.emit('error', 'You are not a participant of this chat');
          return;
        }
        
        // Create the message
        const message = await prisma.chatMessage.create({
          data: {
            content,
            chatId,
            senderId: socket.user.userId
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        // Mark as read by sender
        await prisma.messageRead.create({
          data: {
            userId: socket.user.userId,
            chatMessageId: message.id
          }
        });
        
        // Update chat's updatedAt timestamp
        await prisma.chat.update({
          where: {
            id: chatId
          },
          data: {
            updatedAt: new Date()
          }
        });
        
        // Broadcast to all users in the chat room
        io.to(chatId).emit('newMessage', message);
        
        // Create notifications for other participants
        const otherParticipants = await prisma.chatParticipant.findMany({
          where: {
            chatId,
            userId: {
              not: socket.user.userId
            }
          },
          select: {
            userId: true
          }
        });
        
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          select: { name: true, team: { select: { name: true } } }
        });
        
        // Emit notification event to other participants
        otherParticipants.forEach(participant => {
          socket.to(participant.userId).emit('notification', {
            type: 'CHAT_MESSAGE',
            content: `New message from ${socket.user.name} in ${chat.name || chat.team.name} chat`,
            chatId
          });
        });
      } catch (error) {
        console.error('Error sending message via socket:', error);
        socket.emit('error', 'Failed to send message');
      }
    });
    
    // Handle user typing indicator
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('userTyping', {
        userId: socket.user.userId,
        name: socket.user.name,
        chatId
      });
    });
    
    // Handle user stopped typing
    socket.on('stopTyping', (chatId) => {
      socket.to(chatId).emit('userStoppedTyping', {
        userId: socket.user.userId,
        chatId
      });
    });
    
    // Mark messages as read
    socket.on('markAsRead', async (data) => {
      try {
        const { chatId, messageIds } = data;
        
        // Check if user is a participant
        const participant = await prisma.chatParticipant.findFirst({
          where: {
            chatId,
            userId: socket.user.userId
          }
        });
        
        if (!participant) {
          socket.emit('error', 'You are not a participant of this chat');
          return;
        }
        
        // Get unread messages
        const messages = await prisma.chatMessage.findMany({
          where: {
            id: {
              in: messageIds
            },
            chatId,
            readBy: {
              none: {
                userId: socket.user.userId
              }
            }
          }
        });
        
        // Mark messages as read
        const readPromises = messages.map(message => {
          return prisma.messageRead.create({
            data: {
              userId: socket.user.userId,
              chatMessageId: message.id
            }
          });
        });
        
        await Promise.all(readPromises);
        
        // Emit read receipt to the chat room
        io.to(chatId).emit('messagesRead', {
          userId: socket.user.userId,
          name: socket.user.name,
          messageIds,
          chatId
        });
      } catch (error) {
        console.error('Error marking messages as read via socket:', error);
        socket.emit('error', 'Failed to mark messages as read');
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.userId}`);
    });
  });
};
export default socketHandlers;