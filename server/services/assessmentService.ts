import { storage } from '../storage';
import { analyzeResume } from './openai';
import { logger } from './logger';
import { AppError } from './errorHandler';

export async function processAssessment(
  candidateId: string, 
  assessmentId: string, 
  position: string,
  resumeSummary: string | null
): Promise<void> {
  try {
    // Handle cases where resume summary is not available
    if (!resumeSummary || resumeSummary.trim().length < 50) {
      // Create a basic assessment with minimal scores if PDF extraction failed
      await storage.updateAssessment(assessmentId, {
        overallScore: "0.00",
        technicalSkills: "0.00", 
        experienceMatch: "0.00",
        education: "0.00",
        aiInsights: "Resume content could not be extracted from the uploaded PDF. Manual review required to assess candidate qualifications.",
        status: 'completed',
      });
      
      logger.warn('Assessment completed with minimal data due to missing resume content', { 
        candidateId, 
        assessmentId 
      });
      return;
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

export async function runAssessment(candidateId: string): Promise<void> {
  try {
    logger.info('Starting assessment for candidate', { candidateId });
    
    // Get candidate details
    const candidate = await storage.getCandidateById(candidateId);
    if (!candidate) {
      throw new AppError('Candidate not found', 404);
    }
    
    // Create assessment record
    const assessment = await storage.createAssessment({
      candidateId,
      status: 'pending',
    });
    
    // Process the assessment
    await processAssessment(candidateId, assessment.id, candidate.position, candidate.resumeSummary);
    
    logger.info('Assessment completed successfully', { candidateId, assessmentId: assessment.id });
  } catch (error) {
    logger.error('Assessment failed', { candidateId, error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}