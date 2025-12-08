/**
 * Expert Network Integration
 * Integrates with fact-checker APIs and expert verification systems
 */

import axios from 'axios';

export interface FactCheckerResult {
  source: string;
  url: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified' | 'mixed';
  confidence: number;
  publishedDate: string;
  summary?: string;
}

export interface ExpertVerification {
  factCheckers: FactCheckerResult[];
  academicSources: Array<{ title: string; url: string; relevance: number }>;
  expertOpinions: Array<{ expert: string; field: string; opinion: string }>;
  verificationScore: number; // 0-1
  scoreAdjustment: number;
}

// Fact-checker API configurations
const FACT_CHECKER_APIS = {
  factCheckLk: {
    enabled: true,
    baseUrl: 'https://factcheck.lk/api', // Hypothetical - implement when available
    apiKey: process.env.FACTCHECK_LK_API_KEY,
  },
  watchdogTeam: {
    enabled: true,
    baseUrl: 'https://watchdog.team/api', // Hypothetical
    apiKey: process.env.WATCHDOG_API_KEY,
  },
  afp: {
    enabled: true,
    baseUrl: 'https://factcheck.afp.com/api', // Hypothetical
    apiKey: process.env.AFP_FACTCHECK_API_KEY,
  },
  snopes: {
    enabled: true,
    baseUrl: 'https://api.snopes.com', // Hypothetical
    apiKey: process.env.SNOPES_API_KEY,
  },
};

/**
 * Query factcheck.lk for Sri Lankan fact-checks
 */
async function queryFactCheckLk(claim: string): Promise<FactCheckerResult[]> {
  if (!FACT_CHECKER_APIS.factCheckLk.apiKey) {
    console.log('FactCheck.lk API key not configured');
    return [];
  }
  
  try {
    // Hypothetical API call - implement when API is available
    const response = await axios.get(`${FACT_CHECKER_APIS.factCheckLk.baseUrl}/search`, {
      params: { q: claim, limit: 5 },
      headers: { 'Authorization': `Bearer ${FACT_CHECKER_APIS.factCheckLk.apiKey}` },
      timeout: 5000,
    });
    
    return response.data.results.map((result: any) => ({
      source: 'factcheck.lk',
      url: result.url,
      verdict: result.verdict.toLowerCase(),
      confidence: result.confidence || 0.8,
      publishedDate: result.publishedDate,
      summary: result.summary,
    }));
  } catch (error) {
    console.error('FactCheck.lk API error:', error);
    return [];
  }
}

/**
 * Query watchdog.team for investigative journalism fact-checks
 */
async function queryWatchdogTeam(claim: string): Promise<FactCheckerResult[]> {
  if (!FACT_CHECKER_APIS.watchdogTeam.apiKey) {
    console.log('Watchdog.team API key not configured');
    return [];
  }
  
  try {
    // Hypothetical API call
    const response = await axios.get(`${FACT_CHECKER_APIS.watchdogTeam.baseUrl}/verify`, {
      params: { claim, language: 'en' },
      headers: { 'X-API-Key': FACT_CHECKER_APIS.watchdogTeam.apiKey },
      timeout: 5000,
    });
    
    return response.data.checks.map((check: any) => ({
      source: 'watchdog.team',
      url: check.article_url,
      verdict: check.rating.toLowerCase(),
      confidence: check.confidence_score || 0.75,
      publishedDate: check.date,
      summary: check.explanation,
    }));
  } catch (error) {
    console.error('Watchdog.team API error:', error);
    return [];
  }
}

/**
 * Query AFP Fact Check for international verification
 */
async function queryAFPFactCheck(claim: string): Promise<FactCheckerResult[]> {
  if (!FACT_CHECKER_APIS.afp.apiKey) {
    console.log('AFP FactCheck API key not configured');
    return [];
  }
  
  try {
    // Hypothetical API call
    const response = await axios.post(`${FACT_CHECKER_APIS.afp.baseUrl}/check`, {
      text: claim,
      region: 'south-asia',
    }, {
      headers: { 'Authorization': `Bearer ${FACT_CHECKER_APIS.afp.apiKey}` },
      timeout: 5000,
    });
    
    return response.data.matches.map((match: any) => ({
      source: 'AFP FactCheck',
      url: match.url,
      verdict: match.verdict.toLowerCase(),
      confidence: match.score || 0.7,
      publishedDate: match.published,
      summary: match.title,
    }));
  } catch (error) {
    console.error('AFP FactCheck API error:', error);
    return [];
  }
}

/**
 * Search academic databases (Google Scholar, ResearchGate)
 * This is a simplified version - in production, use proper academic APIs
 */
async function searchAcademicSources(claim: string): Promise<ExpertVerification['academicSources']> {
  // Simplified implementation - in production, use Google Scholar API, Semantic Scholar, etc.
  const keywords = claim.split(' ').slice(0, 5).join(' ');
  
  try {
    // Placeholder - would integrate with academic search APIs
    console.log('Academic search for:', keywords);
    return [];
  } catch (error) {
    console.error('Academic search error:', error);
    return [];
  }
}

/**
 * Match claim to expert domains and find relevant experts
 */
function matchExpertsByTopic(claim: string): ExpertVerification['expertOpinions'] {
  const lowerClaim = claim.toLowerCase();
  const experts: ExpertVerification['expertOpinions'] = [];
  
  // Health-related claims
  if (lowerClaim.match(/health|medicine|vaccine|disease|covid|virus|cure/)) {
    experts.push({
      expert: 'Ministry of Health, Sri Lanka',
      field: 'Public Health',
      opinion: 'Consult official health.gov.lk for verified health information',
    });
  }
  
  // Economic claims
  if (lowerClaim.match(/economy|bank|currency|inflation|price|fuel|rupee/)) {
    experts.push({
      expert: 'Central Bank of Sri Lanka',
      field: 'Economics',
      opinion: 'Verify economic data at cbsl.gov.lk',
    });
  }
  
  // Political claims
  if (lowerClaim.match(/election|government|parliament|minister|president|vote/)) {
    experts.push({
      expert: 'Elections Commission of Sri Lanka',
      field: 'Political Science',
      opinion: 'Check official announcements at elections.gov.lk',
    });
  }
  
  // Education claims
  if (lowerClaim.match(/school|exam|university|education|student|teacher/)) {
    experts.push({
      expert: 'Ministry of Education',
      field: 'Education',
      opinion: 'Verify at moe.gov.lk and doenets.lk',
    });
  }
  
  // Natural disaster claims
  if (lowerClaim.match(/tsunami|earthquake|flood|landslide|cyclone|disaster/)) {
    experts.push({
      expert: 'Disaster Management Centre',
      field: 'Disaster Management',
      opinion: 'Check alerts at dmc.gov.lk and meteo.gov.lk',
    });
  }
  
  return experts;
}

/**
 * Integrate all expert network sources
 */
export async function verifyWithExperts(claim: string): Promise<ExpertVerification> {
  console.log('Querying expert network for verification...');
  
  // Query all fact-checker APIs in parallel
  const [factCheckLkResults, watchdogResults, afpResults] = await Promise.all([
    queryFactCheckLk(claim).catch(() => []),
    queryWatchdogTeam(claim).catch(() => []),
    queryAFPFactCheck(claim).catch(() => []),
  ]);
  
  const allFactCheckers = [
    ...factCheckLkResults,
    ...watchdogResults,
    ...afpResults,
  ];
  
  // Search academic sources
  const academicSources = await searchAcademicSources(claim);
  
  // Match to expert domains
  const expertOpinions = matchExpertsByTopic(claim);
  
  // Calculate verification score
  let verificationScore = 0.5; // Neutral baseline
  let scoreAdjustment = 0;
  
  if (allFactCheckers.length > 0) {
    // Check fact-checker verdicts
    const falseVerdicts = allFactCheckers.filter(fc => fc.verdict === 'false');
    const trueVerdicts = allFactCheckers.filter(fc => fc.verdict === 'true');
    const misleadingVerdicts = allFactCheckers.filter(fc => fc.verdict === 'misleading');
    
    if (falseVerdicts.length > 0) {
      // Multiple fact-checkers say it's false - strong indicator
      scoreAdjustment += 0.3 + (falseVerdicts.length * 0.05);
      verificationScore = 0.2;
    } else if (misleadingVerdicts.length > 0) {
      scoreAdjustment += 0.15;
      verificationScore = 0.4;
    } else if (trueVerdicts.length > 0) {
      // Fact-checkers confirm it's true
      scoreAdjustment -= 0.2;
      verificationScore = 0.8;
    }
  }
  
  // Academic sources increase credibility
  if (academicSources.length > 0) {
    verificationScore += 0.1;
    scoreAdjustment -= 0.1;
  }
  
  return {
    factCheckers: allFactCheckers.slice(0, 5), // Top 5 results
    academicSources: academicSources.slice(0, 3),
    expertOpinions,
    verificationScore: Math.max(0, Math.min(1, verificationScore)),
    scoreAdjustment: Math.max(-0.3, Math.min(0.4, scoreAdjustment)), // Cap between -0.3 and 0.4
  };
}

/**
 * Get fact-checker API status
 */
export function getFactCheckerStatus() {
  return {
    factCheckLk: {
      enabled: FACT_CHECKER_APIS.factCheckLk.enabled,
      configured: !!FACT_CHECKER_APIS.factCheckLk.apiKey,
    },
    watchdogTeam: {
      enabled: FACT_CHECKER_APIS.watchdogTeam.enabled,
      configured: !!FACT_CHECKER_APIS.watchdogTeam.apiKey,
    },
    afp: {
      enabled: FACT_CHECKER_APIS.afp.enabled,
      configured: !!FACT_CHECKER_APIS.afp.apiKey,
    },
    snopes: {
      enabled: FACT_CHECKER_APIS.snopes.enabled,
      configured: !!FACT_CHECKER_APIS.snopes.apiKey,
    },
  };
}
