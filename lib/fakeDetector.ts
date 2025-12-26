import { Verdict } from '@/types';

interface FakeDetectionResult {
  score: number; // 0 to 1, where 1 is most likely fake
  reasons: string[];
}

/**
 * Analyzes text for fake news indicators using rule-based logic
 */
export function detectFakeNews(text: string): FakeDetectionResult {
  const reasons: string[] = [];
  let score = 0.5; // Start neutral

  // 0. Check if text is too short or vague to analyze
  if (text.trim().length < 15) {
    reasons.push('Minimum 15 characters required for analysis. Please provide a complete claim to fact-check.');
    return { score: 0.5, reasons };
  }

  // 1. Check for sensational keywords
  const sensationalWords = [
    'shocking', 'unbelievable', 'secret', 'exposed', 'revealed',
    'scandal', 'urgent', 'breaking', 'exclusive', 'miracle',
    'dangerous', 'terrifying', 'amazing', 'incredible'
  ];
  
  const lowerText = text.toLowerCase();
  const sensationalCount = sensationalWords.filter(word => 
    lowerText.includes(word)
  ).length;

  if (sensationalCount >= 3) {
    score += 0.2;
    reasons.push('Contains multiple sensational phrases designed to provoke strong emotions');
  } else if (sensationalCount >= 1) {
    score += 0.1;
  }

  // 2. Check for excessive punctuation
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  
  if (exclamationCount >= 3) {
    score += 0.15;
    reasons.push('Contains excessive exclamation marks, a common tactic in misleading content');
  }

  // 3. Check for all caps words
  const knownAcronyms = ['USA', 'UK', 'EU', 'UN', 'WHO', 'NATO', 'UNICEF', 'UNHCR', 'FBI', 'CIA', 'CDC', 'NASA'];
  const allCapsWordsRaw = text.match(/\b[A-Z]{3,}\b/g) || [];
  const allCapsWords = allCapsWordsRaw.filter(word => !knownAcronyms.includes(word));
  if (allCapsWords.length >= 3) {
    score += 0.08;
    reasons.push('Uses ALL CAPS formatting excessively, often seen in sensationalized content (ignoring standard acronyms)');
  }

  // 4. Check text length and structure
  if (text.length < 100) {
    score += 0.1;
    reasons.push('Very short content without sufficient context or detail');
  } else if (text.length > 1000) {
    score -= 0.05; // Longer articles tend to be more legitimate
  }

  // 5. Check for lack of sources or attribution
  const hasSourceIndicators = /according to|source|study|research|report|said|stated/i.test(text);
  if (!hasSourceIndicators && text.length > 200) {
    score += 0.15;
    reasons.push('No clear attribution or sources mentioned in the content');
  } else if (hasSourceIndicators) {
    score -= 0.1;
    // Bonus: credible sources explicitly mentioned
    const credibleSources = ['reuters', 'ap news', 'associated press', 'bbc', 'guardian', 'new york times', 'nytimes', 'washington post', 'who', 'world health organization'];
    const hasCredibleSource = credibleSources.some(src => lowerText.includes(src));
    if (hasCredibleSource) {
      score -= 0.08;
      reasons.push('Mentions credible sources or official statements');
    }
    // Additional bonus: multiple named official sources/ministries/commands quoted
    const officialIndicators = ['president', 'minister', 'ministry', 'command', 'department', 'spokesperson', 'spokesman', 'spokeswoman', 'secretary', 'foreign minister', 'defense minister', 'africom', 'state department'];
    const officialCount = officialIndicators.filter(ind => lowerText.includes(ind)).length;
    if (officialCount >= 2) {
      score -= 0.12;
      reasons.push('Multiple named official sources are cited');
    }
  }

  // 6. Check for vague claims
  const vagueWords = ['they say', 'people are saying', 'many believe', 'experts claim', 'sources say'];
  const vagueCount = vagueWords.filter(phrase => lowerText.includes(phrase)).length;
  
  if (vagueCount >= 2) {
    score += 0.1;
    reasons.push('Uses vague attributions without naming specific sources');
  }

  // 7. Check for emotional manipulation
  const emotionalWords = ['fear', 'hate', 'love', 'angry', 'outraged', 'devastated', 'heartbreaking'];
  const emotionalCount = emotionalWords.filter(word => lowerText.includes(word)).length;
  
  if (emotionalCount >= 3) {
    score += 0.1;
    reasons.push('Heavy use of emotional language designed to manipulate readers');
  }

  // 8. Check for conspiracy-related terms
  const conspiracyTerms = ['cover-up', 'conspiracy', 'hidden truth', 'they don\'t want you to know', 'wake up'];
  const conspiracyCount = conspiracyTerms.filter(term => lowerText.includes(term)).length;
  
  if (conspiracyCount >= 1) {
    score += 0.15;
    reasons.push('Contains conspiracy-related language and rhetoric');
  }

  // Normalize score to 0-1 range
  score = Math.max(0, Math.min(1, score));

  // Add positive indicators if score is low
  if (score < 0.4 && reasons.length === 0) {
    reasons.push('Content appears measured and factual in tone');
    reasons.push('No obvious sensational or manipulative language detected');
  }

  return { score, reasons };
}

/**
 * Converts fake score to verdict
 */
export function scoreToVerdict(score: number, reasons: string[] = []): Verdict {
  // Check if this is an unanalyzable claim
  if (reasons.some(r => r.includes('Minimum 15 characters') || r.includes('too short') || r.includes('without an actual claim'))) {
    return 'unanalyzable';
  }
  
  if (score >= 0.65) return 'fake';
  if (score <= 0.35) return 'real';
  return 'uncertain';
}

/**
 * Converts score to confidence level
 */
export function scoreToConfidence(score: number): number {
  // Convert to confidence: how far from 0.5 (uncertain)
  const distance = Math.abs(score - 0.5);
  
  // Scale confidence more aggressively
  // At threshold (0.65 or 0.35): distance = 0.15 → confidence ~65%
  // At extreme (0.9 or 0.1): distance = 0.4 → confidence ~95%
  const baseConfidence = distance * 2; // 0 to 1
  const boostedConfidence = Math.pow(baseConfidence, 0.7); // Boost lower values
  
  return Math.min(1, boostedConfidence);
}
