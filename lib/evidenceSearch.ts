import axios from 'axios';
import { EvidenceLink } from '@/types';

// Trusted news domains
const TRUSTED_DOMAINS = [
  'bbc.com', 'bbc.co.uk', 'reuters.com', 'apnews.com', 'npr.org',
  'theguardian.com', 'nytimes.com', 'washingtonpost.com', 'wsj.com',
  'cnn.com', 'abcnews.go.com', 'nbcnews.com', 'cbsnews.com',
  'bloomberg.com', 'ft.com', 'economist.com', 'time.com',
  'nature.com', 'science.org', 'scientificamerican.com',
  // Sinhala/Sri Lankan sources
  'adaderana.lk', 'newsfirst.lk', 'dailynews.lk', 'sundaytimes.lk',
  'island.lk', 'colombogazette.com', 'dailymirror.lk', 'ft.lk',
  'lankacnews.com', 'newswire.lk', 'lankatruth.com'
];

// Known low-trust domains
const LOW_TRUST_DOMAINS = [
  'infowars.com', 'naturalnews.com', 'beforeitsnews.com',
  'worldnewsdailyreport.com', 'empirenews.net'
];

/**
 * Searches SerpAPI for relevant articles
 */
export async function searchBing(query: string, language: 'si' | 'en' | 'ta' = 'en'): Promise<EvidenceLink[]> {
  const results = await searchWithSnippets(query, language);
  return results.map(({ title, url, source, snippet }) => ({ title, url, source, snippet }));
}

/**
 * Searches SerpAPI and returns results with snippets
 */
export async function searchWithSnippets(query: string, language: 'si' | 'en' | 'ta' = 'en'): Promise<Array<{ title: string; url: string; source: string; snippet?: string }>> {
  const apiKey = process.env.SERPAPI_API_KEY;
  
  if (!apiKey) {
    console.warn('SERPAPI_API_KEY not configured');
    return [];
  }

  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: apiKey,
        q: query,
        engine: 'google',
        num: 10,
        gl: language === 'si' || language === 'ta' ? 'lk' : 'us', // Sri Lanka for Sinhala/Tamil, otherwise US
        hl: language === 'si' ? 'si' : language === 'ta' ? 'ta' : 'en', // Sinhala, Tamil or English
      },
    });

    const results: Array<{ title: string; url: string; source: string; snippet?: string }> = [];

    if (response.data.organic_results) {
      for (const item of response.data.organic_results) {
        const domain = extractDomain(item.link);
        const isTrusted = TRUSTED_DOMAINS.some(d => domain.includes(d));
        const isLowTrust = LOW_TRUST_DOMAINS.some(d => domain.includes(d));

        // Keep results but tag them; filtering is done later in classification
        results.push({
          title: item.title,
          url: item.link,
          source: domain,
          snippet: item.snippet,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return [];
  }
}

/**
 * Searches Google Fact Check API
 */
export async function searchFactCheck(query: string): Promise<EvidenceLink[]> {
  const apiKey = process.env.GOOGLE_FACTCHECK_API_KEY;

  if (!apiKey) {
    console.warn('GOOGLE_FACTCHECK_API_KEY not configured');
    return [];
  }

  try {
    const response = await axios.get('https://factchecktools.googleapis.com/v1alpha1/claims:search', {
      params: {
        key: apiKey,
        query: query,
        languageCode: 'en',
      },
    });

    const results: EvidenceLink[] = [];

    if (response.data.claims) {
      for (const claim of response.data.claims) {
        if (claim.claimReview && claim.claimReview.length > 0) {
          const review = claim.claimReview[0];
          // Map fact-check review to EvidenceLink with a rating and moderate confidence
          results.push({
            title: claim.text || review.title || 'Fact Check',
            url: review.url,
            source: review.publisher?.name || 'Fact Checker',
            rating: review.textualRating,
            snippet: review.title || claim.text,
            confidence: 0.9, // fact-check result is high-confidence evidence
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Fact check search error:', error);
    return [];
  }
}

/**
 * Extracts domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Classifies links as support or debunk based on titles and ratings
 */
export function classifyLinks(
  serpApiResults: EvidenceLink[],
  factCheckResults: EvidenceLink[]
): { supportLinks: EvidenceLink[]; debunkLinks: EvidenceLink[] } {
  const supportLinks: EvidenceLink[] = [];
  const debunkLinks: EvidenceLink[] = [];

  // Classify SerpAPI results using title/snippet and domain reputation
  const debunkKeywords = ['debunk', 'fact-check', 'fact check', 'false', 'incorrect', 'misleading', 'hoax', 'not true', 'fake', 'fabricated'];
  const supportKeywords = ['confirmed', 'reported', 'official', 'announced', 'said', 'statement', 'according to', 'verifiable'];

  for (const link of serpApiResults) {
    const domain = link.source || '';
    const title = (link.title || '').toLowerCase();
    const snippet = (link.snippet || '').toLowerCase();

    // Start with neutral confidence
    let confidence = 0.5;

    // Boost confidence for trusted domains
    if (TRUSTED_DOMAINS.some(d => domain.includes(d))) {
      confidence = Math.max(confidence, 0.75);
    }
    // Lower for known low-trust domains
    if (LOW_TRUST_DOMAINS.some(d => domain.includes(d))) {
      confidence = Math.min(confidence, 0.25);
    }

    // Check for debunking language in title/snippet
    const hasDebunk = debunkKeywords.some(k => title.includes(k) || snippet.includes(k));
    const hasSupport = supportKeywords.some(k => title.includes(k) || snippet.includes(k));

    if (hasDebunk && !hasSupport) {
      // Treat as debunk evidence
      link.confidence = Math.min(1, (link.confidence || confidence) + 0.25);
      debunkLinks.push(link);
    } else if (hasSupport && !hasDebunk) {
      // Treat as supporting evidence
      link.confidence = Math.min(1, (link.confidence || confidence) + 0.2);
      supportLinks.push(link);
    } else {
      // Neutral result: only treat as support when the source is trusted; otherwise keep it neutral
      if (TRUSTED_DOMAINS.some(d => domain.includes(d))) {
        link.confidence = link.confidence ?? confidence;
        supportLinks.push(link);
      }
      // If the source is unverified/low trust and not explicitly supportive, skip to avoid biasing toward "real"
    }
  }

  // Classify fact check results by rating
  // Use fact-check results with stronger weights
  for (const link of factCheckResults) {
    const rating = (link.rating || '').toLowerCase();
    const isFalse = rating.includes('false') || rating.includes('incorrect') || rating.includes('misleading') || rating.includes('pants on fire');
    const isTrue = rating.includes('true') || rating.includes('correct') || rating.includes('accurate');

    // Default high confidence for fact-check entries unless specified
    link.confidence = link.confidence ?? 0.9;

    if (isFalse) {
      debunkLinks.push(link);
    } else if (isTrue) {
      supportLinks.push(link);
    } else {
      // No explicit rating - treat as debunk reference but lower confidence
      link.confidence = Math.min(0.85, link.confidence);
      debunkLinks.push(link);
    }
  }

  return { supportLinks, debunkLinks };
}
