import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { BadRequestError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface ParsedDocument {
  text: string;
  pageCount: number;
  metadata?: Record<string, any>;
  sections?: { title: string; content: string; page?: number }[];
}

export class DocumentParser {
  static async parse(filePath: string, mimeType: string, originalName: string): Promise<ParsedDocument> {
    const extension = originalName.split('.').pop()?.toLowerCase();

    try {
      if (mimeType === 'application/pdf' || extension === 'pdf') {
        return await this.parsePdf(filePath);
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        extension === 'docx'
      ) {
        return await this.parseDocx(filePath);
      } else if (
        mimeType.startsWith('text/') ||
        extension === 'txt' ||
        extension === 'md' ||
        extension === 'csv'
      ) {
        return await this.parseText(filePath);
      } else {
        throw new BadRequestError(`Unsupported file format: ${extension || mimeType}`);
      }
    } catch (error: any) {
      logger.error(`Error parsing document ${originalName}:`, error);
      throw new BadRequestError(`Failed to parse document: ${error.message}`);
    }
  }

  private static async parsePdf(filePath: string): Promise<ParsedDocument> {
    const dataBuffer = await fs.promises.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);

    return {
      text: pdfData.text,
      pageCount: pdfData.numpages || 1,
      metadata: pdfData.info || {},
    };
  }

  private static async parseDocx(filePath: string): Promise<ParsedDocument> {
    const dataBuffer = await fs.promises.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });

    // Estimate page count (~500 words per page)
    const words = result.value.split(/\s+/).length;
    const estimatedPages = Math.max(1, Math.ceil(words / 500));

    return {
      text: result.value,
      pageCount: estimatedPages,
      metadata: { messages: result.messages },
    };
  }

  private static async parseText(filePath: string): Promise<ParsedDocument> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const estimatedPages = Math.max(1, Math.ceil(lines.length / 50));

    return {
      text: content,
      pageCount: estimatedPages,
    };
  }
}
