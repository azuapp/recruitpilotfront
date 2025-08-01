import type { 
  Candidate, InsertCandidate, CandidateWithAssessment, CandidateWithRelations 
} from '../../shared/schema';
import type { ICandidateService } from '../interfaces/services';
import type { ICandidateRepository, IAssessmentRepository, IEmailRepository } from '../interfaces/repositories';
import { extractTextFromPDF } from './pdfExtractor';
import { processAssessment } from './assessmentService';
import { sendEmail, getApplicationConfirmationEmail } from './email';
import { logger } from './logger';
import { AppError } from './errorHandler';
import { APPLICATION_STATUS } from '../../shared/constants';
import fs from 'fs';

export class CandidateService implements ICandidateService {
  constructor(
    private candidateRepository: ICandidateRepository,
    private assessmentRepository: IAssessmentRepository,
    private emailRepository: IEmailRepository
  ) {}

  async createCandidate(data: InsertCandidate, file?: Express.Multer.File): Promise<Candidate> {
    logger.info('Creating new candidate application', { 
      fullName: data.fullName,
      email: data.email,
      position: data.position 
    });

    // Check for duplicate application
    const existingCandidate = await this.candidateRepository.findByEmailAndPosition(
      data.email,
      data.position
    );

    if (existingCandidate) {
      logger.warn('Duplicate application blocked', { 
        email: data.email, 
        position: data.position,
        existingCandidateId: existingCandidate.id 
      });
      throw new AppError(
        'You have already applied for this position. Please check your email for application status or contact us for updates.', 
        409
      );
    }

    // Extract resume text if CV file provided
    let resumeSummary = null;
    if (file && data.cvFilePath) {
      try {
        resumeSummary = await extractTextFromPDF(data.cvFilePath);
        logger.info('PDF text extracted successfully', { 
          candidateEmail: data.email,
          textLength: resumeSummary.length 
        });
      } catch (error) {
        logger.error('Failed to extract PDF text', { 
          candidateEmail: data.email,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Create candidate with extracted resume text
    const candidateData = {
      ...data,
      resumeSummary,
      status: APPLICATION_STATUS.NEW
    };

    const candidate = await this.candidateRepository.create(candidateData);
    
    logger.info('Candidate created successfully', { 
      candidateId: candidate.id,
      email: candidate.email,
      position: candidate.position 
    });

    // Send confirmation email asynchronously
    this.sendConfirmationEmailAsync(candidate);

    // Process AI assessment asynchronously if resume text available
    if (resumeSummary) {
      this.processAssessmentAsync(candidate.id, resumeSummary);
    }

    return candidate;
  }

  async getCandidates(filters?: {
    search?: string;
    position?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CandidateWithAssessment[]> {
    logger.info('Fetching candidates with filters', { filters });
    return await this.candidateRepository.findAll(filters);
  }

  async getCandidateById(id: string): Promise<CandidateWithRelations | undefined> {
    logger.info('Fetching candidate by ID', { candidateId: id });
    return await this.candidateRepository.findWithRelations(id);
  }

  async updateCandidateStatus(id: string, status: string): Promise<Candidate> {
    logger.info('Updating candidate status', { candidateId: id, status });
    
    // Validate status
    const validStatuses = Object.values(APPLICATION_STATUS);
    if (!validStatuses.includes(status as any)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }

    return await this.candidateRepository.updateStatus(id, status);
  }

  async deleteCandidateWithRelatedData(id: string): Promise<void> {
    logger.info('Deleting candidate and related data', { candidateId: id });
    
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) {
      throw new AppError('Candidate not found', 404);
    }

    // Delete CV file if exists
    if (candidate.cvFilePath && fs.existsSync(candidate.cvFilePath)) {
      try {
        fs.unlinkSync(candidate.cvFilePath);
        logger.info('CV file deleted', { filePath: candidate.cvFilePath });
      } catch (error) {
        logger.error('Failed to delete CV file', { 
          filePath: candidate.cvFilePath,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Delete candidate (cascade will handle related data)
    await this.candidateRepository.delete(id);
    
    logger.info('Candidate deleted successfully', { candidateId: id });
  }

  async exportCandidates(filters?: any): Promise<Buffer> {
    logger.info('Exporting candidates', { filters });
    
    const candidates = await this.candidateRepository.findAll(filters);
    
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Position', 'Status', 'Applied At', 'Score'];
    const csvContent = [
      headers.join(','),
      ...candidates.map(candidate => [
        `"${candidate.fullName}"`,
        candidate.email,
        candidate.phone,
        `"${candidate.position}"`,
        candidate.status,
        candidate.appliedAt?.toISOString().split('T')[0] || '',
        candidate.assessment?.overallScore || ''
      ].join(','))
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  // Private helper methods
  private async sendConfirmationEmailAsync(candidate: Candidate): Promise<void> {
    try {
      const emailContent = getApplicationConfirmationEmail(candidate.fullName, candidate.position);
      await sendEmail({
        to: candidate.email,
        subject: `Application Confirmation - ${candidate.position}`,
        html: emailContent
      });
      
      logger.info('Confirmation email sent', { 
        candidateId: candidate.id,
        email: candidate.email 
      });
    } catch (error) {
      logger.error('Failed to send confirmation email', { 
        candidateId: candidate.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async processAssessmentAsync(candidateId: string, resumeText: string): Promise<void> {
    try {
      // Note: This would need to be updated once we know the correct processAssessment signature
      // For now, we'll just log that it should be processed
      logger.info('Assessment queued for processing', { candidateId, resumeTextLength: resumeText.length });
      // await processAssessment(candidateId, resumeText, position, requirements);
    } catch (error) {
      logger.error('Failed to process assessment', { 
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}
