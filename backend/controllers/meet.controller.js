// controllers/meetingController.js
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

import express from 'express';
import { sendMeetingInvitationEmail, sendMeetingReminderEmail } from '../services/email.Service.js';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Create a new meeting for a team
 * @route POST /api/meetings
 * @access Private (Team members)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { title, description, startTime, endTime, teamId, attendeeIds } = req.body;

    // Check if user is part of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    });

    // if (!teamMember) {
      // return res.status(403).json({ message: "You must be a team member to create a meeting" });
    // }

    // Generate a unique 6-character room code
    const roomCode = generateRoomCode();

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        roomCode,
        teamId,
        attendees: {
          create: [
            // Add the creator as an attendee with accepted status
            {
              userId,
              status: 'accepted'
            },
            // Add other attendees if specified
            ...(attendeeIds?.map(attendeeId => ({
              userId: attendeeId,
              status: 'pending'
            })) || [])
          ]
        }
      },
      include: {
        team: true,
        attendees: {
          include: {
            user: true
          }
        }
      }
    });

    // Create a chat for the meeting
    await prisma.chat.create({
      data: {
        type: 'MEETING',
        teamId,
        meetingId: meeting.id,
        participants: {
          create: [
            { userId },
            ...(attendeeIds?.map(attendeeId => ({
              userId: attendeeId
            })) || [])
          ]
        }
      }
    });

    // Get creator's name for the email
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    // Create notifications and send emails to attendees
    for (const attendee of meeting.attendees) {
      if (attendee.userId !== userId) {
        // Create notification
        await prisma.notification.create({
          data: {
            type: 'MEETING_SCHEDULED',
            content: `You have been invited to the meeting: ${meeting.title}`,
            userId: attendee.userId,
            relatedId: meeting.id
          }
        });

        // Send email
        await sendMeetingInvitationEmail({
          email: attendee.user.email,
          userName: attendee.user.name,
          meetingTitle: meeting.title,
          meetingId: meeting.id,
          roomCode: meeting.roomCode,
          teamName: meeting.team.name,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          organizerName: creator.name
        });
      }
    }

    res.status(201).json({
      message: "Meeting created successfully",
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        roomCode: meeting.roomCode,
        teamId: meeting.teamId
      }
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ message: "Failed to create meeting", error: error.message });
  }
});

/**
 * Get all meetings for a team
 * @route GET /api/meetings/team/:teamId
 * @access Private (Team members)
 */
router.get('/team/:teamId', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { teamId } = req.params;

    // Check if user is part of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    });

    if (!teamMember) {
      return res.status(403).json({ message: "You must be a team member to view team meetings" });
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        teamId
      },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching team meetings:", error);
    res.status(500).json({ message: "Failed to fetch meetings", error: error.message });
  }
});

/**
 * Get meetings for current user
 * @route GET /api/meetings/my-meetings
 * @access Private
 */
router.get('/my-meetings', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;

    const meetings = await prisma.meeting.findMany({
      where: {
        attendees: {
          some: {
            userId
          }
        }
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching user meetings:", error);
    res.status(500).json({ message: "Failed to fetch meetings", error: error.message });
  }
});

/**
 * Get a meeting by ID
 * @route GET /api/meetings/:id
 * @access Private (Meeting attendees)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const meeting = await prisma.meeting.findUnique({
      where: {
        id
      },
      include: {
        team: true,
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        resources: true
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user is part of the team or an attendee
    const isTeamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: meeting.teamId
        }
      }
    });

    const isAttendee = meeting.attendees.some(attendee => attendee.userId === userId);

    if (!isTeamMember && !isAttendee) {
      return res.status(403).json({ message: "You don't have access to this meeting" });
    }

    res.status(200).json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ message: "Failed to fetch meeting", error: error.message });
  }
});

/**
 * Join a meeting by room code
 * @route POST /api/meetings/join
 * @access Private
 */
router.post('/join', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { roomCode } = req.body;

    const meeting = await prisma.meeting.findUnique({
      where: {
        roomCode
      },
      include: {
        team: true,
        attendees: true
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found with this room code" });
    }

    // Check if meeting has started
    const now = new Date();
    if (now < new Date(meeting.startTime)) {
      return res.status(400).json({ message: "Meeting has not started yet" });
    }

    // Check if meeting has ended
    if (now > new Date(meeting.endTime)) {
      return res.status(400).json({ message: "Meeting has already ended" });
    }

    // Check if user is part of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: meeting.teamId
        }
      }
    });

    if (!teamMember) {
      return res.status(403).json({ message: "You must be a team member to join this meeting" });
    }

    // Check if user is already an attendee
    const existingAttendee = meeting.attendees.find(attendee => attendee.userId === userId);

    if (!existingAttendee) {
      // Add user as an attendee
      await prisma.meetingAttendee.create({
        data: {
          meetingId: meeting.id,
          userId,
          status: 'accepted'
        }
      });

      // Add user to meeting chat
      const meetingChat = await prisma.chat.findFirst({
        where: {
          meetingId: meeting.id,
          type: 'MEETING'
        }
      });

      if (meetingChat) {
        const existingParticipant = await prisma.chatParticipant.findFirst({
          where: {
            chatId: meetingChat.id,
            userId
          }
        });

        if (!existingParticipant) {
          await prisma.chatParticipant.create({
            data: {
              chatId: meetingChat.id,
              userId
            }
          });
        }
      }
    } else if (existingAttendee.status === 'pending') {
      // Update status to accepted
      await prisma.meetingAttendee.update({
        where: {
          id: existingAttendee.id
        },
        data: {
          status: 'accepted'
        }
      });
    }

    res.status(200).json({
      message: "Successfully joined the meeting",
      meetingId: meeting.id
    });
  } catch (error) {
    console.error("Error joining meeting:", error);
    res.status(500).json({ message: "Failed to join meeting", error: error.message });
  }
});

/**
 * Respond to a meeting invitation
 * @route POST /api/meetings/:id/respond
 * @access Private (Invited users)
 */
router.post('/:id/respond', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'accepted' or 'declined'" });
    }

    // Check if user is invited to the meeting
    const attendee = await prisma.meetingAttendee.findFirst({
      where: {
        meetingId: id,
        userId
      }
    });

    if (!attendee) {
      return res.status(404).json({ message: "You are not invited to this meeting" });
    }

    // Update attendance status
    await prisma.meetingAttendee.update({
      where: {
        id: attendee.id
      },
      data: {
        status
      }
    });

    // If accepting, ensure user is added to the meeting chat
    if (status === 'accepted') {
      const meetingChat = await prisma.chat.findFirst({
        where: {
          meetingId: id,
          type: 'MEETING'
        }
      });

      if (meetingChat) {
        const existingParticipant = await prisma.chatParticipant.findFirst({
          where: {
            chatId: meetingChat.id,
            userId
          }
        });

        if (!existingParticipant) {
          await prisma.chatParticipant.create({
            data: {
              chatId: meetingChat.id,
              userId
            }
          });
        }
      }
    }

    res.status(200).json({
      message: `Meeting invitation ${status}`,
      status
    });
  } catch (error) {
    console.error("Error responding to meeting invitation:", error);
    res.status(500).json({ message: "Failed to respond to invitation", error: error.message });
  }
});

/**
 * Update meeting details
 * @route PUT /api/meetings/:id
 * @access Private (Meeting creator or Team manager)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;
    const { title, description, startTime, endTime, attendeeIds } = req.body;

    const meeting = await prisma.meeting.findUnique({
      where: {
        id
      },
      include: {
        team: true,
        attendees: true
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Find meeting creator (first attendee or someone who created the record)
    const creator = meeting.attendees.find(a => a.status === 'accepted');
    
    // Check if user is the creator or team manager
    const isCreator = creator?.userId === userId;
    const isManager = meeting.team.managerId === userId;

    if (!isCreator && !isManager && role !== 'MANAGER') {
      return res.status(403).json({ message: "You don't have permission to update this meeting" });
    }

    // Update meeting details
    const updatedMeeting = await prisma.meeting.update({
      where: {
        id
      },
      data: {
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined
      },
      include: {
        team: true,
        attendees: {
          include: {
            user: true
          }
        }
      }
    });

    // If attendeeIds provided, update attendees
    if (attendeeIds && Array.isArray(attendeeIds)) {
      // Get current attendees
      const currentAttendeeIds = meeting.attendees.map(a => a.userId);
      
      // Find attendees to add
      const attendeesToAdd = attendeeIds.filter(id => !currentAttendeeIds.includes(id));
      
      // Find attendees to remove
      const attendeesToRemove = currentAttendeeIds.filter(
        id => !attendeeIds.includes(id) && id !== userId // Don't remove the creator
      );
      
      // Add new attendees
      for (const attendeeId of attendeesToAdd) {
        await prisma.meetingAttendee.create({
          data: {
            meetingId: meeting.id,
            userId: attendeeId,
            status: 'pending'
          }
        });
        
        // Add to meeting chat
        const meetingChat = await prisma.chat.findFirst({
          where: {
            meetingId: meeting.id,
            type: 'MEETING'
          }
        });
        
        if (meetingChat) {
          await prisma.chatParticipant.create({
            data: {
              chatId: meetingChat.id,
              userId: attendeeId
            }
          });
        }
        
        // Send notification and email
        const newAttendee = await prisma.user.findUnique({
          where: { id: attendeeId },
          select: { name: true, email: true }
        });
        
        await prisma.notification.create({
          data: {
            type: 'MEETING_SCHEDULED',
            content: `You have been invited to the meeting: ${meeting.title}`,
            userId: attendeeId,
            relatedId: meeting.id
          }
        });
        
        await sendMeetingInvitationEmail({
          email: newAttendee.email,
          userName: newAttendee.name,
          meetingTitle: updatedMeeting.title,
          meetingId: updatedMeeting.id,
          roomCode: updatedMeeting.roomCode,
          teamName: updatedMeeting.team.name,
          startTime: updatedMeeting.startTime,
          endTime: updatedMeeting.endTime,
          organizerName: req.user.name
        });
      }
      
      // Remove attendees
      for (const attendeeId of attendeesToRemove) {
        const attendeeToRemove = meeting.attendees.find(a => a.userId === attendeeId);
        
        if (attendeeToRemove) {
          await prisma.meetingAttendee.delete({
            where: {
              id: attendeeToRemove.id
            }
          });
          
          // Remove from meeting chat
          const meetingChat = await prisma.chat.findFirst({
            where: {
              meetingId: meeting.id,
              type: 'MEETING'
            }
          });
          
          if (meetingChat) {
            const chatParticipant = await prisma.chatParticipant.findFirst({
              where: {
                chatId: meetingChat.id,
                userId: attendeeId
              }
            });
            
            if (chatParticipant) {
              await prisma.chatParticipant.delete({
                where: {
                  id: chatParticipant.id
                }
              });
            }
          }
          
          // Send notification
          await prisma.notification.create({
            data: {
              type: 'MEETING_SCHEDULED',
              content: `You have been removed from the meeting: ${meeting.title}`,
              userId: attendeeId,
              relatedId: meeting.id
            }
          });
        }
      }
    }

    res.status(200).json({
      message: "Meeting updated successfully",
      meeting: updatedMeeting
    });
  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({ message: "Failed to update meeting", error: error.message });
  }
});

/**
 * End a meeting
 * @route POST /api/meetings/:id/end
 * @access Private (Meeting creator or Team manager)
 */
router.post('/:id/end', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    const meeting = await prisma.meeting.findUnique({
      where: {
        id
      },
      include: {
        team: true,
        attendees: true
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Find meeting creator (first attendee or someone who created the record)
    const creator = meeting.attendees.find(a => a.status === 'accepted');
    
    // Check if user is the creator or team manager
    const isCreator = creator?.userId === userId;
    const isManager = meeting.team.managerId === userId;

    if (!isCreator && !isManager && role !== 'MANAGER') {
      return res.status(403).json({ message: "You don't have permission to end this meeting" });
    }

    // End the meeting by setting endTime to now
    const now = new Date();
    await prisma.meeting.update({
      where: {
        id
      },
      data: {
        endTime: now
      }
    });

    // Notify all attendees
    for (const attendee of meeting.attendees) {
      if (attendee.status === 'accepted' && attendee.userId !== userId) {
        await prisma.notification.create({
          data: {
            type: 'MEETING_SCHEDULED',
            content: `The meeting "${meeting.title}" has ended`,
            userId: attendee.userId,
            relatedId: meeting.id
          }
        });
      }
    }

    res.status(200).json({
      message: "Meeting ended successfully",
      endTime: now
    });
  } catch (error) {
    console.error("Error ending meeting:", error);
    res.status(500).json({ message: "Failed to end meeting", error: error.message });
  }
});

/**
 * Delete a meeting
 * @route DELETE /api/meetings/:id
 * @access Private (Meeting creator or Team manager)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    const meeting = await prisma.meeting.findUnique({
      where: {
        id
      },
      include: {
        team: true,
        attendees: true
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Find meeting creator
    const creator = meeting.attendees.find(a => a.status === 'accepted');
    
    // Check if user is the creator or team manager
    const isCreator = creator?.userId === userId;
    const isManager = meeting.team.managerId === userId;

    if (!isCreator && !isManager && role !== 'MANAGER') {
      return res.status(403).json({ message: "You don't have permission to delete this meeting" });
    }

    // Delete the meeting (this will cascade delete attendees, resources, and chat)
    await prisma.meeting.delete({
      where: {
        id
      }
    });

    // Notify all attendees
    for (const attendee of meeting.attendees) {
      if (attendee.userId !== userId) {
        await prisma.notification.create({
          data: {
            type: 'MEETING_SCHEDULED',
            content: `The meeting "${meeting.title}" has been cancelled`,
            userId: attendee.userId,
            relatedId: null // Meeting no longer exists
          }
        });
      }
    }

    res.status(200).json({
      message: "Meeting deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ message: "Failed to delete meeting", error: error.message });
  }
});

/**
 * Add a resource to a meeting
 * @route POST /api/meetings/:id/resources
 * @access Private (Meeting attendees)
 */
router.post('/:id/resources', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { name, url, type } = req.body;

    // Check if user is an attendee of the meeting
    const attendee = await prisma.meetingAttendee.findFirst({
      where: {
        meetingId: id,
        userId,
        status: 'accepted'
      }
    });

    if (!attendee) {
      return res.status(403).json({ message: "You must be an accepted attendee to add resources" });
    }

    // Add resource
    const resource = await prisma.meetingResource.create({
      data: {
        name,
        url,
        type,
        meetingId: id
      }
    });

    res.status(201).json({
      message: "Resource added successfully",
      resource
    });
  } catch (error) {
    console.error("Error adding resource:", error);
    res.status(500).json({ message: "Failed to add resource", error: error.message });
  }
});

/**
 * Helper function to generate a random room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default router;