// routes.js - Authentication routes
import express from 'express';
import { register, login, refreshToken, logout, verifyInvitationToken, registerInvitedUser } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/verify-invitation', verifyInvitationToken);
router.post('/register-invited', registerInvitedUser);

// Protected route example
router.get('/dashboard', authenticate, (req, res) => {
  res.status(200).json({ message: "Welcome to your dashboard!", user: req.user });
});

export default router;