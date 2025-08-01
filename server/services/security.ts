import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Common validation schemas
export const commonSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format'),
  nonEmptyString: z.string().min(1, 'Field cannot be empty'),
  positiveNumber: z.number().positive('Number must be positive'),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  url: z.string().url('Invalid URL format').optional(),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).optional()
  }).partial(),
  
  // File validation
  fileData: z.object({
    originalname: z.string(),
    mimetype: z.string().regex(/^(application\/pdf|image\/(jpeg|jpg|png))$/, 'Invalid file type'),
    size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB')
  })
};

// Input sanitization functions
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/&lt;/gi, '')
      .replace(/&gt;/gi, '');
  }

  /**
   * Sanitize text input by trimming and escaping special characters
   */
  static sanitizeText(input: string): string {
    return input.trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  /**
   * Sanitize SQL-like input to prevent injection
   */
  static sanitizeSqlInput(input: string): string {
    return input.replace(/['";\\]/g, '') // Remove SQL special characters
      .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|SELECT|UNION|UPDATE|FROM|WHERE)\b)/gi, ''); // Remove SQL keywords
  }

  /**
   * Sanitize file path to prevent directory traversal
   */
  static sanitizeFilePath(input: string): string {
    return input.replace(/\.\./g, '') // Remove parent directory references
      .replace(/[<>:"|?*]/g, '') // Remove invalid file characters
      .replace(/^\/+/, ''); // Remove leading slashes
  }

  /**
   * Comprehensive input sanitization
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this.sanitizeText(key)] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Authentication rate limiting (more restrictive)
export const authRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 authentication attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Middleware to validate request parameters
 */
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input before validation
      req.params = InputSanitizer.sanitizeObject(req.params);
      
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Parameter validation failed', {
          path: req.path,
          params: req.params,
          errors: error.errors
        });
        
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware to validate request body
 */
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input before validation
      req.body = InputSanitizer.sanitizeObject(req.body);
      
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Body validation failed', {
          path: req.path,
          errors: error.errors
        });
        
        return res.status(400).json({
          error: 'Invalid request body',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware to validate query parameters
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input before validation
      req.query = InputSanitizer.sanitizeObject(req.query);
      
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Query validation failed', {
          path: req.path,
          query: req.query,
          errors: error.errors
        });
        
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS enforcement
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * Request size limiter
 */
export const requestSizeLimits = {
  json: { limit: '10mb' },
  urlencoded: { limit: '10mb', extended: true },
  raw: { limit: '10mb' }
};

export default {
  commonSchemas,
  InputSanitizer,
  validateParams,
  validateBody,
  validateQuery,
  securityHeaders,
  rateLimitConfig,
  authRateLimitConfig,
  requestSizeLimits
};
