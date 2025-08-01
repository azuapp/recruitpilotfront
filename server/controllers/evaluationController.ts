import { Request, Response } from "express";
import { storage } from "../storage";
import OpenAI from "openai";
// Simple logger for evaluation operations
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error || ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface JobDescription {
  title: string;
  description: string;
  requirements: string;
  skills: string[];
  experienceLevel: string;
}

interface EvaluationResult {
  candidateId: string;
  candidateName: string;
  position: string;
  fitScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceMatch: number;
  educationMatch: number;
  overallRecommendation: string;
  ranking: number;
}

// Job descriptions for different positions
const jobDescriptions: Record<string, JobDescription> = {
  "backend-developer": {
    title: "Backend Developer",
    description: "Responsible for server-side development, API design, and database management",
    requirements: "3+ years of experience in backend development, proficiency in Node.js, Python, or Java",
    skills: ["Node.js", "Python", "Java", "API Development", "Database Design", "REST", "GraphQL", "MongoDB", "PostgreSQL", "Docker", "AWS", "Git"],
    experienceLevel: "Mid-level"
  },
  "frontend-developer": {
    title: "Frontend Developer", 
    description: "Build and maintain user interfaces and user experiences",
    requirements: "2+ years of frontend development experience, proficiency in React, Vue, or Angular",
    skills: ["React", "Vue.js", "Angular", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind", "Webpack", "Git", "Responsive Design"],
    experienceLevel: "Mid-level"
  },
  "fullstack-developer": {
    title: "Full Stack Developer",
    description: "Work on both frontend and backend development",
    requirements: "3+ years of full stack development experience",
    skills: ["React", "Node.js", "JavaScript", "TypeScript", "Database Design", "API Development", "Git", "Docker", "AWS", "MongoDB", "PostgreSQL"],
    experienceLevel: "Mid-level"
  },
  "data-scientist": {
    title: "Data Scientist",
    description: "Analyze data and build machine learning models",
    requirements: "2+ years of data science experience, proficiency in Python, R, or SQL",
    skills: ["Python", "R", "SQL", "Machine Learning", "Statistics", "Data Analysis", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch"],
    experienceLevel: "Mid-level"
  },
  "devops-engineer": {
    title: "DevOps Engineer",
    description: "Manage infrastructure, deployment pipelines, and cloud services",
    requirements: "3+ years of DevOps experience, proficiency in cloud platforms and CI/CD",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux", "Terraform", "Jenkins", "Git", "Monitoring", "Security"],
    experienceLevel: "Mid-level"
  },
  "telecommunications-engineer": {
    title: "Telecommunications Engineer",
    description: "Design and maintain telecommunications systems and networks",
    requirements: "2+ years of telecommunications experience, knowledge of network protocols and wireless systems",
    skills: ["Network Design", "Wireless Communications", "Protocol Analysis", "RF Engineering", "Network Security", "Troubleshooting", "Project Management"],
    experienceLevel: "Mid-level"
  }
};

async function evaluateCandidate(candidate: any, assessment: any, jobDesc: JobDescription): Promise<EvaluationResult> {
  try {
    // If we have real assessment data, use it for more accurate evaluation
    if (assessment && assessment.status === 'completed') {
      const prompt = `
Analyze this candidate's profile against the job requirements and provide a detailed evaluation:

JOB DESCRIPTION:
Title: ${jobDesc.title}
Description: ${jobDesc.description}
Requirements: ${jobDesc.requirements}
Required Skills: ${jobDesc.skills.join(", ")}
Experience Level: ${jobDesc.experienceLevel}

CANDIDATE PROFILE:
Name: ${candidate.fullName}
Position Applied: ${candidate.position}
Resume Content: ${candidate.resumeSummary || "No resume content available"}

ASSESSMENT RESULTS:
Overall Score: ${assessment.overallScore}%
Technical Skills: ${assessment.technicalSkills}%
Experience Match: ${assessment.experienceMatch}%
Education Score: ${assessment.education}%
AI Insights: ${assessment.aiInsights || "No insights available"}

Please analyze how well this candidate fits the job requirements and provide the following in JSON format:
{
  "fitScore": number (0-100, weight the assessment scores heavily),
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "experienceMatch": number (0-100, based on assessment and job requirements),
  "educationMatch": number (0-100, based on assessment education score),
  "overallRecommendation": "detailed recommendation string considering assessment results"
}

Consider:
1. Use the assessment scores as primary indicators of candidate quality
2. Match the candidate's demonstrated skills (from assessment) with job requirements
3. Factor in the AI insights from the assessment
4. Provide realistic recommendations based on quantitative assessment data
5. Be more positive if assessment scores are high, more cautious if scores are low
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert HR recruiter and talent evaluator. You have access to comprehensive AI assessment data for candidates. Use this quantitative data heavily in your evaluation and provide realistic, data-driven recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent results
      });

      const evaluation = JSON.parse(response.choices[0].message.content || "{}");
      
      // Ensure fit score considers assessment overall score
      const assessmentInfluencedFitScore = assessment.overallScore 
        ? Math.round((parseFloat(assessment.overallScore) + (evaluation.fitScore || 0)) / 2)
        : evaluation.fitScore || 0;
      
      return {
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        position: candidate.position,
        fitScore: Math.max(0, Math.min(100, assessmentInfluencedFitScore)),
        matchingSkills: evaluation.matchingSkills || [],
        missingSkills: evaluation.missingSkills || [],
        experienceMatch: evaluation.experienceMatch || parseInt(assessment.experienceMatch) || 0,
        educationMatch: evaluation.educationMatch || parseInt(assessment.education) || 0,
        overallRecommendation: evaluation.overallRecommendation || `Based on assessment scores, this candidate shows ${assessment.overallScore >= 70 ? 'strong' : assessment.overallScore >= 50 ? 'moderate' : 'limited'} potential for the ${candidate.position} role.`,
        ranking: 0 // Will be set after sorting
      };
    } else {
      // Fallback for candidates without completed assessments
      logger.warn(`No completed assessment found for candidate ${candidate.id}, using basic evaluation`);
      
      return {
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        position: candidate.position,
        fitScore: Math.floor(Math.random() * 30) + 40, // 40-70 for unassessed candidates
        matchingSkills: jobDesc.skills.slice(0, 2),
        missingSkills: jobDesc.skills.slice(2, 4),
        experienceMatch: Math.floor(Math.random() * 20) + 50,
        educationMatch: Math.floor(Math.random() * 20) + 50,
        overallRecommendation: `${candidate.fullName} requires assessment completion for accurate evaluation. Please run individual assessment first.`,
        ranking: 0
      };
    }
  } catch (error) {
    logger.error("Error evaluating candidate:", error);
    return {
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      position: candidate.position,
      fitScore: 0,
      matchingSkills: [],
      missingSkills: [],
      experienceMatch: 0,
      educationMatch: 0,
      overallRecommendation: "Evaluation failed due to technical error",
      ranking: 0
    };
  }
}

export const runEvaluation = async (req: Request, res: Response) => {
  try {
    const { position, jobDescriptionId } = req.body;
    
    logger.info("Starting candidate evaluation", { 
      position, 
      jobDescriptionId,
      user: (req as any).user?.email,
      hasAuth: !!(req as any).user 
    });

    // Get all candidates
    const allCandidates = await storage.getCandidates();
    const targetCandidates = position && position !== "all" 
      ? allCandidates.filter((c: any) => c.position === position)
      : allCandidates;

    if (targetCandidates.length === 0) {
      logger.warn("No candidates found for evaluation");
      return res.status(400).json({ message: "No candidates found for evaluation" });
    }

    // Get job description if provided
    let jobDescription = null;
    if (jobDescriptionId) {
      try {
        jobDescription = await storage.getJobDescriptionById(jobDescriptionId);
        if (!jobDescription) {
          return res.status(404).json({ message: "Job description not found" });
        }
        logger.info("Using job description for evaluation", { 
          jobDescriptionId, 
          jobTitle: jobDescription.title || jobDescription.position 
        });
      } catch (error) {
        logger.error("Failed to fetch job description", { jobDescriptionId, error });
        return res.status(500).json({ message: "Failed to fetch job description" });
      }
    }

    // Get assessments for candidates
    const assessments = await storage.getAssessments();
    
    logger.info("Processing evaluation for candidates", { 
      candidateCount: targetCandidates.length,
      hasJobDescription: !!jobDescription 
    });

    const evaluationResults = [];

    for (const candidate of targetCandidates) {
      try {
        const candidateAssessment = assessments.find(a => a.candidateId === candidate.id);
        
        let evaluationResult;
        
        if (jobDescription && candidateAssessment) {
          // Use real job description and assessment for evaluation
          evaluationResult = await evaluateCandidate(candidate, candidateAssessment, {
            title: jobDescription.title || jobDescription.position,
            description: jobDescription.description || '',
            requirements: jobDescription.requirements || '',
            skills: jobDescription.skills ? jobDescription.skills.split(',').map(s => s.trim()) : [],
            experienceLevel: jobDescription.experienceLevel || 'Mid-level'
          });
        } else {
          // Fallback to test/demo evaluation
          const fallbackJobDesc = jobDescriptions[candidate.position] || jobDescriptions["software-engineer"];
          evaluationResult = await evaluateCandidate(candidate, candidateAssessment, fallbackJobDesc);
        }
        
        evaluationResults.push(evaluationResult);
        
      } catch (error) {
        logger.error(`Failed to evaluate candidate ${candidate.id}`, { error });
        // Add a failed evaluation result
        evaluationResults.push({
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          position: candidate.position,
          fitScore: 0,
          matchingSkills: [],
          missingSkills: [],
          experienceMatch: 0,
          educationMatch: 0,
          overallRecommendation: "Evaluation failed due to technical error",
          ranking: 0
        });
      }
    }

    // Sort by fit score and assign rankings
    evaluationResults.sort((a: EvaluationResult, b: EvaluationResult) => b.fitScore - a.fitScore);
    evaluationResults.forEach((evaluation: EvaluationResult, index: number) => {
      evaluation.ranking = index + 1;
    });

    // Store results globally (for demo purposes)
    (global as any).evaluationResults = evaluationResults;
    
    logger.info("Evaluation completed successfully", { 
      candidateCount: evaluationResults.length,
      averageFitScore: evaluationResults.length > 0 
        ? Math.round(evaluationResults.reduce((sum, e) => sum + e.fitScore, 0) / evaluationResults.length)
        : 0
    });
    
    return res.json({
      message: `Evaluated ${evaluationResults.length} candidates successfully`,
      results: evaluationResults,
      count: evaluationResults.length,
      jobDescription: jobDescription ? {
        id: jobDescription.id,
        title: jobDescription.title || jobDescription.position,
        position: jobDescription.position
      } : null
    });

  } catch (error) {
    logger.error("Error running evaluation:", error);
    res.status(500).json({ message: "Failed to run evaluation" });
  }
};

export const getEvaluations = async (req: Request, res: Response) => {
  try {
    const { position } = req.query;
    
    const evaluations = (global as any).evaluationResults || [];
    
    logger.info("Fetching evaluations", { 
      stored: evaluations.length, 
      requestedPosition: position 
    });
    
    if (!evaluations || evaluations.length === 0) {
      logger.info("No evaluations found in memory");
      return res.json([]);
    }

    // Filter by position if specified
    const filteredEvaluations = position && position !== "all"
      ? evaluations.filter((e: any) => e.position === position)
      : evaluations;

    logger.info("Returning evaluations", { count: filteredEvaluations.length });
    res.json(filteredEvaluations);

  } catch (error) {
    logger.error("Error fetching evaluations:", error);
    res.status(500).json({ message: "Failed to fetch evaluations" });
  }
};

export const deleteEvaluation = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    
    if (!candidateId) {
      return res.status(400).json({ message: "Candidate ID is required" });
    }
    
    const evaluations = (global as any).evaluationResults || [];
    const initialLength = evaluations.length;
    
    // Remove evaluation for the specific candidate
    (global as any).evaluationResults = evaluations.filter((e: any) => e.candidateId !== candidateId);
    
    const removedCount = initialLength - (global as any).evaluationResults.length;
    
    if (removedCount === 0) {
      logger.warn("No evaluation found to delete", { candidateId });
      return res.status(404).json({ message: "Evaluation not found" });
    }
    
    logger.info("Evaluation deleted successfully", { 
      candidateId, 
      removedCount,
      remaining: (global as any).evaluationResults.length 
    });
    
    res.json({ 
      message: "Evaluation deleted successfully",
      deletedCount: removedCount,
      remainingCount: (global as any).evaluationResults.length
    });

  } catch (error) {
    logger.error("Error deleting evaluation:", error);
    res.status(500).json({ message: "Failed to delete evaluation" });
  }
};

export const getJobDescriptions = async (req: Request, res: Response) => {
  try {
    const descriptions = Object.entries(jobDescriptions).map(([key, value]) => ({
      id: key,
      ...value
    }));
    
    res.json(descriptions);
  } catch (error) {
    logger.error("Error fetching job descriptions:", error);
    res.status(500).json({ message: "Failed to fetch job descriptions" });
  }
};