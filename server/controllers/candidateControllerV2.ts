import { Request, Response } from 'express';
import { insertCandidateSchema } from '@shared/schema';
import { logger } from '../services/logger';
import { AppError, asyncHandler } from '../services/errorHandler';
import { CandidateService } from '../services/candidateService';
import { CandidateRepository } from '../repositories/candidateRepository';
import { HTTP_STATUS } from '@shared/constants';

// Initialize repositories and services
const candidateRepository = new CandidateRepository();
// Note: These would be properly injected in a full DI container
const candidateService = new CandidateService(
  candidateRepository,
  {} as any, // assessmentRepository placeholder
  {} as any  // emailRepository placeholder
);

export const createCandidate = asyncHandler(async (req: Request, res: Response) => {
  logger.info('POST /api/candidates - Creating new candidate', {
    body: { ...req.body, password: undefined } // Don't log sensitive data
  });

  const candidateData = insertCandidateSchema.parse({
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    linkedinProfile: req.body.linkedinProfile || null,
    position: req.body.position,
    cvFileName: req.file?.originalname,
    cvFilePath: req.file?.path,
  });

  const candidate = await candidateService.createCandidate(candidateData, req.file);

  logger.info('Candidate created successfully', { candidateId: candidate.id });
  
  res.status(HTTP_STATUS.CREATED).json({
    message: 'Application submitted successfully! You will receive a confirmation email shortly.',
    candidateId: candidate.id,
    status: 'success'
  });
});

export const getCandidates = asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/candidates - Fetching candidates', { query: req.query });

  const filters = {
    search: req.query.search as string,
    position: req.query.position as string,
    status: req.query.status as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
  };

  const candidates = await candidateService.getCandidates(filters);

  logger.info('Candidates retrieved successfully', { count: candidates.length });
  
  res.status(HTTP_STATUS.OK).json(candidates);
});

export const getCandidateById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  logger.info('GET /api/candidates/:id - Fetching candidate', { candidateId: id });

  const candidate = await candidateService.getCandidateById(id);

  if (!candidate) {
    throw new AppError('Candidate not found', HTTP_STATUS.NOT_FOUND);
  }

  logger.info('Candidate retrieved successfully', { candidateId: id });
  
  res.status(HTTP_STATUS.OK).json(candidate);
});

export const updateCandidateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  logger.info('PATCH /api/candidates/:id/status - Updating candidate status', { 
    candidateId: id, 
    status 
  });

  if (!status) {
    throw new AppError('Status is required', HTTP_STATUS.BAD_REQUEST);
  }

  const candidate = await candidateService.updateCandidateStatus(id, status);

  logger.info('Candidate status updated successfully', { 
    candidateId: id, 
    newStatus: status 
  });
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Candidate status updated successfully',
    candidate,
    status: 'success'
  });
});

export const deleteCandidate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  logger.info('DELETE /api/candidates/:id - Deleting candidate', { candidateId: id });

  await candidateService.deleteCandidateWithRelatedData(id);

  logger.info('Candidate deleted successfully', { candidateId: id });
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Candidate and related data deleted successfully',
    status: 'success'
  });
});

export const exportCandidates = asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/candidates/export - Exporting candidates', { query: req.query });

  const filters = {
    search: req.query.search as string,
    position: req.query.position as string,
    status: req.query.status as string,
  };

  const csvBuffer = await candidateService.exportCandidates(filters);

  const filename = `candidates_export_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', csvBuffer.length);
  
  logger.info('Candidates exported successfully', { filename });
  
  res.status(HTTP_STATUS.OK).send(csvBuffer);
});
