import type { 
  User, InsertUser, 
  Candidate, InsertCandidate, CandidateWithAssessment, CandidateWithRelations,
  Assessment, InsertAssessment,
  Interview, InsertInterview,
  EmailHistory, InsertEmail,
  JobDescription, InsertJobDescription
} from '@shared/schema';

// Base repository interface
export interface IBaseRepository<T, CreateT> {
  findById(id: string): Promise<T | undefined>;
  create(data: CreateT): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// User repository interface
export interface IUserRepository extends IBaseRepository<User, InsertUser> {
  findByEmail(email: string): Promise<User | undefined>;
  findAll(): Promise<User[]>;
  updateLastLogin(id: string): Promise<void>;
}

// Candidate repository interface
export interface ICandidateRepository extends IBaseRepository<Candidate, InsertCandidate> {
  findAll(filters?: {
    search?: string;
    position?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CandidateWithAssessment[]>;
  findByEmailAndPosition(email: string, position: string): Promise<Candidate | undefined>;
  findWithRelations(id: string): Promise<CandidateWithRelations | undefined>;
  updateStatus(id: string, status: string): Promise<Candidate>;
  getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPosition: Record<string, number>;
  }>;
}

// Assessment repository interface
export interface IAssessmentRepository extends IBaseRepository<Assessment, InsertAssessment> {
  findByCandidateId(candidateId: string): Promise<Assessment | undefined>;
  findAll(filters?: {
    candidateId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Assessment[]>;
  getStatistics(): Promise<{
    total: number;
    averageScore: number;
    byStatus: Record<string, number>;
  }>;
}

// Interview repository interface
export interface IInterviewRepository extends IBaseRepository<Interview, InsertInterview> {
  findByCandidateId(candidateId: string): Promise<Interview[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Interview[]>;
  findAll(filters?: {
    candidateId?: string;
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Interview[]>;
  updateStatus(id: string, status: string): Promise<Interview>;
}

// Email repository interface
export interface IEmailRepository extends IBaseRepository<EmailHistory, InsertEmail> {
  findByCandidateId(candidateId: string): Promise<EmailHistory[]>;
  findAll(filters?: {
    candidateId?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<EmailHistory[]>;
  updateStatus(id: string, status: string): Promise<EmailHistory>;
}

// Job Description repository interface
export interface IJobDescriptionRepository extends IBaseRepository<JobDescription, InsertJobDescription> {
  findByPosition(position: string): Promise<JobDescription | undefined>;
  findAll(): Promise<JobDescription[]>;
  findActive(): Promise<JobDescription[]>;
}
