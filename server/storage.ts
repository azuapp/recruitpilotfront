import {
  users,
  candidates,
  assessments,
  interviews,
  emailHistory,
  type User,
  type InsertUser,
  type Candidate,
  type InsertCandidate,
  type Assessment,
  type InsertAssessment,
  type Interview,
  type InsertInterview,
  type EmailHistory,
  type InsertEmail,
  type CandidateWithAssessment,
  type CandidateWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  getUsers(): Promise<User[]>;
  
  // Candidate operations
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidates(filters?: {
    search?: string;
    position?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CandidateWithAssessment[]>;
  getCandidateById(id: string): Promise<CandidateWithRelations | undefined>;
  updateCandidateStatus(id: string, status: string): Promise<Candidate>;
  
  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessmentByCandidateId(candidateId: string): Promise<Assessment | undefined>;
  updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment>;
  getAssessments(): Promise<Assessment[]>;
  
  // Interview operations
  createInterview(interview: InsertInterview): Promise<Interview>;
  getInterviews(filters?: {
    candidateId?: string;
    status?: string;
    date?: Date;
  }): Promise<Interview[]>;
  updateInterview(id: string, updates: Partial<Interview>): Promise<Interview>;
  
  // Email operations
  createEmail(email: InsertEmail): Promise<EmailHistory>;
  getEmails(candidateId?: string): Promise<EmailHistory[]>;
  updateEmailStatus(id: string, status: string): Promise<EmailHistory>;
  
  // Statistics
  getStats(): Promise<{
    totalCandidates: number;
    activePositions: number;
    interviews: number;
    assessments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Candidate operations
  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db
      .insert(candidates)
      .values(candidate)
      .returning();
    return newCandidate;
  }

  async getCandidates(filters?: {
    search?: string;
    position?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CandidateWithAssessment[]> {
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          like(candidates.fullName, `%${filters.search}%`),
          like(candidates.email, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.position) {
      conditions.push(eq(candidates.position, filters.position));
    }
    
    if (filters?.status) {
      conditions.push(eq(candidates.status, filters.status));
    }

    let queryBuilder = db
      .select({
        id: candidates.id,
        fullName: candidates.fullName,
        email: candidates.email,
        phone: candidates.phone,
        linkedinProfile: candidates.linkedinProfile,
        position: candidates.position,
        cvFileName: candidates.cvFileName,
        cvFilePath: candidates.cvFilePath,
        status: candidates.status,
        appliedAt: candidates.appliedAt,
        updatedAt: candidates.updatedAt,
        assessment: {
          id: assessments.id,
          candidateId: assessments.candidateId,
          overallScore: assessments.overallScore,
          technicalSkills: assessments.technicalSkills,
          experienceMatch: assessments.experienceMatch,
          education: assessments.education,
          aiInsights: assessments.aiInsights,
          status: assessments.status,
          processedAt: assessments.processedAt,
          createdAt: assessments.createdAt,
        },
      })
      .from(candidates)
      .leftJoin(assessments, eq(candidates.id, assessments.candidateId));

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions));
    }

    queryBuilder = queryBuilder.orderBy(desc(candidates.appliedAt));

    if (filters?.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder = queryBuilder.offset(filters.offset);
    }

    const results = await queryBuilder;
    
    return results.map(row => ({
      ...row,
      assessment: row.assessment && row.assessment.id ? row.assessment : null,
    })) as CandidateWithAssessment[];
  }

  async getCandidateById(id: string): Promise<CandidateWithRelations | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    if (!candidate) return undefined;

    const [candidateAssessments, candidateInterviews, candidateEmails] = await Promise.all([
      db.select().from(assessments).where(eq(assessments.candidateId, id)),
      db.select().from(interviews).where(eq(interviews.candidateId, id)),
      db.select().from(emailHistory).where(eq(emailHistory.candidateId, id)),
    ]);

    return {
      ...candidate,
      assessments: candidateAssessments,
      interviews: candidateInterviews,
      emails: candidateEmails,
    };
  }

  async updateCandidateStatus(id: string, status: string): Promise<Candidate> {
    const [updatedCandidate] = await db
      .update(candidates)
      .set({ status, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    return updatedCandidate;
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async getAssessmentByCandidateId(candidateId: string): Promise<Assessment | undefined> {
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.candidateId, candidateId));
    return assessment;
  }

  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment> {
    const [updatedAssessment] = await db
      .update(assessments)
      .set({ ...updates, processedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return updatedAssessment;
  }

  async getAssessments(): Promise<Assessment[]> {
    return await db.select().from(assessments).orderBy(desc(assessments.createdAt));
  }

  // Interview operations
  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db
      .insert(interviews)
      .values(interview)
      .returning();
    return newInterview;
  }

  async getInterviews(filters?: {
    candidateId?: string;
    status?: string;
    date?: Date;
  }): Promise<Interview[]> {
    const conditions = [];
    
    if (filters?.candidateId) {
      conditions.push(eq(interviews.candidateId, filters.candidateId));
    }
    
    if (filters?.status) {
      conditions.push(eq(interviews.status, filters.status));
    }

    let queryBuilder = db.select().from(interviews);

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions));
    }

    return await queryBuilder.orderBy(desc(interviews.scheduledDate));
  }

  async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview> {
    const [updatedInterview] = await db
      .update(interviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning();
    return updatedInterview;
  }

  // Email operations
  async createEmail(email: InsertEmail): Promise<EmailHistory> {
    const [newEmail] = await db
      .insert(emailHistory)
      .values(email)
      .returning();
    return newEmail;
  }

  async getEmails(candidateId?: string): Promise<EmailHistory[]> {
    let queryBuilder = db.select().from(emailHistory);

    if (candidateId) {
      queryBuilder = queryBuilder.where(eq(emailHistory.candidateId, candidateId));
    }

    return await queryBuilder.orderBy(desc(emailHistory.createdAt));
  }

  async updateEmailStatus(id: string, status: string): Promise<EmailHistory> {
    const [updatedEmail] = await db
      .update(emailHistory)
      .set({ status, sentAt: new Date() })
      .where(eq(emailHistory.id, id))
      .returning();
    return updatedEmail;
  }

  // Statistics
  async getStats(): Promise<{
    totalCandidates: number;
    activePositions: number;
    interviews: number;
    assessments: number;
  }> {
    const [candidateCount] = await db.select({ count: sql`count(*)`.as('count') }).from(candidates);
    const [positionCount] = await db.select({ 
      count: sql`count(distinct position)`.as('count') 
    }).from(candidates);
    const [interviewCount] = await db.select({ count: sql`count(*)`.as('count') })
      .from(interviews)
      .where(eq(interviews.status, 'scheduled'));
    const [assessmentCount] = await db.select({ count: sql`count(*)`.as('count') }).from(assessments);

    return {
      totalCandidates: Number(candidateCount.count) || 0,
      activePositions: Number(positionCount.count) || 0,
      interviews: Number(interviewCount.count) || 0,
      assessments: Number(assessmentCount.count) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
