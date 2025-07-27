import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { upload } from "./services/fileUpload";
import { analyzeResume } from "./services/openai";
import { sendEmail, getApplicationConfirmationEmail, getInterviewInvitationEmail } from "./services/email";
import { extractTextFromPDF, validatePDFContent } from "./services/pdfExtractor";
import { insertCandidateSchema, insertInterviewSchema, insertEmailSchema, insertJobDescriptionSchema, insertJobFitScoreSchema } from "@shared/schema";
import { calculateJobFitScore } from "./services/jobFitService";
import { z } from "zod";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Current user route
  app.get('/api/user', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role = "admin" } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(password);
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { email, firstName, lastName, role, isActive } = req.body;
      
      const updates: any = {};
      if (email) updates.email = email;
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (role) updates.role = role;
      if (typeof isActive === 'boolean') updates.isActive = isActive;

      const user = await storage.updateUser(id, updates);
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent self-deletion
      if (req.user && req.user.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // File serving route
  app.get('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  });

  // Public application form endpoint
  app.post('/api/applications', upload.single('cv'), async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.parse({
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        linkedinProfile: req.body.linkedinProfile || null,
        position: req.body.position,
        cvFileName: req.file?.originalname,
        cvFilePath: req.file?.path,
      });

      // Extract text from PDF if file was uploaded
      let resumeSummary = null;
      if (req.file?.path) {
        try {
          resumeSummary = await extractTextFromPDF(req.file.path);
          console.log(`Extracted ${resumeSummary.length} characters from PDF for ${candidateData.fullName}`);
        } catch (error) {
          console.error('Failed to extract PDF text:', error);
          // Continue with application even if PDF extraction fails
        }
      }

      // Add resume summary to candidate data
      const candidateWithResume = {
        ...candidateData,
        resumeSummary
      };

      const candidate = await storage.createCandidate(candidateWithResume);

      // Send confirmation email
      try {
        const emailHtml = getApplicationConfirmationEmail(candidate.fullName, candidate.position);
        await sendEmail({
          to: candidate.email,
          subject: `Application Received - ${candidate.position}`,
          html: emailHtml,
        });

        // Log email in history
        await storage.createEmail({
          candidateId: candidate.id,
          subject: `Application Received - ${candidate.position}`,
          content: emailHtml,
          emailType: 'confirmation',
          status: 'sent',
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Continue even if email fails
      }

      // Trigger AI assessment asynchronously
      if (req.file?.path) {
        try {
          // Create assessment record
          const assessment = await storage.createAssessment({
            candidateId: candidate.id,
            status: 'pending',
          });

          // Process assessment asynchronously (don't await)
          processAssessment(candidate.id, assessment.id, candidate.position, resumeSummary)
            .catch(error => console.error('Assessment processing failed:', error));
        } catch (error) {
          console.error('Failed to create assessment:', error);
        }
      }

      res.json({ 
        message: 'Application submitted successfully',
        candidateId: candidate.id 
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to submit application' });
      }
    }
  });

  // Protected routes (require authentication)
  
  // Dashboard stats
  app.get('/api/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Candidates endpoints
  app.get('/api/candidates', isAuthenticated, async (req, res) => {
    try {
      const { search, position, status, limit, offset } = req.query;
      const candidates = await storage.getCandidates({
        search: search as string,
        position: position as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(candidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      res.status(500).json({ message: 'Failed to fetch candidates' });
    }
  });

  app.get('/api/candidates/:id', isAuthenticated, async (req, res) => {
    try {
      const candidate = await storage.getCandidateById(req.params.id);
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }
      res.json(candidate);
    } catch (error) {
      console.error('Error fetching candidate:', error);
      res.status(500).json({ message: 'Failed to fetch candidate' });
    }
  });

  app.patch('/api/candidates/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const candidate = await storage.updateCandidateStatus(req.params.id, status);
      res.json(candidate);
    } catch (error) {
      console.error('Error updating candidate status:', error);
      res.status(500).json({ message: 'Failed to update candidate status' });
    }
  });

  // Download candidate CV
  app.get('/api/candidates/:id/download-cv', isAuthenticated, async (req, res) => {
    try {
      const candidate = await storage.getCandidateById(req.params.id);
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      if (!candidate.cvFilePath) {
        return res.status(404).json({ message: 'CV file not found' });
      }

      const filePath = path.resolve(candidate.cvFilePath);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'CV file not found on server' });
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${candidate.cvFileName || 'CV.pdf'}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Error streaming CV file:', error);
        res.status(500).json({ message: 'Error downloading CV' });
      });

    } catch (error) {
      console.error('Error downloading CV:', error);
      res.status(500).json({ message: 'Failed to download CV' });
    }
  });

  // Assessments endpoints
  app.get('/api/assessments', isAuthenticated, async (req, res) => {
    try {
      const assessments = await storage.getAssessments();
      res.json(assessments);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      res.status(500).json({ message: 'Failed to fetch assessments' });
    }
  });

  app.post('/api/assessments/:candidateId/run', isAuthenticated, async (req, res) => {
    try {
      const candidateId = req.params.candidateId;
      const candidate = await storage.getCandidateById(candidateId);
      
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      if (!candidate.cvFilePath) {
        return res.status(400).json({ message: 'No CV file found for candidate' });
      }

      let assessment = await storage.getAssessmentByCandidateId(candidateId);
      
      if (!assessment) {
        assessment = await storage.createAssessment({
          candidateId,
          status: 'pending',
        });
      }

      // Process assessment asynchronously
      processAssessment(candidateId, assessment.id, candidate.cvFilePath, candidate.position)
        .catch(error => console.error('Assessment processing failed:', error));

      res.json({ message: 'Assessment started', assessmentId: assessment.id });
    } catch (error) {
      console.error('Error starting assessment:', error);
      res.status(500).json({ message: 'Failed to start assessment' });
    }
  });

  // Interviews endpoints
  app.get('/api/interviews', isAuthenticated, async (req, res) => {
    try {
      const { candidateId, status } = req.query;
      const interviews = await storage.getInterviews({
        candidateId: candidateId as string,
        status: status as string,
      });
      res.json(interviews);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      res.status(500).json({ message: 'Failed to fetch interviews' });
    }
  });

  app.post('/api/interviews', isAuthenticated, async (req, res) => {
    try {
      // Parse and convert scheduledDate to proper Date object
      const rawData = req.body;
      const interviewData = {
        ...rawData,
        scheduledDate: new Date(rawData.scheduledDate)
      };
      
      const validatedData = insertInterviewSchema.parse(interviewData);
      const interview = await storage.createInterview(validatedData);
      
      // Send interview invitation email
      try {
        const candidate = await storage.getCandidateById(interviewData.candidateId);
        if (candidate) {
          const emailHtml = getInterviewInvitationEmail(
            candidate.fullName,
            candidate.position,
            new Date(interviewData.scheduledDate).toLocaleString(),
            interviewData.interviewType
          );
          
          await sendEmail({
            to: candidate.email,
            subject: `Interview Invitation - ${candidate.position}`,
            html: emailHtml,
          });

          await storage.createEmail({
            candidateId: candidate.id,
            subject: `Interview Invitation - ${candidate.position}`,
            content: emailHtml,
            emailType: 'interview',
            status: 'sent',
          });
        }
      } catch (emailError) {
        console.error('Failed to send interview invitation:', emailError);
      }

      res.json(interview);
    } catch (error) {
      console.error('Error creating interview:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid interview data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create interview' });
      }
    }
  });

  // Email history endpoints
  app.get('/api/emails', isAuthenticated, async (req, res) => {
    try {
      const { candidateId } = req.query;
      const emails = await storage.getEmails(candidateId as string);
      res.json(emails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ message: 'Failed to fetch emails' });
    }
  });

  app.post('/api/emails', isAuthenticated, async (req, res) => {
    try {
      const emailData = insertEmailSchema.parse(req.body);
      const email = await storage.createEmail(emailData);
      
      // Send the actual email
      try {
        const candidate = await storage.getCandidateById(emailData.candidateId);
        if (candidate) {
          await sendEmail({
            to: candidate.email,
            subject: emailData.subject,
            html: emailData.content,
          });
          
          await storage.updateEmailStatus(email.id, 'sent');
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        await storage.updateEmailStatus(email.id, 'failed');
      }

      res.json(email);
    } catch (error) {
      console.error('Error creating email:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid email data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create email' });
      }
    }
  });

  // Job Descriptions routes
  app.get('/api/job-descriptions', isAuthenticated, async (req, res) => {
    try {
      const jobDescriptions = await storage.getJobDescriptions();
      res.json(jobDescriptions);
    } catch (error) {
      console.error("Error fetching job descriptions:", error);
      res.status(500).json({ message: "Failed to fetch job descriptions" });
    }
  });

  app.post('/api/job-descriptions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertJobDescriptionSchema.parse(req.body);
      const jobDescription = await storage.createJobDescription(validatedData);
      res.status(201).json(jobDescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating job description:", error);
      res.status(500).json({ message: "Failed to create job description" });
    }
  });

  app.get('/api/job-descriptions/:id', isAuthenticated, async (req, res) => {
    try {
      const jobDescription = await storage.getJobDescriptionById(req.params.id);
      if (!jobDescription) {
        return res.status(404).json({ message: "Job description not found" });
      }
      res.json(jobDescription);
    } catch (error) {
      console.error("Error fetching job description:", error);
      res.status(500).json({ message: "Failed to fetch job description" });
    }
  });

  app.put('/api/job-descriptions/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertJobDescriptionSchema.partial().parse(req.body);
      const jobDescription = await storage.updateJobDescription(req.params.id, validatedData);
      res.json(jobDescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating job description:", error);
      res.status(500).json({ message: "Failed to update job description" });
    }
  });

  app.delete('/api/job-descriptions/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteJobDescription(req.params.id);
      res.status(200).json({ message: "Job description deleted successfully" });
    } catch (error) {
      console.error("Error deleting job description:", error);
      res.status(500).json({ message: "Failed to delete job description" });
    }
  });

  // Job Fit Scores routes
  app.post('/api/candidates/:candidateId/calculate-fit-score', isAuthenticated, async (req, res) => {
    try {
      const { candidateId } = req.params;
      const { jobDescriptionId } = req.body;

      if (!jobDescriptionId) {
        return res.status(400).json({ message: "Job description ID is required" });
      }

      // Get candidate and job description
      const candidate = await storage.getCandidateById(candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      const jobDescription = await storage.getJobDescriptionById(jobDescriptionId);
      if (!jobDescription) {
        return res.status(404).json({ message: "Job description not found" });
      }

      // Read CV content if available
      let cvContent = '';
      if (candidate.cvFilePath) {
        try {
          const cvPath = path.join(process.cwd(), candidate.cvFilePath);
          if (fs.existsSync(cvPath)) {
            const cvBuffer = fs.readFileSync(cvPath);
            const pdfParse = await import('pdf-parse');
            const pdfData = await pdfParse.default(cvBuffer);
            cvContent = pdfData.text;
          }
        } catch (error) {
          console.warn("Failed to read CV content:", error);
        }
      }

      // Calculate fit score using OpenAI
      const fitAnalysis = await calculateJobFitScore(candidate, jobDescription, cvContent);

      // Check if score already exists
      const existingScore = await storage.getJobFitScoreByCandidate(candidateId, jobDescriptionId);

      let jobFitScore;
      if (existingScore) {
        // Update existing score
        jobFitScore = await storage.updateJobFitScore(existingScore.id, {
          fitScore: fitAnalysis.fitScore,
          skillMatch: fitAnalysis.skillMatch,
          experienceAlignment: fitAnalysis.experienceAlignment,
          languageMatch: fitAnalysis.languageMatch,
          aiAnalysis: fitAnalysis.analysis,
        });
      } else {
        // Create new score
        const jobFitScoreData = {
          candidateId,
          jobDescriptionId,
          fitScore: fitAnalysis.fitScore,
          skillMatch: fitAnalysis.skillMatch,
          experienceAlignment: fitAnalysis.experienceAlignment,
          languageMatch: fitAnalysis.languageMatch,
          aiAnalysis: fitAnalysis.analysis,
        };
        jobFitScore = await storage.createJobFitScore(jobFitScoreData);
      }

      res.json(jobFitScore);
    } catch (error) {
      console.error("Error calculating fit score:", error);
      res.status(500).json({ message: "Failed to calculate fit score" });
    }
  });

  app.get('/api/candidates/:candidateId/fit-scores', isAuthenticated, async (req, res) => {
    try {
      const fitScores = await storage.getJobFitScoresByCandidateId(req.params.candidateId);
      res.json(fitScores);
    } catch (error) {
      console.error("Error fetching fit scores:", error);
      res.status(500).json({ message: "Failed to fetch fit scores" });
    }
  });

  app.get('/api/candidates-with-fit-scores', isAuthenticated, async (req, res) => {
    try {
      const { jobDescriptionId } = req.query;
      const candidatesWithScores = await storage.getCandidatesWithFitScores(
        jobDescriptionId as string || undefined
      );
      res.json(candidatesWithScores);
    } catch (error) {
      console.error("Error fetching candidates with fit scores:", error);
      res.status(500).json({ message: "Failed to fetch candidates with fit scores" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to process AI assessment
async function processAssessment(
  candidateId: string, 
  assessmentId: string, 
  position: string,
  resumeSummary: string | null
) {
  try {
    // Use extracted resume text instead of reading file
    if (!resumeSummary) {
      throw new Error('No resume text available for analysis');
    }

    console.log(`Processing assessment for candidate ${candidateId} with ${resumeSummary.length} characters of resume text`);
    const analysis = await analyzeResume(resumeSummary, position);

    await storage.updateAssessment(assessmentId, {
      overallScore: analysis.overallScore.toString(),
      technicalSkills: analysis.technicalSkills.toString(),
      experienceMatch: analysis.experienceMatch.toString(),
      education: analysis.education.toString(),
      aiInsights: analysis.insights.join('\n'),
      status: 'completed',
    });

    console.log(`Assessment completed for candidate ${candidateId}`);
  } catch (error) {
    console.error(`Assessment failed for candidate ${candidateId}:`, error);
    await storage.updateAssessment(assessmentId, {
      status: 'failed',
    });
  }
}
