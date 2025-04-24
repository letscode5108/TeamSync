import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { cloudinary } from'../config/cloudinary.js';

// Create a new chat for a team
export const createTeamChat = async (req, res) => {
  try {
    const { teamId, name } = req.body;
    const { userId, role } = req.user;

    // Check if user is a member or manager of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    });

    const isManager = await prisma.team.findFirst({
      where: {
        id: teamId,
        managerId: userId
      }
    });

    if (!teamMember && !isManager) {
      return res.status(403).json({ message: "You don't have access to this team" });
    }

    // Check if a team chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        teamId,
        type: 'TEAM'
      }
    });

    if (existingChat) {
      return res.status(400).json({ message: "Team chat already exists" });
    }

    // Create a new team chat
    const newChat = await prisma.chat.create({
      data: {
        name: name || `${teamId} General Chat`,
        type: 'TEAM',
        teamId
      }
    });

    // Add all team members as participants
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId
      },
      select: {
        userId: true
      }
    });

    // Add team manager
    const team = await prisma.team.findUnique({
      where: {
        id: teamId
      },
      select: {
        managerId: true
      }
    });

    const participantIds = [...teamMembers.map(member => member.userId)];
    if (!participantIds.includes(team.managerId)) {
      participantIds.push(team.managerId);
    }

    // Create chat participants
    const participantPromises = participantIds.map(memberId => {
      return prisma.chatParticipant.create({
        data: {
          chatId: newChat.id,
          userId: memberId
        }
      });
    });

    await Promise.all(participantPromises);

    res.status(201).json({ 
      message: "Team chat created successfully", 
      chat: newChat 
    });
  } catch (error) {
    console.error("Error creating team chat:", error);
    res.status(500).json({ message: "Failed to create team chat", error: error.message });
  }
};

// Get all chats for a user
export const getUserChats = async (req, res) => {
  try {
    const { userId } = req.user;
   
    const userChats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        team: {
          select: {
            name: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });
    
    res.status(200).json(userChats);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ message: "Failed to fetch user chats", error: error.message });
  }
};

// Get chat by ID with messages
export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.user;
    
    // Check if user is a participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId
      }
    });
    
    if (!participant) {
      return res.status(403).json({ message: "You don't have access to this chat" });
    }
    
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            },
            attachments: true,
            readBy: true
            
               
              
            
          }
        }
      }
    });
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    res.status(200).json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ message: "Failed to fetch chat", error: error.message });
  }
};

// Send a message in a chat
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const { userId } = req.user;
    
    // Check if user is a participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId
      }
    });
    
    if (!participant) {
      return res.status(403).json({ message: "You don't have access to this chat" });
    }
    
    const message = await prisma.chatMessage.create({
      data: {
        content,
        chatId,
        senderId: userId
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
    
    // Mark the message as read by the sender
    await prisma.messageRead.create({
      data: {
        userId,
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
    
    // Create notifications for other participants
    const otherParticipants = await prisma.chatParticipant.findMany({
      where: {
        chatId,
        userId: {
          not: userId
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
    
    const notificationPromises = otherParticipants.map(participant => {
      return prisma.notification.create({
        data: {
          type: 'CHAT_MESSAGE',
          content: `New message in ${chat.name || chat.team.name} chat`,
          userId: participant.userId,
          relatedId: chatId
        }
      });
    });
    
    await Promise.all(notificationPromises);
    
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

// Upload file attachment to a message
export const uploadAttachment = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.user;
    const { file } = req;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
   
    
    // Check if user is a participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId
      }
    });
    
    if (!participant) {
      return res.status(403).json({ message: "You don't have access to this chat" });
    }
    
    // Create the message first
    const message = await prisma.chatMessage.create({
      data: {
        content: `Shared a file: ${file.originalname}`,
        chatId,
        senderId: userId
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
    
    // Create attachment record
    const attachment = await prisma.chatAttachment.create({
      data: {
        chatMessageId: message.id,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        cloudinaryUrl: file.path || req.file.path,
        publicId: file.filename ||  (req.file.path ? req.file.path.split('/').pop() : null)
      }
    });
    
    // Mark the message as read by the sender
    await prisma.messageRead.create({
      data: {
        userId,
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
    
    res.status(201).json({ 
      message: "File uploaded successfully", 
      chatMessage: message,
      attachment
    });
  } catch (error) {
   // console.error("Error uploading file:", error);
    res.status(500).json({ message: "Failed to upload file", error: error.message });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;
    const { userId } = req.user;
    
    // Check if user is a participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId
      }
    });
    
    if (!participant) {
      return res.status(403).json({ message: "You don't have access to this chat" });
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
            userId
          }
        }
      }
    });
    
    // Mark messages as read
    const readPromises = messages.map(message => {
      return prisma.messageRead.create({
        data: {
          userId,
          chatMessageId: message.id
        }
      });
    });
    
    await Promise.all(readPromises);
    
    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read", error: error.message });
  }
};

// Add a user to a chat (for when new team members join)
export const addUserToChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId: targetUserId } = req.body;
    const { userId, role } = req.user;
    
    // Check if requesting user is manager or already a participant
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId
      },
      include: {
        team: true
      }
    });
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    const isManager = chat.team.managerId === userId;
    
    if (!isManager && role !== 'MANAGER') {
      return res.status(403).json({ message: "Only managers can add users to chats" });
    }
    
    // Check if target user is a member of the team
    const isTeamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: targetUserId,
          teamId: chat.teamId
        }
      }
    });
    
    const isTeamManager = chat.team.managerId === targetUserId;
    
    if (!isTeamMember && !isTeamManager) {
      return res.status(400).json({ message: "User is not a member of this team" });
    }
    
    // Check if user is already a participant
    const existingParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: targetUserId
      }
    });
    
    if (existingParticipant) {
      return res.status(400).json({ message: "User is already a chat participant" });
    }
    
    // Add user to chat
    const participant = await prisma.chatParticipant.create({
      data: {
        chatId,
        userId: targetUserId
      }
    });
    
    res.status(201).json({ 
      message: "User added to chat successfully", 
      participant 
    });
  } catch (error) {
    console.error("Error adding user to chat:", error);
    res.status(500).json({ message: "Failed to add user to chat", error: error.message });
  }
};

// Get unread message counts for a user
export const getUnreadMessageCounts = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const userChats = await prisma.chatParticipant.findMany({
      where: {
        userId: userId
      },
      select: {
        chatId: true
      }
    });
    
    const chatIds = userChats.map(chat => chat.chatId);
    
    const unreadCounts = await Promise.all(
      chatIds.map(async (chatId) => {
        const totalMessages = await prisma.chatMessage.count({
          where: {
            chatId: chatId
          }
        });
        
        const readMessages = await prisma.messageRead.count({
          where: {
            userId: userId,
            chatMessage: {
              chatId: chatId
            }
          }
        });
        
        return {
          chatId: chatId,
          unreadCount: totalMessages - readMessages
        };
      })
    );
    
    res.status(200).json(unreadCounts);
  } catch (error) {
    console.error("Error fetching unread message counts:", error);
    res.status(500).json({ message: "Failed to fetch unread message counts", error: error.message });
  }
};