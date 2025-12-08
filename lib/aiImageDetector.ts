/**
 * AI-Generated Image Detection
 * Uses Sightengine API for professional ML-powered detection
 * Falls back to heuristic analysis if API is unavailable
 */

import axios from 'axios';

const SIGHTENGINE_API_USER = process.env.SIGHTENGINE_API_USER;
const SIGHTENGINE_API_SECRET = process.env.SIGHTENGINE_API_SECRET;
const SIGHTENGINE_API_URL = 'https://api.sightengine.com/1.0/check.json';

export interface AIImageAnalysis {
  isAIGenerated: boolean;
  confidence: number; // 0-1
  reasons: string[];
  warnings: string[];
  metadata: {
    hasEXIF: boolean;
    software?: string;
    creationDate?: string;
    cameraModel?: string;
  };
}

/**
 * Analyze image for AI generation indicators using Sightengine API
 * @param imageBase64 Base64 encoded image
 * @param imageBuffer Optional buffer for metadata analysis
 * @returns Analysis results
 */
export async function detectAIGeneratedImage(
  imageBase64: string,
  imageBuffer?: Buffer
): Promise<AIImageAnalysis> {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let aiScore = 0; // 0-100 scale
  
  // Convert base64 to buffer if not provided
  const buffer = imageBuffer || Buffer.from(imageBase64, 'base64');
  
  // ============================================
  // 1. SIGHTENGINE API - ML-POWERED DETECTION
  // ============================================
  let sightengineResult: any = null;
  
  if (SIGHTENGINE_API_USER && SIGHTENGINE_API_SECRET) {
    try {
      console.log('Using Sightengine API for AI detection...');
      sightengineResult = await callSightengineAPI(imageBase64);
      
      if (sightengineResult) {
        console.log('Sightengine full response:', JSON.stringify(sightengineResult, null, 2));
        
        // Sightengine returns score in type.ai_generated (0-1)
        const aiProbability = sightengineResult.type?.ai_generated || 0;
        aiScore = Math.round(aiProbability * 100);
        
        if (aiProbability > 0.7) {
          reasons.push(`Sightengine AI detection: ${Math.round(aiProbability * 100)}% confidence - High likelihood of AI generation`);
        } else if (aiProbability > 0.4) {
          warnings.push(`Sightengine AI detection: ${Math.round(aiProbability * 100)}% confidence - Moderate likelihood`);
        } else if (aiProbability > 0) {
          warnings.push(`Sightengine AI detection: ${Math.round(aiProbability * 100)}% confidence - Low likelihood`);
        }
      }
    } catch (error: any) {
      console.error('Sightengine API error:', error.message);
      warnings.push('Sightengine API unavailable - using fallback detection');
    }
  } else {
    warnings.push('Sightengine API not configured - using heuristic detection only');
  }
  
  // ============================================
  // 2. METADATA ANALYSIS (Always run as backup)
  // ============================================
  const metadata = analyzeImageMetadata(buffer);
  
  // Check for AI generation software in metadata
  if (metadata.software) {
    const aiSoftware = [
      'midjourney', 'dall-e', 'dalle', 'stable diffusion', 'stablediffusion',
      'dreamstudio', 'leonardo', 'firefly', 'adobe firefly', 'canva ai',
      'bing image creator', 'craiyon', 'artbreeder', 'nightcafe',
    ];
    
    const softwareLower = metadata.software.toLowerCase();
    if (aiSoftware.some(ai => softwareLower.includes(ai))) {
      aiScore = Math.max(aiScore, 85); // Override if metadata confirms AI
      reasons.push(`Metadata indicates AI generation software: ${metadata.software}`);
    }
  }
  
  // If Sightengine wasn't used, run heuristic analysis
  if (!sightengineResult) {
    // Lack of camera EXIF data (suspicious for photos)
    if (!metadata.hasEXIF || !metadata.cameraModel) {
      aiScore += 10;
      warnings.push('Missing camera EXIF data - common in AI-generated images');
    }
    
    // Recent creation without camera info
    if (metadata.creationDate && !metadata.cameraModel) {
      aiScore += 5;
      warnings.push('Image created without camera metadata');
    }
    
    // Visual artifact detection
    const artifactScore = analyzeVisualArtifacts(imageBase64);
    aiScore += artifactScore;
    
    if (artifactScore > 20) {
      reasons.push('Image shows visual artifacts common in AI generation');
    }
    
    // File size / quality analysis
    const sizeAnalysis = analyzeFileCharacteristics(buffer, imageBase64);
    
    if (sizeAnalysis.suspiciousSize) {
      aiScore += 10;
      warnings.push('File size pattern matches AI-generated images');
    }
    
    if (sizeAnalysis.perfectSquare) {
      aiScore += 15;
      warnings.push('Perfect square dimensions (512x512, 1024x1024) - common in AI generators');
    }
  }
  
  // ============================================
  // FINAL VERDICT
  // ============================================
  const confidence = Math.min(aiScore / 100, 0.95); // Cap at 95%
  const isAIGenerated = aiScore >= 50; // Threshold: 50%
  
  if (isAIGenerated) {
    reasons.unshift(`High likelihood of AI generation (score: ${aiScore}/100)`);
  } else if (aiScore >= 30) {
    warnings.unshift(`Moderate likelihood of AI generation (score: ${aiScore}/100)`);
  } else {
    warnings.unshift(`Low likelihood of AI generation (score: ${aiScore}/100)`);
  }
  
  return {
    isAIGenerated,
    confidence,
    reasons,
    warnings,
    metadata,
  };
}

/**
 * Call Sightengine API for AI-generated image detection
 */
async function callSightengineAPI(imageBase64: string): Promise<any> {
  try {
    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Build multipart form data manually for Node.js
    const boundary = '----SightengineFormBoundary' + Math.random().toString(36).substr(2, 9);
    const parts = [];
    
    // Add form fields
    parts.push(`--${boundary}`);
    parts.push('Content-Disposition: form-data; name="models"');
    parts.push('');
    parts.push('genai');
    
    parts.push(`--${boundary}`);
    parts.push('Content-Disposition: form-data; name="api_user"');
    parts.push('');
    parts.push(SIGHTENGINE_API_USER!);
    
    parts.push(`--${boundary}`);
    parts.push('Content-Disposition: form-data; name="api_secret"');
    parts.push('');
    parts.push(SIGHTENGINE_API_SECRET!);
    
    parts.push(`--${boundary}`);
    parts.push('Content-Disposition: form-data; name="media"; filename="image.jpg"');
    parts.push('Content-Type: image/jpeg');
    parts.push('');
    
    // Build the complete body
    const header = Buffer.from(parts.join('\r\n') + '\r\n');
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, imageBuffer, footer]);
    
    const response = await axios.post(SIGHTENGINE_API_URL, body, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
    });
    
    if (response.data.status === 'success') {
      console.log('Sightengine API response:', response.data);
      return response.data;
    } else {
      throw new Error(`Sightengine API error: ${response.data.error?.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    if (error.response) {
      console.error('Sightengine API error response:', error.response.data);
    }
    // Log but don't throw - will use fallback
    console.error('Sightengine API failed:', error.message);
    return null;
  }
}

/**
 * Analyze image metadata for AI generation clues
 */
function analyzeImageMetadata(buffer: Buffer): AIImageAnalysis['metadata'] {
  const metadata: AIImageAnalysis['metadata'] = {
    hasEXIF: false,
  };
  
  try {
    // Simple metadata extraction (checking for common markers)
    const bufferStr = buffer.toString('binary', 0, Math.min(5000, buffer.length));
    
    // Check for EXIF marker
    if (bufferStr.includes('Exif') || bufferStr.includes('\xff\xe1')) {
      metadata.hasEXIF = true;
    }
    
    // Look for software tags
    const softwareMatch = bufferStr.match(/Software[^\x00]{1,100}/);
    if (softwareMatch) {
      metadata.software = softwareMatch[0].replace('Software', '').trim();
    }
    
    // Look for camera model
    const cameraMatch = bufferStr.match(/(?:Camera|Model)[^\x00]{1,50}/);
    if (cameraMatch) {
      metadata.cameraModel = cameraMatch[0].replace(/(?:Camera|Model)/, '').trim();
    }
    
    // Look for creation date
    const dateMatch = bufferStr.match(/DateTime[^\x00]{1,30}/);
    if (dateMatch) {
      metadata.creationDate = dateMatch[0].replace('DateTime', '').trim();
    }
  } catch (error) {
    console.error('Metadata extraction error:', error);
  }
  
  return metadata;
}

/**
 * Analyze visual artifacts (heuristic-based)
 * In a production system, this would use ML models
 */
function analyzeVisualArtifacts(imageBase64: string): number {
  let score = 0;
  
  // Check for common AI generation patterns in base64 size
  // AI-generated images often have specific compression patterns
  
  // Very uniform base64 length suggests synthetic origin
  if (imageBase64.length % 1024 === 0) {
    score += 5;
  }
  
  // Check for common AI image dimensions (encoded in headers)
  const dimensionPatterns = [
    '512x512', '1024x1024', '768x768', '1536x1536',
    '512x768', '768x512', // Portrait/landscape AI presets
  ];
  
  // This is a placeholder - real implementation would decode image dimensions
  // For now, we're using heuristics based on file size
  const sizeKB = (imageBase64.length * 0.75) / 1024; // Rough size estimation
  
  if (sizeKB >= 200 && sizeKB <= 300) {
    score += 10; // Common AI generation size range
  }
  
  return score;
}

/**
 * Analyze file characteristics
 */
function analyzeFileCharacteristics(
  buffer: Buffer,
  imageBase64: string
): { suspiciousSize: boolean; perfectSquare: boolean } {
  const fileSize = buffer.length;
  
  // AI generators often produce files in specific size ranges
  const suspiciousSizes = [
    [100000, 150000],   // ~100-150KB (512x512)
    [200000, 350000],   // ~200-350KB (1024x1024)
    [400000, 600000],   // ~400-600KB (1536x1536)
  ];
  
  const suspiciousSize = suspiciousSizes.some(
    ([min, max]) => fileSize >= min && fileSize <= max
  );
  
  // Check for perfect square dimensions (would need actual image decoding)
  // This is a placeholder - real implementation would decode PNG/JPEG headers
  const perfectSquare = false; // TODO: Implement dimension detection
  
  return { suspiciousSize, perfectSquare };
}

/**
 * Placeholder for reverse image search
 * Future implementation: Use Google Reverse Image Search API or TinEye
 */
export async function reverseImageSearch(imageBase64: string): Promise<{
  foundSources: Array<{ url: string; title: string; date?: string }>;
  isOriginal: boolean;
}> {
  // TODO: Implement reverse image search
  // Options:
  // 1. Google Reverse Image Search API
  // 2. TinEye API
  // 3. Bing Visual Search API
  
  return {
    foundSources: [],
    isOriginal: false,
  };
}
