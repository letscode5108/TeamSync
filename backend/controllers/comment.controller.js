import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add a comment to a task
export const addTaskComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    
    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: true,
        assignee: true
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Verify user has access to the task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: task.teamId
        }
      }
    });
    
    const isManager = task.team.managerId === userId;
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.creatorId === userId;
    
    if (!teamMember && !isManager && !isAssignee && !isCreator) {
      return res.status(403).json({ error: 'You do not have access to this task' });
    }
    
    // Create the comment with the userId to track who made the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId, // Track who created the comment
        createdAt: new Date()
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
    
    // Notify relevant users about the new comment
    // Notify assignee if they're not the commenter
    if (task.assigneeId && task.assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'MESSAGE',
          content: `New comment on task "${task.title}" from ${req.user.name || 'a team member'}`,
          userId: task.assigneeId,
          relatedId: taskId
        }
      });
    }
    
    // Notify creator if they're not the commenter and not the assignee
    if (task.creatorId && task.creatorId !== userId && task.creatorId !== task.assigneeId) {
      await prisma.notification.create({
        data: {
          type: 'MESSAGE',
          content: `New comment on task "${task.title}" from ${req.user.name || 'a team member'}`,
          userId: task.creatorId,
          relatedId: taskId
        }
      });
    }
    
    return res.status(201).json({ 
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Edit a task comment
export const editTaskComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    
    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            team: true
          }
        }
      }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Get task details
    const task = comment.task;
    
    // Check if user is authorized to edit comment
    // Team manager, comment author, or task creator can edit comment
    const isManager = task.team.managerId === userId;
    const isCommentAuthor = comment.userId === userId;
    
    if (!isManager && !isCommentAuthor) {
      return res.status(403).json({ 
        error: 'Only the comment author or team manager can edit comments' 
      });
    }
    
    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date()
      }
    });
    
    return res.status(200).json({ 
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ error: 'Failed to update comment' });
  }
};

// Delete a task comment
export const deleteTaskComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;
    
    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            team: true
          }
        }
      }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Get task details
    const task = comment.task;
    
    // Check if user is authorized to delete comment
    // Team manager or comment author can delete comment
    const isManager = task.team.managerId === userId;
    const isCommentAuthor = comment.userId === userId;
    
    if (!isManager && !isCommentAuthor) {
      return res.status(403).json({ 
        error: 'Only the comment author or team manager can delete comments' 
      });
    }
    
    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId }
    });
    
    return res.status(200).json({ 
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// Get all comments for a task
export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    
    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: true
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Verify user has access to the task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: task.teamId
        }
      }
    });
    
    const isManager = task.team.managerId === userId;
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.creatorId === userId;
    
    if (!teamMember && !isManager && !isAssignee && !isCreator) {
      return res.status(403).json({ error: 'You do not have access to this task' });
    }
    
    // Get comments with user information
    const comments = await prisma.comment.findMany({
      where: {
        taskId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
};