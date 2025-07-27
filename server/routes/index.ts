import { Express } from 'express';
import { createServer, type Server } from "http";
import candidateRoutes from './candidateRoutes';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import assessmentRoutes from './assessmentRoutes';
import interviewRoutes from './interviewRoutes';
import emailRoutes from './emailRoutes';
import jobRoutes from './jobRoutes';
import testRoutes from './testRoutes';
import { setupAuth } from '../auth';
import { logger } from '../services/logger';
import { asyncHandler, handleError } from '../services/errorHandler';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Register route modules
  app.use('/api', authRoutes);
  app.use('/api', candidateRoutes);
  app.use('/api', dashboardRoutes);
  app.use('/api', assessmentRoutes);
  app.use('/api', interviewRoutes);
  app.use('/api', emailRoutes);
  app.use('/api', jobRoutes);
  app.use('/api', testRoutes);

  // Legacy email endpoint for backward compatibility
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