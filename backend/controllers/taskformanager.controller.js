import { PrismaClient } from '@prisma/client';

import {  sendTaskAssignmentEmail, sendTaskDeadlineEmail } from '../services/email.Service.js';


const prisma = new PrismaClient();
// Create a new task with notifications
export const createTask = async (req, res) => {
    try {
      const { title, description, priority, deadline,  assigneeId } = req.body;
      const { teamId } = req.params;
      const userId = req.user.userId; // From auth middleware
      
      // Validate user is a manager of this team
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          managerId: userId
        }
      });
      
      if (!team) {
        return res.status(403).json({ error: 'You must be a team manager to create tasks' });
      }
      
      // Validate assignee is a member of the team
      if (assigneeId) {
        const teamMember = await prisma.teamMember.findUnique({
          where: {
            userId_teamId: {
              userId: assigneeId,
              teamId
            }
          }
        });
        
        if (!teamMember) {
          return res.status(400).json({ error: 'Assignee must be a member of the team' });
        }
      }
      
      // Create the task
      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority: priority || 'MEDIUM',
          deadline: deadline ? new Date(deadline) : null,
          teamId,
          creatorId: userId,
          assigneeId,
          status: 'NOT_STARTED'
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          team: {
            select: {
              name: true
            }
          }
        }
      });
      
      // Create task history entry
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          status: 'NOT_STARTED'
        }
      });
      
      // If assigned to someone, create notification
      if (assigneeId) {
        // Create in-app notification
        await createTaskAssignmentNotification(task);
        
        // Send email notification
        await sendTaskAssignmentEmail({
          email: task.assignee.email,
          userName: task.assignee.name,
          taskTitle: task.title,
          taskId: task.id,
          teamName: task.team.name,
          deadline: task.deadline
        });
      }
      
      return res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ error: 'Failed to create task' });
    }
  };
  
  // Helper function to create in-app notification
  const createTaskAssignmentNotification = async (task) => {
    try {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          content: `You have been assigned a new task: ${task.title}`,
          userId: task.assigneeId,
          relatedId: task.id
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Continue execution even if notification fails
    }
  };

// Get tasks for a specific team
export const getTeamAnalysis = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    
    // Check if user is part of the team
    
    const isManager = await prisma.team.findFirst({
      where: {
        id: teamId,
        managerId: userId
      }
    });
    
    if ( !isManager) {
      return res.status(403).json({ error: 'You are not a manager of this team' });
    }
    
    const tasks = await prisma.task.findMany({
      where: {
        teamId
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        subtasks: true
      },
      orderBy: [
        {
          priority: 'desc'
        },
        {
          deadline: 'asc'
        }
      ]
    });
    const tasksByStatus = {
      NOT_STARTED: tasks.filter(task => task.status === 'NOT_STARTED'),
      READY_TO_START: tasks.filter(task => task.status === 'READY_TO_START'),
      IN_PROGRESS: tasks.filter(task => task.status === 'IN_PROGRESS'),
      ALMOST_DONE: tasks.filter(task => task.status === 'ALMOST_DONE'),
      COMPLETED: tasks.filter(task => task.status === 'COMPLETED')
    };
    
    // Calculate summary stats
    const summary = {
      total: tasks.length,
      completed: tasksByStatus.COMPLETED.length,
      inProgress: tasksByStatus.IN_PROGRESS.length + tasksByStatus.ALMOST_DONE.length,
      notStarted: tasksByStatus.NOT_STARTED.length + tasksByStatus.READY_TO_START.length,
      completionRate: tasks.length > 0 ? (tasksByStatus.COMPLETED.length / tasks.length) * 100 : 0
    };
    return res.status(200).json({ 
      tasks,
      tasksByStatus,
      summary
    });
  } catch (error) {
    console.error('Error fetching team tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch team tasks' });
  }
};


export const getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subtasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        history: {
          orderBy: {
            changedAt: 'desc'
          }
        },
        comments: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        resources: true
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has access to this task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: task.teamId
        }
      }
    });
    
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.creatorId === userId;
    const isManager = task.team.managerId === userId;
    
    if (!teamMember && !isAssignee && !isCreator && !isManager) {
      return res.status(403).json({ 
        error: 'You do not have access to this task' 
      });
    }
    
    return res.status(200).json({ task });
  } catch (error) {
    console.error('Error fetching task details:', error);
    return res.status(500).json({ error: 'Failed to fetch task details' });
  }
};

// Add resources to a task
export const addTaskResource = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name, url, type } = req.body;
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
    
    const isManager = task.team.managerId === userId;
    const isAssignee = task.assigneeId === userId;
    
    // Only team manager or assignee can add resources
    if (!isManager && !isAssignee) {
      return res.status(403).json({ error: 'You do not have permission to add resources to this task' });
    }
    
    // Create the resource
    const resource = await prisma.resource.create({
      data: {
        name,
        url,
        type,
        taskId
      }
    });
    
    return res.status(201).json({ 
      message: 'Resource added successfully',
      resource
    });
  } catch (error) {
    console.error('Error adding resource:', error);
    return res.status(500).json({ error: 'Failed to add resource' });
  }
};

// Add to task.controller.js

// Edit a task
export const editTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, deadline, assigneeId } = req.body;
    const userId = req.user.userId;
    
    // Find the task
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
    
    // Check if user is the creator or team manager
    const isCreator = task.creatorId === userId;
    const isManager = task.team.managerId === userId;
    
    if (!isCreator && !isManager) {
      return res.status(403).json({ 
        error: 'Only the task creator or team manager can edit this task' 
      });
    }
    
    // Only allow managers to change priority
    if (priority !== undefined && priority !== task.priority && !isManager) {
      return res.status(403).json({
        error: 'Only the team manager can change task priority'
      });
    }

    // Only allow managers to change deadline
    if (deadline !== undefined && deadline !== task.deadline && !isManager) {
      return res.status(403).json({
        error: 'Only the team manager can change task deadline'
      });
    }


    
    // If assignee is changed, validate new assignee is a team member
    if (assigneeId && assigneeId !== task.assigneeId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: assigneeId,
            teamId: task.teamId
          }
        }
      });
      
      if (!teamMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the team' });
      }
      
      // Create notification for new assignee
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          content: `You have been assigned to task: ${title || task.title}`,
          userId: assigneeId,
          relatedId: taskId
        }
      });
      
      // Could add email notification here as well

    }
    
    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title : task.title,
        description: description !== undefined ? description : task.description,
        priority: priority !== undefined ? priority : task.priority,
        deadline: deadline !== undefined ? new Date(deadline) : task.deadline,
        assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
        updatedAt: new Date()
      },
      include: {
        team: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return res.status(200).json({ 
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: true,
        subtasks: true
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user is the creator or team manager
    const isCreator = task.creatorId === userId;
    const isManager = task.team.managerId === userId;
    
    if (!isCreator && !isManager) {
      return res.status(403).json({ 
        error: 'Only the task creator or team manager can delete this task' 
      });
    }
    
    // Check if task has subtasks
    if (task.subtasks.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete a task with subtasks. Delete the subtasks first or reassign them.' 
      });
    }
    
    // Delete the task and all associated records (using cascade)
    await prisma.task.delete({
      where: { id: taskId }
    });
    
    // Create notification for assignee if task was assigned
    if (task.assigneeId) {
      await prisma.notification.create({
        data: {
          type: 'TASK_STATUS_CHANGE',
          content: `Task "${task.title}" has been deleted`,
          userId: task.assigneeId,
          relatedId: null
        }
      });
    }
    
    return res.status(200).json({ 
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
};


// Add to task.controller.js

// Create a subtask
export const createSubtask = async (req, res) => {
  try {
    const { parentTaskId } = req.params;
    const { title, description, priority, deadline, assigneeId } = req.body;
    const userId = req.user.userId;
    
    // Find the parent task
    const parentTask = await prisma.task.findUnique({
      where: { id: parentTaskId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            managerId: true
          }
        }
      }
    });
    
    if (!parentTask) {
      return res.status(404).json({ error: 'Parent task not found' });
    }
    
    // Validate user is either team manager or the parent task creator/assignee
    const isManager = parentTask.team.managerId === userId;
    const isCreator = parentTask.creatorId === userId;
    const isAssignee = parentTask.assigneeId === userId;
    
    if (!isManager && !isCreator && !isAssignee) {
      return res.status(403).json({ 
        error: 'You do not have permission to create subtasks for this task' 
      });
    }
    
    // Validate assignee is a member of the team
    if (assigneeId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: assigneeId,
            teamId: parentTask.teamId
          }
        }
      });
      
      if (!teamMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the team' });
      }
    }
    
    // Create the subtask
    const subtask = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        deadline: deadline ? new Date(deadline) : null,
        teamId: parentTask.teamId,
        creatorId: userId,
        assigneeId,
        status: 'NOT_STARTED',
        parentId: parentTaskId // This makes it a subtask
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        team: {
          select: {
            name: true
          }
        },
        parent: {
          select: {
            title: true
          }
        }
      }
    });
    
    // Create task history entry
    await prisma.taskHistory.create({
      data: {
        taskId: subtask.id,
        status: 'NOT_STARTED'
      }
    });
    
    // If assigned to someone, create notification
    if (assigneeId) {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          content: `You have been assigned a new subtask: ${subtask.title} (part of "${subtask.parent.title}")`,
          userId: assigneeId,
          relatedId: subtask.id
        }
      });
      
      // Send email notification
  
    }
    
    return res.status(201).json(subtask);
  } catch (error) {
    console.error('Error creating subtask:', error);
    return res.status(500).json({ error: 'Failed to create subtask' });
  }
};

// Get all subtasks for a specific task
export const getTaskSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: true
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has access to this task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: task.teamId
        }
      }
    });
    
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.creatorId === userId;
    const isManager = task.team.managerId === userId;
    
    if (!teamMember && !isAssignee && !isCreator && !isManager) {
      return res.status(403).json({ 
        error: 'You do not have access to this task' 
      });
    }
    
    // Get all subtasks
    const subtasks = await prisma.task.findMany({
      where: {
        parentId: taskId
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        history: {
          orderBy: {
            changedAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: [
        {
          priority: 'desc'
        },
        {
          deadline: 'asc'
        }
      ]
    });
    
    // Calculate summary stats
    const summary = {
      total: subtasks.length,
      completed: subtasks.filter(task => task.status === 'COMPLETED').length,
      inProgress: subtasks.filter(task => ['IN_PROGRESS', 'ALMOST_DONE'].includes(task.status)).length,
      notStarted: subtasks.filter(task => ['NOT_STARTED', 'READY_TO_START'].includes(task.status)).length
    };
    
    return res.status(200).json({ 
      subtasks,
      summary
    });
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
};




export const checkAndSendDeadlineReminders = async () => {
  try {
    // Get current date
    const now = new Date();
    
    // Calculate date 24 hours from now
    const tomorrow = new Date(now);
    tomorrow.setHours(tomorrow.getHours() + 24);
    
    // Find tasks that:
    // 1. Have a deadline within the next 24 hours
    // 2. Are not yet completed
    // 3. Haven't had a reminder sent yet (we'll track this)
    const tasksWithApproachingDeadlines = await prisma.task.findMany({
      where: {
        deadline: {
          gt: now,
          lt: tomorrow
        },
        status: {
          notIn: ['COMPLETED']
        },
        // You might want to add a field to track if reminder has been sent
        // reminderSent: false
      },
      include: {
        assignee: true,
        team: true
      }
    });
    
    console.log(`Found ${tasksWithApproachingDeadlines.length} tasks with approaching deadlines`);
    
    // Send notifications for each task
    for (const task of tasksWithApproachingDeadlines) {
      if (task.assignee) {
        // Create in-app notification
        await prisma.notification.create({
          data: {
            type: 'TASK_DEADLINE_APPROACHING',
            content: `Your task "${task.title}" is due in less than 24 hours`,
            userId: task.assigneeId,
            relatedId: task.id
          }
        });
        
        // Send email notification
        await sendTaskDeadlineEmail({
          email: task.assignee.email,
          userName: task.assignee.name,
          taskTitle: task.title,
          taskId: task.id,
          teamName: task.team.name,
          deadline: task.deadline
        });
        
        // Update task to mark that reminder has been sent
        // await prisma.task.update({
        //   where: { id: task.id },
        //   data: { reminderSent: true }
        // });
        
        console.log(`Sent deadline reminder for task ${task.id} to ${task.assignee.email}`);
      }
    }
    
    return tasksWithApproachingDeadlines.length;
  } catch (error) {
    console.error('Error sending deadline reminders:', error);
    throw error;
  }
};

// Add this function to task.controller.js

// Update parent task status based on subtask completion
const updateParentTaskStatus = async (taskId) => {
  try {
    // Get the task to check if it has a parent
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { parentId: true }
    });
    
    // If task has no parent, nothing to update
    if (!task || !task.parentId) {
      return null;
    }
    
    // Get all sibling subtasks (including this one)
    const subtasks = await prisma.task.findMany({
      where: { parentId: task.parentId }
    });
    
    // Calculate completion metrics
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(subtask => subtask.status === 'COMPLETED').length;
    const inProgressSubtasks = subtasks.filter(subtask => 
      ['IN_PROGRESS', 'ALMOST_DONE'].includes(subtask.status)
    ).length;
    
    // Determine appropriate parent status based on subtask statuses
    let newParentStatus;
    
    if (completedSubtasks === totalSubtasks) {
      // All subtasks completed
      newParentStatus = 'COMPLETED';
    } else if (completedSubtasks > 0 || inProgressSubtasks > 0) {
      // Some subtasks completed or in progress
      const completionRatio = completedSubtasks / totalSubtasks;
      
      if (completionRatio >= 0.75) {
        newParentStatus = 'ALMOST_DONE';
      } else if (completionRatio > 0) {
        newParentStatus = 'IN_PROGRESS';
      } else {
        // Only some in progress, none completed
        newParentStatus = 'IN_PROGRESS';
      }
    } else {
      // No progress on any subtask
      newParentStatus = 'NOT_STARTED';
    }
    
    // Update the parent task status
    const updatedParent = await prisma.task.update({
      where: { id: task.parentId },
      data: { 
        status: newParentStatus,
        updatedAt: new Date()
      }
    });
    
    // Create task history record for the parent
    await prisma.taskHistory.create({
      data: {
        taskId: task.parentId,
        status: newParentStatus,
        changedAt: new Date()
      }
    });
    
    return updatedParent;
  } catch (error) {
    console.error('Error updating parent task status:', error);
    return null;
  }
};