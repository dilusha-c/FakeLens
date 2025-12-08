import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Extracts main content from a URL
 */
export async function extractContentFromUrl(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Remove script and style elements
    $('script, style, nav, footer, aside').remove();

    // Try to find main content
    let mainContent = '';
    
    // Look for common article selectors
    const article = $('article').first();
    const mainTag = $('main').first();
    
    if (article.length) {
      mainContent = article.text();
    } else if (mainTag.length) {
      mainContent = mainTag.text();
    } else {
      // Fallback to body
      mainContent = $('body').text();
    }

    // Clean up whitespace
    mainContent = mainContent.replace(/\s+/g, ' ').trim();

    // Get title
    const title = $('title').text() || $('h1').first().text() || '';

    return `${title}\n\n${mainContent}`.substring(0, 5000); // Limit length
  } catch (error) {
    throw new Error(`Failed to extract content from URL: ${error}`);
  }
}

/**
 * Checks if text is likely a URL
 */
export function isUrl(text: string): boolean {
  return text.includes('http://') || text.includes('https://');
}

/**
 * Checks if text is likely a follow-up question
 */
export function isFollowUpQuestion(text: string): boolean {
  const questionWords = ['why', 'how', 'what', 'where', 'when', 'who', 'which', 'proof', 'source', 'evidence', 'sure', 'certain'];
  const lowerText = text.toLowerCase();
  
  // Short text with question words
  if (text.length < 200 && questionWords.some(word => lowerText.includes(word))) {
    return true;
  }

  // Contains question mark
  if (text.includes('?')) {
    return true;
  }

  return false;
}
