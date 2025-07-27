import { Router } from 'express';
import { DashboardService } from '../services/dashboardService';
import { asyncHandler } from '../services/errorHandler';
import { requireAuth } from '../auth';

const router = Router();

// Get dashboard statistics
router.get('/stats', requireAuth, asyncHandler(async (req, res) => {
  const stats = await DashboardService.getDashboardStats();
  res.json(stats);
}));

// Get recent activities
router.get('/activities', requireAuth, asyncHandler(async (req, res) => {
  const activities = await DashboardService.getRecentActivities();
  res.json(activities);
}));

export default router;