import { Router } from "express";
import { runEvaluation, getEvaluations, getJobDescriptions } from "../controllers/evaluationController";

const router = Router();

// POST /api/evaluations/run - Run AI evaluation for candidates
router.post("/run", runEvaluation);

// GET /api/evaluations - Get evaluation results
router.get("/", getEvaluations);

// GET /api/job-descriptions - Get job descriptions
router.get("/job-descriptions", getJobDescriptions);

export default router;