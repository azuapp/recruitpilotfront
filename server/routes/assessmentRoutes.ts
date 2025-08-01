import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../services/errorHandler';
import { requireAuth } from '../auth';
import { logger } from '../services/logger';
import { runAssessment } from '../services/assessmentService';

const router = Router();

// Get all assessments
router.get('/assessments', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const assessments = await storage.getAssessments();
  res.json(assessments);
}));

// Get assessment by candidate ID
router.get('/assessments/candidate/:candidateId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const assessment = await storage.getAssessmentByCandidateId(candidateId);
  
  if (!assessment) {
    return res.status(404).json({ message: 'Assessment not found' });
  }
  
  res.json(assessment);
}));

// Run bulk assessments
router.post('/assessments/bulk', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  
  logger.info('Starting bulk assessment process');
  
  // Get all candidates without assessments or with failed assessments
  const candidates = await storage.getCandidates();
  const existingAssessments = await storage.getAssessments();
  
  const candidatesNeedingAssessment = candidates.filter(candidate => {
    const hasValidAssessment = existingAssessments.some(assessment => 
      assessment.candidateId === candidate.id && 
      assessment.status === 'completed'
    );
    // Include candidates without valid assessments, regardless of resume summary
    return !hasValidAssessment;
  });

  if (candidatesNeedingAssessment.length === 0) {
    return res.json({ 
      message: 'No candidates require assessment',
      processed: 0,
      total: 0
    });
  }

  logger.info(`Processing assessments for ${candidatesNeedingAssessment.length} candidates`);

  const results = [];
  for (const candidate of candidatesNeedingAssessment) {
    try {
      logger.debug(`Running assessment for candidate ${candidate.id}`, { 
        candidateId: candidate.id, 
        fullName: candidate.fullName 
      });
      
      await runAssessment(candidate.id);
      results.push({ candidateId: candidate.id, status: 'success' });
      
      logger.debug(`Assessment completed for candidate ${candidate.id}`);
    } catch (error) {
      logger.error(`Assessment failed for candidate ${candidate.id}`, { 
        candidateId: candidate.id, 
        error 
      });
      results.push({ candidateId: candidate.id, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const failureCount = results.filter(r => r.status === 'failed').length;

  logger.info('Bulk assessment completed', {
    total: candidatesNeedingAssessment.length,
    successful: successCount,
    failed: failureCount
  });

  res.json({
    message: `Processed ${candidatesNeedingAssessment.length} candidates`,
    processed: candidatesNeedingAssessment.length,
    successful: successCount,
    failed: failureCount,
    results
  });
}));

// Trigger single assessment
router.post('/assessments/:candidateId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  
  logger.info(`Triggering assessment for candidate ${candidateId}`);
  
  try {
    await runAssessment(candidateId);
    logger.info(`Assessment completed for candidate ${candidateId}`);
    res.json({ message: 'Assessment completed successfully' });
  } catch (error) {
    logger.error(`Assessment failed for candidate ${candidateId}`, { error });
    throw error;
  }
}));

// Trigger assessment for specific candidate (alternative endpoint for frontend compatibility)
router.post('/assessments/candidate/:candidateId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  
  logger.info(`Triggering assessment for candidate ${candidateId}`);
  
  try {
    await runAssessment(candidateId);
    logger.info(`Assessment completed for candidate ${candidateId}`);
    res.json({ message: 'Assessment completed successfully' });
  } catch (error) {
    logger.error(`Assessment failed for candidate ${candidateId}`, { error });
    throw error;
  }
}));

// Trigger assessments for all candidates in a specific position
router.post('/assessments/position/:position', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { position } = req.params;
  
  logger.info(`Starting position-based assessment for position: ${position}`);
  
  // Get all candidates for the specified position
  const allCandidates = await storage.getCandidates();
  const positionCandidates = allCandidates.filter(candidate => candidate.position === position);
  
  if (positionCandidates.length === 0) {
    return res.json({ 
      message: `No candidates found for position: ${position}`,
      processed: 0,
      total: 0
    });
  }

  // Get existing assessments to avoid duplicates
  const existingAssessments = await storage.getAssessments();
  const candidatesNeedingAssessment = positionCandidates.filter(candidate => {
    const hasValidAssessment = existingAssessments.some(assessment => 
      assessment.candidateId === candidate.id && 
      assessment.status === 'completed'
    );
    return !hasValidAssessment;
  });

  if (candidatesNeedingAssessment.length === 0) {
    return res.json({ 
      message: `All candidates for position "${position}" already have completed assessments`,
      processed: 0,
      total: positionCandidates.length
    });
  }

  logger.info(`Processing assessments for ${candidatesNeedingAssessment.length} candidates in position: ${position}`);

  const results = [];
  for (const candidate of candidatesNeedingAssessment) {
    try {
      logger.debug(`Running assessment for candidate ${candidate.id} (${position})`, { 
        candidateId: candidate.id, 
        fullName: candidate.fullName,
        position: candidate.position 
      });
      
      await runAssessment(candidate.id);
      results.push({ candidateId: candidate.id, status: 'success' });
      
      logger.debug(`Assessment completed for candidate ${candidate.id}`);
    } catch (error) {
      logger.error(`Assessment failed for candidate ${candidate.id}`, { 
        candidateId: candidate.id, 
        error 
      });
      results.push({ candidateId: candidate.id, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const failureCount = results.filter(r => r.status === 'failed').length;

  logger.info('Position-based assessment completed', {
    position,
    total: candidatesNeedingAssessment.length,
    successful: successCount,
    failed: failureCount
  });

  res.json({
    message: `Processed ${candidatesNeedingAssessment.length} candidates for position "${position}"`,
    processed: candidatesNeedingAssessment.length,
    successful: successCount,
    failed: failureCount,
    position,
    results
  });
}));

// Delete assessment
router.delete('/assessments/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  logger.info(`Deleting assessment ${id}`);
  
  const success = await storage.deleteAssessment(id);
  
  if (!success) {
    return res.status(404).json({ message: 'Assessment not found' });
  }
  
  logger.info(`Assessment ${id} deleted successfully`);
  res.json({ message: 'Assessment deleted successfully' });
}));

export default router;