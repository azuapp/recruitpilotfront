import { Router } from 'express';
import {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidateStatus,
  downloadCV,
  deleteCandidate
} from '../controllers/candidateController';
import { upload } from '../services/fileUpload';
import { handleError } from '../services/errorHandler';

const router = Router();

// Create new candidate application
router.post('/applications', upload.single('cv'), createCandidate);

// Get all candidates with filtering
router.get('/candidates', getCandidates);

// Get single candidate by ID
router.get('/candidates/:id', getCandidateById);

// Update candidate status
router.patch('/candidates/:id/status', updateCandidateStatus);

// Download CV file
router.get('/candidates/:id/cv', downloadCV);

// Delete candidate
router.delete('/candidates/:id', deleteCandidate);

// Error handling middleware
router.use((error: Error, req: any, res: any, next: any) => {
  handleError(error, res);
});

export default router;