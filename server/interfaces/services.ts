import type { 
  Candidate, InsertCandidate, CandidateWithAssessment, CandidateWithRelations,
  Assessment, InsertAssessment,
  Interview, InsertInterview,
  EmailHistory, InsertEmail,
  User, InsertUser
} from '@shared/schema';
import type { EmailType, InterviewType } from '@shared/constants';

// Candidate service interface
export interface ICandidateService {
  createCandidate(data: InsertCandidate, file?: Express.Multer.File): Promise<Candidate>;
  getCandidates(filters?: {
    search?: string;
    position?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CandidateWithAssessment[]>;
  getCandidateById(id: string): Promise<CandidateWithRelations | undefined>;
  updateCandidateStatus(id: string, status: string): Promise<Candidate>;
  deleteCandidateWithRelatedData(id: string): Promise<void>;
  exportCandidates(filters?: any): Promise<Buffer>;
}

// Assessment service interface
export interface IAssessmentService {
  processAssessment(candidateId: string, cvText: string): Promise<Assessment>;
  runBulkAssessment(candidateIds?: string[]): Promise<{
    processed: number;
    failed: number;
    results: Assessment[];
  }>;
  getAssessmentById(id: string): Promise<Assessment | undefined>;
  getAssessmentsByCandidateId(candidateId: string): Promise<Assessment | undefined>;
  deleteAssessment(id: string): Promise<void>;
}

// Email service interface
export interface IEmailService {
  sendEmail(to: string, subject: string, html: string, type: EmailType): Promise<void>;
  sendApplicationConfirmation(candidate: Candidate): Promise<void>;
  sendInterviewInvitation(candidate: Candidate, interview: Interview): Promise<void>;
  sendRejectionEmail(candidate: Candidate): Promise<void>;
  sendAcceptanceEmail(candidate: Candidate): Promise<void>;
  getEmailHistory(candidateId?: string): Promise<EmailHistory[]>;
  deleteEmail(id: string): Promise<void>;
}

// Interview service interface
export interface IInterviewService {
  scheduleInterview(data: InsertInterview): Promise<Interview>;
  getInterviews(filters?: {
    candidateId?: string;
    status?: string;
    type?: string;
  }): Promise<Interview[]>;
  getInterviewById(id: string): Promise<Interview | undefined>;
  updateInterviewStatus(id: string, status: string): Promise<Interview>;
  rescheduleInterview(id: string, newDateTime: Date): Promise<Interview>;
  deleteInterview(id: string): Promise<void>;
}

// User service interface
export interface IUserService {
  createUser(data: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  updateLastLogin(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
}

// File service interface
export interface IFileService {
  uploadFile(file: Express.Multer.File): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
  validateFile(file: Express.Multer.File): Promise<boolean>;
  extractTextFromPDF(filePath: string): Promise<string>;
}

// PDF service interface
export interface IPdfService {
  extractText(filePath: string): Promise<string>;
  validatePDF(filePath: string): Promise<boolean>;
  validateContent(text: string): Promise<boolean>;
}

// Analytics service interface
export interface IAnalyticsService {
  getDashboardStats(): Promise<{
    totalCandidates: number;
    activePositions: number;
    interviews: number;
    assessments: number;
  }>;
  getCandidateAnalytics(): Promise<{
    byStatus: Record<string, number>;
    byPosition: Record<string, number>;
    trends: Array<{ date: string; count: number }>;
  }>;
  getAssessmentAnalytics(): Promise<{
    averageScore: number;
    scoreDistribution: Record<string, number>;
    topSkills: Array<{ skill: string; frequency: number }>;
  }>;
}
