import { Router } from 'express';
import { TestDataService } from '../services/testDataService';
import { runProductionTestScenario, validateSystemHealth } from '../utils/testScenario';
import { asyncHandler } from '../services/errorHandler';
import { requireAuth } from '../auth';
import { logger } from '../services/logger';

const router = Router();

// Run production test scenario
router.post('/test/production-scenario', asyncHandler(async (req, res) => {
  logger.info('Running production test scenario');
  
  const report = await runProductionTestScenario();
  
  res.json({
    message: 'Production test scenario completed successfully',
    report
  });
}));

// Create complete test scenario (legacy)
router.post('/test/create-scenario', requireAuth, asyncHandler(async (req, res) => {
  logger.info('Creating test scenario');
  
  const scenario = await TestDataService.createCompleteTestScenario();
  
  res.json({
    message: 'Test scenario created successfully',
    scenario
  });
}));

// Generate test report
router.get('/test/report', requireAuth, asyncHandler(async (req, res) => {
  logger.info('Generating test report');
  
  const report = await TestDataService.generateTestReport();
  
  res.json(report);
}));

// Create test candidate only
router.post('/test/candidate', requireAuth, asyncHandler(async (req, res) => {
  const candidate = await TestDataService.createTestCandidate();
  
  res.json({
    message: 'Test candidate created successfully',
    candidate
  });
}));

// Create test job description only
router.post('/test/job-description', requireAuth, asyncHandler(async (req, res) => {
  const jobDescription = await TestDataService.createTestJobDescription();
  
  res.json({
    message: 'Test job description created successfully',
    jobDescription
  });
}));

// System health check
router.get('/test/health', asyncHandler(async (req, res) => {
  const health = await validateSystemHealth();
  
  res.status(health.status === 'healthy' ? 200 : 500).json({
    message: health.status === 'healthy' ? 'System is healthy' : 'System issues detected',
    health
  });
}));

// Ensure admin user exists
router.post('/test/admin', asyncHandler(async (req, res) => {
  const admin = await TestDataService.ensureTestAdminUser();
  
  res.json({
    message: 'Admin user ensured successfully',
    admin: {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role
    }
  });
}));

export default router;