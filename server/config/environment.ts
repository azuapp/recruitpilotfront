import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Environment {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  OPENAI_API_KEY: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
}

export const env: Environment = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  SESSION_SECRET: process.env.SESSION_SECRET || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || '',
};

// Validate required environment variables
export function validateEnvironment(): void {
  const required = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'OPENAI_API_KEY',
    'SMTP_USER',
    'SMTP_PASS'
  ] as const;

  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default env;