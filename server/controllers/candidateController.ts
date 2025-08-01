import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertCandidateSchema } from '@shared/schema';
import { extractTextFromPDF } from '../services/pdfExtractor';
import { sendEmail, getApplicationConfirmationEmail } from '../services/email';
import { logger } from '../services/logger';
import { AppError, asyncHandler, ValidationError } from '../services/errorHandler';
import { processAssessment } from '../services/assessmentService';
import { InputSanitizer } from '../services/security';
import fs from 'fs';
import path from 'path';

export const createCandidate = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Creating new candidate application', { 
    fullName: req.body.fullName,
    email: req.body.email,
    position: req.body.position 
  });

  // Validate required fields first
  if (!req.body.fullName || !req.body.email || !req.body.phone || !req.body.position) {
    throw new ValidationError('Missing required fields: fullName, email, phone, and position are required');
  }

  // Sanitize all input fields
  const sanitizedData = {
    fullName: InputSanitizer.sanitizeText(req.body.fullName),
    email: req.body.email, // Email validation will be handled by Zod
    phone: InputSanitizer.sanitizeText(req.body.phone),
    linkedinProfile: req.body.linkedinProfile ? InputSanitizer.sanitizeText(req.body.linkedinProfile) : null,
    position: InputSanitizer.sanitizeText(req.body.position),
    cvFileName: req.file?.originalname,
    cvFilePath: req.file?.path,
  };

  // Validate with Zod schema after sanitization
  const candidateData = insertCandidateSchema.parse(sanitizedData);

  // Check for duplicate application (same email + same position)
  logger.info('Checking for duplicate application', { 
    email: candidateData.email, 
    position: candidateData.position 
  });
  
  const existingCandidate = await storage.getCandidateByEmailAndPosition(
    candidateData.email,
    candidateData.position
  );

  if (existingCandidate) {
    logger.warn('Duplicate application blocked', { 
      email: candidateData.email, 
      position: candidateData.position,
      existingCandidateId: existingCandidate.id 
    });
    throw new AppError('You have already applied for this position. Please check your email for application status or contact us for updates.', 400);
  }

  logger.info('Duplicate validation passed, proceeding with application', { 
    email: candidateData.email, 
    position: candidateData.position 
  });

  // Extract text from PDF if file was uploaded
  let resumeSummary = null;
  if (req.file?.path) {
    try {
      resumeSummary = await extractTextFromPDF(req.file.path);
      logger.info('PDF text extracted successfully', { 
        candidateName: candidateData.fullName,
        textLength: resumeSummary.length 
      });
    } catch (error) {
      logger.warn('PDF text extraction failed, continuing without summary', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateName: candidateData.fullName 
      });
    }
  }

  // Create candidate with resume summary
  const candidateWithResume = {
    ...candidateData,
    resumeSummary
  };

  const candidate = await storage.createCandidate(candidateWithResume);
  
  logger.info('Candidate created successfully', { candidateId: candidate.id });

  // Send confirmation email (non-blocking)
  sendConfirmationEmail(candidate)
    .catch(error => logger.error('Failed to send confirmation email', { 
      candidateId: candidate.id, 
      error: error.message 
    }));

  // Start AI assessment (non-blocking)
  if (resumeSummary) {
    startAssessment(candidate.id, candidate.position, resumeSummary)
      .catch(error => logger.error('Assessment failed', { 
        candidateId: candidate.id, 
        error: error.message 
      }));
  }

  res.status(201).json({ 
    message: 'Application submitted successfully',
    candidateId: candidate.id 
  });
});

export const getCandidates = asyncHandler(async (req: Request, res: Response) => {
  const { search, position, status, limit, offset } = req.query;
  
  // Check for SQL injection patterns in search parameter
  if (search && typeof search === 'string') {
    const sqlPatterns = /('|"|;|--|\\bOR\\b|\\bAND\\b|\\bUNION\\b|\\bSELECT\\b|\\bINSERT\\b|\\bDELETE\\b|\\bUPDATE\\b|\\bDROP\\b)/i;
    if (sqlPatterns.test(search)) {
      throw new ValidationError('Invalid search parameter: potential SQL injection detected');
    }
  }
  
  // Sanitize search parameters to prevent SQL injection
  const sanitizedParams = {
    search: search ? InputSanitizer.sanitizeSqlInput(search as string) : undefined,
    position: position ? InputSanitizer.sanitizeText(position as string) : undefined,
    status: status ? InputSanitizer.sanitizeText(status as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };
  
  const candidates = await storage.getCandidates(sanitizedParams);

  logger.debug('Retrieved candidates', { count: candidates.length });
  res.json(candidates);
});

export const getCandidateById = asyncHandler(async (req: Request, res: Response) => {
  const candidate = await storage.getCandidateById(req.params.id);
  
  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  res.json(candidate);
});

export const updateCandidateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const candidate = await storage.updateCandidateStatus(req.params.id, status);
  
  logger.info('Candidate status updated', { 
    candidateId: req.params.id, 
    newStatus: status 
  });
  
  res.json(candidate);
});

export const downloadCV = asyncHandler(async (req: Request, res: Response) => {
  const candidate = await storage.getCandidateById(req.params.id);
  
  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  if (!candidate.cvFilePath) {
    throw new AppError('CV file not found', 404);
  }

  const filePath = path.resolve(candidate.cvFilePath);
  
  if (!fs.existsSync(filePath)) {
    throw new AppError('CV file not found on server', 404);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${candidate.cvFileName || 'CV.pdf'}"`);
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error: Error) => {
    logger.error('Error streaming CV file', { error: error.message, filePath });
    throw new AppError('Error downloading CV', 500);
  });
});

// Helper functions
async function sendConfirmationEmail(candidate: any): Promise<void> {
  try {
    const emailHtml = getApplicationConfirmationEmail(candidate.fullName, candidate.position);
    await sendEmail({
      to: candidate.email,
      subject: `Application Received - ${candidate.position}`,
      html: emailHtml,
    });

    await storage.createEmail({
      candidateId: candidate.id,
      subject: `Application Received - ${candidate.position}`,
      content: emailHtml,
      emailType: 'confirmation',
      status: 'sent',
    });

    logger.info('Confirmation email sent', { candidateId: candidate.id });
  } catch (error) {
    logger.error('Failed to send confirmation email', { 
      candidateId: candidate.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

async function startAssessment(candidateId: string, position: string, resumeSummary: string): Promise<void> {
  try {
    const assessment = await storage.createAssessment({
      candidateId,
      status: 'pending',
    });

    await processAssessment(candidateId, assessment.id, position, resumeSummary);
    
    logger.info('Assessment completed', { candidateId, assessmentId: assessment.id });
  } catch (error) {
    logger.error('Assessment failed', { 
      candidateId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

export const deleteCandidate = asyncHandler(async (req: Request, res: Response) => {
  const candidateId = req.params.id;
  
  logger.info('Deleting candidate', { candidateId, user: (req as any).user?.email });

  // Check if candidate exists
  const candidate = await storage.getCandidateById(candidateId);
  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  // Delete candidate and all related data
  await storage.deleteCandidate(candidateId);

  logger.info('Candidate deleted successfully', { candidateId, candidateName: candidate.fullName });

  res.json({ 
    message: 'Candidate deleted successfully',
    candidateId 
  });
});