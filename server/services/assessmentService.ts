import { storage } from '../storage';
import { analyzeResume } from './openai';
import { logger } from './logger';
import { AppError } from './errorHandler';

export async function processAssessment(
  candidateId: string, 
  assessmentId: string, 
  position: string,
  resumeSummary: string
): Promise<void> {
  try {
    // Validate input
    if (!resumeSummary || resumeSummary.trim().length < 50) {
      throw new AppError('Insufficient resume content for analysis', 400);
    }

    logger.info('Processing AI assessment', { 
      candidateId, 
      assessmentId, 
      position,
      resumeLength: resumeSummary.length 
    });

    // Analyze resume using AI
    const analysis = await analyzeResume(resumeSummary, position);

    // Update assessment with results
    await storage.updateAssessment(assessmentId, {
      overallScore: analysis.overallScore.toString(),
      technicalSkills: analysis.technicalSkills.toString(),
      experienceMatch: analysis.experienceMatch.toString(),
      education: analysis.education.toString(),
      aiInsights: analysis.insights.join('\n'),
      status: 'completed',
    });

    logger.info('Assessment completed successfully', { 
      candidateId, 
      assessmentId,
      overallScore: analysis.overallScore 
    });

  } catch (error) {
    logger.error('Assessment processing failed', { 
      candidateId, 
      assessmentId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    // Update assessment status to failed
    await storage.updateAssessment(assessmentId, {
      status: 'failed',
      aiInsights: error instanceof Error ? error.message : 'Assessment failed due to unknown error',
    }).catch(updateError => {
      logger.error('Failed to update assessment status', { 
        assessmentId, 
        error: updateError instanceof Error ? updateError.message : 'Unknown error' 
      });
    });

    throw error;
  }
}