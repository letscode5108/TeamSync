import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const getMyTasks = async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const tasks = await prisma.task.findMany({
        where: {
          assigneeId: userId
        },
        include: {
          team: {
            select: {
              id: true,
              name: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          subtasks: true
        },
        orderBy: {
          deadline: 'asc'
        }
      });
      
      return res.status(200).json({ tasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  };

  export const updateTaskStatus = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { status, comment } = req.body;
      const userId = req.user.userId;
      
      // Find the task
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          team: true,
          creator: true,
          assignee: true
        }
      });
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Check if user is the assignee or the team manager
      const isAssignee = task.assigneeId === userId;
      const isManager = task.team.managerId === userId;
      
      if (!isAssignee && !isManager) {
        return res.status(403).json({ 
          error: 'Only the assigned team member or team manager can update this task status' 
        });
      }
      
      // Validate status value
      const validStatuses = ['NOT_STARTED', 'READY_TO_START', 'IN_PROGRESS', 'ALMOST_DONE', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      // Update the task status
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { 
          status,
          updatedAt: new Date()
        },
        include: {
          team: true,
          creator: true,
          assignee: true
        }
      });
      
      // Create task history record
      await prisma.taskHistory.create({
        data: {
          taskId,
          status,
          changedAt: new Date()
        }
      });
      
      // Add comment if provided
      if (comment) {
        await prisma.comment.create({
          data: {
            content: comment,
            taskId
          }
        });
      }
      
      // Create notification for team manager or assignee
      const notificationRecipientId = isAssignee ? task.creatorId : task.assigneeId;
      
      if (notificationRecipientId) {
        await prisma.notification.create({
          data: {
            type: 'TASK_STATUS_CHANGE',
            content: `Task "${task.title}" status changed to ${status} by ${isAssignee ? 'assignee' : 'manager'}`,
            userId: notificationRecipientId,
            relatedId: taskId
          }
        });
        
        // Send email notification
        // Check if recipient exists and has an email
        //const recipient = isAssignee ? task.creator : task.assignee;
        // if (recipient && recipient.email) {
          // await sendTaskStatusUpdateEmail({
            // email: recipient.email,
            // userName: recipient.name,
            // taskTitle: task.title,
            // taskId: task.id,
            // teamName: task.team.name,
            // newStatus: status,
            // updatedBy: req.user.name || 'A team member'
          // });
        // }
      }
      if (task.parentId) {
        await updateParentTaskStatus(taskId);
      }
      return res.status(200).json({ 
        message: 'Task status updated successfully',
        task: updatedTask
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      return res.status(500).json({ error: 'Failed to update task status' });
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
              email: true,
             
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
        inProgress: subtasks.filter(task => ['IN_PROGRESS', 'ALMOST_DONE'].includes(task.status)),
        notStarted: subtasks.filter(task => ['NOT_STARTED', 'READY_TO_START'].includes(task.status))
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