// config/cronJobs.js
import cron from 'node-cron';
import { checkAndSendDeadlineReminders } from "../controllers/taskformanager.controller.js";

// Setup cron jobs for task notifications
export const setupCronJobs = () => {
  // Run deadline reminders check - run once every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running scheduled job: Check task deadlines');
    try {
      const remindersSent = await checkAndSendDeadlineReminders();
      console.log(`Sent ${remindersSent} deadline reminder notifications`);
    } catch (error) {
      console.error('Error in deadline reminder cron job:', error);
    }
  });

  console.log('Cron jobs have been scheduled');
};

// For manual testing of deadline notifications
export const testDeadlineNotifications = async () => {
  try {
    console.log('Running manual test: Check task deadlines');
    const remindersSent = await checkAndSendDeadlineReminders();
    console.log(`Sent ${remindersSent} deadline reminder notifications`);
    
   
   
   
   
    return { remindersSent };
  } catch (error) {
    console.error('Error in notification test:', error);
    throw error;
  }
};