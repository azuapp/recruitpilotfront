import fs from 'fs';

// Import pdf-parse using require to avoid ES module issues
const createRequire = (await import('module')).createRequire;
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(filePath);
    
    // Extract text using pdf-parse
    const data = await pdf(pdfBuffer);
    
    // Return the extracted text, cleaned up
    const extractedText = data.text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    if (!extractedText || extractedText.length < 50) {
      throw new Error('PDF appears to be empty or contains no readable text');
    }
    
    return extractedText;
  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message || 'Unknown error'}`);
  }
}

export function validatePDFContent(text: string): boolean {
  // Basic validation to ensure we have meaningful content
  const minLength = 50;
  const hasLetters = /[a-zA-Z]/.test(text);
  const hasWords = text.split(/\s+/).length > 10;
  
  return text.length >= minLength && hasLetters && hasWords;
}