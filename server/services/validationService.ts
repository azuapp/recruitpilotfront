import { z } from 'zod';
import { logger } from './logger';

// Validation schemas
export const candidateValidationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  position: z.string().min(2, 'Position must be specified'),
  linkedinProfile: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
});

export const userValidationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['admin', 'recruiter']).optional().default('recruiter'),
});

export const interviewValidationSchema = z.object({
  candidateId: z.string().uuid('Invalid candidate ID'),
  scheduledDate: z.string().refine((date) => {
    // Accept both datetime-local format and ISO strings
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format'),
  interviewType: z.enum(['phone', 'video', 'in-person']),
  notes: z.string().optional(),
});

export const emailValidationSchema = z.object({
  candidateId: z.string().uuid('Invalid candidate ID'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
  recipientEmail: z.string().email('Invalid recipient email'),
});

export const jobDescriptionValidationSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  position: z.string().min(2, 'Position is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.string().min(20, 'Requirements must be specified'),
  benefits: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  salaryMin: z.number().min(0, 'Minimum salary must be positive').optional(),
  salaryMax: z.number().min(0, 'Maximum salary must be positive').optional(),
  isActive: z.boolean().optional().default(true),
});

export class ValidationService {
  /**
   * Validate request data against a schema
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        logger.warn('Validation failed', { errors: errorMessages, data });
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: Express.Multer.File, allowedTypes: string[] = ['application/pdf']) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    logger.debug('File validation passed', { 
      filename: file.filename, 
      mimetype: file.mimetype, 
      size: file.size 
    });
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}