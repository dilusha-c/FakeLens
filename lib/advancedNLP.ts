/**
 * Advanced NLP Analysis
 * Sentiment analysis, entity verification, and fact cross-referencing
 */

import axios from 'axios';

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'fear' | 'anger';
  emotionalScore: number; // 0-1, how emotionally charged
  fearTriggers: string[];
  angerTriggers: string[];
  manipulationScore: number; // 0-1, emotional manipulation likelihood
}

export interface EntityVerification {
  people: Array<{ name: string; verified: boolean; context?: string }>;
  places: Array<{ name: string; verified: boolean; context?: string }>;
  organizations: Array<{ name: string; verified: boolean; context?: string }>;
  dates: Array<{ date: string; verified: boolean; context?: string }>;
  numbers: Array<{ value: string; verified: boolean; context?: string }>;
  verificationScore: number; // 0-1, how many entities verified
}

export interface NLPAnalysis {
  sentiment: SentimentAnalysis;
  entities: EntityVerification;
  scoreAdjustment: number;
  warnings: string[];
}

// Emotional manipulation patterns
const FEAR_TRIGGERS = [
  'danger', 'threat', 'deadly', 'fatal', 'death', 'die', 'kill', 'harmful', 'toxic',
  'pandemic', 'outbreak', 'epidemic', 'virus', 'disease', 'cancer', 'poison',
  'disaster', 'catastrophe', 'emergency', 'urgent', 'warning', 'alert',
  'scary', 'terrifying', 'horrifying', 'shocking', 'crisis', 'collapse',
  // Sinhala
  'භයානක', 'මරණය', 'අනතුර', 'අර්බුදය', 'මරාගෙන',
  // Tamil
  'ஆபத்து', 'மரணம்', 'நோய்', 'அவசரம்',
];

const ANGER_TRIGGERS = [
  'outrage', 'scandal', 'betrayal', 'lie', 'fraud', 'cheat', 'steal', 'corrupt',
  'injustice', 'unfair', 'attack', 'destroy', 'ruin', 'evil', 'criminal',
  'hate', 'disgrace', 'shame', 'insult', 'abuse', 'exploit',
  // Sinhala
  'වංචා', 'දුෂණය', 'අපරාධ', 'මෝසම', 'කෝප',
  // Tamil
  'ஊழல்', 'மோசடி', 'குற்றம்', 'கோபம்',
];

// Sri Lankan entities for verification
const SRI_LANKAN_PEOPLE = [
  'president', 'prime minister', 'minister', 'mp', 'member of parliament',
  'ජනාධිපති', 'අගමැති', 'ප්‍රධාන', 'පාර්ලිමේන්තු',
  'ஜனாதிபதி', 'பிரதமர்', 'அமைச்சர்',
];

const SRI_LANKAN_PLACES = [
  'colombo', 'kandy', 'galle', 'jaffna', 'anuradhapura', 'trincomalee', 'batticaloa',
  'negombo', 'matara', 'kurunegala', 'ratnapura', 'badulla', 'ampara', 'vavuniya',
  'කොළඹ', 'මහනුවර', 'ගාල්ල', 'යාපනය', 'අනුරාධපුර',
  'கொழும்பு', 'கண்டி', 'யாழ்ப்பாணம்', 'திருகோணமலை',
  'sri lanka', 'ශ්‍රී ලංකා', 'இலங்கை',
];

const SRI_LANKAN_ORGS = [
  'parliament', 'government', 'ministry', 'police', 'army', 'navy', 'air force',
  'central bank', 'cbsl', 'elections commission', 'health ministry', 'education ministry',
  'පාර්ලිමේන්තුව', 'රජය', 'අමාත්‍යාංශය', 'පොලීසිය', 'හමුදාව',
  'பாராளுமன்றம்', 'அரசாங்கம்', 'அமைச்சகம்', 'காவல்துறை',
];

/**
 * Analyze sentiment and emotional manipulation
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  const lowerText = text.toLowerCase();
  
  // Detect fear triggers
  const fearTriggers: string[] = [];
  FEAR_TRIGGERS.forEach(trigger => {
    if (lowerText.includes(trigger)) {
      fearTriggers.push(trigger);
    }
  });
  
  // Detect anger triggers
  const angerTriggers: string[] = [];
  ANGER_TRIGGERS.forEach(trigger => {
    if (lowerText.includes(trigger)) {
      angerTriggers.push(trigger);
    }
  });
  
  // Calculate emotional scores
  const fearScore = Math.min(fearTriggers.length / 3, 1); // Cap at 1
  const angerScore = Math.min(angerTriggers.length / 3, 1);
  const emotionalScore = Math.max(fearScore, angerScore);
  
  // Determine dominant sentiment
  let sentiment: SentimentAnalysis['sentiment'] = 'neutral';
  if (fearScore > 0.3) sentiment = 'fear';
  else if (angerScore > 0.3) sentiment = 'anger';
  else if (emotionalScore > 0) sentiment = 'negative';
  
  // Calculate manipulation score
  // High emotional language + caps + exclamation = manipulation
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  const exclamationCount = (text.match(/!/g) || []).length;
  
  const manipulationScore = Math.min(
    (emotionalScore * 0.5) + (capsRatio * 0.3) + (exclamationCount / 10 * 0.2),
    1
  );
  
  return {
    sentiment,
    emotionalScore,
    fearTriggers: fearTriggers.slice(0, 5), // Top 5
    angerTriggers: angerTriggers.slice(0, 5),
    manipulationScore,
  };
}

/**
 * Extract and verify named entities
 * In production, use advanced NER models like spaCy or transformers
 */
export function verifyEntities(text: string): EntityVerification {
  const lowerText = text.toLowerCase();
  
  // Simple pattern matching (in production, use proper NER)
  const people: EntityVerification['people'] = [];
  const places: EntityVerification['places'] = [];
  const organizations: EntityVerification['organizations'] = [];
  const dates: EntityVerification['dates'] = [];
  const numbers: EntityVerification['numbers'] = [];
  
  // Verify people
  SRI_LANKAN_PEOPLE.forEach(person => {
    if (lowerText.includes(person)) {
      people.push({
        name: person,
        verified: true,
        context: 'Known Sri Lankan political figure',
      });
    }
  });
  
  // Verify places
  SRI_LANKAN_PLACES.forEach(place => {
    if (lowerText.includes(place)) {
      places.push({
        name: place,
        verified: true,
        context: 'Verified Sri Lankan location',
      });
    }
  });
  
  // Verify organizations
  SRI_LANKAN_ORGS.forEach(org => {
    if (lowerText.includes(org)) {
      organizations.push({
        name: org,
        verified: true,
        context: 'Known Sri Lankan institution',
      });
    }
  });
  
  // Extract dates (simple regex)
  const datePatterns = [
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, // DD/MM/YYYY
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
  ];
  
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(date => {
        dates.push({
          date,
          verified: isReasonableDate(date),
          context: isReasonableDate(date) ? 'Valid date range' : 'Suspicious date',
        });
      });
    }
  });
  
  // Extract numbers and verify reasonableness
  const numberMatches = text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g);
  if (numberMatches) {
    numberMatches.forEach(num => {
      const value = parseFloat(num.replace(/,/g, ''));
      numbers.push({
        value: num,
        verified: isReasonableNumber(value),
        context: isReasonableNumber(value) ? 'Reasonable value' : 'Suspiciously large/small',
      });
    });
  }
  
  // Calculate verification score
  const totalEntities = people.length + places.length + organizations.length + dates.length + numbers.length;
  const verifiedEntities = [
    ...people.filter(p => p.verified),
    ...places.filter(p => p.verified),
    ...organizations.filter(o => o.verified),
    ...dates.filter(d => d.verified),
    ...numbers.filter(n => n.verified),
  ].length;
  
  const verificationScore = totalEntities > 0 ? verifiedEntities / totalEntities : 0.5;
  
  return {
    people,
    places,
    organizations,
    dates,
    numbers,
    verificationScore,
  };
}

/**
 * Check if date is reasonable (not too far in past or future)
 */
function isReasonableDate(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const yearDiff = Math.abs(date.getFullYear() - now.getFullYear());
    
    // Dates should be within 10 years past or 1 year future
    return yearDiff <= 10 && (date <= now || yearDiff <= 1);
  } catch {
    return false;
  }
}

/**
 * Check if number is reasonable (not absurdly large or small)
 */
function isReasonableNumber(value: number): boolean {
  // Flag suspiciously large numbers (> 1 trillion) or impossibly precise
  if (value > 1_000_000_000_000) return false;
  
  // Check for suspicious precision (e.g., "exactly 1,234,567 people")
  const str = value.toString();
  if (str.length > 6 && !str.includes('.')) {
    // Large round numbers are suspicious
    return false;
  }
  
  return true;
}

/**
 * Comprehensive NLP analysis
 */
export async function analyzeNLP(claimText: string): Promise<NLPAnalysis> {
  // Run sentiment and entity analysis
  const sentiment = analyzeSentiment(claimText);
  const entities = verifyEntities(claimText);
  
  const warnings: string[] = [];
  let scoreAdjustment = 0;
  
  // High emotional manipulation increases fake score
  if (sentiment.manipulationScore > 0.6) {
    scoreAdjustment += 0.2;
    warnings.push('High emotional manipulation detected');
  } else if (sentiment.manipulationScore > 0.4) {
    scoreAdjustment += 0.1;
    warnings.push('Moderate emotional language detected');
  }
  
  // Fear/anger sentiment increases fake score
  if (sentiment.sentiment === 'fear') {
    scoreAdjustment += 0.1;
    warnings.push(`Fear triggers: ${sentiment.fearTriggers.join(', ')}`);
  }
  if (sentiment.sentiment === 'anger') {
    scoreAdjustment += 0.1;
    warnings.push(`Anger triggers: ${sentiment.angerTriggers.join(', ')}`);
  }
  
  // Unverified entities increase fake score
  if (entities.verificationScore < 0.5 && entities.people.length + entities.places.length > 0) {
    scoreAdjustment += 0.15;
    warnings.push('Contains unverified people/places');
  }
  
  // Suspicious dates/numbers
  const unverifiedDates = entities.dates.filter(d => !d.verified);
  const unverifiedNumbers = entities.numbers.filter(n => !n.verified);
  
  if (unverifiedDates.length > 0) {
    scoreAdjustment += 0.1;
    warnings.push(`Suspicious dates: ${unverifiedDates.map(d => d.date).join(', ')}`);
  }
  
  if (unverifiedNumbers.length > 0) {
    scoreAdjustment += 0.1;
    warnings.push(`Suspicious numbers: ${unverifiedNumbers.map(n => n.value).join(', ')}`);
  }
  
  return {
    sentiment,
    entities,
    scoreAdjustment: Math.min(scoreAdjustment, 0.4), // Cap at 0.4
    warnings,
  };
}
