import axios from 'axios';
import { Analysis, Message } from '@/types';

// Available models in order of preference (best to fallback)
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-exp',
  'gemma-3-12b',
  'gemma-3-4b',
  'gemma-3-2b',
];

/**
 * Call Gemini API with automatic model fallback on quota errors
 */
async function callGeminiWithFallback(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  let lastError: any;
  
  // Try each model until one succeeds
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      if (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
        console.log(`Success with model: ${model}`);
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (error: any) {
      lastError = error;
      const isQuotaError = error.response?.status === 429;
      
      if (isQuotaError) {
        console.log(`Quota exceeded for ${model}, trying next model...`);
        continue; // Try next model
      } else {
        // Other errors, stop trying
        console.error(`Error with ${model}:`, error.message);
        throw error;
      }
    }
  }
  
  // All models failed
  throw lastError || new Error('All models failed');
}

/**
 * Generates a response for a new claim analysis
 */
export async function generateClaimResponse(analysis: Analysis, language: 'si' | 'en' | 'ta' = 'en'): Promise<string> {
  const languageInstruction = language === 'si' 
    ? 'Respond in Sinhala (සිංහල). Provide a brief, clear explanation in Sinhala.'
    : language === 'ta'
    ? 'Respond in Tamil (தமிழ்). Provide a brief, clear explanation in Tamil.'
    : 'Respond in English.';

  // Special handling for unanalyzable claims
  if (analysis.verdict === 'unanalyzable') {
    const prompt = `You are FakeLens, a fact-checking assistant. ${languageInstruction}

The user entered: "${analysis.claimText}"

This text cannot be analyzed because it's too short or vague to fact-check. It appears to be just a name, location, or incomplete statement without any actual claim to verify.

Provide a brief, polite message (2-3 sentences) explaining:
1. That this cannot be fact-checked because it's not a complete claim
2. Ask the user to provide a specific claim or statement to verify
3. Give an example of what a verifiable claim would look like

Be helpful and friendly. Do NOT label it as "FAKE" or "TRUE". Simply explain it cannot be analyzed.

${language === 'si' ? 'Remember to respond in Sinhala.' : ''}`;

    return await callGeminiWithFallback(prompt);
  }

  const prompt = `You are FakeLens, a fact-checking assistant. ${languageInstruction} A claim has been analyzed with the following results:

Claim: "${analysis.claimText}"

Verdict: ${analysis.verdict.toUpperCase()}
Confidence: ${(analysis.confidence * 100).toFixed(0)}%
Fake Likelihood: ${(analysis.confidence * 100).toFixed(0)}%

Reasons:
${analysis.reasons.map(r => `- ${r}`).join('\n')}

Supporting Sources (${analysis.supportLinks.length}):
${analysis.supportLinks.slice(0, 3).map(l => `- ${l.title} (${l.source})`).join('\n') || '- None found'}

Fact Checks / Debunking Sources (${analysis.debunkLinks.length}):
${analysis.debunkLinks.slice(0, 3).map(l => `- ${l.title} (${l.source})${l.rating ? ` - Rating: ${l.rating}` : ''}`).join('\n') || '- None found'}

Based ONLY on this analysis data, provide a brief, clear explanation (2-3 sentences) of the verdict. Explain why this claim is likely ${analysis.verdict}. Reference the specific reasons and evidence provided above. Do not invent new facts or sources. Keep it conversational but accurate.

${language === 'si' ? 'Remember to include a disclaimer in Sinhala that this is an automated estimation and users should verify with official sources.' : 'Remember to include a disclaimer that this is an automated estimation and users should verify with official sources.'}`;

  return await callGeminiWithFallback(prompt);
}

/**
 * Generates a response for a follow-up question with fresh internet search
 */
export async function generateFollowUpWithSearch(
  question: string,
  searchResults: { title: string; url: string; source: string; snippet?: string }[],
  language: 'si' | 'en' | 'ta' = 'en'
): Promise<string> {
  const languageInstruction = language === 'si' 
    ? 'Respond in Sinhala (සිංහල).'
    : language === 'ta'
    ? 'Respond in Tamil (தமிழ்).'
    : 'Respond in English.';

  const resultsText = searchResults
    .slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.title}\n   Source: ${r.source}\n   URL: ${r.url}${r.snippet ? `\n   Snippet: ${r.snippet}` : ''}`)
    .join('\n\n');

  const prompt = `You are FakeLens, a fact-checking assistant. ${languageInstruction} A user asked a factual question, and here are the latest search results from the internet:

User Question: "${question}"

Search Results:
${resultsText}

Based on these search results, provide a clear, accurate answer to the user's question. Cite the specific sources when possible. If the results don't fully answer the question, acknowledge what information is available and what's uncertain. Keep your response concise (2-4 sentences) and conversational.`;

  return await callGeminiWithFallback(prompt);
}

/**
 * Generates a response for a follow-up question
 */
export async function generateFollowUpResponse(
  question: string,
  analysis: Analysis,
  conversationHistory: Message[],
  language: 'si' | 'en' | 'ta' = 'en'
): Promise<string> {
  const languageInstruction = language === 'si' 
    ? 'Respond in Sinhala (සිංහල).'
    : language === 'ta'
    ? 'Respond in Tamil (தமிழ்).'
    : 'Respond in English.';

  const historyText = conversationHistory
    .slice(-4) // Last 4 messages for context
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const prompt = `You are FakeLens, a fact-checking assistant. ${languageInstruction} A user is asking a follow-up question about a previously analyzed claim.

Original Claim: "${analysis.claimText}"

Analysis Results:
Verdict: ${analysis.verdict.toUpperCase()}
Confidence: ${(analysis.confidence * 100).toFixed(0)}%

Reasons:
${analysis.reasons.map(r => `- ${r}`).join('\n')}

Supporting Sources:
${analysis.supportLinks.map(l => `- ${l.title} (${l.source}) - ${l.url}`).join('\n') || '- None found'}

Fact Checks / Debunking Sources:
${analysis.debunkLinks.map(l => `- ${l.title} (${l.source})${l.rating ? ` - Rating: ${l.rating}` : ''} - ${l.url}`).join('\n') || '- None found'}

Recent Conversation:
${historyText}

User Question: "${question}"

Answer the user's question based ONLY on the analysis data and evidence links provided above. If the question asks for proof or sources, cite the specific links from the lists above. Do not invent new information or sources. Be helpful and conversational, but stick to the facts from the analysis.

Keep your response concise (2-4 sentences unless more detail is needed).`;

  return await callGeminiWithFallback(prompt);
}
