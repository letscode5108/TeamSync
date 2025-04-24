import express from 'express';
import { getMyTasks, getTaskDetails, updateTaskStatus, getTaskSubtasks } from '../controllers/taskformember.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';


const router = express.Router();
router.use(authenticate);





router.get('/', getMyTasks);
router.get('/:taskId/subtasks', getTaskSubtasks);
router.get('/details/:taskId', getTaskDetails);
router.patch('/:taskId/status', updateTaskStatus);



export default router;

