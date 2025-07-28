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

ASSESSMENT DATA:
Overall Score: ${assessment?.overallScore || "N/A"}
Skills Score: ${assessment?.skillsScore || "N/A"}
Experience Score: ${assessment?.experienceScore || "N/A"}
Education Score: ${assessment?.educationScore || "N/A"}
AI Insights: ${assessment?.aiInsights || "N/A"}

Please analyze and provide the following in JSON format:
{
  "fitScore": number (0-100),
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "experienceMatch": number (0-100),
  "educationMatch": number (0-100),
  "overallRecommendation": "detailed recommendation string"
}

Consider:
1. How well the candidate's skills match the required skills
2. Whether their experience level matches the job requirements
3. Their educational background relevance
4. Overall potential for success in this role
5. Specific strengths and weaknesses
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert HR recruiter and talent evaluator. Provide accurate, fair, and detailed candidate evaluations based on job requirements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      position: candidate.position,
      fitScore: evaluation.fitScore || 0,
      matchingSkills: evaluation.matchingSkills || [],
      missingSkills: evaluation.missingSkills || [],
      experienceMatch: evaluation.experienceMatch || 0,
      educationMatch: evaluation.educationMatch || 0,
      overallRecommendation: evaluation.overallRecommendation || "No recommendation available",
      ranking: 0 // Will be set after sorting
    };

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
    const { position } = req.body;
    
    logger.info("Starting candidate evaluation", { position });

    if (!process.env.OPENAI_API_KEY) {
      logger.error("OpenAI API key not configured");
      return res.status(500).json({ message: "OpenAI API key not configured" });
    }

    // Get candidates for the specific position or all if "all" is selected
    const candidates = await storage.getCandidates();
    const filteredCandidates = position === "all" 
      ? candidates 
      : candidates.filter((c: any) => c.position === position);

    if (filteredCandidates.length === 0) {
      return res.status(400).json({ message: "No candidates found for evaluation" });
    }

    // Get assessments for these candidates
    const assessments = await storage.getAssessments();
    const assessmentMap = new Map(assessments.map((a: any) => [a.candidateId, a]));

    const evaluationResults: EvaluationResult[] = [];

    // Process each candidate
    for (const candidate of filteredCandidates) {
      const assessment = assessmentMap.get(candidate.id);
      const jobDesc = jobDescriptions[candidate.position];
      
      if (!jobDesc) {
        logger.warn("No job description found for position", { position: candidate.position });
        continue;
      }

      const evaluation = await evaluateCandidate(candidate, assessment, jobDesc);
      evaluationResults.push(evaluation);
    }

    // Sort by fit score and assign rankings
    evaluationResults.sort((a, b) => b.fitScore - a.fitScore);
    evaluationResults.forEach((evaluation, index) => {
      evaluation.ranking = index + 1;
    });

    // Store evaluations in temporary memory for this session
    // Note: In a real implementation, this would be stored in database
    (global as any).evaluationResults = evaluationResults;

    logger.info("Evaluation completed", { 
      total: evaluationResults.length,
      position,
      avgScore: evaluationResults.reduce((acc, e) => acc + e.fitScore, 0) / evaluationResults.length
    });

    res.json({
      message: `Evaluated ${evaluationResults.length} candidates successfully`,
      results: evaluationResults
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
    
    if (!evaluations || evaluations.length === 0) {
      return res.json([]);
    }

    // Filter by position if specified
    const filteredEvaluations = position && position !== "all"
      ? evaluations.filter((e: any) => e.position === position)
      : evaluations;

    res.json(filteredEvaluations);

  } catch (error) {
    logger.error("Error fetching evaluations:", error);
    res.status(500).json({ message: "Failed to fetch evaluations" });
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