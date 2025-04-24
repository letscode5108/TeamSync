// // routes/meetingRoutes.js
// import express from 'express';
// import { authenticate } from '../middlewares/auth.middleware.js';
// import {
//   createMeeting,
//   getMeeting,
//   getUserMeetings,
//   updateAttendanceStatus,
//   joinMeetingByCode,
//   endMeeting,
  
// } from '../controllers/meet.controller.js';

// const router = express.Router();

// // Apply authentication middleware to all routes
// router.use(authenticate);

// // Meeting routes


// router.post('/', createMeeting);//
// router.get('/', getUserMeetings);//
// router.get('/:meetingId', getMeeting);//
// router.post('/join', joinMeetingByCode);
// router.patch('/:meetingId/status', updateAttendanceStatus);
// router.post('/:meetingId/end', endMeeting);
// router.post('/join', joinMeetingByCode);


// export default router;