import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Admin users table for email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: varchar("role").notNull().default("admin"), // admin, super_admin
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  linkedinProfile: varchar("linkedin_profile"),
  position: varchar("position").notNull(),
  cvFileName: varchar("cv_file_name"),
  cvFilePath: varchar("cv_file_path"),
  status: varchar("status").notNull().default("new"), // new, reviewed, interview, hired, rejected
  appliedAt: timestamp("applied_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessments table for AI evaluations
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  technicalSkills: decimal("technical_skills", { precision: 5, scale: 2 }),
  experienceMatch: decimal("experience_match", { precision: 5, scale: 2 }),
  education: decimal("education", { precision: 5, scale: 2 }),
  aiInsights: text("ai_insights"),
  status: varchar("status").notNull().default("pending"), // pending, completed, failed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Interviews table
export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  scheduledDate: timestamp("scheduled_date").notNull(),
  interviewType: varchar("interview_type").notNull(), // video, phone, in-person
  status: varchar("status").notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email history table
export const emailHistory = pgTable("email_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  emailType: varchar("email_type").notNull(), // confirmation, interview, follow-up, rejection, offer
  status: varchar("status").notNull().default("pending"), // pending, sent, delivered, failed
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const candidatesRelations = relations(candidates, ({ many }) => ({
  assessments: many(assessments),
  interviews: many(interviews),
  emails: many(emailHistory),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  candidate: one(candidates, {
    fields: [assessments.candidateId],
    references: [candidates.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
}));

export const emailHistoryRelations = relations(emailHistory, ({ one }) => ({
  candidate: one(candidates, {
    fields: [emailHistory.candidateId],
    references: [candidates.id],
  }),
}));

// Insert schemas
export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  processedAt: true,
  createdAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailSchema = createInsertSchema(emailHistory).omit({
  id: true,
  sentAt: true,
  createdAt: true,
});

// Types
// User types and schemas
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const updateUserSchema = insertUserSchema.partial().omit({ password: true });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type EmailHistory = typeof emailHistory.$inferSelect;

// Combined types for API responses
export type CandidateWithAssessment = Candidate & {
  assessment?: Assessment;
};

export type CandidateWithRelations = Candidate & {
  assessments: Assessment[];
  interviews: Interview[];
  emails: EmailHistory[];
};
