import express from 'express';
import {
    createTask,
    editTask,
    deleteTask,
    getTaskDetails,
    getTeamAnalysis,
    createSubtask,
    getTaskSubtasks

} from '../controllers/taskformanager.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();


router.use(authenticate);


//task assignment routes
router.post('/:teamId', createTask);//manager
router.get('/:teamId', getTeamAnalysis);//manager
router.put('/:taskId', editTask);//manager
router.delete('/:taskId', deleteTask);//manager
router.get('/details/:taskId', getTaskDetails);

// Subtask routes
router.post('/:parentTaskId/subtasks', createSubtask);
router.get('/:taskId/subtasks', getTaskSubtasks);//manager



export default router;