/**
 * Sri Lanka-specific fake news detection enhancements
 * Validates local sources, checks fact-checkers, and detects rumor patterns
 */

import axios from 'axios';

// ============================================
// 1) TRUSTED SRI LANKAN NEWS SOURCES
// ============================================

const SRI_LANKA_TRUSTED_SOURCES = [
  'newsfirst.lk',
  'adaderana.lk',
  'dailymirror.lk',
  'economynext.com',
  'moe.gov.lk',      // Ministry of Education
  'gov.lk',          // Government official domain
  'dailynews.lk',
  'sundaytimes.lk',
  'island.lk',
  'colombogazette.com',
  'ft.lk',           // Financial Times Sri Lanka
  'newswire.lk',
  'hirunews.lk',
  'newswire.lk',
  'ada.lk',
  'lankadeepa.lk',
  'divaina.lk',
  'silumina.lk',
  'thinakaran.lk',   // Tamil news
  'virakesari.lk',   // Tamil news
  'president.gov.lk',
  'police.lk',
  'health.gov.lk',
  'cbsl.gov.lk',     // Central Bank
];

/**
 * Validates if URLs come from trusted Sri Lankan sources
 * @param urls Array of URLs to check
 * @returns Score adjustment (-0.2 to 0.2) and count of trusted sources
 */
export function validateSriLankaSources(urls: string[]): {
  scoreAdjustment: number;
  trustedCount: number;
  isSriLankanContent: boolean;
} {
  let trustedCount = 0;
  
  for (const url of urls) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      if (SRI_LANKA_TRUSTED_SOURCES.some(trusted => domain.includes(trusted))) {
        trustedCount++;
      }
    } catch {
      // Invalid URL, skip
    }
  }
  
  const isSriLankanContent = trustedCount > 0;
  let scoreAdjustment = 0;
  
  if (trustedCount >= 2) {
    // Multiple trusted Sri Lankan sources confirm → likely real
    scoreAdjustment = -0.15;
  } else if (trustedCount === 1) {
    // One trusted source → slightly credible
    scoreAdjustment = -0.05;
  } else if (isSriLankanContent && trustedCount === 0) {
    // No trusted Sri Lankan sources despite local content → suspicious
    scoreAdjustment = 0.1;
  }
  
  return { scoreAdjustment, trustedCount, isSriLankanContent };
}

// ============================================
// 2) LOCAL FACT-CHECKER INTEGRATION
// ============================================

const SRI_LANKA_FACT_CHECKERS = [
  'factcheck.lk',
  'watchdog.team',
  'afp.com',         // AFP fact checks for Sri Lanka
];

/**
 * Check if claim has been debunked by local fact-checkers
 * Note: This is a basic implementation. Full integration would require:
 * - API access to fact-checker databases
 * - Web scraping with proper error handling
 * - Caching to avoid repeated lookups
 * 
 * @param claimText The claim to check
 * @returns Score adjustment and debunk status
 */
export async function checkLocalFactCheckers(claimText: string): Promise<{
  scoreAdjustment: number;
  debunked: boolean;
  source?: string;
}> {
  // For now, return neutral - implement full scraping/API calls when needed
  // TODO: Add actual fact-checker API integration
  // Example implementation would involve:
  // 1. Search fact-checker sites for similar claims
  // 2. Use NLP/similarity matching to find relevant debunks
  // 3. Return boosted fake score if debunked
  
  return {
    scoreAdjustment: 0,
    debunked: false,
  };
  
  // Future implementation example:
  // try {
  //   const response = await axios.get(`https://factcheck.lk/api/search?q=${encodeURIComponent(claimText)}`);
  //   if (response.data.debunked) {
  //     return { scoreAdjustment: 0.3, debunked: true, source: 'factcheck.lk' };
  //   }
  // } catch (error) {
  //   console.error('Fact-checker lookup failed:', error);
  // }
}

// ============================================
// 3) SINHALA & TAMIL LANGUAGE DETECTION
// ============================================

/**
 * Detects Sinhala, Tamil, or English in text
 * @param text Input text
 * @returns Language code: 'si' | 'ta' | 'en' | 'mixed'
 */
export function detectSinhalaTamilLanguage(text: string): 'si' | 'ta' | 'en' | 'mixed' {
  const sinhalaRegex = /[\u0D80-\u0DFF]/;  // Sinhala Unicode range
  const tamilRegex = /[\u0B80-\u0BFF]/;    // Tamil Unicode range
  
  const hasSinhala = sinhalaRegex.test(text);
  const hasTamil = tamilRegex.test(text);
  
  if (hasSinhala && hasTamil) return 'mixed';
  if (hasSinhala) return 'si';
  if (hasTamil) return 'ta';
  return 'en';
}

/**
 * Translates Sinhala/Tamil text to English using Gemini API
 * @param text Text to translate
 * @param fromLang Source language
 * @returns Translated English text
 */
export async function translateToEnglish(text: string, fromLang: 'si' | 'ta'): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured for translation');
    return text; // Return original if no API key
  }
  
  const langName = fromLang === 'si' ? 'Sinhala' : 'Tamil';
  const prompt = `Translate the following ${langName} text to English. Provide only the translation, no explanations:\n\n${text}`;
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    
    if (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text.trim();
    }
  } catch (error) {
    console.error('Translation failed:', error);
  }
  
  return text; // Return original on failure
}

/**
 * Detects language and translates if needed
 * @param text Input text
 * @returns Object with detected language and English text
 */
export async function detectSinhalaTamilAndTranslate(text: string): Promise<{
  originalLanguage: 'si' | 'ta' | 'en' | 'mixed';
  englishText: string;
  wasTranslated: boolean;
}> {
  const originalLanguage = detectSinhalaTamilLanguage(text);
  
  if (originalLanguage === 'si' || originalLanguage === 'ta') {
    const englishText = await translateToEnglish(text, originalLanguage);
    return {
      originalLanguage,
      englishText,
      wasTranslated: englishText !== text,
    };
  }
  
  return {
    originalLanguage,
    englishText: text,
    wasTranslated: false,
  };
}

// ============================================
// 4) SRI LANKA RUMOR PATTERN DETECTION
// ============================================

/**
 * Detects WhatsApp-style viral rumor patterns common in Sri Lanka
 * @param text Text to analyze
 * @returns Score adjustment based on detected patterns
 */
export function detectSriLankaRumorPatterns(text: string): {
  scoreAdjustment: number;
  detectedPatterns: string[];
} {
  const detectedPatterns: string[] = [];
  let scoreAdjustment = 0;
  
  // Urgent sharing phrases (Sinhala, Tamil, English)
  const urgentPhrases = [
    // English
    'share fast', 'pls share', 'please share', 'forward immediately',
    'urgent', 'breaking news', 'must share', 'share this',
    
    // Sinhala
    'අනතුරයි',           // Danger
    'යාලුවනෙ',          // Friends
    'හැමෝම බලන්න',      // Everyone look
    'බෙදාගන්න',         // Share
    'ඉක්මනට',           // Quickly
    'වැදගත්',            // Important
    
    // Tamil
    'விரைவாக பகிரவும்',   // Share quickly
    'அவசரம்',            // Urgent
    'முக்கியம்',          // Important
    'பகிருங்கள்',        // Please share
  ];
  
  const lowerText = text.toLowerCase();
  
  // Check for urgent phrases
  for (const phrase of urgentPhrases) {
    if (lowerText.includes(phrase.toLowerCase()) || text.includes(phrase)) {
      detectedPatterns.push(`Urgent sharing phrase: "${phrase}"`);
      scoreAdjustment += 0.1;
      break; // Only count once
    }
  }
  
  // Check for excessive uppercase (screaming)
  const uppercaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (uppercaseRatio > 0.6 && text.length > 20) {
    detectedPatterns.push('Excessive uppercase text (screaming)');
    scoreAdjustment += 0.1;
  }
  
  // Check for very short dramatic claims
  if (text.length < 80 && text.includes('!')) {
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount >= 2) {
      detectedPatterns.push('Very short with multiple exclamation marks');
      scoreAdjustment += 0.08;
    }
  }
  
  // Check for WhatsApp forward indicators
  const forwardIndicators = [
    '*Forwarded*',
    '*FORWARDED*',
    'forwarded message',
    'ස්ථිර කරන්න',      // Sinhala: Forward
    'பகிர்ந்து',         // Tamil: Forwarded
  ];
  
  for (const indicator of forwardIndicators) {
    if (text.includes(indicator) || lowerText.includes(indicator.toLowerCase())) {
      detectedPatterns.push('WhatsApp forward indicator detected');
      scoreAdjustment += 0.05;
      break;
    }
  }
  
  // Check for fake authority claims
  const fakeAuthority = [
    'doctor said', 'doctors say', 'government confirmed', 'official announcement',
    'වෛද්‍යවරු කියයි',   // Sinhala: Doctors say
    'රජය පවසයි',         // Sinhala: Government says
    'மருத்துவர்கள்',     // Tamil: Doctors
  ];
  
  for (const claim of fakeAuthority) {
    if (lowerText.includes(claim.toLowerCase()) || text.includes(claim)) {
      // Only flag if no source is provided
      if (!text.includes('http') && !text.includes('source')) {
        detectedPatterns.push('Vague authority claim without source');
        scoreAdjustment += 0.08;
        break;
      }
    }
  }
  
  // Cap maximum adjustment from rumor patterns
  scoreAdjustment = Math.min(scoreAdjustment, 0.3);
  
  return {
    scoreAdjustment,
    detectedPatterns,
  };
}

// ============================================
// COMBINED SRI LANKA ANALYSIS
// ============================================

/**
 * Detects Sri Lankan location-specific context
 * Boosts confidence when local context matches
 */
export function detectSriLankanContext(text: string): {
  contextScore: number;
  detectedContext: string[];
} {
  const detectedContext: string[] = [];
  let contextScore = 0;
  
  // Sri Lankan cities/locations
  const locations = [
    'colombo', 'kandy', 'galle', 'jaffna', 'trincomalee',
    'anuradhapura', 'polonnaruwa', 'matara', 'negombo',
    'කොළඹ', 'මහනුවර', 'ගාල්ල', 'යාපනය',
    'கொழும்பு', 'கண்டி', 'யாழ்ப்பாணம்',
  ];
  
  // Government bodies/institutions
  const institutions = [
    'parliament', 'president', 'ministry', 'minister',
    'police', 'army', 'navy', 'air force',
    'central bank', 'cbsl', 'පාර්ලිමේන්තුව', 'ජනාධිපති',
    'பாராளுமன்றம்', 'அமைச்சர்',
  ];
  
  const lowerText = text.toLowerCase();
  
  // Check for Sri Lankan locations
  for (const location of locations) {
    if (lowerText.includes(location.toLowerCase()) || text.includes(location)) {
      detectedContext.push(`Sri Lankan location mentioned: ${location}`);
      contextScore += 0.05;
    }
  }
  
  // Check for institutions
  for (const institution of institutions) {
    if (lowerText.includes(institution.toLowerCase()) || text.includes(institution)) {
      detectedContext.push(`Sri Lankan institution mentioned: ${institution}`);
      contextScore += 0.03;
    }
  }
  
  return { contextScore, detectedContext };
}

/**
 * Runs all Sri Lanka-specific checks and returns combined score adjustment
 * @param text Claim text
 * @param sourceUrls URLs found in search results
 * @returns Combined analysis results
 */
export async function analyzeSriLankaContent(
  text: string,
  sourceUrls: string[]
): Promise<{
  totalScoreAdjustment: number;
  details: {
    sourceValidation: ReturnType<typeof validateSriLankaSources>;
    rumorPatterns: ReturnType<typeof detectSriLankaRumorPatterns>;
    translation: Awaited<ReturnType<typeof detectSinhalaTamilAndTranslate>>;
    factCheckerResult: Awaited<ReturnType<typeof checkLocalFactCheckers>>;
    localContext: ReturnType<typeof detectSriLankanContext>;
  };
}> {
  // Run all checks in parallel where possible
  const [sourceValidation, rumorPatterns, translation, factCheckerResult, localContext] = await Promise.all([
    Promise.resolve(validateSriLankaSources(sourceUrls)),
    Promise.resolve(detectSriLankaRumorPatterns(text)),
    detectSinhalaTamilAndTranslate(text),
    checkLocalFactCheckers(text),
    Promise.resolve(detectSriLankanContext(text)),
  ]);
  
  // Calculate total score adjustment
  const totalScoreAdjustment = 
    sourceValidation.scoreAdjustment +
    rumorPatterns.scoreAdjustment +
    factCheckerResult.scoreAdjustment;
  // Note: localContext is informational, doesn't adjust score
  
  return {
    totalScoreAdjustment,
    details: {
      sourceValidation,
      rumorPatterns,
      translation,
      factCheckerResult,
      localContext,
    },
  };
}
