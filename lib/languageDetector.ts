/**
 * Detects the language of input text
 */
export function detectLanguage(text: string): 'si' | 'en' {
  // Check for Sinhala Unicode range (0D80-0DFF)
  const sinhalaRegex = /[\u0D80-\u0DFF]/;
  
  if (sinhalaRegex.test(text)) {
    return 'si';
  }
  
  return 'en';
}

/**
 * Get language name for display
 */
export function getLanguageName(code: 'si' | 'en'): string {
  return code === 'si' ? 'Sinhala' : 'English';
}
