import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { logger } from './logger';
import { ValidationService } from './validationService';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export class FileService {
  /**
   * Initialize upload directory
   */
  static async initializeUploadDir() {
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      logger.info('Created upload directory', { path: UPLOAD_DIR });
    }
  }

  /**
   * Configure multer for file uploads
   */
  static getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `cv-${uniqueSuffix}${extension}`);
      }
    });

    return multer({
      storage,
      fileFilter: (req, file, cb) => {
        try {
          ValidationService.validateFileUpload(file, ['application/pdf']);
          cb(null, true);
        } catch (error) {
          cb(error as Error, false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      }
    });
  }

  /**
   * Extract text from PDF file
   */
  static async extractPdfText(filePath: string): Promise<string> {
    try {
      logger.debug('Extracting text from PDF', { filePath });
      
      const fileBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(fileBuffer);
      
      const extractedText = pdfData.text.trim();
      
      if (!extractedText || extractedText.length < 50) {
        logger.warn('PDF text extraction resulted in minimal content', { 
          filePath, 
          textLength: extractedText.length 
        });
        return 'PDF content could not be extracted or is minimal.';
      }

      logger.debug('PDF text extracted successfully', { 
        filePath, 
        textLength: extractedText.length 
      });
      
      return extractedText;
    } catch (error) {
      logger.error('Failed to extract PDF text', { filePath, error });
      throw new Error('Failed to extract text from PDF file');
    }
  }

  /**
   * Delete file safely
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);
      
      // Security check: ensure file is within upload directory
      if (!fullPath.startsWith(path.resolve(UPLOAD_DIR))) {
        throw new Error('Invalid file path');
      }

      await fs.unlink(fullPath);
      logger.debug('File deleted successfully', { filePath: fullPath });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error('Failed to delete file', { filePath, error });
        throw error;
      }
      // File doesn't exist, which is fine
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(filePath: string) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      logger.error('Failed to get file stats', { filePath, error });
      return null;
    }
  }

  /**
   * Clean up old files (files older than 30 days)
   */
  static async cleanupOldFiles() {
    try {
      const files = await fs.readdir(UPLOAD_DIR);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(UPLOAD_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (stats.birthtime < thirtyDaysAgo) {
          await fs.unlink(filePath);
          logger.debug('Cleaned up old file', { file });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old files', { error });
    }
  }
}

// Initialize upload directory on module load
FileService.initializeUploadDir().catch(error => {
  logger.error('Failed to initialize upload directory', { error });
});