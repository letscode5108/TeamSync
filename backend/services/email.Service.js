// services/emailService.js
import nodemailer from 'nodemailer';

// This would be configured with real email service in production
// For development, you can use a service like Ethereal or Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure:false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendInvitationEmail = async ({ email, token,teamId, teamName, senderName }) => {
  const invitationLink = `${process.env.FRONTEND_URL}/auth/invitation?token=${token}&teamId=${teamId}`;

  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Invitation to join ${teamName}`,
    html: `
      <h1>Team Invitation</h1>
      <p>Hello,</p>
      <p>${senderName} has invited you to join their team "${teamName}" on ${process.env.APP_NAME}.</p>
      <p>Click the button below to accept the invitation and register:</p>
      <p>
        <a href="${invitationLink}" style="display: inline-block; background-color:rgb(19, 53, 204); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Accept Invitation
        </a>
      </p>
      <p>This invitation link will expire in 7 days.</p>
      <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL}.</p>
      <p>Regards,</p>
      <p>The ${process.env.APP_NAME} Team</p>
       
    `
  };
   // <p>For testing with Postman, use this token: ${token}</p>

  //return transporter.sendMail(mailOptions);
  return transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent: ', info.response);
    }
});
};
export const sendTaskAssignmentEmail = async ({ email, userName, taskTitle, taskId, teamName, deadline }) => {
  const taskLink = `${process.env.FRONTEND_URL}/tasks/${taskId}`;
  const deadlineFormatted = deadline ? new Date(deadline).toLocaleDateString() : 'No deadline';

  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <h1>New Task Assignment</h1>
      <p>Hello ${userName},</p>
      <p>You have been assigned a new task in team "${teamName}":</p>
      <h2>${taskTitle}</h2>
      <p><strong>Deadline:</strong> ${deadlineFormatted}</p>
      <p>Click the button below to view the task details:</p>
      <p>
        <a href="${taskLink}" style="display: inline-block; background-color:rgb(19, 53, 204); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Task
        </a>
      </p>
      <p>If you have any questions, please contact your team manager.</p>
      <p>Regards,</p>
      <p>The ${process.env.APP_NAME} Team</p>
    `
  };

  return transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};
//Deadline reminder email
export const sendTaskDeadlineEmail = async ({ email, userName, taskTitle, taskId, teamName, deadline }) => {
  const taskLink = `${process.env.FRONTEND_URL}/tasks/${taskId}`;
  const deadlineFormatted = deadline ? new Date(deadline).toLocaleDateString() : 'No deadline';

  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `⚠️ Upcoming Deadline: ${taskTitle}`,
    html: `
      <h1>Task Deadline Approaching</h1>
      <p>Hello ${userName},</p>
      <p>This is a reminder that your task in team "${teamName}" is due soon:</p>
      <h2>${taskTitle}</h2>
      <p><strong>Deadline:</strong> ${deadlineFormatted} (within 24 hours)</p>
      <p>Click the button below to view the task details:</p>
      <p>
        <a href="${taskLink}" style="display: inline-block; background-color:rgb(19, 53, 204); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Task
        </a>
      </p>
      <p>Please update the task status if you've made progress.</p>
      <p>Regards,</p>
      <p>The ${process.env.APP_NAME} Team</p>
    `
  };

  return transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};
export const sendMeetingInvitationEmail = async ({ 
  email, 
  userName, 
  meetingTitle, 
  meetingId, 
  roomCode, 
  teamName, 
  startTime, 
  endTime, 
  organizerName 
}) => {
  const meetingLink = `${process.env.FRONTEND_URL}/meetings/${meetingId}`;
  const startTimeFormatted = new Date(startTime).toLocaleString();
  const endTimeFormatted = new Date(endTime).toLocaleString();
  
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Meeting Invitation: ${meetingTitle}`,
    html: `
      <h1>Meeting Invitation</h1>
      <p>Hello ${userName},</p>
      <p>${organizerName} has invited you to a meeting in team "${teamName}":</p>
      <h2>${meetingTitle}</h2>
      <p><strong>Start Time:</strong> ${startTimeFormatted}</p>
      <p><strong>End Time:</strong> ${endTimeFormatted}</p>
      <p><strong>Room Code:</strong> ${roomCode}</p>
      <p>Click the button below to join the meeting:</p>
      <p>
        <a href="${meetingLink}" style="display: inline-block; background-color:rgb(19, 53, 204); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Join Meeting
        </a>
      </p>
      <p>You can also join the meeting by entering the room code: <strong>${roomCode}</strong></p>
      <p>Regards,</p>
      <p>The ${process.env.APP_NAME} Team</p>
    `
  };

  return transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

export const sendMeetingReminderEmail = async ({ 
  email, 
  userName, 
  meetingTitle, 
  meetingId, 
  teamName, 
  startTime 
}) => {
  const meetingLink = `${process.env.FRONTEND_URL}/meetings/${meetingId}`;
  const startTimeFormatted = new Date(startTime).toLocaleString();
  
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `⏰ Reminder: Meeting "${meetingTitle}" starting soon`,
    html: `
      <h1>Meeting Reminder</h1>
      <p>Hello ${userName},</p>
      <p>This is a reminder that your meeting in team "${teamName}" is starting soon:</p>
      <h2>${meetingTitle}</h2>
      <p><strong>Start Time:</strong> ${startTimeFormatted} (in 15 minutes)</p>
      <p>Click the button below to join the meeting:</p>
      <p>
        <a href="${meetingLink}" style="display: inline-block; background-color:rgb(19, 53, 204); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Join Meeting
        </a>
      </p>
      <p>Regards,</p>
      <p>The ${process.env.APP_NAME} Team</p>
    `
  };

  return transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};