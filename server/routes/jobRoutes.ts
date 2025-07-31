import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../services/errorHandler';
import { ValidationService, jobDescriptionValidationSchema } from '../services/validationService';
import { requireAuth } from '../auth';
import { logger } from '../services/logger';

const router = Router();

// Get all job descriptions
router.get('/job-descriptions', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const jobDescriptions = await storage.getJobDescriptions();
  res.json(jobDescriptions);
}));

// Get job description by ID
router.get('/job-descriptions/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const jobDescription = await storage.getJobDescriptionById(id);
  
  if (!jobDescription) {
    return res.status(404).json({ message: 'Job description not found' });
  }
  
  res.json(jobDescription);
}));

// Create job description
router.post('/job-descriptions', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const validatedData = ValidationService.validate(jobDescriptionValidationSchema, req.body);
  
  logger.info('Creating job description', { 
    title: validatedData.title,
    position: validatedData.position 
  });
  
  const jobDescription = await storage.createJobDescription(validatedData);
  
  logger.info('Job description created', { jobDescriptionId: jobDescription.id });
  res.status(201).json(jobDescription);
}));

// Update job description
router.put('/job-descriptions/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Validate partial data for updates - support both old and new schema fields
  const allowedUpdates = [
    'title', 'position', 'description', 'responsibilities', 'requirements', 
    'requiredExperience', 'benefits', 'skills', 'experienceLevel',
    'location', 'salaryMin', 'salaryMax', 'notes', 'isActive'
  ];
  
  const updates: any = {};
  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  
  logger.info('Updating job description', { 
    jobDescriptionId: id, 
    updates: Object.keys(updates) 
  });
  
  const updatedJobDescription = await storage.updateJobDescription(id, updates);
  
  logger.info('Job description updated', { jobDescriptionId: id });
  res.json(updatedJobDescription);
}));

// Delete job description (soft delete)
router.delete('/job-descriptions/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  logger.info('Deleting job description', { jobDescriptionId: id });
  
  await storage.deleteJobDescription(id);
  
  logger.info('Job description deleted', { jobDescriptionId: id });
  res.json({ message: 'Job description deleted successfully' });
}));

// Get candidates with fit scores for a job
router.get('/job-descriptions/:id/candidates', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const candidatesWithFitScores = await storage.getCandidatesWithFitScores(id);
  
  res.json(candidatesWithFitScores);
}));

// Calculate job fit score
router.post('/job-descriptions/:id/calculate-fit/:candidateId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id: jobDescriptionId, candidateId } = req.params;
  
  logger.info('Calculating job fit score', { jobDescriptionId, candidateId });
  
  // Import the service dynamically to avoid circular dependencies
  const { calculateJobFitScore } = await import('../services/jobFitService');
  
  try {
    const fitScore = await calculateJobFitScore(candidateId, jobDescriptionId);
    
    logger.info('Job fit score calculated', { 
      jobDescriptionId, 
      candidateId, 
      score: fitScore.fitScore 
    });
    
    res.json(fitScore);
  } catch (error) {
    logger.error('Failed to calculate job fit score', { 
      jobDescriptionId, 
      candidateId, 
      error 
    });
    throw error;
  }
}));

export default router;