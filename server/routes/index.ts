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

  app.post('/api/assessments/bulk', asyncHandler(async (req, res) => {
    const { runAssessment } = await import('../services/assessmentService');
    
    // Get all candidates without assessments or with failed assessments
    const candidates = await storage.getCandidates();
    const existingAssessments = await storage.getAssessments();
    
    const candidatesNeedingAssessment = candidates.filter(candidate => {
      const hasValidAssessment = existingAssessments.some(assessment => 
        assessment.candidateId === candidate.id && 
        assessment.status === 'completed'
      );
      return !hasValidAssessment && candidate.resumeSummary; // Only assess candidates with resume content
    });

    if (candidatesNeedingAssessment.length === 0) {
      return res.json({ 
        message: 'No candidates require assessment',
        processed: 0,
        total: 0
      });
    }

    let processed = 0;
    const results = [];

    // Process assessments in batches to avoid overwhelming OpenAI API
    for (const candidate of candidatesNeedingAssessment) {
      try {
        const assessment = await runAssessment(candidate.id, candidate.resumeSummary);
        results.push(assessment);
        processed++;
        logger.info('Bulk assessment completed for candidate', { candidateId: candidate.id });
      } catch (error) {
        logger.error('Bulk assessment failed for candidate', { 
          candidateId: candidate.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        // Continue with next candidate even if one fails
      }
    }

    res.json({
      message: `Bulk assessment completed. Processed ${processed} out of ${candidatesNeedingAssessment.length} candidates.`,
      processed,
      total: candidatesNeedingAssessment.length,
      results
    });
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
    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Missing required fields: to, subject, body' });
    }

    const { sendEmail } = await import('../services/email');
    
    const success = await sendEmail({
      to,
      subject,
      html: body.replace(/\n/g, '<br>'),
    });
    
    if (success) {
      res.json({ message: 'Email sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send email' });
    }
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