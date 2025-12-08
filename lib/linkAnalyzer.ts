/**
 * Link Analyzer
 * Automatically identifies and analyzes links from social media, news sites, etc.
 * Extracts content and determines if it's suitable for fact-checking
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LinkAnalysis {
  url: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'tiktok' | 'whatsapp' | 'news' | 'blog' | 'website' | 'unknown';
  contentType: 'news-article' | 'factual-claim' | 'opinion' | 'story' | 'entertainment' | 'advertisement' | 'personal-post' | 'unknown';
  isFactCheckable: boolean;
  extractedContent?: string;
  metadata?: {
    title?: string;
    author?: string;
    publishDate?: string;
    description?: string;
    siteName?: string;
  };
  warnings: string[];
  reason?: string; // Why it's not fact-checkable
}

// Social media platform patterns
const PLATFORM_PATTERNS = {
  facebook: [/facebook\.com/, /fb\.com/, /fb\.watch/],
  twitter: [/twitter\.com/, /x\.com/, /t\.co/],
  instagram: [/instagram\.com/, /instagr\.am/],
  youtube: [/youtube\.com/, /youtu\.be/],
  tiktok: [/tiktok\.com/],
  whatsapp: [/wa\.me/, /chat\.whatsapp\.com/],
};

// News site indicators
const NEWS_INDICATORS = [
  'news', 'daily', 'times', 'post', 'gazette', 'herald', 'tribune',
  'mirror', 'observer', 'journal', 'reporter', 'press', 'media',
  'hirunews', 'adaderana', 'newsfirst', 'lankaviews',
];

// Content type indicators
const CONTENT_TYPE_KEYWORDS = {
  opinion: ['opinion', 'editorial', 'commentary', 'column', 'perspective', 'viewpoint', 'i think', 'i believe', 'in my view'],
  story: ['story', 'tale', 'fiction', 'novel', 'short story', 'narrative', 'once upon a time'],
  entertainment: ['entertainment', 'celebrity', 'gossip', 'movie', 'music', 'review', 'trailer', 'playlist'],
  advertisement: ['ad', 'advertisement', 'sponsored', 'promotion', 'advertorial', 'buy now', 'limited offer'],
  personalPost: ['diary', 'journal', 'my thoughts', 'my experience', 'personal blog', 'vlog'],
  // Factual claims can include scientific, historical, health, or any verifiable statements
  factualClaim: [
    'study shows', 'research', 'according to', 'scientists', 'experts', 'data',
    'statistics', 'percentage', 'announced', 'confirmed', 'reported', 'discovered',
    'theory', 'law of', 'physics', 'chemistry', 'biology', 'mathematics',
    'historical', 'evidence', 'proof', 'experiment', 'tested', 'verified'
  ],
};

/**
 * Identify platform from URL
 */
function identifyPlatform(url: string): LinkAnalysis['platform'] {
  const lowerUrl = url.toLowerCase();
  
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(lowerUrl))) {
      return platform as LinkAnalysis['platform'];
    }
  }
  
  // Check if it's a news site
  if (NEWS_INDICATORS.some(indicator => lowerUrl.includes(indicator))) {
    return 'news';
  }
  
  // Check if it's a blog
  if (lowerUrl.includes('blog') || lowerUrl.includes('medium.com') || lowerUrl.includes('wordpress')) {
    return 'blog';
  }
  
  return 'website';
}

/**
 * Extract metadata from HTML
 */
async function extractMetadata(url: string, html: string): Promise<LinkAnalysis['metadata']> {
  const $ = cheerio.load(html);
  
  const metadata: LinkAnalysis['metadata'] = {
    title: 
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      undefined,
    
    author:
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('[rel="author"]').text() ||
      $('.author').text() ||
      undefined,
    
    publishDate:
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="publish-date"]').attr('content') ||
      $('time[datetime]').attr('datetime') ||
      $('.publish-date').text() ||
      undefined,
    
    description:
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      undefined,
    
    siteName:
      $('meta[property="og:site_name"]').attr('content') ||
      undefined,
  };
  
  return metadata;
}

/**
 * Extract main content from HTML
 */
function extractMainContent(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, iframe, advertisement').remove();
  
  // Try to find main content area
  let content = 
    $('article').text() ||
    $('.article-content').text() ||
    $('.post-content').text() ||
    $('.entry-content').text() ||
    $('main').text() ||
    $('.content').text() ||
    $('body').text();
  
  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  return content.substring(0, 5000); // Limit to 5000 chars
}

/**
 * Determine content type based on metadata and content
 */
function determineContentType(metadata: LinkAnalysis['metadata'], content: string, url: string): LinkAnalysis['contentType'] {
  const textToAnalyze = `${metadata?.title || ''} ${metadata?.description || ''} ${content}`.toLowerCase();
  const urlLower = url.toLowerCase();
  
  // Check URL path for indicators
  if (urlLower.includes('/opinion/') || urlLower.includes('/editorial/')) {
    return 'opinion';
  }
  
  if (urlLower.includes('/entertainment/') || urlLower.includes('/celebrity/')) {
    return 'entertainment';
  }
  
  if (urlLower.includes('/sponsored/') || urlLower.includes('/ad/')) {
    return 'advertisement';
  }
  
  // Check for pure fiction/story indicators
  const storyKeywords = CONTENT_TYPE_KEYWORDS.story || [];
  const storyMatches = storyKeywords.filter(keyword => textToAnalyze.includes(keyword)).length;
  if (storyMatches >= 2) {
    return 'story';
  }
  
  // Check for factual claims (scientific, historical, health, physics, etc.)
  const factualKeywords = CONTENT_TYPE_KEYWORDS.factualClaim || [];
  const factualMatches = factualKeywords.filter(keyword => textToAnalyze.includes(keyword)).length;
  
  // Even one factual indicator makes it checkable
  if (factualMatches >= 1) {
    return 'factual-claim';
  }
  
  // Check for opinion indicators (but allow if contains factual claims)
  const opinionKeywords = CONTENT_TYPE_KEYWORDS.opinion || [];
  const opinionMatches = opinionKeywords.filter(keyword => textToAnalyze.includes(keyword)).length;
  if (opinionMatches >= 2 && factualMatches === 0) {
    return 'opinion';
  }
  
  // Check for entertainment
  const entertainmentKeywords = CONTENT_TYPE_KEYWORDS.entertainment || [];
  const entertainmentMatches = entertainmentKeywords.filter(keyword => textToAnalyze.includes(keyword)).length;
  if (entertainmentMatches >= 2) {
    return 'entertainment';
  }
  
  // Check for advertisement
  const adKeywords = CONTENT_TYPE_KEYWORDS.advertisement || [];
  const adMatches = adKeywords.filter(keyword => textToAnalyze.includes(keyword)).length;
  if (adMatches >= 2) {
    return 'advertisement';
  }
  
  // Check for personal blog/diary
  const personalKeywords = CONTENT_TYPE_KEYWORDS.personalPost || [];
  const personalMatches = personalKeywords.filter(keyword => textToAnalyze.includes(keyword)).length;
  if (personalMatches >= 2 && factualMatches === 0) {
    return 'personal-post';
  }
  
  // Check for news article structure
  if (metadata?.author && metadata?.publishDate) {
    return 'news-article';
  }
  
  // Default to factual-claim if uncertain (prefer fact-checking over rejection)
  return 'factual-claim';
}

/**
 * Determine if content is fact-checkable
 */
function isFactCheckable(
  platform: LinkAnalysis['platform'],
  contentType: LinkAnalysis['contentType'],
  metadata: LinkAnalysis['metadata']
): { checkable: boolean; reason?: string } {
  // ALL social media posts can contain factual claims - always fact-check
  if (platform === 'facebook' || platform === 'twitter' || platform === 'whatsapp' || 
      platform === 'instagram' || platform === 'youtube' || platform === 'tiktok') {
    return { checkable: true };
  }
  
  // Factual claims are ALWAYS checkable (includes scientific theories, physics, health, etc.)
  if (contentType === 'factual-claim') {
    return { checkable: true };
  }
  
  // News articles are checkable
  if (contentType === 'news-article') {
    return { checkable: true };
  }
  
  // Pure opinion pieces without factual claims
  if (contentType === 'opinion') {
    return {
      checkable: false,
      reason: 'This is a pure opinion piece without factual claims. If the opinion mentions specific facts, statistics, or scientific theories, paste those claims separately for fact-checking.',
    };
  }
  
  // Pure fiction/stories without factual claims
  if (contentType === 'story') {
    return {
      checkable: false,
      reason: 'This appears to be fictional content. If the story makes claims about real events, science, or history, extract those specific claims for fact-checking.',
    };
  }
  
  // Entertainment content - often not factual
  if (contentType === 'entertainment') {
    return {
      checkable: false,
      reason: 'This is entertainment content. If it contains specific factual claims about science, health, or events, extract those claims separately for verification.',
    };
  }
  
  // Advertisements
  if (contentType === 'advertisement') {
    return {
      checkable: false,
      reason: 'This is promotional content. If it makes specific health claims, scientific assertions, or product efficacy claims, paste those separately for fact-checking.',
    };
  }
  
  // Personal posts without factual claims
  if (contentType === 'personal-post') {
    return {
      checkable: false,
      reason: 'This is a personal blog post or diary. If it contains factual claims about science, health, or current events, extract those specific claims for verification.',
    };
  }
  
  // Unknown content - allow fact-checking by default
  return { checkable: true };
}

/**
 * Analyze link and extract content
 */
export async function analyzeLink(url: string): Promise<LinkAnalysis> {
  console.log('Analyzing link:', url);
  
  const platform = identifyPlatform(url);
  const warnings: string[] = [];
  
  try {
    // Fetch page content
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const html = response.data;
    
    // Extract metadata and content
    const metadata = await extractMetadata(url, html);
    const extractedContent = extractMainContent(html);
    
    // Determine content type
    const contentType = determineContentType(metadata, extractedContent, url);
    
    // Check if fact-checkable
    const { checkable, reason } = isFactCheckable(platform, contentType, metadata);
    
    // Add platform-specific warnings
    if (platform === 'facebook' || platform === 'twitter' || platform === 'instagram') {
      warnings.push('Social media content: Verify claims independently as posts may be misleading or taken out of context');
    }
    
    if (platform === 'whatsapp') {
      warnings.push('WhatsApp forward: High risk of misinformation. Always verify through trusted sources');
    }
    
    if (platform === 'youtube' || platform === 'tiktok') {
      warnings.push('Video content detected: Analyze claims made in video separately');
    }
    
    if (!metadata?.author) {
      warnings.push('No author information found');
    }
    
    if (!metadata?.publishDate) {
      warnings.push('No publication date found');
    }
    
    return {
      url,
      platform,
      contentType,
      isFactCheckable: checkable,
      extractedContent: extractedContent.substring(0, 1000), // Limit for response
      metadata,
      warnings,
      reason,
    };
  } catch (error) {
    console.error('Link analysis error:', error);
    
    // Return basic analysis even if fetching fails
    return {
      url,
      platform,
      contentType: 'unknown',
      isFactCheckable: true, // Default to checkable if we can't determine
      warnings: ['Could not fetch page content. The link may be broken, require authentication, or block automated access.'],
    };
  }
}

/**
 * Extract all links from text
 */
export function extractLinks(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  
  // Clean up URLs (remove trailing punctuation)
  return matches.map(url => url.replace(/[.,;!?)]$/, ''));
}

/**
 * Analyze multiple links in text
 */
export async function analyzeAllLinks(text: string): Promise<LinkAnalysis[]> {
  const links = extractLinks(text);
  
  if (links.length === 0) {
    return [];
  }
  
  console.log(`Found ${links.length} link(s) to analyze`);
  
  // Analyze all links in parallel (limit to 5 to avoid overwhelming)
  const linksToAnalyze = links.slice(0, 5);
  const analyses = await Promise.all(
    linksToAnalyze.map(link => analyzeLink(link))
  );
  
  return analyses;
}

/**
 * Get fact-checking suggestions for non-checkable content
 */
export function getFactCheckingSuggestions(analysis: LinkAnalysis): string {
  if (analysis.isFactCheckable) {
    return '';
  }
  
  const contentTypeMap: Record<string, string> = {
    opinion: 'For fact-checking, look for: Specific factual claims mentioned in the opinion → Data or statistics cited → Attributions to studies or reports',
    story: 'This is creative content. If you suspect a story is being shared as real news, search for: News articles about this incident → Official statements → Location/person verification',
    entertainment: 'To verify entertainment claims: Check official celebrity social media → Verified news sources → IMDb or other entertainment databases',
    advertisement: 'To verify product claims: Independent product reviews → Consumer protection agencies → Medical/scientific studies (for health claims)',
    personalPost: 'For personal blog verification: Check author credentials → Look for cited sources → Cross-reference any specific claims with news sources',
  };
  
  return contentTypeMap[analysis.contentType] || 'Extract specific factual claims from this content and verify them separately.';
}
