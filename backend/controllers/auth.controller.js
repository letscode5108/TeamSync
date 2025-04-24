import { 
    hashPassword, 
    verifyPassword, 
    generateAccessToken, 
    generateRefreshToken,
    storeRefreshToken,
    verifyRefreshToken,
    clearRefreshToken
  } from '../middlewares/auth.middleware.js';
  import { PrismaClient } from '@prisma/client';
  
  const prisma = new PrismaClient();
  
  // Register a new user
  export const register = async (req, res) => {
    try {
      const { email, password, name,  role } = req.body;
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email." });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role === "MANAGER" ? "MANAGER" : "MEMBER",
          hashedToken: ""
        }
      });
      
      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);
      
      // Store hashed refresh token
      await storeRefreshToken(user.id, refreshToken);
      
      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 2 * 24 * 60 * 60 * 1000//60 * 60 * 1000 // 1 hour
      });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 24 * 60 * 60 * 1000 // 5 days
      });
      
      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed", error: error.message });
    }
  };
  

  // Verify invitation token
export const verifyInvitationToken = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { team: true }
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid invitation token' });
    }
    
    // Check if expired
    if (new Date() > invitation.expiresAt) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      return res.status(400).json({ message: 'Invitation has expired' });
    }
    
    // Return invitation data for registration form
    res.status(200).json({
      email: invitation.email,
      teamId: invitation.teamId,
      teamName: invitation.team.name
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to verify invitation', 
      error: error.message 
    });
  }
};

// Register invited user
export const registerInvitedUser = async (req, res) => {
  try {
    const { name, email, password, token } = req.body;
    
    // Verify token is valid
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { team: true }
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid invitation token' });
    }
    
    if (invitation.email !== email) {
      return res.status(400).json({ message: 'Email does not match invitation' });
    }
    
    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ message: 'Invitation has already been used or expired' });
    }
    
    if (new Date() > invitation.expiresAt) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      return res.status(400).json({ message: 'Invitation has expired' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    let user;
    
    await prisma.$transaction(async (prisma) => {
      if (existingUser) {
        // User exists, just update the user reference
        user = existingUser;
      } else {
        // Hash password
        const hashedPassword = await hashPassword(password);
        
        // Create new user with MEMBER role
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: 'MEMBER', // Always member when invited
            hashedToken: ""
          }
        });
      }
      
      // Add user to team
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          teamId: invitation.teamId
        }
      });
      
      // Add user to team chat
      const teamChat = await prisma.chat.findFirst({
        where: {
          teamId: invitation.teamId,
          type: 'TEAM'
        }
      });
      
      if (teamChat) {
        await prisma.chatParticipant.create({
          data: {
            chatId: teamChat.id,
            userId: user.id
          }
        });
      }
      
      // Update invitation status
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          recipientId: user.id
        }
      });
      
      // Create notification for team manager
      await prisma.notification.create({
        data: {
          type: 'TEAM_INVITATION',
          content: `${user.name} has joined your team ${invitation.team.name}`,
          userId: invitation.team.managerId,
          relatedId: invitation.teamId
        }
      });
    });
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    
    // Store hashed refresh token
    await storeRefreshToken(user.id, refreshToken);
    
    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 24* 60 * 60 * 1000 // 1 hour
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 5 * 24 * 60 * 60 * 1000 // 5 days
    });
    
    res.status(201).json({
      message: "Registration successful! You have been added to the team.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
};


  
  // Login user
  export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
      
      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
      
      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);
      
      // Store hashed refresh token
      await storeRefreshToken(user.id, refreshToken);
      
      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 2 * 24 * 60 * 60 * 1000 //60 * 60 * 1000 // 1 hour
      });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 24 * 60 * 60 * 1000 // 5 days
      });
      
      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  };
  
  // Refresh token
  export const refreshToken = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found." });
      }
      
      // Verify refresh token
      const userData = await verifyRefreshToken(refreshToken);
      
      if (!userData) {
        return res.status(401).json({ message: "Invalid or expired refresh token." });
      }
      
      // Generate new tokens
      const newAccessToken = generateAccessToken(userData.userId, userData.role);
      const newRefreshToken = generateRefreshToken(userData.userId);
      
      // Store new hashed refresh token
      await storeRefreshToken(userData.userId, newRefreshToken);
      
      // Set new cookies
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge:  2 * 24 * 60 * 60 * 1000 //60 * 60 * 1000 // 1 hour
      });
      
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 24 * 60 * 60 * 1000 // 5 days
      });
      
      res.status(200).json({ message: "Token refreshed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Token refresh failed", error: error.message });
    }
  };
  
  // Logout user
  export const logout = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        // Verify and get user ID from refresh token
        const userData = await verifyRefreshToken(refreshToken);
        
        if (userData) {
          // Clear refresh token in database
          await clearRefreshToken(userData.userId);
        }
      }
      
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed", error: error.message });
    }
  };