// jobs/meetingScheduler.js
import { PrismaClient } from '@prisma/client';
import { sendMeetingReminderEmail } from '../services/email.Service.js';
import cron from 'node-cron';

const prisma = new PrismaClient();

/**
 * Send reminders for meetings starting in 15 minutes
 * This job should be scheduled to run every 5 minutes
 */
export const sendMeetingReminders = async () => {
  try {
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    
    // Find meetings starting in about 15 minutes (between 10-15 minutes from now)
    // This gives us a 5-minute window to avoid duplicate reminders if the job runs every 5 minutes
    const upcomingMeetings = await prisma.meeting.findMany({
      where: {
        startTime: {
          gte: tenMinutesFromNow,
          lt: fifteenMinutesFromNow
        },
        // Only include meetings that haven't ended
        endTime: {
          gt: now
        }
      },
      include: {
        team: true,
        attendees: {
          include: {
            user: true
          },
          where: {
            status: 'accepted'
          }
        }
      }
    });
    
    console.log(`Found ${upcomingMeetings.length} upcoming meetings to send reminders for`);
    
    for (const meeting of upcomingMeetings) {
      for (const attendee of meeting.attendees) {
        // Send email reminder
        await sendMeetingReminderEmail({
          email: attendee.user.email,
          userName: attendee.user.name,
          meetingTitle: meeting.title,
          meetingId: meeting.id,
          teamName: meeting.team.name,
          startTime: meeting.startTime
        });
        
        // Create notification
        await prisma.notification.create({
          data: {
            type: 'MEETING_SCHEDULED',
            content: `Reminder: Your meeting "${meeting.title}" starts in 15 minutes`,
            userId: attendee.userId,
            relatedId: meeting.id
          }
        });
      }
    }
    
    return upcomingMeetings.length;
  } catch (error) {
    console.error("Error sending meeting reminders:", error);
    throw error;
  }
};

/**
 * Schedule this job to run every 5 minutes
 * Example with node-cron in your main server file:
 * 
 * import cron from 'node-cron';
 * import { sendMeetingReminders } from './jobs/meetingScheduler.js';
 * 
 * // Run every 5 minutes**/
  
cron.schedule('*/5 * * * *', async () => {
   try {
     const remindersCount = await sendMeetingReminders();
     console.log(`Sent ${remindersCount} meeting reminders`);
   } catch (error) {
     console.error('Meeting reminder job failed:', error);
   }
 });
