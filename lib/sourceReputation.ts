/**
 * Source Reputation Scoring
 * Analyzes domain age, author credibility, and website security
 */

import axios from 'axios';
import https from 'https';

export interface DomainReputation {
  domain: string;
  age?: number; // in years
  isHTTPS: boolean;
  hasValidSSL?: boolean;
  trustScore: number; // 0-1
  category: 'trusted' | 'neutral' | 'suspicious' | 'unknown';
  flags: string[];
}

export interface AuthorCredibility {
  author?: string;
  hasAuthor: boolean;
  authorHistory?: string[];
  credibilityScore: number; // 0-1
}

export interface SourceReputation {
  domains: DomainReputation[];
  authors: AuthorCredibility[];
  overallTrustScore: number; // 0-1
  scoreAdjustment: number;
  warnings: string[];
}

// Known suspicious TLDs (top-level domains)
const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq', // Free domains
  '.xyz', '.top', '.win', '.bid', // Often used for spam
  '.info', '.click', '.link', // Frequently misused
];

// Sri Lankan trusted domains (from previous implementation)
const TRUSTED_SRI_LANKAN_DOMAINS = [
  'newsfirst.lk', 'adaderana.lk', 'dailymirror.lk', 'sundaytimes.lk',
  'sundayobserver.lk', 'colombogazette.com', 'economynext.com',
  'gov.lk', 'president.gov.lk', 'parliament.lk', 'moe.gov.lk',
  'police.lk', 'health.gov.lk', 'cbsl.gov.lk', 'elections.gov.lk',
  'hirunews.lk', 'lankadeepa.lk', 'divaina.lk', 'silumina.lk',
  'thinakaran.lk', 'virakesari.lk', 'tamilmirror.lk', 'tamilwin.com',
];

// International trusted sources
const TRUSTED_INTERNATIONAL_DOMAINS = [
  'bbc.com', 'bbc.co.uk', 'reuters.com', 'apnews.com', 'afp.com',
  'who.int', 'un.org', 'worldbank.org', 'nature.com', 'sciencemag.org',
  'snopes.com', 'factcheck.org', 'politifact.com',
];

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Check if domain uses HTTPS and has valid SSL
 */
async function checkHTTPSAndSSL(url: string): Promise<{ isHTTPS: boolean; hasValidSSL: boolean }> {
  try {
    const urlObj = new URL(url);
    const isHTTPS = urlObj.protocol === 'https:';
    
    if (!isHTTPS) {
      return { isHTTPS: false, hasValidSSL: false };
    }
    
    // Test SSL validity with a HEAD request
    try {
      await axios.head(url, {
        timeout: 3000,
        httpsAgent: new https.Agent({ rejectUnauthorized: true }),
      });
      return { isHTTPS: true, hasValidSSL: true };
    } catch (sslError) {
      return { isHTTPS: true, hasValidSSL: false };
    }
  } catch (error) {
    return { isHTTPS: false, hasValidSSL: false };
  }
}

/**
 * Check domain age using WHOIS-like services
 * In production, integrate with WHOIS API services
 */
async function checkDomainAge(domain: string): Promise<number | undefined> {
  try {
    // Placeholder - in production, use WHOIS API like:
    // - whoisxmlapi.com
    // - whois.domaintools.com
    // - api.whoxy.com
    
    // For now, return undefined (unknown)
    // Example implementation:
    // const response = await axios.get(`https://api.whoisxmlapi.com/v1`, {
    //   params: { domainName: domain, apiKey: process.env.WHOIS_API_KEY }
    // });
    // return calculateYearsSince(response.data.createdDate);
    
    return undefined;
  } catch (error) {
    console.error('Domain age check error:', error);
    return undefined;
  }
}

/**
 * Analyze domain reputation
 */
async function analyzeDomainReputation(url: string): Promise<DomainReputation> {
  const domain = extractDomain(url);
  const flags: string[] = [];
  let trustScore = 0.5; // Neutral baseline
  let category: DomainReputation['category'] = 'unknown';
  
  // Check if it's a trusted source
  if (TRUSTED_SRI_LANKAN_DOMAINS.includes(domain)) {
    trustScore = 0.9;
    category = 'trusted';
    flags.push('Verified Sri Lankan trusted source');
  } else if (TRUSTED_INTERNATIONAL_DOMAINS.includes(domain)) {
    trustScore = 0.85;
    category = 'trusted';
    flags.push('Verified international trusted source');
  }
  
  // Check for suspicious TLD
  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
  if (hasSuspiciousTLD) {
    trustScore -= 0.3;
    category = 'suspicious';
    flags.push('Domain uses suspicious TLD');
  }
  
  // Check for very long domain (often spam)
  if (domain.length > 40) {
    trustScore -= 0.2;
    flags.push('Unusually long domain name');
  }
  
  // Check for excessive hyphens (often spam)
  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount > 3) {
    trustScore -= 0.15;
    flags.push('Excessive hyphens in domain');
  }
  
  // Check for numbers in domain (can be suspicious)
  if (/\d{3,}/.test(domain)) {
    trustScore -= 0.1;
    flags.push('Contains multiple numbers');
  }
  
  // Check HTTPS and SSL
  const { isHTTPS, hasValidSSL } = await checkHTTPSAndSSL(url);
  
  if (!isHTTPS) {
    trustScore -= 0.2;
    flags.push('Not using HTTPS');
  } else if (!hasValidSSL) {
    trustScore -= 0.15;
    flags.push('Invalid SSL certificate');
  }
  
  // Check domain age
  const age = await checkDomainAge(domain);
  if (age !== undefined) {
    if (age < 1) {
      trustScore -= 0.2;
      category = 'suspicious';
      flags.push('Very new domain (< 1 year)');
    } else if (age > 5) {
      trustScore += 0.1;
      flags.push('Established domain (> 5 years)');
    }
  }
  
  // Determine category if not already set
  if (category === 'unknown') {
    if (trustScore >= 0.7) category = 'trusted';
    else if (trustScore >= 0.4) category = 'neutral';
    else category = 'suspicious';
  }
  
  return {
    domain,
    age,
    isHTTPS,
    hasValidSSL,
    trustScore: Math.max(0, Math.min(1, trustScore)),
    category,
    flags,
  };
}

/**
 * Analyze author credibility
 * In production, integrate with journalist databases, social media verification
 */
function analyzeAuthorCredibility(authorName?: string): AuthorCredibility {
  if (!authorName || authorName.trim() === '') {
    return {
      hasAuthor: false,
      credibilityScore: 0.3, // No author attribution is suspicious
    };
  }
  
  // Check for anonymous or vague authors
  const lowerAuthor = authorName.toLowerCase();
  const vagueAuthors = ['staff', 'admin', 'user', 'guest', 'anonymous', 'unknown'];
  
  if (vagueAuthors.some(vague => lowerAuthor.includes(vague))) {
    return {
      author: authorName,
      hasAuthor: true,
      credibilityScore: 0.4,
    };
  }
  
  // In production, check against:
  // - Verified journalist databases
  // - LinkedIn profiles
  // - Twitter verification
  // - Past publication history
  
  return {
    author: authorName,
    hasAuthor: true,
    credibilityScore: 0.6, // Neutral - has author but not verified
  };
}

/**
 * Comprehensive source reputation analysis
 */
export async function analyzeSourceReputation(urls: string[], authors?: string[]): Promise<SourceReputation> {
  console.log('Analyzing source reputation for', urls.length, 'URLs...');
  
  // Analyze all domains in parallel
  const domainPromises = urls.map(url => analyzeDomainReputation(url));
  const domains = await Promise.all(domainPromises);
  
  // Analyze authors
  const authorsList = authors || [];
  const authorsAnalysis = authorsList.map(author => analyzeAuthorCredibility(author));
  
  const warnings: string[] = [];
  
  // Calculate overall trust score
  const avgDomainTrust = domains.length > 0
    ? domains.reduce((sum, d) => sum + d.trustScore, 0) / domains.length
    : 0.5;
  
  const avgAuthorCredibility = authorsAnalysis.length > 0
    ? authorsAnalysis.reduce((sum, a) => sum + a.credibilityScore, 0) / authorsAnalysis.length
    : 0.5;
  
  const overallTrustScore = (avgDomainTrust * 0.7) + (avgAuthorCredibility * 0.3);
  
  // Generate warnings
  const suspiciousDomains = domains.filter(d => d.category === 'suspicious');
  if (suspiciousDomains.length > 0) {
    warnings.push(`${suspiciousDomains.length} suspicious domain(s) detected`);
  }
  
  const noHTTPS = domains.filter(d => !d.isHTTPS);
  if (noHTTPS.length > 0) {
    warnings.push(`${noHTTPS.length} source(s) not using HTTPS`);
  }
  
  const noAuthors = authorsAnalysis.filter(a => !a.hasAuthor);
  if (noAuthors.length === authorsAnalysis.length && authorsAnalysis.length > 0) {
    warnings.push('No author attribution found');
  }
  
  // Calculate score adjustment
  let scoreAdjustment = 0;
  
  if (overallTrustScore < 0.3) {
    scoreAdjustment += 0.25; // Very untrustworthy sources
  } else if (overallTrustScore < 0.5) {
    scoreAdjustment += 0.15; // Moderately untrustworthy
  } else if (overallTrustScore > 0.8) {
    scoreAdjustment -= 0.2; // Highly trustworthy sources
  }
  
  return {
    domains,
    authors: authorsAnalysis,
    overallTrustScore,
    scoreAdjustment: Math.max(-0.25, Math.min(0.3, scoreAdjustment)),
    warnings,
  };
}

/**
 * Quick domain trust check (without full analysis)
 */
export function quickDomainCheck(url: string): { isTrusted: boolean; domain: string } {
  const domain = extractDomain(url);
  const isTrusted = 
    TRUSTED_SRI_LANKAN_DOMAINS.includes(domain) ||
    TRUSTED_INTERNATIONAL_DOMAINS.includes(domain);
  
  return { isTrusted, domain };
}
