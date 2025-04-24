// controllers/teamController.js
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendInvitationEmail } from '../services/email.Service.js';

const prisma = new PrismaClient();

// Create a new team
export const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId; // From JWT middleware
    
    const newTeam = await prisma.team.create({
      data: {
        name,
        description,
        managerId: userId,
        // Create default team chat
        chats: {
          create: {
            type: 'TEAM',
            participants: {
              create: {
                userId
              }
            }
          }
        }
      },
      include: {
        manager: true,
        chats: true
      }
    });
    
    res.status(201).json({ 
      message: 'Team created successfully', 
      team: newTeam 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create team', 
      error: error.message 
    });
  }
};

// Get all teams managed by the user
export const getTeams = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const teams = await prisma.team.findMany({
      where: {
        managerId: userId
      },
      include: {
        members: {
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
      }
    });
    
    res.status(200).json({ teams });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch teams', 
      error: error.message 
    });
  }
};

// Get team by ID
export const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    
    // Check if user is manager or member of the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        manager: true,
        members: {
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
        tasks: true,
        meetings: true
      }
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const isMember = team.members.some(member => member.userId === userId);
    const isManager = team.managerId === userId;
    
    if (!isManager && !isMember) {
      return res.status(403).json({ message: 'Not authorized to access this team' });
    }
    
    res.status(200).json({ team });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch team details', 
      error: error.message 
    });
  }
};

// Update team details
export const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.userId;
    
    // Check if user is the manager
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    if (team.managerId !== userId) {
      return res.status(403).json({ message: 'Only the team manager can update team details' });
    }
    
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        description
      }
    });
    
    res.status(200).json({ 
      message: 'Team updated successfully', 
      team: updatedTeam 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update team', 
      error: error.message 
    });
  }
};

// Delete a team
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    
    // Check if user is the manager
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    if (team.managerId !== userId) {
      return res.status(403).json({ message: 'Only the team manager can delete the team' });
    }
    
    await prisma.team.delete({
      where: { id: teamId }
    });
    
    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete team', 
      error: error.message 
    });
  }
};

// Send team invitation
export const inviteMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    const userId = req.user.userId;
    
    // Check if user is the manager
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        manager: true
      }
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    if (team.managerId !== userId) {
      return res.status(403).json({ message: 'Only the team manager can send invitations' });
    }
    
    // Check if invitation already exists
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        teamId_email: {
          teamId,
          email
        }
      }
    });
    
    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }
    
    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
  
    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        senderId: userId,
        email,
        token,
        expiresAt,
        status: 'PENDING'
      },
      include: {
        team: true,
        sender: true
      }
    });
    
    // Send invitation email
    await sendInvitationEmail({
      email,
      token,
      teamId,  // Add this
      teamName: team.name,
      senderName: req.user.name || team.manager.name
    });
    
    res.status(201).json({ 
      message: 'Invitation sent successfully', 
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        token: token //For testing purpose
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to send invitation', 
      error: error.message 
    });
  }
};

// Get all pending invitations for a team
export const getTeamInvitations = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    
    // Check if user is the manager
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    if (team.managerId !== userId) {
      return res.status(403).json({ message: 'Only the team manager can view invitations' });
    }
    
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId,
        
      },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        expiresAt: true
      }
    });
    
    res.status(200).json({ invitations });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch invitations', 
      error: error.message 
    });
  }
};


// Get team members
export const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    
    // Check if user is manager or member of the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const isMember = team.members.some(member => member.userId === userId);
    const isManager = team.managerId === userId;
    
    if (!isManager && !isMember) {
      return res.status(403).json({ message: 'Not authorized to access this team' });
    }
    
    const members = team.members.map(member => ({
      id: member.id,
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.user.role,
      joinedAt: member.joinedAt
    }));
  

    res.status(200).json({ members });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch team members', 
      error: error.message 
    });
  }
};

// Remove a member from the team
export const removeMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const userId = req.user.userId;
    
    // Check if user is the manager
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    if (team.managerId !== userId) {
      return res.status(403).json({ message: 'Only the team manager can remove members' });
    }
    
    // Find the team member
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId
      }
    });
    
    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    // Don't allow removing the manager
    if (teamMember.userId === team.managerId) {
      return res.status(400).json({ message: 'Cannot remove the team manager' });
    }
    
    await prisma.teamMember.delete({
      where: { id: memberId }
    });
    
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to remove member', 
      error: error.message 
    });
  }
};
