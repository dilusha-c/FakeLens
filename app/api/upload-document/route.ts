import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface DocumentAnalysisResult {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    pageCount?: number;
    wordCount: number;
    charCount: number;
  };
  extractedAt: string;
}

async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    // Use pdf-parse-fork which is compatible with Next.js
    const pdfParse = require('pdf-parse-fork');
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF document');
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX document');
  }
}

async function extractTextFromTXT(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('document') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No document provided' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Document size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    let extractedText = '';
    let pageCount: number | undefined;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text based on file type
    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      const pdfResult = await extractTextFromPDF(buffer);
      extractedText = pdfResult.text;
      pageCount = pdfResult.pageCount;
    } else if (
      fileName.endsWith('.docx') ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      extractedText = await extractTextFromDOCX(buffer);
    } else if (fileName.endsWith('.doc') || fileType === 'application/msword') {
      return NextResponse.json(
        { error: 'Legacy .doc format not supported. Please convert to .docx' },
        { status: 400 }
      );
    } else if (fileName.endsWith('.txt') || fileType === 'text/plain') {
      extractedText = await extractTextFromTXT(buffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported document format. Please upload PDF, DOCX, or TXT files.' },
        { status: 400 }
      );
    }

    // Clean up extracted text
    extractedText = extractedText.trim();

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json(
        { error: 'No readable text found in document' },
        { status: 400 }
      );
    }

    // Calculate statistics
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = extractedText.length;

    const result: DocumentAnalysisResult = {
      text: extractedText,
      metadata: {
        fileName: file.name,
        fileType: fileType || 'unknown',
        fileSize: file.size,
        pageCount,
        wordCount,
        charCount,
      },
      extractedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process document' },
      { status: 500 }
    );
  }
}
