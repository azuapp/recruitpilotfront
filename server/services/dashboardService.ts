import { storage } from '../storage';
import { logger } from './logger';

export class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats() {
    try {
      logger.debug('Fetching dashboard statistics');
      
      const stats = await storage.getDashboardStats();
      
      logger.debug('Dashboard statistics retrieved', { stats });
      return stats;
    } catch (error) {
      logger.error('Failed to fetch dashboard statistics', { error });
      throw error;
    }
  }

  /**
   * Get recent activities summary
   */
  static async getRecentActivities() {
    try {
      logger.debug('Fetching recent activities');
      
      // Get recent candidates, interviews, and assessments
      const [recentCandidates, recentInterviews, recentAssessments] = await Promise.all([
        storage.getCandidates({ limit: 5 }),
        storage.getInterviews(),
        storage.getAssessments().then(assessments => assessments.slice(0, 5))
      ]);

      return {
        candidates: recentCandidates,
        interviews: recentInterviews,
        assessments: recentAssessments
      };
    } catch (error) {
      logger.error('Failed to fetch recent activities', { error });
      throw error;
    }
  }
}