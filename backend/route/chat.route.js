import express from'express';
import { createTeamChat,
     getUserChats,
     getChatById,
     sendMessage,
     uploadAttachment,
     markMessagesAsRead,
     addUserToChat,
     getUnreadMessageCounts } from '../controllers/chat.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js'
import { upload } from'../config/cloudinary.js';


const router = express.Router();

router.use(authenticate);

router.post('/team', createTeamChat);
router.get('/', getUserChats);
router.get('/:chatId', getChatById);
router.post('/:chatId/messages', sendMessage);
router.post('/:chatId/attachments', upload.single('file'), uploadAttachment);
router.post('/:chatId/read', markMessagesAsRead);
router.post('/:chatId/participants', addUserToChat);
router.get('/unread/count', getUnreadMessageCounts);


export default router;