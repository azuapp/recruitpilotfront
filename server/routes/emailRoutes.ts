import { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../services/errorHandler';
import { ValidationService, emailValidationSchema } from '../services/validationService';
import { sendEmail } from '../services/email';
import { requireAuth } from '../auth';
import { logger } from '../services/logger';

const router = Router();

// Get all emails
router.get('/emails', requireAuth, asyncHandler(async (req, res) => {
  const { candidateId } = req.query;
  
  const emails = await storage.getEmails(candidateId as string);
  res.json(emails);
}));

// Send email
router.post('/emails/send', requireAuth, asyncHandler(async (req, res) => {
  const validatedData = ValidationService.validate(emailValidationSchema, req.body);
  
  logger.info('Sending email', { 
    candidateId: validatedData.candidateId,
    recipientEmail: validatedData.recipientEmail,
    subject: validatedData.subject
  });
  
  try {
    // Send email
    const emailResult = await sendEmail({
      to: validatedData.recipientEmail,
      subject: validatedData.subject,
      html: validatedData.content
    });
    
    // Log email in database
    const emailRecord = await storage.createEmail({
      candidateId: validatedData.candidateId,
      recipientEmail: validatedData.recipientEmail,
      subject: validatedData.subject,
      content: validatedData.content,
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
  } catch (error) {
    logger.error('Failed to send email', { 
      candidateId: validatedData.candidateId,
      error 
    });
    
    // Log failed email attempt
    await storage.createEmail({
      candidateId: validatedData.candidateId,
      recipientEmail: validatedData.recipientEmail,
      subject: validatedData.subject,
      content: validatedData.content,
      status: 'failed',
      sentAt: new Date(),
    });
    
    throw new Error('Failed to send email');
  }
}));

// Update email status
router.put('/emails/:id/status', requireAuth, asyncHandler(async (req, res) => {
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

export default router;