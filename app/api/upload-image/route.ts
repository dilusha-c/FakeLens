/**
 * Image Upload API Endpoint
 * Handles image uploads and performs OCR + AI detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage, analyzeImageContent } from '@/lib/imageAnalysis';
import { detectAIGeneratedImage } from '@/lib/aiImageDetector';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are supported.' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }
    
    console.log('Processing image:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Convert file to buffer and base64
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    
    // Compress large images (>1MB) to avoid timeout
    if (buffer.length > 1024 * 1024) {
      console.log('Large image detected, compressing...');
      try {
        const sharp = require('sharp');
        buffer = await sharp(buffer)
          .resize(1920, 1080, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toBuffer();
        console.log('Image compressed from', arrayBuffer.byteLength, 'to', buffer.length);
      } catch (e) {
        console.warn('Image compression failed, using original:', e);
        buffer = Buffer.from(arrayBuffer);
      }
    }
    
    const base64Image = buffer.toString('base64');
    
    console.log('Image converted to base64, length:', base64Image.length);
    
    // ============================================
    // PARALLEL ANALYSIS
    // ============================================
    console.log('Running parallel image analysis...');
    
    const [ocrResult, aiDetection, contentAnalysis] = await Promise.all([
      // 1. OCR Text Extraction
      extractTextFromImage(base64Image).catch(error => {
        console.error('OCR failed:', error);
        return {
          extractedText: '',
          confidence: 0,
          language: 'unknown',
        };
      }),
      
      // 2. AI Generation Detection
      detectAIGeneratedImage(base64Image, buffer).catch(error => {
        console.error('AI detection failed:', error);
        return {
          isAIGenerated: false,
          confidence: 0,
          reasons: ['AI detection failed'],
          warnings: [error.message],
          metadata: { hasEXIF: false },
        };
      }),
      
      // 3. Content Analysis (SafeSearch, Labels)
      analyzeImageContent(base64Image).catch(error => {
        console.error('Content analysis failed:', error);
        return {
          safeSearch: { adult: 'UNKNOWN', violence: 'UNKNOWN', medical: 'UNKNOWN' },
          labels: [],
          logos: [],
        };
      }),
    ]);
    
    console.log('Image analysis complete:', {
      textLength: ocrResult.extractedText.length,
      aiGenerated: aiDetection.isAIGenerated,
      labels: contentAnalysis.labels.length,
    });
    
    // Build response
    const response = {
      success: true,
      ocr: {
        text: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        language: ocrResult.language,
        hasText: ocrResult.extractedText.length > 0,
      },
      aiDetection: {
        isAIGenerated: aiDetection.isAIGenerated,
        confidence: aiDetection.confidence,
        likelihood: Math.round(aiDetection.confidence * 100),
        reasons: aiDetection.reasons,
        warnings: aiDetection.warnings,
        metadata: aiDetection.metadata,
      },
      content: {
        safeSearch: contentAnalysis.safeSearch,
        labels: contentAnalysis.labels.slice(0, 5), // Top 5 labels
        logos: contentAnalysis.logos,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
