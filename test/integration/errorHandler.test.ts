import request from 'supertest';
import express from 'express';
import { globalErrorHandler, AppError } from '../../server/services/errorHandler';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Test route that throws AppError
  app.get('/test/app-error', (req, res, next) => {
    next(new AppError('Test application error', 400, 'TEST_ERROR'));
  });
  
  // Test route that throws generic error
  app.get('/test/generic-error', (req, res, next) => {
    next(new Error('Generic test error'));
  });
  
  // Test route that succeeds
  app.get('/test/success', (req, res) => {
    res.json({ message: 'Success', data: { test: true } });
  });
  
  // Add global error handler
  app.use(globalErrorHandler);
  
  return app;
};

describe('Error Handler Integration', () => {
  const app = createTestApp();

  it('should handle AppError and return proper response', async () => {
    const response = await request(app)
      .get('/test/app-error')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Test application error',
      error: {
        code: 'TEST_ERROR'
      },
      timestamp: expect.any(String)
    });
  });

  it('should handle generic error and return 500', async () => {
    const response = await request(app)
      .get('/test/generic-error')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.any(String), // Different based on NODE_ENV
      error: {
        code: 'INTERNAL_ERROR'
      },
      timestamp: expect.any(String)
    });
  });

  it('should handle successful requests normally', async () => {
    const response = await request(app)
      .get('/test/success')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Success',
      data: { test: true }
    });
  });
});
