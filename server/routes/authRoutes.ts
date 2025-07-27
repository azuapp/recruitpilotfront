import { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler, AppError } from '../services/errorHandler';
import { logger } from '../services/logger';

const router = Router();

// Get current user
router.get('/user', asyncHandler(async (req, res) => {
  if (!req.isAuthenticated()) {
    throw new AppError('Unauthorized', 401);
  }
  
  const user = await storage.getUser(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json(user);
}));

// Login endpoint
router.post('/login', asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const bcrypt = await import('bcryptjs');
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  req.login(user, (err) => {
    if (err) {
      return next(err);
    }
    
    logger.info('User logged in successfully', { userId: user.id, email: user.email });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
}));

// Logout endpoint
router.post('/logout', asyncHandler(async (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error('Logout error', { error: err.message });
      throw new AppError('Logout failed', 500);
    }
    res.json({ message: 'Logged out successfully' });
  });
}));

export default router;