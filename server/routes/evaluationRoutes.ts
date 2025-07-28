import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../auth';
import { asyncHandler } from '../services/errorHandler';
import { logger } from '../services/logger';

const router = Router();

// Run evaluation
router.post('/evaluations/run', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/evaluations', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  logger.info("Fetching evaluations", { query: req.query });
  
  try {
    const { getEvaluations } = await import('../controllers/evaluationController');
    await getEvaluations(req, res);
  } catch (error) {
    logger.error("Error fetching evaluations:", error);
    res.status(500).json({ message: "Failed to fetch evaluations" });
  }
}));

// Delete evaluation
router.delete('/evaluations/:candidateId', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  
  logger.info("Deleting evaluation", { 
    candidateId, 
    user: (req as any).user?.email 
  });
  
  try {
    const { deleteEvaluation } = await import('../controllers/evaluationController');
    await deleteEvaluation(req, res);
  } catch (error) {
    logger.error("Error deleting evaluation:", error);
    res.status(500).json({ message: "Failed to delete evaluation" });
  }
}));

export default router;