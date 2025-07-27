import fs from 'fs';
import { logger } from './logger';
import { AppError } from './errorHandler';

// Use dynamic import for pdf-parse to handle ES module compatibility
async function getPdfParser() {
  try {
    const pdfParse = await import('pdf-parse');
    return pdfParse.default;
  } catch (error) {
    logger.error('Failed to import pdf-parse', { error });
    throw new AppError('PDF parsing library not available', 500);
  }
}

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    logger.info('Starting PDF text extraction', { filePath });
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new AppError('PDF file not found', 404);
    }
    
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(filePath);
    logger.debug('PDF file read successfully', { fileSize: pdfBuffer.length });
    
    // Get PDF parser
    const pdf = await getPdfParser();
    
    // Extract text using pdf-parse
    const data = await pdf(pdfBuffer);
    
    // Clean up the extracted text
    const extractedText = data.text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    // Validate extracted content
    if (!extractedText || extractedText.length < 50) {
      throw new AppError('PDF appears to be empty or contains no readable text', 400);
    }
    
    logger.info('PDF text extraction successful', { 
      textLength: extractedText.length,
      wordCount: extractedText.split(/\s+/).length 
    });
    
    return extractedText;
  } catch (error: any) {
    logger.error('PDF text extraction failed', { error: error.message, filePath });
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(`Failed to extract text from PDF: ${error.message}`, 500);
  }
}

export function validatePDFContent(text: string): boolean {
  // Basic validation to ensure we have meaningful content
  const minLength = 50;
  const hasLetters = /[a-zA-Z]/.test(text);
  const hasWords = text.split(/\s+/).length > 10;
  
  return text.length >= minLength && hasLetters && hasWords;
}