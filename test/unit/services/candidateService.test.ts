import { CandidateService } from '../../../server/services/candidateService';
import { ICandidateRepository, IAssessmentRepository, IEmailRepository } from '../../../server/interfaces/repositories';
import { InsertCandidate, Candidate } from '../../../shared/schema';
import { AppError } from '../../../server/services/errorHandler';
import { APPLICATION_STATUS } from '../../../shared/constants';

// Mock dependencies
const mockCandidateRepository: jest.Mocked<ICandidateRepository> = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findByEmailAndPosition: jest.fn(),
  findWithRelations: jest.fn(),
  updateStatus: jest.fn(),
  getStatistics: jest.fn(),
};

const mockAssessmentRepository: jest.Mocked<IAssessmentRepository> = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByCandidateId: jest.fn(),
  findAll: jest.fn(),
  getStatistics: jest.fn(),
};

const mockEmailRepository: jest.Mocked<IEmailRepository> = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByCandidateId: jest.fn(),
  findAll: jest.fn(),
  updateStatus: jest.fn(),
};

// Mock external dependencies
jest.mock('../../../server/services/pdfExtractor', () => ({
  extractTextFromPDF: jest.fn().mockResolvedValue('Sample resume text'),
}));

jest.mock('../../../server/services/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  getApplicationConfirmationEmail: jest.fn().mockReturnValue('<h1>Welcome</h1>'),
}));

jest.mock('../../../server/services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('CandidateService', () => {
  let candidateService: CandidateService;
  
  const validCandidateData: InsertCandidate = {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    position: 'Software Engineer',
    cvFileName: 'resume.pdf',
    cvFilePath: '/uploads/resume.pdf',
  };

  const mockCandidate: Candidate = {
    id: 'candidate-123',
    fullName: validCandidateData.fullName,
    email: validCandidateData.email,
    phone: validCandidateData.phone,
    position: validCandidateData.position,
    linkedinProfile: null,
    cvFileName: validCandidateData.cvFileName || null,
    cvFilePath: validCandidateData.cvFilePath || null,
    resumeSummary: null,
    status: APPLICATION_STATUS.NEW,
    appliedAt: new Date(),
    updatedAt: new Date(),
  };
  
  beforeEach(() => {
    candidateService = new CandidateService(
      mockCandidateRepository,
      mockAssessmentRepository,
      mockEmailRepository
    );
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createCandidate', () => {
    it('should create a candidate successfully', async () => {
      // Arrange
      mockCandidateRepository.findByEmailAndPosition.mockResolvedValue(undefined);
      mockCandidateRepository.create.mockResolvedValue(mockCandidate);

      // Act
      const result = await candidateService.createCandidate(validCandidateData);

      // Assert
      expect(result).toEqual(mockCandidate);
      expect(mockCandidateRepository.findByEmailAndPosition).toHaveBeenCalledWith(
        validCandidateData.email,
        validCandidateData.position
      );
      expect(mockCandidateRepository.create).toHaveBeenCalledWith({
        ...validCandidateData,
        resumeSummary: null, // PDF extraction failed in this test scenario
        status: APPLICATION_STATUS.NEW,
      });
    });

    it('should throw error for duplicate application', async () => {
      // Arrange
      mockCandidateRepository.findByEmailAndPosition.mockResolvedValue(mockCandidate);

      // Act & Assert
      await expect(
        candidateService.createCandidate(validCandidateData)
      ).rejects.toThrow(AppError);

      expect(mockCandidateRepository.create).not.toHaveBeenCalled();
    });

    it('should handle PDF extraction failure gracefully', async () => {
      // Arrange
      const { extractTextFromPDF } = require('../../../server/services/pdfExtractor');
      extractTextFromPDF.mockRejectedValue(new Error('PDF parsing failed'));
      
      mockCandidateRepository.findByEmailAndPosition.mockResolvedValue(undefined);
      mockCandidateRepository.create.mockResolvedValue({
        ...mockCandidate,
        resumeSummary: null,
      });

      // Act
      const result = await candidateService.createCandidate(validCandidateData);

      // Assert
      expect(result.resumeSummary).toBeNull();
      expect(mockCandidateRepository.create).toHaveBeenCalledWith({
        ...validCandidateData,
        resumeSummary: null,
        status: APPLICATION_STATUS.NEW,
      });
    });
  });

  describe('updateCandidateStatus', () => {
    it('should update candidate status successfully', async () => {
      // Arrange
      const candidateId = 'candidate-123';
      const newStatus = APPLICATION_STATUS.REVIEWED;
      const updatedCandidate = { ...mockCandidate, status: newStatus };
      
      mockCandidateRepository.updateStatus.mockResolvedValue(updatedCandidate);

      // Act
      const result = await candidateService.updateCandidateStatus(candidateId, newStatus);

      // Assert
      expect(result).toEqual(updatedCandidate);
      expect(mockCandidateRepository.updateStatus).toHaveBeenCalledWith(candidateId, newStatus);
    });

    it('should throw error for invalid status', async () => {
      // Arrange
      const candidateId = 'candidate-123';
      const invalidStatus = 'invalid-status';

      // Act & Assert
      await expect(
        candidateService.updateCandidateStatus(candidateId, invalidStatus)
      ).rejects.toThrow(AppError);

      expect(mockCandidateRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('deleteCandidateWithRelatedData', () => {
    it('should delete candidate successfully', async () => {
      // Arrange
      const candidateId = 'candidate-123';
      mockCandidateRepository.findById.mockResolvedValue(mockCandidate);
      mockCandidateRepository.delete.mockResolvedValue();

      // Act
      await candidateService.deleteCandidateWithRelatedData(candidateId);

      // Assert
      expect(mockCandidateRepository.findById).toHaveBeenCalledWith(candidateId);
      expect(mockCandidateRepository.delete).toHaveBeenCalledWith(candidateId);
    });

    it('should throw error when candidate not found', async () => {
      // Arrange
      const candidateId = 'non-existent-id';
      mockCandidateRepository.findById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        candidateService.deleteCandidateWithRelatedData(candidateId)
      ).rejects.toThrow(AppError);

      expect(mockCandidateRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCandidates', () => {
    it('should return filtered candidates', async () => {
      // Arrange
      const filters = { position: 'Software Engineer', status: APPLICATION_STATUS.NEW };
      const mockCandidates = [mockCandidate];
      mockCandidateRepository.findAll.mockResolvedValue(mockCandidates as any);

      // Act
      const result = await candidateService.getCandidates(filters);

      // Assert
      expect(result).toEqual(mockCandidates);
      expect(mockCandidateRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });
});
