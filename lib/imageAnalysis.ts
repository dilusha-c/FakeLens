/**
 * Image Analysis using Google Cloud Vision API
 * Extracts text from images using OCR
 */

import axios from 'axios';

const VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export interface OCRResult {
  extractedText: string;
  confidence: number;
  language: string;
  fullResponse?: any;
}

/**
 * Extract text from image using Google Cloud Vision API OCR
 * @param imageBase64 Base64 encoded image string (without data:image/... prefix)
 * @returns Extracted text and metadata
 */
export async function extractTextFromImage(imageBase64: string): Promise<OCRResult> {
  if (!VISION_API_KEY) {
    throw new Error('Google Vision API key not configured');
  }

  try {
    const response = await axios.post(
      `${VISION_API_URL}?key=${VISION_API_KEY}`,
      {
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const annotations = response.data.responses[0];
    
    if (!annotations.textAnnotations || annotations.textAnnotations.length === 0) {
      return {
        extractedText: '',
        confidence: 0,
        language: 'unknown',
      };
    }

    // First annotation contains full text
    const fullTextAnnotation = annotations.fullTextAnnotation;
    const extractedText = fullTextAnnotation?.text || annotations.textAnnotations[0].description || '';
    
    // Calculate average confidence from all text annotations
    const confidences = annotations.textAnnotations
      .map((ann: any) => ann.confidence || 0.9) // Default to 0.9 if not provided
      .filter((c: number) => c > 0);
    
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((sum: number, c: number) => sum + c, 0) / confidences.length
      : 0.9;

    // Detect language
    const detectedLanguage = fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages?.[0]?.languageCode || 'unknown';

    return {
      extractedText: extractedText.trim(),
      confidence: avgConfidence,
      language: detectedLanguage,
      fullResponse: annotations,
    };
  } catch (error: any) {
    console.error('Vision API error:', error.response?.data || error.message);
    // Graceful fallback for billing disabled
    if (error.response?.status === 403 || error.message?.includes('billing')) {
      console.warn('Vision API billing not enabled - OCR disabled, using Sightengine only');
      return {
        extractedText: '',
        confidence: 0,
        language: 'unknown',
      };
    }
    throw new Error(`OCR failed: ${error.message}`);
  }
}

/**
 * Analyze image for manipulation and SafeSearch content
 * @param imageBase64 Base64 encoded image string
 * @returns Analysis results
 */
export async function analyzeImageContent(imageBase64: string): Promise<{
  safeSearch: {
    adult: string;
    violence: string;
    medical: string;
  };
  labels: Array<{ description: string; score: number }>;
  logos: Array<{ description: string; score: number }>;
}> {
  if (!VISION_API_KEY) {
    throw new Error('Google Vision API key not configured');
  }

  try {
    const response = await axios.post(
      `${VISION_API_URL}?key=${VISION_API_KEY}`,
      {
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              { type: 'SAFE_SEARCH_DETECTION' },
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'LOGO_DETECTION', maxResults: 5 },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const annotations = response.data.responses[0];
    
    return {
      safeSearch: {
        adult: annotations.safeSearchAnnotation?.adult || 'UNKNOWN',
        violence: annotations.safeSearchAnnotation?.violence || 'UNKNOWN',
        medical: annotations.safeSearchAnnotation?.medical || 'UNKNOWN',
      },
      labels: annotations.labelAnnotations || [],
      logos: annotations.logoAnnotations || [],
    };
  } catch (error: any) {
    console.error('Vision API content analysis error:', error.response?.data || error.message);
    // Graceful fallback for billing disabled or any other error
    if (error.response?.status === 403 || error.message?.includes('billing')) {
      console.warn('Vision API billing not enabled - content analysis disabled');
    }
    return {
      safeSearch: { adult: 'UNKNOWN', violence: 'UNKNOWN', medical: 'UNKNOWN' },
      labels: [],
      logos: [],
    };
  }
}
