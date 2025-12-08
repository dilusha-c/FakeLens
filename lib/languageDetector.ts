/**
 * Detects the language of input text
 */
export function detectLanguage(text: string): 'si' | 'en' | 'ta' {
  // Check for Sinhala Unicode range (0D80-0DFF)
  const sinhalaRegex = /[\u0D80-\u0DFF]/;
  // Check for Tamil Unicode range (0B80-0BFF)
  const tamilRegex = /[\u0B80-\u0BFF]/;
  
  if (sinhalaRegex.test(text)) {
    return 'si';
  }

  if (tamilRegex.test(text)) {
    return 'ta';
  }
  
  return 'en';
}

/**
 * Get language name for display
 */
export function getLanguageName(code: 'si' | 'en' | 'ta'): string {
  if (code === 'si') return 'Sinhala';
  if (code === 'ta') return 'Tamil';
  return 'English';
}
