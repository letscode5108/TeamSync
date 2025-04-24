import express from 'express';
import { addTaskComment, deleteTaskComment, editTaskComment , getTaskComments} from '../controllers/comment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';


const router = express.Router();

router.use(authenticate);

router.post('/tasks/:taskId/comments', addTaskComment);
router.get('/tasks/:taskId/comments', getTaskComments);
router.put('/comments/:commentId', editTaskComment);
router.delete('/comments/:commentId', deleteTaskComment);

export default router;






