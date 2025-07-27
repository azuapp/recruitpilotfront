export const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // Authentication
  SESSION_SECRET: process.env.SESSION_SECRET!,
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@recruitpro.com',
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  UPLOAD_PATH: './uploads',
  
  // AI Settings
  DEFAULT_AI_MODEL: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
  MAX_TOKENS: 1500,
  
  // Validation
  isDevelopment: () => config.NODE_ENV === 'development',
  isProduction: () => config.NODE_ENV === 'production',
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET', 'OPENAI_API_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}