import OpenAI from "openai";
import type { Candidate, JobDescription } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface JobFitAnalysis {
  fitScore: number; // 0-100
  skillMatch: number; // 0-100
  experienceAlignment: number; // 0-100
  languageMatch: number; // 0-100
  analysis: string;
}

export async function calculateJobFitScore(
  candidate: Candidate,
  jobDescription: JobDescription,
  cvContent: string
): Promise<JobFitAnalysis> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert AI recruiter specializing in candidate-job matching. Your task is to analyze how well a candidate fits a specific job position based on their CV and application details compared to the job requirements.

Provide a comprehensive analysis with specific scores and detailed reasoning. Be objective and thorough in your assessment.

Respond with JSON in this exact format:
{
  "fitScore": number (0-100),
  "skillMatch": number (0-100),
  "experienceAlignment": number (0-100),
  "languageMatch": number (0-100),
  "analysis": "Detailed explanation of the analysis including strengths, gaps, and recommendations"
}`
        },
        {
          role: "user",
          content: `Please analyze this candidate for the following position:

**Position:** ${jobDescription.position}

**Job Requirements:**
- Responsibilities: ${jobDescription.responsibilities}
- Required Experience: ${jobDescription.requiredExperience}
- Required Skills: ${jobDescription.skills}
${jobDescription.notes ? `- Additional Notes: ${jobDescription.notes}` : ''}

**Candidate Information:**
- Name: ${candidate.firstName} ${candidate.lastName}
- Email: ${candidate.email}
- Phone: ${candidate.phoneNumber}
- Position Applied For: ${candidate.position}
- Experience: ${candidate.experience} years
- Education: ${candidate.education}
- Skills: ${candidate.skills}
- Languages: ${candidate.languages}
- Additional Notes: ${candidate.notes || 'None provided'}

**CV Content:**
${cvContent || 'CV content not available'}

Please provide:
1. **Overall Fit Score (0-100)**: How well does this candidate match the position overall?
2. **Skill Match (0-100)**: How well do their technical and soft skills align with requirements?
3. **Experience Alignment (0-100)**: How relevant and sufficient is their experience?
4. **Language Match (0-100)**: How well do their language skills meet requirements?
5. **Detailed Analysis**: Comprehensive explanation of strengths, weaknesses, and fit assessment.

Consider factors like:
- Technical skill overlap
- Years of experience vs requirements
- Educational background relevance
- Language proficiency for the role
- Industry experience
- Leadership/management experience if required
- Cultural fit indicators
- Growth potential`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and sanitize the response
    const analysis: JobFitAnalysis = {
      fitScore: Math.max(0, Math.min(100, Math.round(result.fitScore || 0))),
      skillMatch: Math.max(0, Math.min(100, Math.round(result.skillMatch || 0))),
      experienceAlignment: Math.max(0, Math.min(100, Math.round(result.experienceAlignment || 0))),
      languageMatch: Math.max(0, Math.min(100, Math.round(result.languageMatch || 0))),
      analysis: result.analysis || 'Analysis not available',
    };

    return analysis;
  } catch (error) {
    console.error("Error calculating job fit score:", error);
    throw new Error("Failed to calculate job fit score: " + (error as Error).message);
  }
}

export function getFitScoreColor(score: number): string {
  if (score >= 75) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

export function getFitScoreLabel(score: number): string {
  if (score >= 75) return "Excellent Fit";
  if (score >= 60) return "Good Fit";
  if (score >= 40) return "Moderate Fit";
  return "Poor Fit";
}