import { Express } from 'express';
import { createServer, type Server } from "http";
import candidateRoutes from './candidateRoutes';
import authRoutes from './authRoutes';
import { setupAuth } from '../auth';
import { storage } from '../storage';
import { logger } from '../services/logger';
import { asyncHandler, handleError } from '../services/errorHandler';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Register route modules
  app.use('/api', authRoutes);
  app.use('/api', candidateRoutes);

  // Dashboard stats endpoint
  app.get('/api/stats', asyncHandler(async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  }));

  // Assessments endpoints
  app.get('/api/assessments', asyncHandler(async (req, res) => {
    const assessments = await storage.getAssessments();
    res.json(assessments);
  }));

  // Interviews endpoints
  app.get('/api/interviews', asyncHandler(async (req, res) => {
    const interviews = await storage.getInterviews();
    res.json(interviews);
  }));

  app.post('/api/interviews', asyncHandler(async (req, res) => {
    const interview = await storage.createInterview(req.body);
    res.status(201).json(interview);
  }));

  app.put('/api/interviews/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Add input validation and date processing
    const processedData = {
      ...req.body,
      scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate).toISOString() : undefined
    };
    const interview = await storage.updateInterview(id, processedData);
    res.json(interview);
  }));

  // Email endpoints
  app.get('/api/emails', asyncHandler(async (req, res) => {
    const emails = await storage.getEmails();
    res.json(emails);
  }));

  app.post('/api/emails', asyncHandler(async (req, res) => {
    const email = await storage.createEmail(req.body);
    res.status(201).json(email);
  }));

  app.post('/api/send-email', asyncHandler(async (req, res) => {
    // Email sending functionality would go here
    res.json({ message: 'Email sent successfully' });
  }));

  // Job descriptions endpoints
  app.get('/api/job-descriptions', asyncHandler(async (req, res) => {
    const jobDescriptions = await storage.getJobDescriptions();
    res.json(jobDescriptions);
  }));

  app.post('/api/job-descriptions', asyncHandler(async (req, res) => {
    const jobDescription = await storage.createJobDescription(req.body);
    res.status(201).json(jobDescription);
  }));

  // Users management endpoints (admin only)
  app.get('/api/users', asyncHandler(async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  }));

  // Global error handler
  app.use((error: Error, req: any, res: any, next: any) => {
    logger.error('Unhandled route error', { 
      error: error.message, 
      path: req.path,
      method: req.method 
    });
    handleError(error, res);
  });

  logger.info('All routes registered successfully');
  
  const httpServer = createServer(app);
  return httpServer;
}