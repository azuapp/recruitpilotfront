import { Router } from 'express';
import { isAuthenticated } from '../auth';
import { asyncHandler } from '../services/errorHandler';
import { logger } from '../services/logger';

const router = Router();

// Run evaluation
router.post('/evaluations/run', isAuthenticated, asyncHandler(async (req, res) => {
  const { position } = req.body;
  
  logger.info("Starting candidate evaluation", { 
    position, 
    user: (req as any).user?.email 
  });

  try {
    const { runEvaluation } = await import('../controllers/evaluationController');
    await runEvaluation(req, res);
  } catch (error) {
    logger.error("Error running evaluation:", error);
    res.status(500).json({ message: "Failed to run evaluation" });
  }
}));

// Get evaluations
router.get('/evaluations', isAuthenticated, asyncHandler(async (req, res) => {
  logger.info("Fetching evaluations", { query: req.query });
  
  try {
    const { getEvaluations } = await import('../controllers/evaluationController');
    await getEvaluations(req, res);
  } catch (error) {
    logger.error("Error fetching evaluations:", error);
    res.status(500).json({ message: "Failed to fetch evaluations" });
  }
}));

export default router;