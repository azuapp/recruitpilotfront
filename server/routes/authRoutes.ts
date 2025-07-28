import { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler, AppError } from '../services/errorHandler';
import { logger } from '../services/logger';
import { isAuthenticated, isAdmin } from '../auth';

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

// User management routes
router.get('/users', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const users = await storage.getUsers();
  const safeUsers = users.map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  }));
  res.json(safeUsers);
}));

router.post('/users', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role = "admin" } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    throw new AppError("All fields are required", 400);
  }

  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    throw new AppError("Email already exists", 400);
  }

  const { hashPassword } = await import("../auth");
  const hashedPassword = await hashPassword(password);
  
  const user = await storage.createUser({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role,
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  });
}));

router.put('/users/:id', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, role, isActive } = req.body;
  
  const updates: any = {};
  if (email) updates.email = email;
  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (role) updates.role = role;
  if (typeof isActive === 'boolean') updates.isActive = isActive;

  const user = await storage.updateUser(id, updates);
  
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    updatedAt: user.updatedAt,
  });
}));

router.delete('/users/:id', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await storage.deleteUser(id);
  res.json({ message: 'User deleted successfully' });
}));

export default router;