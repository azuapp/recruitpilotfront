import { storage } from '../storage';
import { logger } from './logger';
import { hashPassword } from '../auth';
import path from 'path';
import fs from 'fs/promises';

export class TestDataService {
  /**
   * Create test candidate with sample CV
   */
  static async createTestCandidate() {
    try {
      logger.info('Creating test candidate');
      
      // Create a test candidate
      const candidate = await storage.createCandidate({
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        position: 'Software Engineer',
        linkedinProfile: 'https://linkedin.com/in/johndoe',
        cvFileName: 'john_doe_cv.pdf',
        cvFilePath: '/uploads/john_doe_cv.pdf',
        resumeSummary: `
JOHN DOE
Software Engineer

EXPERIENCE:
• 5+ years of full-stack web development
• Expert in React, Node.js, TypeScript, and Python
• Led development of 3 major web applications
• Experience with AWS, Docker, and microservices
• Strong background in database design and optimization

EDUCATION:
• Bachelor's in Computer Science, MIT (2018)
• Master's in Software Engineering, Stanford (2020)

SKILLS:
• Programming Languages: JavaScript, TypeScript, Python, Java
• Frontend: React, Vue.js, HTML5, CSS3, Tailwind
• Backend: Node.js, Express, Django, FastAPI
• Databases: PostgreSQL, MongoDB, Redis
• Cloud: AWS, Docker, Kubernetes
• Tools: Git, JIRA, Jenkins, Jest

ACHIEVEMENTS:
• Increased application performance by 40%
• Led team of 8 developers on critical project
• Published 3 technical articles on Medium
• Active contributor to open-source projects
        `.trim(),
        status: 'pending',
      });

      logger.info('Test candidate created successfully', { candidateId: candidate.id });
      return candidate;
    } catch (error) {
      logger.error('Failed to create test candidate', { error });
      throw error;
    }
  }

  /**
   * Create test job description
   */
  static async createTestJobDescription() {
    try {
      logger.info('Creating test job description');
      
      const jobDescription = await storage.createJobDescription({
        title: 'Senior Software Engineer',
        position: 'Software Engineer',
        description: `
We are seeking a Senior Software Engineer to join our growing team. The ideal candidate will have strong experience in full-stack web development, cloud technologies, and team leadership.

Key Responsibilities:
• Design and develop scalable web applications
• Lead technical discussions and architectural decisions
• Mentor junior developers and conduct code reviews
• Collaborate with product managers and designers
• Ensure code quality and best practices
• Participate in on-call rotation and incident response

Requirements:
• 5+ years of software development experience
• Strong proficiency in JavaScript/TypeScript and React
• Experience with Node.js and modern backend frameworks
• Knowledge of cloud platforms (AWS, GCP, or Azure)
• Experience with databases (SQL and NoSQL)
• Understanding of DevOps practices and CI/CD
• Strong communication and leadership skills
• Bachelor's degree in Computer Science or related field

Nice to Have:
• Experience with microservices architecture
• Knowledge of containerization (Docker/Kubernetes)
• Previous experience in a startup environment
• Open source contributions
• Experience with data analytics and machine learning
        `.trim(),
        requirements: `
• 5+ years of software development experience
• Proficiency in JavaScript/TypeScript, React, Node.js
• Experience with cloud platforms (AWS preferred)
• Database knowledge (PostgreSQL, MongoDB)
• DevOps and CI/CD experience
• Strong communication skills
• Computer Science degree or equivalent
        `.trim(),
        benefits: `
• Competitive salary ($120,000 - $180,000)
• Comprehensive health insurance
• 401(k) with company matching
• Flexible work arrangements
• Professional development budget
• Stock options
• Unlimited PTO
• Modern tech stack and equipment
        `.trim(),
        location: 'San Francisco, CA (Remote OK)',
        salaryMin: 120000,
        salaryMax: 180000,
        isActive: true,
      });

      logger.info('Test job description created successfully', { jobDescriptionId: jobDescription.id });
      return jobDescription;
    } catch (error) {
      logger.error('Failed to create test job description', { error });
      throw error;
    }
  }

  /**
   * Create test admin user if not exists
   */
  static async ensureTestAdminUser() {
    try {
      // Check if admin user exists
      const existingAdmin = await storage.getUserByEmail('admin@recruitpro.com');
      
      if (!existingAdmin) {
        logger.info('Creating test admin user');
        
        const hashedPassword = await hashPassword('admin123');
        
        const admin = await storage.createUser({
          email: 'admin@recruitpro.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          isActive: true,
        });

        logger.info('Test admin user created successfully', { userId: admin.id });
        return admin;
      } else {
        logger.info('Test admin user already exists', { userId: existingAdmin.id });
        return existingAdmin;
      }
    } catch (error) {
      logger.error('Failed to ensure test admin user', { error });
      throw error;
    }
  }

  /**
   * Create complete test scenario
   */
  static async createCompleteTestScenario() {
    try {
      logger.info('Creating complete test scenario');

      // Create admin user
      const admin = await this.ensureTestAdminUser();

      // Create job description
      const jobDescription = await this.createTestJobDescription();

      // Create test candidate
      const candidate = await this.createTestCandidate();

      // Trigger assessment
      const { runAssessment } = await import('./assessmentService');
      const assessment = await runAssessment(candidate.id);

      // Calculate job fit score
      const { calculateJobFitScore } = await import('./assessmentService');
      const fitScore = await calculateJobFitScore(candidate.id, jobDescription.id);

      // Create interview
      const interview = await storage.createInterview({
        candidateId: candidate.id,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        type: 'video',
        duration: 60,
        interviewerName: 'Sarah Johnson',
        location: 'Zoom Meeting',
        notes: 'Technical interview focusing on React and Node.js experience',
        status: 'scheduled',
      });

      logger.info('Complete test scenario created successfully', {
        adminId: admin.id,
        jobDescriptionId: jobDescription.id,
        candidateId: candidate.id,
        assessmentId: assessment.id,
        fitScoreId: fitScore.id,
        interviewId: interview.id,
      });

      return {
        admin,
        jobDescription,
        candidate,
        assessment,
        fitScore,
        interview,
      };
    } catch (error) {
      logger.error('Failed to create complete test scenario', { error });
      throw error;
    }
  }

  /**
   * Generate test statistics report
   */
  static async generateTestReport() {
    try {
      logger.info('Generating test report');

      const [candidates, assessments, interviews, jobDescriptions] = await Promise.all([
        storage.getCandidates(),
        storage.getAssessments(),
        storage.getInterviews(),
        storage.getJobDescriptions(),
      ]);

      const stats = await storage.getDashboardStats();

      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalCandidates: candidates.length,
          totalAssessments: assessments.length,
          totalInterviews: interviews.length,
          totalJobDescriptions: jobDescriptions.length,
        },
        dashboardStats: stats,
        candidateDetails: candidates.map(c => ({
          id: c.id,
          name: c.fullName,
          position: c.position,
          status: c.status,
          hasAssessment: !!c.assessment,
          assessmentScore: c.assessment?.overallScore || null,
        })),
        assessmentDetails: assessments.map(a => ({
          id: a.id,
          candidateId: a.candidateId,
          overallScore: a.overallScore,
          status: a.status,
          processedAt: a.processedAt,
        })),
        interviewDetails: interviews.map(i => ({
          id: i.id,
          candidateId: i.candidateId,
          type: i.type,
          status: i.status,
          scheduledDate: i.scheduledDate,
        })),
      };

      logger.info('Test report generated successfully', { report });
      return report;
    } catch (error) {
      logger.error('Failed to generate test report', { error });
      throw error;
    }
  }
}