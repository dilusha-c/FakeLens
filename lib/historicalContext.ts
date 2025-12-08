/**
 * Historical Context Analysis
 * Cross-references claims against past debunked content and tracks patterns
 */

export interface DebunkedClaim {
  id: string;
  text: string;
  originalText: string;
  debunkedDate: string;
  category: 'political' | 'health' | 'natural-disaster' | 'social' | 'economic' | 'other';
  season?: 'election' | 'budget' | 'exam' | 'festival' | 'general';
  similarityScore?: number;
  sources: string[];
}

export interface HistoricalAnalysis {
  matchedClaims: DebunkedClaim[];
  similarityScore: number; // 0-1, how similar to past fake news
  isRecurringPattern: boolean;
  seasonalFlag: boolean;
  category: string;
  scoreAdjustment: number; // How much to increase fake score
}

// In-memory database of known debunked claims (in production, use real database)
const DEBUNKED_CLAIMS_DB: DebunkedClaim[] = [
  {
    id: 'db001',
    text: 'schools permanently closed nationwide',
    originalText: 'Government to permanently close all schools across Sri Lanka',
    debunkedDate: '2024-03-15',
    category: 'social',
    season: 'general',
    sources: ['factcheck.lk', 'newsfirst.lk']
  },
  {
    id: 'db002',
    text: 'drinking hot water cures coronavirus',
    originalText: 'Drinking hot water every 15 minutes can cure COVID-19',
    debunkedDate: '2020-04-20',
    category: 'health',
    season: 'general',
    sources: ['who.int', 'health.gov.lk']
  },
  {
    id: 'db003',
    text: 'banks closing withdrawals stopped',
    originalText: 'All banks will stop cash withdrawals from tomorrow',
    debunkedDate: '2024-01-10',
    category: 'economic',
    season: 'general',
    sources: ['cbsl.gov.lk', 'economynext.com']
  },
  {
    id: 'db004',
    text: 'election postponed indefinitely cancelled',
    originalText: 'Presidential election postponed indefinitely due to emergency',
    debunkedDate: '2024-08-05',
    category: 'political',
    season: 'election',
    sources: ['elections.gov.lk', 'adaderana.lk']
  },
  {
    id: 'db005',
    text: 'tsunami warning coastal evacuation',
    originalText: 'Tsunami warning issued for entire coastal belt, immediate evacuation',
    debunkedDate: '2024-05-22',
    category: 'natural-disaster',
    season: 'general',
    sources: ['dmc.gov.lk', 'meteo.gov.lk']
  },
  {
    id: 'db006',
    text: 'exam papers leaked whatsapp',
    originalText: 'O/L exam papers leaked on WhatsApp groups',
    debunkedDate: '2023-12-01',
    category: 'social',
    season: 'exam',
    sources: ['doenets.lk', 'newsfirst.lk']
  },
  {
    id: 'db007',
    text: 'fuel price increase tomorrow lkr',
    originalText: 'Fuel prices to increase by Rs. 100 from tomorrow',
    debunkedDate: '2024-09-14',
    category: 'economic',
    season: 'general',
    sources: ['cpstl.lk', 'ceypetco.gov.lk']
  },
  {
    id: 'db008',
    text: 'vaccine causes infertility death',
    originalText: 'COVID-19 vaccine causes permanent infertility and death',
    debunkedDate: '2021-06-30',
    category: 'health',
    season: 'general',
    sources: ['who.int', 'health.gov.lk', 'epid.gov.lk']
  },
];

/**
 * Calculate text similarity using simple word overlap
 * In production, use advanced algorithms like cosine similarity with embeddings
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size; // Jaccard similarity
}

/**
 * Detect current season/context for seasonal pattern detection
 */
function detectCurrentSeason(): string[] {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const seasons: string[] = ['general'];
  
  // Election season (typically Aug-Nov in Sri Lanka)
  if (month >= 8 && month <= 11) {
    seasons.push('election');
  }
  
  // Budget season (typically Oct-Dec)
  if (month >= 10 && month <= 12) {
    seasons.push('budget');
  }
  
  // Exam season (typically Nov-Dec and May-Jun)
  if ((month >= 11 && month <= 12) || (month >= 5 && month <= 6)) {
    seasons.push('exam');
  }
  
  // Festival season (Apr, Dec-Jan)
  if (month === 4 || month === 12 || month === 1) {
    seasons.push('festival');
  }
  
  return seasons;
}

/**
 * Cross-reference claim against historical debunked claims
 */
export async function analyzeHistoricalContext(claimText: string): Promise<HistoricalAnalysis> {
  const normalizedClaim = claimText.toLowerCase().trim();
  const currentSeasons = detectCurrentSeason();
  
  // Find matching debunked claims
  const matches: DebunkedClaim[] = [];
  let maxSimilarity = 0;
  
  for (const debunked of DEBUNKED_CLAIMS_DB) {
    const similarity = calculateSimilarity(normalizedClaim, debunked.text);
    
    if (similarity > 0.3) { // Threshold for considering a match
      matches.push({
        ...debunked,
        similarityScore: similarity,
      });
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
  }
  
  // Sort by similarity
  matches.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
  
  // Check if recurring pattern (high similarity to past fake news)
  const isRecurringPattern = maxSimilarity > 0.6;
  
  // Check if seasonal fake news
  const seasonalMatches = matches.filter(m => 
    m.season && currentSeasons.includes(m.season)
  );
  const seasonalFlag = seasonalMatches.length > 0;
  
  // Determine category from best match
  const category = matches.length > 0 ? matches[0].category : 'other';
  
  // Calculate score adjustment
  let scoreAdjustment = 0;
  
  if (isRecurringPattern) {
    scoreAdjustment += 0.25; // Strong indicator of fake news
  } else if (maxSimilarity > 0.4) {
    scoreAdjustment += 0.15; // Moderate similarity
  }
  
  if (seasonalFlag) {
    scoreAdjustment += 0.1; // Common fake news during this season
  }
  
  return {
    matchedClaims: matches.slice(0, 3), // Return top 3 matches
    similarityScore: maxSimilarity,
    isRecurringPattern,
    seasonalFlag,
    category,
    scoreAdjustment: Math.min(scoreAdjustment, 0.35), // Cap at 0.35
  };
}

/**
 * Add a new debunked claim to the database
 * In production, this would save to a real database
 */
export function addDebunkedClaim(claim: Omit<DebunkedClaim, 'id'>): DebunkedClaim {
  const newClaim: DebunkedClaim = {
    ...claim,
    id: `db${String(DEBUNKED_CLAIMS_DB.length + 1).padStart(3, '0')}`,
  };
  
  DEBUNKED_CLAIMS_DB.push(newClaim);
  return newClaim;
}

/**
 * Get statistics about historical patterns
 */
export function getHistoricalStats() {
  const categories = DEBUNKED_CLAIMS_DB.reduce((acc, claim) => {
    acc[claim.category] = (acc[claim.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const seasons = DEBUNKED_CLAIMS_DB.reduce((acc, claim) => {
    if (claim.season) {
      acc[claim.season] = (acc[claim.season] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalDebunked: DEBUNKED_CLAIMS_DB.length,
    categories,
    seasons,
    currentSeason: detectCurrentSeason(),
  };
}
