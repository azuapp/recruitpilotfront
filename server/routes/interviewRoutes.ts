import { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../services/errorHandler';
import { ValidationService, interviewValidationSchema } from '../services/validationService';
import { requireAuth } from '../auth';
import { logger } from '../services/logger';

const router = Router();

// Get all interviews
router.get('/interviews', requireAuth, asyncHandler(async (req, res) => {
  const { candidateId, status } = req.query;
  
  const filters: any = {};
  if (candidateId) filters.candidateId = candidateId as string;
  if (status) filters.status = status as string;
  
  const interviews = await storage.getInterviews(filters);
  res.json(interviews);
}));

// Create new interview
router.post('/interviews', requireAuth, asyncHandler(async (req, res) => {
  const validatedData = ValidationService.validate(interviewValidationSchema, req.body);
  
  logger.info('Creating new interview', { candidateId: validatedData.candidateId });
  
  const interview = await storage.createInterview(validatedData);
  
  logger.info('Interview created successfully', { interviewId: interview.id });
  res.status(201).json(interview);
}));

// Update interview
router.put('/interviews/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate partial data for updates
  const allowedUpdates = [
    'scheduledDate', 'type', 'duration', 'interviewerName', 
    'location', 'notes', 'status'
  ];
  
  const updates: any = {};
  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  
  logger.info('Updating interview', { interviewId: id, updates: Object.keys(updates) });
  
  const updatedInterview = await storage.updateInterview(id, updates);
  
  logger.info('Interview updated successfully', { interviewId: id });
  res.json(updatedInterview);
}));

// Get interview by ID
router.get('/interviews/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const interviews = await storage.getInterviews();
  const interview = interviews.find(i => i.id === id);
  
  if (!interview) {
    return res.status(404).json({ message: 'Interview not found' });
  }
  
  res.json(interview);
}));

export default router;