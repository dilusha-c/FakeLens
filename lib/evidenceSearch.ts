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
  return results.map(({ title, url, source }) => ({ title, url, source }));
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

        if (isTrusted || !isLowTrust) {
          results.push({
            title: item.title,
            url: item.link,
            source: domain,
            snippet: item.snippet,
          });
        }
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
          
          results.push({
            title: claim.text || review.title || 'Fact Check',
            url: review.url,
            source: review.publisher?.name || 'Fact Checker',
            rating: review.textualRating,
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

  // Classify SerpAPI results (trusted sources as support)
  for (const link of serpApiResults) {
    const isTrusted = TRUSTED_DOMAINS.some(d => link.source.includes(d));
    if (isTrusted) {
      supportLinks.push(link);
    }
  }

  // Classify fact check results by rating
  for (const link of factCheckResults) {
    if (link.rating) {
      const rating = link.rating.toLowerCase();
      const isFalse = rating.includes('false') || rating.includes('incorrect') || 
                      rating.includes('misleading') || rating.includes('pants on fire');
      const isTrue = rating.includes('true') || rating.includes('correct') || 
                     rating.includes('accurate');

      if (isFalse) {
        debunkLinks.push(link);
      } else if (isTrue) {
        supportLinks.push(link);
      } else {
        // Mixed or uncertain ratings go to debunk
        debunkLinks.push(link);
      }
    } else {
      // No rating, add to debunk as fact check reference
      debunkLinks.push(link);
    }
  }

  return { supportLinks, debunkLinks };
}
