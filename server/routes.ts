import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { upload } from "./services/fileUpload";
import { analyzeResume } from "./services/openai";
import { sendEmail, getApplicationConfirmationEmail, getInterviewInvitationEmail } from "./services/email";
import { insertCandidateSchema, insertInterviewSchema, insertEmailSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

      const candidate = await storage.createCandidate(candidateData);

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
          processAssessment(candidate.id, assessment.id, req.file.path, candidate.position)
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
      const interviewData = insertInterviewSchema.parse(req.body);
      const interview = await storage.createInterview(interviewData);
      
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

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to process AI assessment
async function processAssessment(
  candidateId: string, 
  assessmentId: string, 
  cvFilePath: string, 
  position: string
) {
  try {
    // Read CV file content (assuming it's text or extracted text)
    // In a real implementation, you'd use a PDF parser like pdf-parse
    const cvContent = await fs.promises.readFile(cvFilePath, 'utf-8').catch(() => {
      // If reading as text fails, assume it's a PDF and return placeholder
      return `Resume for ${position} position. CV file: ${path.basename(cvFilePath)}`;
    });

    const analysis = await analyzeResume(cvContent, position);

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
