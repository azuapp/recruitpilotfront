import { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../services/errorHandler';
import { requireAuth } from '../auth';
import { logger } from '../services/logger';

const router = Router();

// Get all assessments
router.get('/assessments', requireAuth, asyncHandler(async (req, res) => {
  const assessments = await storage.getAssessments();
  res.json(assessments);
}));

// Get assessment by candidate ID
router.get('/assessments/candidate/:candidateId', requireAuth, asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const assessment = await storage.getAssessmentByCandidateId(candidateId);
  
  if (!assessment) {
    return res.status(404).json({ message: 'Assessment not found' });
  }
  
  res.json(assessment);
}));

// Run bulk assessments
router.post('/assessments/bulk', requireAuth, asyncHandler(async (req, res) => {
  const { runAssessment } = await import('../services/assessmentService');
  
  logger.info('Starting bulk assessment process');
  
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
      results.push({ candidateId: candidate.id, status: 'failed', error: error.message });
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
router.post('/assessments/:candidateId', requireAuth, asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const { runAssessment } = await import('../services/assessmentService');
  
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

export default router;