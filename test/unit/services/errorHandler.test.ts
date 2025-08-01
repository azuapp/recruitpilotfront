import { AppError, errorResponse, globalErrorHandler } from '../../../server/services/errorHandler';
import { HTTP_STATUS } from '../../../shared/constants';
import { Request, Response, NextFunction } from 'express';

describe('ErrorHandler', () => {
  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create AppError without error code', () => {
      const error = new AppError('Test error', 500);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBeUndefined();
      expect(error.isOperational).toBe(true);
    });
  });

  describe('errorResponse', () => {
    let mockResponse: Partial<Response>;
    let jsonSpy: jest.Mock;
    let statusSpy: jest.Mock;

    beforeEach(() => {
      jsonSpy = jest.fn();
      statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
      
      mockResponse = {
        status: statusSpy,
        json: jsonSpy,
      };
    });

    it('should send error response with all parameters', () => {
      errorResponse(mockResponse as Response, 'Test error', HTTP_STATUS.BAD_REQUEST, 'TEST_CODE', { field: 'email' });
      
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        error: {
          code: 'TEST_CODE',
          details: { field: 'email' }
        },
        timestamp: expect.any(String),
      });
    });

    it('should send error response with default status code', () => {
      errorResponse(mockResponse as Response, 'Server error');
      
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
        error: {
          code: undefined,
          details: undefined
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('globalErrorHandler', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;
    let jsonSpy: jest.Mock;
    let statusSpy: jest.Mock;

    beforeEach(() => {
      jsonSpy = jest.fn();
      statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
      
      mockRequest = {
        method: 'GET',
        url: '/test',
      };
      
      mockResponse = {
        status: statusSpy,
        json: jsonSpy,
      };
      
      mockNext = jest.fn();
    });

    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      
      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        error: {
          code: 'TEST_ERROR',
          statusCode: undefined,
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      
      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          statusCode: undefined,
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle validation errors', () => {
      const error = { 
        name: 'ValidationError', 
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Invalid email' }]
      };
      
      globalErrorHandler(error as any, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          details: undefined,
        },
        timestamp: expect.any(String),
      });
    });
  });
});
