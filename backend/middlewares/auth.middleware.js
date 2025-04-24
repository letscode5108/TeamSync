
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();





// Generate hashed password
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate access token
export const generateAccessToken = (userId, role,name) => {
  return jwt.sign(
    { userId, role, name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn:process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

// Store hashed refresh token in database
export const storeRefreshToken = async (userId, refreshToken) => {
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  
  await prisma.user.update({
    where: { id: userId },
    data: { hashedToken }
  });
  
  return hashedToken;
};

// Verify refresh token
export const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) return null;
    
    return { userId: user.id, role: user.role };
  } catch (error) {
    return null;
  }
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

// Clear refresh token from database
export const clearRefreshToken = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { hashedToken: null }
  });
};

// authMiddleware.js - Authentication middleware

export const authenticate = async (req, res, next) => {
  try {
    let accessToken = req.headers.authorization?.split(" ")[1] || req.cookies.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
    
    const decoded = verifyAccessToken(accessToken);
    
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, role: true, email: true }
    });
    
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }
    
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      name: decoded.name
    };
    
    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication failed." });
  }
};
