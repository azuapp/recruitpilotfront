import { Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

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
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};