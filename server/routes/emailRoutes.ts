import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../services/errorHandler';
import { ValidationService, emailValidationSchema } from '../services/validationService';
import { sendEmail } from '../services/email';
import { requireAuth } from '../auth';
import { logger } from '../services/logger';

const router = Router();

// Get all emails
router.get('/emails', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { candidateId } = req.query;
  
  try {
    const emails = await storage.getEmails(candidateId as string);
    logger.info('Fetched emails', { count: emails.length, candidateId });
    res.json(emails);
  } catch (error: any) {
    logger.error('Failed to fetch emails', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch emails', error: error.message });
  }
}));

// Test endpoint to create sample email (remove this in production)
router.post('/emails/test', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get first candidate to associate with test email
    const candidates = await storage.getCandidates();
    if (candidates.length === 0) {
      return res.status(400).json({ message: 'No candidates found. Create a candidate first.' });
    }
    
    const sampleEmail = await storage.createEmail({
      candidateId: candidates[0].id,
      subject: 'Test Email - Welcome to RecruitPilot',
      content: '<h2>Welcome!</h2><p>This is a test email to verify the email system is working correctly.</p><p>Thank you for your application!</p>',
      emailType: 'follow-up',
      status: 'sent',
      sentAt: new Date(),
    });
    
    res.json({ message: 'Test email created successfully', email: sampleEmail });
  } catch (error: any) {
    logger.error('Failed to create test email', { error: error.message });
    res.status(500).json({ message: 'Failed to create test email', error: error.message });
  }
}));

// Send email
router.post('/emails/send', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = ValidationService.validate(emailValidationSchema, req.body);
    
    logger.info('Sending email', { 
      candidateId: validatedData.candidateId,
      recipientEmail: validatedData.recipientEmail,
      subject: validatedData.subject
    });
    
    // Send email
    const emailResult = await sendEmail({
      to: validatedData.recipientEmail,
      subject: validatedData.subject,
      html: validatedData.content
    });
    
    // Log email in database
    const emailRecord = await storage.createEmail({
      candidateId: validatedData.candidateId,
      subject: validatedData.subject,
      content: validatedData.content,
      emailType: 'follow-up',
      status: 'sent',
      sentAt: new Date(),
    });
    
    logger.info('Email sent successfully', { 
      emailId: emailRecord.id,
      messageId: emailResult.messageId
    });
    
    res.json({ 
      message: 'Email sent successfully',
      emailId: emailRecord.id,
      success: emailResult
    });
  } catch (error: any) {
    logger.error('Failed to send email', { 
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    // Try to log failed email attempt if validation succeeded
    try {
      if (req.body.candidateId) {
        await storage.createEmail({
          candidateId: req.body.candidateId,
          subject: req.body.subject || 'Email Failed',
          content: req.body.content || 'Failed to send email',
          emailType: 'follow-up',
          status: 'failed',
          sentAt: new Date(),
        });
      }
    } catch (logError) {
      logger.error('Failed to log email failure', { error: logError });
    }
    
    res.status(500).json({ 
      message: 'Failed to send email',
      error: error.message 
    });
  }
}));

// Update email status
router.put('/emails/:id/status', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['sent', 'failed', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  
  logger.info('Updating email status', { emailId: id, status });
  
  const updatedEmail = await storage.updateEmailStatus(id, status);
  
  logger.info('Email status updated', { emailId: id, status });
  res.json(updatedEmail);
}));

// Delete email
router.delete('/emails/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  logger.info('Deleting email', { emailId: id, user: req.user?.email });
  
  await storage.deleteEmail(id);
  
  logger.info('Email deleted successfully', { emailId: id });
  res.json({ message: 'Email deleted successfully' });
}));

export default router;