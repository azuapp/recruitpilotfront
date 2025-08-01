import { eq, desc, and, like, or, sql, count } from "drizzle-orm";
import type { 
  Candidate, InsertCandidate, CandidateWithAssessment, CandidateWithRelations,
  Assessment, InsertAssessment 
} from '@shared/schema';
import { candidates, assessments } from '@shared/schema';
import { db } from '../db';
import { ICandidateRepository } from '../interfaces/repositories';
import { APPLICATION_STATUS } from '@shared/constants';

export class CandidateRepository implements ICandidateRepository {
  async findById(id: string): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
    return result[0];
  }

  async create(data: InsertCandidate): Promise<Candidate> {
    const result = await db.insert(candidates).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<Candidate>): Promise<Candidate> {
    const result = await db
      .update(candidates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error(`Candidate with id ${id} not found`);
    }
    
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await db.delete(candidates).where(eq(candidates.id, id));
  }

  async findAll(filters?: {
    search?: string;
    position?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CandidateWithAssessment[]> {
    let query = db
      .select({
        id: candidates.id,
        fullName: candidates.fullName,
        email: candidates.email,
        phone: candidates.phone,
        linkedinProfile: candidates.linkedinProfile,
        position: candidates.position,
        status: candidates.status,
        cvFileName: candidates.cvFileName,
        cvFilePath: candidates.cvFilePath,
        resumeSummary: candidates.resumeSummary,
        appliedAt: candidates.appliedAt,
        updatedAt: candidates.updatedAt,
        assessment: {
          id: assessments.id,
          overallScore: assessments.overallScore,
          technicalSkills: assessments.technicalSkills,
          experienceMatch: assessments.experienceMatch,
          education: assessments.education,
          aiInsights: assessments.aiInsights,
          status: assessments.status,
          processedAt: assessments.processedAt,
        },
      })
      .from(candidates)
      .leftJoin(assessments, eq(candidates.id, assessments.candidateId))
      .orderBy(desc(candidates.appliedAt));

    // Apply filters
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          like(candidates.fullName, `%${filters.search}%`),
          like(candidates.email, `%${filters.search}%`),
          like(candidates.position, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.position) {
      conditions.push(eq(candidates.position, filters.position));
    }
    
    if (filters?.status) {
      conditions.push(eq(candidates.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as typeof query;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as typeof query;
    }

    return await query as unknown as CandidateWithAssessment[];
  }

  async findByEmailAndPosition(email: string, position: string): Promise<Candidate | undefined> {
    const result = await db
      .select()
      .from(candidates)
      .where(and(eq(candidates.email, email), eq(candidates.position, position)))
      .limit(1);
    
    return result[0];
  }

  async findWithRelations(id: string): Promise<CandidateWithRelations | undefined> {
    const result = await db
      .select({
        id: candidates.id,
        fullName: candidates.fullName,
        email: candidates.email,
        phone: candidates.phone,
        linkedinProfile: candidates.linkedinProfile,
        position: candidates.position,
        status: candidates.status,
        cvFileName: candidates.cvFileName,
        cvFilePath: candidates.cvFilePath,
        resumeSummary: candidates.resumeSummary,
        appliedAt: candidates.appliedAt,
        updatedAt: candidates.updatedAt,
        assessment: {
          id: assessments.id,
          overallScore: assessments.overallScore,
          technicalSkills: assessments.technicalSkills,
          experienceMatch: assessments.experienceMatch,
          education: assessments.education,
          aiInsights: assessments.aiInsights,
          status: assessments.status,
          processedAt: assessments.processedAt,
        },
      })
      .from(candidates)
      .leftJoin(assessments, eq(candidates.id, assessments.candidateId))
      .where(eq(candidates.id, id))
      .limit(1);

    return result[0] as unknown as CandidateWithRelations | undefined;
  }

  async updateStatus(id: string, status: string): Promise<Candidate> {
    const result = await db
      .update(candidates)
      .set({ status, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error(`Candidate with id ${id} not found`);
    }
    
    return result[0];
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPosition: Record<string, number>;
  }> {
    // Get total count
    const totalResult = await db.select({ count: count() }).from(candidates);
    const total = totalResult[0]?.count || 0;

    // Get count by status
    const statusResult = await db
      .select({
        status: candidates.status,
        count: count(),
      })
      .from(candidates)
      .groupBy(candidates.status);

    const byStatus = statusResult.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // Get count by position
    const positionResult = await db
      .select({
        position: candidates.position,
        count: count(),
      })
      .from(candidates)
      .groupBy(candidates.position);

    const byPosition = positionResult.reduce((acc, row) => {
      acc[row.position] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byStatus,
      byPosition,
    };
  }
}
