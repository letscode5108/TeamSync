// routes/teamRoutes.js
import express from 'express';
import { 
  createTeam, 
  getTeams, 
  getTeamById, 
  updateTeam, 
  deleteTeam,
  inviteMember, 
  getTeamInvitations, 
  getTeamMembers,
  removeMember,
  
} from '../controllers/team.controller.js';
import { authenticate} from '../middlewares/auth.middleware.js';

const router = express.Router();


router.use(authenticate);

// Team management routes
router.post('/', createTeam);//
router.get('/', getTeams);//
router.get('/:teamId', getTeamById);//
router.put('/:teamId', updateTeam);
router.delete('/:teamId', deleteTeam);//

// Team member routes
router.get('/:teamId/members', getTeamMembers);//
router.delete('/:teamId/members/:memberId', removeMember);

// Invitation routes
router.post('/:teamId/invitations', inviteMember);//
router.get('/:teamId/invitations', getTeamInvitations);




export default router;