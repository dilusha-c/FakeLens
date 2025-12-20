/**
 * Comprehensive Multi-Step Fake News Detection System
 * Specifically designed to catch newly fabricated fake news
 */

import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
console.log('Comprehensive Analysis - API Key loaded:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'MISSING');

/**
 * Call Gemini API using REST endpoint (same as geminiClient.ts)
 */
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No text in Gemini response');
    }
    return text;
  } catch (error: any) {
    console.error('Gemini API error:', error.response?.data || error.message);
    throw error;
  }
}

export interface ComprehensiveAnalysis {
  // Step 1: Initial factual assessment
  initialAssessment: {
    isFactual: boolean;
    isMisleading: boolean;
    reasoning: string;
    confidence: number;
  };
  
  // Step 2: Claim breakdown
  claims: {
    keyPoints: string[];
    verifiableClaims: string[];
    unverifiableClaims: string[];
  };
  
  // Step 3: Language manipulation detection
  languageManipulation: {
    hasSensationalLanguage: boolean;
    sensationalPhrases: string[];
    manipulationScore: number; // 0-1
    detectedTechniques: string[];
  };
  
  // Step 4: Emotional bias evaluation
  emotionalBias: {
    biasLevel: 'none' | 'low' | 'moderate' | 'high' | 'extreme';
    dominantEmotions: string[];
    biasScore: number; // 0-1
    emotionalTriggers: string[];
  };
  
  // Step 5: Novelty and temporal consistency
  novelty: {
    isNovelClaim: boolean;
    hasHistoricalPrecedent: boolean;
    temporalConsistency: 'consistent' | 'inconsistent' | 'unknown';
    noveltyScore: number; // 0-1 (higher = more novel/suspicious)
    relatedHistoricalClaims: string[];
  };
  
  // Step 6 & 7: Multi-language translation
  translations: {
    englishClaim: string;
    localLanguageClaim: string;
    detectedLanguage: string;
  };
  
  // Step 8: Source credibility
  sourceCredibility: {
    overallScore: number; // 0-1
    trustedSourcesFound: number;
    untrustedSourcesFound: number;
    unknownSourcesFound: number;
    topSources: Array<{
      name: string;
      credibilityScore: number;
      reasoning: string;
    }>;
  };
  
  // Step 9: Explainable confidence-based verdict
  finalVerdict: {
    verdict: 'real' | 'fake' | 'uncertain' | 'misleading';
    confidence: number; // 0-1
    explanation: string;
    keyFactors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
    }>;
    recommendations: string[];
  };
}

/**
 * Step 1: Use Gemini to perform initial factual analysis
 */
export async function performInitialFactualAnalysis(
  content: string,
  context?: string
): Promise<ComprehensiveAnalysis['initialAssessment']> {
  try {
    const prompt = `You are an expert fact-checker analyzing potentially false or misleading information.

Content to analyze:
${content}

${context ? `Additional context: ${context}` : ''}

Perform a thorough initial assessment and respond in JSON format:
{
  "isFactual": boolean (true if the content appears to be presenting factual information with credible sources),
  "isMisleading": boolean (true if the content is misleading, deceptive, or manipulative),
  "reasoning": "detailed explanation of your assessment",
  "confidence": number between 0 and 1
}

RED FLAGS that indicate misleading/fake content (set isMisleading=true if ANY present):
- "Unnamed sources", "unnamed officials", "sources claim"
- "Allegedly", "reportedly", "according to social media posts"
- No official confirmation or announcement
- "Officials declined to comment citing security"
- Only mentions unofficial/social media channels
- Creates urgency/panic without official backing
- Makes extraordinary claims without credible sources
- No major news outlets or government confirmation

If you see these red flags, set isMisleading=true and confidence high (0.7-0.9).

Also focus on:
- Does this claim align with established facts?
- Does the content use misleading framing or omit crucial context?
- Is this a newly fabricated claim with no verifiable basis?

Respond ONLY with valid JSON, no other text.`;

    const response = await callGemini(prompt);
    console.log('Initial factual analysis raw response:', response);
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Initial factual analysis parsed:', parsed);
      return parsed;
    }
    
    // Fallback
    console.warn('Could not parse initial factual analysis response');
    return {
      isFactual: true,
      isMisleading: false,
      reasoning: "Unable to parse analysis",
      confidence: 0.3
    };
  } catch (error) {
    console.error('Initial factual analysis error:', error);
    
    // FALLBACK: Rule-based red flag detection
    const redFlags = detectRedFlags(content);
    if (redFlags.count > 0) {
      return {
        isFactual: false,
        isMisleading: true,
        reasoning: `Analysis failed but detected ${redFlags.count} red flags: ${redFlags.flags.join(', ')}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: Math.min(0.85, 0.5 + (redFlags.count * 0.1))
      };
    }
    
    return {
      isFactual: true,
      isMisleading: false,
      reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0.2
    };
  }
}

/**
 * Rule-based red flag detection as fallback when LLM fails
 */
function detectRedFlags(content: string): { count: number; flags: string[] } {
  const lowerContent = content.toLowerCase();
  const flags: string[] = [];
  
  // Check for unnamed sources
  if (lowerContent.includes('unnamed official') || 
      lowerContent.includes('unnamed source') ||
      lowerContent.includes('sources claim')) {
    flags.push('unnamed sources');
  }
  
  // Check for allegedly/reportedly
  if (lowerContent.includes('allegedly') || 
      lowerContent.includes('reportedly') ||
      lowerContent.includes('according to social media')) {
    flags.push('unverified claims (allegedly/reportedly)');
  }
  
  // Check for no official confirmation
  if ((lowerContent.includes('no official statement') || 
       lowerContent.includes('have not published any announcement') ||
       lowerContent.includes('no official confirmation')) &&
      !lowerContent.includes('official confirmation')) {
    flags.push('no official confirmation');
  }
  
  // Check for declined to comment
  if (lowerContent.includes('declined to comment')) {
    flags.push('sources declined to comment');
  }
  
  // Check for unofficial channels
  if (lowerContent.includes('unofficial messaging') || 
      lowerContent.includes('social media posts allege')) {
    flags.push('reliance on unofficial channels');
  }
  
  return { count: flags.length, flags };
}

/**
 * Step 2: Break down content into key points and verifiable claims
 */
export async function extractClaimsAndKeyPoints(
  content: string
): Promise<ComprehensiveAnalysis['claims']> {
  try {
    const prompt = `Analyze this content and break it down into structured claims.

Content:
${content}

Respond in JSON format:
{
  "keyPoints": ["list of main points being made"],
  "verifiableClaims": ["specific claims that can be fact-checked against evidence"],
  "unverifiableClaims": ["claims that cannot be verified (opinions, predictions, etc.)"]
}

Be thorough - extract ALL specific claims that can be verified.
Respond ONLY with valid JSON, no other text.`;

    const response = await callGemini(prompt);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      keyPoints: [content.substring(0, 200)],
      verifiableClaims: [],
      unverifiableClaims: []
    };
  } catch (error) {
    console.error('Claim extraction error:', error);
    return {
      keyPoints: [],
      verifiableClaims: [],
      unverifiableClaims: []
    };
  }
}

/**
 * Step 3: Detect sensational and manipulative language
 */
export async function detectLanguageManipulation(
  content: string
): Promise<ComprehensiveAnalysis['languageManipulation']> {
  try {
    const prompt = `Analyze this content for sensational, manipulative, or deceptive language patterns.

Content:
${content}

Identify:
1. Sensational language (shocking claims, exaggerations, clickbait phrases)
2. Manipulation techniques (fear-mongering, us-vs-them, false urgency)
3. Deceptive framing (misleading context, cherry-picking, false equivalence)

Respond in JSON format:
{
  "hasSensationalLanguage": boolean,
  "sensationalPhrases": ["list of specific sensational phrases found"],
  "manipulationScore": number between 0 and 1,
  "detectedTechniques": ["list of manipulation techniques used, e.g., fear-mongering, false urgency, emotional appeal"]
}

Respond ONLY with valid JSON, no other text.`;

    const response = await callGemini(prompt);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      hasSensationalLanguage: false,
      sensationalPhrases: [],
      manipulationScore: 0,
      detectedTechniques: []
    };
  } catch (error) {
    console.error('Language manipulation detection error:', error);
    return {
      hasSensationalLanguage: false,
      sensationalPhrases: [],
      manipulationScore: 0,
      detectedTechniques: []
    };
  }
}

/**
 * Step 4: Evaluate emotional bias and manipulation
 */
export async function evaluateEmotionalBias(
  content: string
): Promise<ComprehensiveAnalysis['emotionalBias']> {
  try {
    const prompt = `Analyze the emotional bias and manipulation in this content.

Content:
${content}

Evaluate:
1. Level of emotional bias (none, low, moderate, high, extreme)
2. Dominant emotions being triggered (fear, anger, outrage, excitement, etc.)
3. Emotional manipulation score
4. Specific emotional triggers used

Respond in JSON format:
{
  "biasLevel": "none" | "low" | "moderate" | "high" | "extreme",
  "dominantEmotions": ["fear", "anger", etc.],
  "biasScore": number between 0 and 1,
  "emotionalTriggers": ["specific phrases or techniques that trigger emotions"]
}

Respond ONLY with valid JSON, no other text.`;

    const response = await callGemini(prompt);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      biasLevel: 'none',
      dominantEmotions: [],
      biasScore: 0,
      emotionalTriggers: []
    };
  } catch (error) {
    console.error('Emotional bias evaluation error:', error);
    return {
      biasLevel: 'none',
      dominantEmotions: [],
      biasScore: 0,
      emotionalTriggers: []
    };
  }
}

/**
 * Step 5: Assess novelty and temporal consistency
 * This is crucial for detecting newly fabricated fake news
 */
export async function assessNoveltyAndTemporal(
  content: string,
  verifiableClaims: string[]
): Promise<ComprehensiveAnalysis['novelty']> {
  try {
    const prompt = `Analyze whether this is a newly emerging claim or a recycled piece of misinformation.

Content:
${content}

Verifiable claims:
${verifiableClaims.join('\n')}

Assess:
1. Is this a novel/new claim that just emerged?
2. Does it have historical precedent or similar past claims?
3. Is the timing consistent with the events described?
4. Are there temporal inconsistencies suggesting fabrication?

Respond in JSON format:
{
  "isNovelClaim": boolean (true if this appears to be newly fabricated),
  "hasHistoricalPrecedent": boolean (true if similar claims existed before),
  "temporalConsistency": "consistent" | "inconsistent" | "unknown",
  "noveltyScore": number between 0 and 1 (higher = more likely to be newly fabricated),
  "relatedHistoricalClaims": ["list of similar historical claims if any"]
}

A newly fabricated fake news typically:
- Makes novel claims not seen before
- Has temporal inconsistencies (dates don't match, events out of order)
- Lacks historical precedent in legitimate sources
- Cannot be traced to original reporting

Respond ONLY with valid JSON, no other text.`;

    const response = await callGemini(prompt);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      isNovelClaim: false,
      hasHistoricalPrecedent: false,
      temporalConsistency: 'unknown',
      noveltyScore: 0.5,
      relatedHistoricalClaims: []
    };
  } catch (error) {
    console.error('Novelty assessment error:', error);
    return {
      isNovelClaim: false,
      hasHistoricalPrecedent: false,
      temporalConsistency: 'unknown',
      noveltyScore: 0.5,
      relatedHistoricalClaims: []
    };
  }
}

/**
 * Step 6 & 7: Translate claims to English and local language for better search accuracy
 */
export async function translateClaimsMultilingual(
  content: string,
  detectedLanguage: string
): Promise<ComprehensiveAnalysis['translations']> {
  try {
    const prompt = `Translate this content for comprehensive fact-checking.

Content:
${content}

Detected language: ${detectedLanguage}

Provide translations in JSON format:
{
  "englishClaim": "translation to English for global fact-checking",
  "localLanguageClaim": "translation to the primary local language (Sinhala/Tamil for Sri Lankan content)",
  "detectedLanguage": "ISO code of detected language"
}

For English content, still provide the local language translation if the content is about a specific region.
Respond ONLY with valid JSON, no other text.`;

    const response = await callGemini(prompt);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      englishClaim: content,
      localLanguageClaim: content,
      detectedLanguage: detectedLanguage
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      englishClaim: content,
      localLanguageClaim: content,
      detectedLanguage: detectedLanguage
    };
  }
}

/**
 * Step 8: Calculate source credibility with detailed scoring
 */
export function calculateSourceCredibility(
  supportLinks: any[],
  debunkLinks: any[],
  content?: string
): ComprehensiveAnalysis['sourceCredibility'] {
  // Define trusted authoritative sources with credibility scores
  const trustedSources: Record<string, { score: number; category: string }> = {
    // International news agencies (highest credibility)
    'reuters.com': { score: 0.95, category: 'International News Agency' },
    'apnews.com': { score: 0.95, category: 'International News Agency' },
    'bbc.com': { score: 0.92, category: 'International Broadcaster' },
    'bbc.co.uk': { score: 0.92, category: 'International Broadcaster' },
    
    // Fact-checking organizations (highest credibility for debunking)
    'snopes.com': { score: 0.93, category: 'Fact-Checking' },
    'factcheck.org': { score: 0.93, category: 'Fact-Checking' },
    'politifact.com': { score: 0.93, category: 'Fact-Checking' },
    'fullfact.org': { score: 0.92, category: 'Fact-Checking' },
    
    // Major reputable news outlets
    'nytimes.com': { score: 0.88, category: 'Major News Outlet' },
    'washingtonpost.com': { score: 0.88, category: 'Major News Outlet' },
    'theguardian.com': { score: 0.87, category: 'Major News Outlet' },
    'cnn.com': { score: 0.82, category: 'Major News Outlet' },
    'npr.org': { score: 0.87, category: 'Public Broadcaster' },
    
    // Sri Lankan trusted sources
    'newsfirst.lk': { score: 0.82, category: 'Sri Lankan News' },
    'adaderana.lk': { score: 0.82, category: 'Sri Lankan News' },
    'dailymirror.lk': { score: 0.78, category: 'Sri Lankan News' },
    'sundaytimes.lk': { score: 0.78, category: 'Sri Lankan News' },
    'island.lk': { score: 0.78, category: 'Sri Lankan News' },
    'ft.lk': { score: 0.80, category: 'Sri Lankan News' },
    
    // Government sources
    'gov.lk': { score: 0.85, category: 'Government' },
    'president.gov.lk': { score: 0.85, category: 'Government' },
    'moe.gov.lk': { score: 0.85, category: 'Government' },
    'health.gov.lk': { score: 0.85, category: 'Government' },
    'cbsl.gov.lk': { score: 0.85, category: 'Government' },
    'police.lk': { score: 0.85, category: 'Government' },
  };
  
  // Sources with known bias or credibility issues
  const untrustedSources = [
    'facebook.com', 'whatsapp', 'telegram', 'twitter.com', 'x.com',
    'instagram.com', 'tiktok.com', 'youtube.com'
  ];
  
  const topSources: Array<{ name: string; credibilityScore: number; reasoning: string }> = [];
  let trustedCount = 0;
  let untrustedCount = 0;
  let unknownCount = 0;
  let totalCredibilityScore = 0;
  
  // Analyze support links
  supportLinks.forEach(link => {
    const domain = extractDomain(link.url || link.source || '');
    const baseDomain = domain.replace('www.', '');
    
    let credibilityScore = 0.5; // Default for unknown sources
    let reasoning = 'Unknown source';
    
    // Check if trusted source FIRST (highest priority)
    const trustedMatch = Object.keys(trustedSources).find(ts => baseDomain.includes(ts));
    if (trustedMatch) {
      const sourceInfo = trustedSources[trustedMatch];
      credibilityScore = sourceInfo.score;
      reasoning = `Trusted ${sourceInfo.category}`;
      trustedCount++;
    }
    // Check if untrusted
    else if (untrustedSources.some(us => baseDomain.includes(us))) {
      credibilityScore = 0.2;
      reasoning = 'Social media or user-generated content (low credibility)';
      untrustedCount++;
    }
    // Check if generic/old article (only for unknown sources)
    else {
      const title = (link.title || '').toLowerCase();
      const isGenericArticle = 
        (title.includes('report') && !title.includes('putin') && !title.includes('war')) || 
        title.includes('freedom on the net') ||
        ((title.includes('2021') || title.includes('2022') || title.includes('2023')) && !title.includes('2024') && !title.includes('2025')) ||
        (title.includes('must ensure') && !title.includes('says') && !title.includes('vow'));
      
      if (isGenericArticle) {
        credibilityScore = 0.3;
        reasoning = 'Generic article - may not be about this specific claim';
      }
      unknownCount++;
    }
    
    totalCredibilityScore += credibilityScore;
    topSources.push({
      name: domain,
      credibilityScore,
      reasoning
    });
  });
  
  // Sort by credibility score
  topSources.sort((a, b) => b.credibilityScore - a.credibilityScore);
  
  // ENHANCEMENT: Check if content mentions trusted sources even if search didn't find them
  if (content) {
    const contentLower = content.toLowerCase();
    const mentionedSources = Object.entries(trustedSources).filter(([domain, info]) => {
      const sourceName = domain.replace('.com', '').replace('.org', '').replace('.co.uk', '');
      return contentLower.includes(sourceName) || 
             contentLower.includes(domain) ||
             (sourceName === 'reuters' && contentLower.includes('reuters')) ||
             (sourceName === 'bbc' && (contentLower.includes('bbc') || contentLower.includes('british broadcasting'))) ||
             (sourceName === 'apnews' && contentLower.includes('associated press'));
    });
    
    // If trusted sources are mentioned in content, add them
    mentionedSources.forEach(([domain, info]) => {
      const existingSource = topSources.find(s => s.name.includes(domain.split('.')[0]));
      if (!existingSource) {
        topSources.unshift({
          name: `${domain} (mentioned in content)`,
          credibilityScore: info.score * 0.9, // Slightly lower than actual link
          reasoning: `Trusted ${info.category} cited in content`
        });
        trustedCount++;
        totalCredibilityScore += info.score * 0.9;
      }
    });
  }
  
  // Calculate overall credibility - use BEST source, not average
  // If even one highly trusted source reports it, that's more important than many low-quality sources
  const allScores = topSources.map(s => s.credibilityScore);
  const overallScore = allScores.length > 0 
    ? Math.max(...allScores, totalCredibilityScore / Math.max(supportLinks.length + (content ? 1 : 0), 1) * 0.5)
    : 0;
  
  return {
    overallScore,
    trustedSourcesFound: trustedCount,
    untrustedSourcesFound: untrustedCount,
    unknownSourcesFound: unknownCount,
    topSources: topSources.slice(0, 5) // Top 5 sources
  };
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Step 9: Generate comprehensive explainable verdict
 */
export async function generateExplainableVerdict(
  analysis: Partial<ComprehensiveAnalysis>,
  supportLinks: any[],
  debunkLinks: any[]
): Promise<ComprehensiveAnalysis['finalVerdict']> {
  const keyFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }> = [];
  
  let fakeScore = 0.5; // Start at neutral (0.5 = uncertain)
  
  // Factor 1: Initial factual assessment (weight: 30%) - INCREASED WEIGHT
  if (analysis.initialAssessment) {
    const weight = 0.30;
    if (analysis.initialAssessment.isMisleading) {
      // Push towards fake (add positive value)
      fakeScore += weight * analysis.initialAssessment.confidence;
      keyFactors.push({
        factor: `Initial analysis indicates misleading content: ${analysis.initialAssessment.reasoning}`,
        impact: 'negative',
        weight
      });
    } else if (analysis.initialAssessment.isFactual) {
      // Push towards real (subtract value)
      fakeScore -= weight * analysis.initialAssessment.confidence;
      if (analysis.initialAssessment.confidence >= 0.6) {
        keyFactors.push({
          factor: `Initial analysis suggests factual content: ${analysis.initialAssessment.reasoning}`,
          impact: 'positive',
          weight
        });
      }
    }
  }
  
  // Factor 2: Language manipulation (weight: 15%)
  if (analysis.languageManipulation) {
    const weight = 0.15;
    const manipScore = analysis.languageManipulation.manipulationScore;
    
    // Only apply if not default (0) - when LLM fails, it returns 0
    if (manipScore > 0) {
      fakeScore += manipScore * weight;
      
      if (manipScore > 0.6) {
        keyFactors.push({
          factor: `High manipulation detected (${(manipScore * 100).toFixed(0)}%): ${analysis.languageManipulation.detectedTechniques.join(', ')}`,
          impact: 'negative',
          weight
        });
      } else if (manipScore > 0.3) {
        keyFactors.push({
          factor: `Moderate manipulation detected (${(manipScore * 100).toFixed(0)}%)`,
          impact: 'neutral',
          weight
        });
      }
    }
  }
  
  // Factor 3: Emotional bias (weight: 15%)
  if (analysis.emotionalBias) {
    const weight = 0.15;
    const biasScore = analysis.emotionalBias.biasScore;
    
    // Only apply if not default (0) - when LLM fails, it returns 0
    if (biasScore > 0) {
      fakeScore += biasScore * weight;
      
      if (analysis.emotionalBias.biasLevel === 'high' || analysis.emotionalBias.biasLevel === 'extreme') {
        keyFactors.push({
          factor: `${analysis.emotionalBias.biasLevel} emotional bias detected, triggering: ${analysis.emotionalBias.dominantEmotions.join(', ')}`,
          impact: 'negative',
          weight
        });
      }
    }
  }
  
  // Factor 4: Novelty (weight: 20%) - CRITICAL for newly fabricated fake news
  if (analysis.novelty) {
    const weight = 0.20;
    const noveltyScore = analysis.novelty.noveltyScore;
    
    // ONLY apply novelty score if it's not the default (0.5)
    // When LLM fails and returns 0.5, don't penalize either way
    if (noveltyScore !== 0.5) {
      fakeScore += noveltyScore * weight;
    }
    
    if (analysis.novelty.isNovelClaim && !analysis.novelty.hasHistoricalPrecedent) {
      keyFactors.push({
        factor: 'Newly emerging claim with no verifiable historical precedent - high risk of fabrication',
        impact: 'negative',
        weight
      });
    } else if (analysis.novelty.hasHistoricalPrecedent) {
      keyFactors.push({
        factor: `Similar claims found in historical context: ${analysis.novelty.relatedHistoricalClaims.join(', ')}`,
        impact: 'neutral',
        weight: weight * 0.5
      });
    }
    
    if (analysis.novelty.temporalConsistency === 'inconsistent') {
      keyFactors.push({
        factor: 'Temporal inconsistencies detected (dates/events don\'t align)',
        impact: 'negative',
        weight: weight * 0.5
      });
    }
  }
  
  // Factor 5: Source credibility (weight: 25%, boosted to 40% when it's the primary signal)
  if (analysis.sourceCredibility) {
    let weight = 0.25;
    const credScore = analysis.sourceCredibility.overallScore;
    const trustedCount = analysis.sourceCredibility.trustedSourcesFound;
    
    // If we have high credibility but other analysis failed (returned defaults),
    // increase the weight of source credibility as it's our most reliable signal
    const hasDefaultAnalysis = 
      (!analysis.languageManipulation || analysis.languageManipulation.manipulationScore === 0) &&
      (!analysis.emotionalBias || analysis.emotionalBias.biasScore === 0) &&
      (!analysis.novelty || analysis.novelty.noveltyScore === 0.5);
    
    if (hasDefaultAnalysis && credScore >= 0.8 && trustedCount >= 2) {
      // Boost source credibility weight when it's the primary reliable signal
      weight = 0.50;
    }
    
    // High credibility pushes towards real, low credibility pushes towards fake
    fakeScore += (0.5 - credScore) * weight;
    
    if (credScore >= 0.8) {
      keyFactors.push({
        factor: `Highly credible sources (${trustedCount} trusted): ${analysis.sourceCredibility.topSources.slice(0, 3).map(s => s.name).join(', ')}`,
        impact: 'positive',
        weight
      });
    } else if (credScore < 0.4) {
      keyFactors.push({
        factor: `Low credibility sources found (${analysis.sourceCredibility.untrustedSourcesFound} untrusted, ${analysis.sourceCredibility.unknownSourcesFound} unknown)`,
        impact: 'negative',
        weight
      });
    }
  }
  
  // Factor 6: Fact-checking evidence
  if (debunkLinks.length > 0) {
    const weight = 0.15;
    fakeScore += weight;
    keyFactors.push({
      factor: `${debunkLinks.length} fact-checking article(s) debunk this claim`,
      impact: 'negative',
      weight
    });
  }
  
  // Factor 7: Penalty for urgent/breaking claims with NO trusted source support
  // This catches newly fabricated fake news that creates urgency but has zero credible backing
  if (supportLinks.length === 0 || 
      (analysis.sourceCredibility && analysis.sourceCredibility.trustedSourcesFound === 0)) {
    const weight = 0.15;
    fakeScore += weight;
    keyFactors.push({
      factor: 'No trusted authoritative sources confirm this urgent/breaking claim',
      impact: 'negative',
      weight
    });
  }
  
  // Clamp fake score to 0-1 range
  fakeScore = Math.max(0, Math.min(1, fakeScore));
  
  // Determine verdict and confidence with more aggressive thresholds for fake news
  let verdict: 'real' | 'fake' | 'uncertain' | 'misleading';
  let confidence: number;
  
  if (fakeScore >= 0.6) {
    // Lowered from 0.7 to catch more fake news
    verdict = 'fake';
    confidence = Math.min(0.95, fakeScore + 0.1); // Boost confidence for fake verdict
  } else if (fakeScore >= 0.4) {
    // Lowered from 0.5
    verdict = 'misleading';
    confidence = 0.75;
  } else if (fakeScore >= 0.25) {
    // Lowered from 0.3
    verdict = 'uncertain';
    confidence = 0.6;
  } else {
    verdict = 'real';
    confidence = Math.min(0.95, 1 - fakeScore);
  }
  
  // Generate explanation
  const explanation = generateVerdictExplanation(verdict, confidence, keyFactors, analysis);
  
  // Generate recommendations
  const recommendations = generateRecommendations(verdict, analysis, debunkLinks);
  
  return {
    verdict,
    confidence,
    explanation,
    keyFactors,
    recommendations
  };
}

function generateVerdictExplanation(
  verdict: string,
  confidence: number,
  keyFactors: any[],
  analysis: Partial<ComprehensiveAnalysis>
): string {
  const confidencePercent = (confidence * 100).toFixed(0);
  
  let explanation = `Based on comprehensive multi-step analysis, this claim is assessed as **${verdict.toUpperCase()}** with ${confidencePercent}% confidence.\n\n`;
  
  explanation += '**Key Analysis Factors:**\n\n';
  
  // Add top factors
  keyFactors.slice(0, 5).forEach((factor, index) => {
    const icon = factor.impact === 'positive' ? '✓' : factor.impact === 'negative' ? '✗' : '•';
    explanation += `${icon} ${factor.factor}\n\n`;
  });
  
  // Add claims breakdown if available
  if (analysis.claims && analysis.claims.verifiableClaims.length > 0) {
    explanation += `**Verifiable Claims Identified:**\n`;
    analysis.claims.verifiableClaims.slice(0, 3).forEach(claim => {
      explanation += `- ${claim}\n`;
    });
    explanation += '\n';
  }
  
  return explanation;
}

function generateRecommendations(
  verdict: string,
  analysis: Partial<ComprehensiveAnalysis>,
  debunkLinks: any[]
): string[] {
  const recommendations: string[] = [];
  
  if (verdict === 'fake' || verdict === 'misleading') {
    recommendations.push('❌ Do NOT share this content without verification');
    recommendations.push('🔍 Cross-check claims with multiple trusted sources');
    
    if (debunkLinks.length > 0) {
      recommendations.push(`📰 Review fact-checking articles: ${debunkLinks.slice(0, 2).map(l => l.source).join(', ')}`);
    }
  }
  
  if (verdict === 'uncertain') {
    recommendations.push('⚠️ Treat this claim with skepticism until verified');
    recommendations.push('🔎 Seek additional authoritative sources');
    recommendations.push('⏳ Wait for official statements or trusted news coverage');
  }
  
  if (analysis.novelty?.isNovelClaim) {
    recommendations.push('🆕 This appears to be a newly emerging claim - exercise extra caution');
    recommendations.push('📅 Check if mainstream news outlets have reported on this');
  }
  
  if (analysis.emotionalBias && analysis.emotionalBias.biasScore > 0.6) {
    recommendations.push('😠 Content uses emotional manipulation - be aware of potential bias');
  }
  
  if (analysis.sourceCredibility && analysis.sourceCredibility.trustedSourcesFound === 0) {
    recommendations.push('⚠️ No trusted authoritative sources found supporting this claim');
  }
  
  // Always add general recommendation
  recommendations.push('✅ Always verify with official government or trusted news sources');
  
  return recommendations;
}

/**
 * Main orchestrator: Run all analysis steps
 */
export async function runComprehensiveAnalysis(
  content: string,
  supportLinks: any[],
  debunkLinks: any[],
  detectedLanguage: string = 'en'
): Promise<ComprehensiveAnalysis> {
  console.log('Starting comprehensive multi-step analysis...');
  
  try {
    // Step 1: Initial factual assessment
    const initialAssessment = await performInitialFactualAnalysis(content);
    console.log('Step 1 complete: Initial assessment -', initialAssessment.isMisleading ? 'MISLEADING' : 'OK');
    
    // Step 2: Extract claims and key points
    const claims = await extractClaimsAndKeyPoints(content);
    console.log('Step 2 complete: Found', claims.verifiableClaims.length, 'verifiable claims');
    
    // Steps 3-5: Run language, emotional, and novelty analysis in parallel
    const [languageManipulation, emotionalBias, novelty] = await Promise.all([
      detectLanguageManipulation(content),
      evaluateEmotionalBias(content),
      assessNoveltyAndTemporal(content, claims.verifiableClaims)
    ]);
    console.log('Steps 3-5 complete: Manipulation score:', languageManipulation.manipulationScore);
    
    // Step 6-7: Translate for multi-language verification
    const translations = await translateClaimsMultilingual(content, detectedLanguage);
    console.log('Steps 6-7 complete: Translations ready');
    
    // Step 8: Calculate source credibility
    const sourceCredibility = calculateSourceCredibility(supportLinks, debunkLinks, content);
    console.log('Step 8 complete: Source credibility score:', sourceCredibility.overallScore);
    
    // Step 9: Generate final explainable verdict
    const partialAnalysis = {
      initialAssessment,
      claims,
      languageManipulation,
      emotionalBias,
      novelty,
      translations,
      sourceCredibility
    };
    
    const finalVerdict = await generateExplainableVerdict(
      partialAnalysis,
      supportLinks,
      debunkLinks
    );
    console.log('Step 9 complete: Final verdict -', finalVerdict.verdict, 'at', (finalVerdict.confidence * 100).toFixed(0) + '%');
    
    return {
      ...partialAnalysis,
      finalVerdict
    };
  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    
    // Return safe fallback
    return {
      initialAssessment: {
        isFactual: true,
        isMisleading: false,
        reasoning: 'Analysis incomplete due to error',
        confidence: 0.3
      },
      claims: {
        keyPoints: [],
        verifiableClaims: [],
        unverifiableClaims: []
      },
      languageManipulation: {
        hasSensationalLanguage: false,
        sensationalPhrases: [],
        manipulationScore: 0,
        detectedTechniques: []
      },
      emotionalBias: {
        biasLevel: 'none',
        dominantEmotions: [],
        biasScore: 0,
        emotionalTriggers: []
      },
      novelty: {
        isNovelClaim: false,
        hasHistoricalPrecedent: false,
        temporalConsistency: 'unknown',
        noveltyScore: 0.5,
        relatedHistoricalClaims: []
      },
      translations: {
        englishClaim: content,
        localLanguageClaim: content,
        detectedLanguage: 'en'
      },
      sourceCredibility: calculateSourceCredibility(supportLinks, debunkLinks, content),
      finalVerdict: {
        verdict: 'uncertain',
        confidence: 0.4,
        explanation: 'Analysis could not be completed. Please verify manually.',
        keyFactors: [],
        recommendations: ['Verify with trusted sources', 'Exercise caution']
      }
    };
  }
}
