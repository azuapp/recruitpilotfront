import fs from "fs";
import { logger } from "./logger";
import { AppError } from "./errorHandler";

// Type definition for pdf-parse
interface PDFData {
  text: string;
  numpages: number;
  info: any;
  metadata: any;
}

// Alternative PDF text extraction using buffer analysis as fallback
function extractTextFromBuffer(buffer: Buffer): string {
  try {
    // Basic text extraction for simple PDFs
    const text = buffer.toString("utf8");
    // Look for text patterns in PDF
    const textMatches = text.match(/BT\s+(.*?)\s+ET/g);
    if (textMatches) {
      return textMatches
        .map((match) => match.replace(/BT\s+|\s+ET/g, ""))
        .join(" ")
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    return "";
  } catch (error) {
    logger.warn("Buffer-based text extraction failed", { error });
    return "";
  }
}

// Use dynamic import for pdf-parse to avoid ENOENT test file issues

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    logger.info("Starting PDF text extraction", { filePath });

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new AppError("PDF file not found", 404);
    }

    // Read the PDF file
    const pdfBuffer = fs.readFileSync(filePath);
    logger.debug("PDF file read successfully", { fileSize: pdfBuffer.length });

    let extractedText = "";

    // Try pdf-parse first with dynamic import
    try {
      // @ts-ignore - Dynamic import to avoid pdf-parse test file issues
      const pdfParse = await import("pdf-parse");
      const data: PDFData = await pdfParse.default(pdfBuffer);
      extractedText = data.text;
      logger.info("PDF text extracted using pdf-parse", {
        textLength: extractedText.length,
      });
    } catch (pdfParseError: any) {
      logger.warn("pdf-parse failed, trying fallback method", {
        error: pdfParseError.message,
      });

      // Fallback to buffer analysis
      extractedText = extractTextFromBuffer(pdfBuffer);

      if (!extractedText) {
        throw new AppError(
          "Failed to extract text from PDF using all available methods",
          500
        );
      }

      logger.info("PDF text extracted using fallback method", {
        textLength: extractedText.length,
      });
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, " ") // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .trim();

    // Validate extracted content
    if (!extractedText || extractedText.length < 10) {
      throw new AppError(
        "PDF appears to be empty or contains no readable text",
        400
      );
    }

    logger.info("PDF text extraction successful", {
      textLength: extractedText.length,
      wordCount: extractedText.split(/\s+/).length,
    });

    return extractedText;
  } catch (error: any) {
    logger.error("PDF text extraction failed", {
      error: error.message,
      filePath,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      `Failed to extract text from PDF: ${error.message}`,
      500
    );
  }
}

export function validatePDFContent(text: string): boolean {
  // Basic validation to ensure we have meaningful content
  const minLength = 50;
  const hasLetters = /[a-zA-Z]/.test(text);
  const hasWords = text.split(/\s+/).length > 10;

  return text.length >= minLength && hasLetters && hasWords;
}
