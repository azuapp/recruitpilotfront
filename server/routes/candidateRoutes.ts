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
import { handleError, AppError } from '../services/errorHandler';

const router = Router();

// Create new candidate application
router.post('/applications', upload.single('cv'), createCandidate);

// Secure file upload endpoint with validation
router.post('/candidates/upload', (req, res, next) => {
  upload.single('cv')(req, res, (err) => {
    if (err) {
      if (err.message === 'Only PDF files are allowed') {
        return res.status(415).json({ message: 'Only PDF files are allowed' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File size too large. Maximum 10MB allowed' });
      }
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Additional security check
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(415).json({ message: 'Only PDF files are allowed' });
    }
    
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(413).json({ message: 'File size too large. Maximum 10MB allowed' });
    }
    
    res.status(200).json({ 
      message: 'File uploaded successfully',
      filename: req.file.filename 
    });
  });
});

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

// Handle unsupported methods on /candidates route - MUST be last
router.all('/candidates', (req, res) => {
  res.status(405).json({ 
    message: 'Method not allowed',
    method: req.method,
    allowedMethods: ['GET']
  });
});

// Error handling middleware
router.use((error: Error, req: any, res: any, next: any) => {
  handleError(error, res);
});

export default router;