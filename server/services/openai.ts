import OpenAI from "openai";
import env from "../config/environment";
import { logger } from "./logger";
import { AppError } from "./errorHandler";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: env.OPENAI_API_KEY
});

export interface ResumeAnalysis {
  overallScore: number;
  technicalSkills: number;
  experienceMatch: number;
  education: number;
  insights: string[];
}

export async function analyzeResume(
  resumeText: string, 
  position: string
): Promise<ResumeAnalysis> {
  try {
    logger.info('Starting AI resume analysis', { position, textLength: resumeText.length });
    
    if (!resumeText || resumeText.length < 50) {
      throw new AppError('Resume text is too short for analysis', 400);
    }

    const prompt = `
    Analyze this resume for the position of "${position}". 
    Provide a detailed assessment in JSON format with the following structure:
    {
      "overallScore": number (0-100),
      "technicalSkills": number (0-100),
      "experienceMatch": number (0-100),
      "education": number (0-100),
      "insights": ["insight1", "insight2", "insight3", "insight4"]
    }

    Resume content:
    ${resumeText}

    Consider:
    - Technical skills relevant to the position
    - Years of experience and relevance
    - Educational background
    - Project experience and achievements
    - Overall fit for the role

    Provide 4 specific insights about the candidate's strengths and recommendations.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert HR recruiter and technical interviewer. Analyze resumes objectively and provide detailed assessments."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    logger.info('AI analysis completed', { 
      overallScore: analysis.overallScore,
      position 
    });

    return {
      overallScore: Math.max(0, Math.min(100, analysis.overallScore || 0)),
      technicalSkills: Math.max(0, Math.min(100, analysis.technicalSkills || 0)),
      experienceMatch: Math.max(0, Math.min(100, analysis.experienceMatch || 0)),
      education: Math.max(0, Math.min(100, analysis.education || 0)),
      insights: analysis.insights || [],
    };
  } catch (error) {
    logger.error("AI resume analysis failed", { error: error instanceof Error ? error.message : 'Unknown error' });
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError("Failed to analyze resume: " + (error as Error).message, 500);
  }
}

// Remove unused function - text extraction is handled by pdfExtractor service
