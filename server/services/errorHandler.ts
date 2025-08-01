import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { HTTP_STATUS } from '../../shared/constants';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Standard API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: any;
  };
  timestamp: string;
}

// Success response helper
export const successResponse = <T>(
  res: Response, 
  message: string, 
  data?: T, 
  statusCode: number = HTTP_STATUS.OK
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
};

// Error response helper
export const errorResponse = (
  res: Response, 
  message: string, 
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: string,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      details
    },
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
};

// Global error handler middleware
export const globalErrorHandler = (
  error: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): Response | void => {
  logger.error('Global error handler triggered', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Handle different types of errors
  if (error instanceof AppError) {
    return errorResponse(res, error.message, error.statusCode, error.code);
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return errorResponse(
      res, 
      'Validation failed', 
      HTTP_STATUS.BAD_REQUEST, 
      'VALIDATION_ERROR',
      (error as any).errors
    );
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return errorResponse(
      res, 
      'Invalid token', 
      HTTP_STATUS.UNAUTHORIZED, 
      'INVALID_TOKEN'
    );
  }

  // Handle database errors
  if (error.message.includes('duplicate key')) {
    return errorResponse(
      res, 
      'Resource already exists', 
      HTTP_STATUS.CONFLICT, 
      'DUPLICATE_RESOURCE'
    );
  }

  // Default error response
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    'INTERNAL_ERROR'
  );
};

export const handleError = (error: Error, res: Response): void => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      status: 'error'
    });
    return;
  }

  // Default error response
  res.status(500).json({
    message: 'Internal server error',
    status: 'error'
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};