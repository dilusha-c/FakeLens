import { NextRequest, NextResponse } from 'next/server';
import { ChatApiRequest, ChatApiResponse, Analysis } from '@/types';
import { extractContentFromUrl, isUrl, isFollowUpQuestion } from '@/lib/textExtractor';
import { detectFakeNews, scoreToVerdict, scoreToConfidence } from '@/lib/fakeDetector';
import { searchBing, searchFactCheck, classifyLinks, searchWithSnippets } from '@/lib/evidenceSearch';
import { generateClaimResponse, generateFollowUpResponse, generateFollowUpWithSearch } from '@/lib/geminiClient';
import { detectLanguage } from '@/lib/languageDetector';
import { analyzeSriLankaContent, detectSinhalaTamilAndTranslate } from '@/lib/sriLankaDetector';
import { analyzeHistoricalContext } from '@/lib/historicalContext';
import { analyzeNLP } from '@/lib/advancedNLP';
import { verifyWithExperts } from '@/lib/expertNetwork';
import { analyzeSourceReputation } from '@/lib/sourceReputation';
import { monitorRealTime } from '@/lib/realTimeMonitoring';
import { analyzeAllLinks, getFactCheckingSuggestions } from '@/lib/linkAnalyzer';

export async function POST(request: NextRequest) {
  try {
    console.log('Chat API called');
    const body: ChatApiRequest = await request.json();
    const { messages, analysis: existingAnalysis } = body;
    console.log('Received messages:', messages.length);

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    const userInput = lastMessage.content;
    console.log('User input:', userInput.substring(0, 100));

    // Detect language
    let language = detectLanguage(userInput);
    console.log('Detected language:', language);

    // Determine if this is a new claim or follow-up question
    const isFollowUp = existingAnalysis && isFollowUpQuestion(userInput) && !isUrl(userInput);
    console.log('Is follow-up:', isFollowUp);

    if (isFollowUp) {
      // Check if this is a new factual question or just asking about the analysis
      const isFactualQuestion = /\b(when|what|where|who|how many|will|start|begin|open|reopen)\b/i.test(userInput);
      
      if (isFactualQuestion) {
        // Do fresh internet search for factual questions with context
        console.log('Searching internet for factual answer...');
        // Add context from original claim to search query
        const contextualQuery = `${existingAnalysis.claimText.substring(0, 100)} ${userInput}`;
        console.log('Search query with context:', contextualQuery);
        const searchResults = await searchWithSnippets(contextualQuery, language);
        console.log('Search results found:', searchResults.length);
        
        let responseText = '';
        try {
          responseText = await generateFollowUpWithSearch(userInput, searchResults, language);
        } catch (error: any) {
          // Fallback if Gemini fails (quota exceeded, etc.)
          console.log('Gemini failed, using fallback response');
          if (searchResults.length > 0) {
            responseText = language === 'si' 
              ? `"${userInput}" ගැන මා සොයාගත් දේ මෙන්න:\n\n`
              : `Here's what I found about "${userInput}":\n\n`;
            searchResults.slice(0, 5).forEach((result, i) => {
              responseText += `${i + 1}. **${result.title}**\n`;
              if (result.snippet) {
                responseText += `   ${result.snippet}\n`;
              }
              responseText += `   ${language === 'si' ? 'මූලාශ්‍රය' : 'Source'}: [${result.source}](${result.url})\n\n`;
            });
            responseText += language === 'si' 
              ? '*මේවා විශ්වාසදායක මූලාශ්‍රවලින් ලැබුණු නවතම සෙවුම් ප්‍රතිඵල වේ.*'
              : '*These are the latest search results from trusted sources.*';
          } else {
            responseText = language === 'si'
              ? 'මම තොරතුරු සොයා බැලුවෙමි නමුත් මෑත ප්‍රතිඵල හමු නොවීය. කරුණාකර ඔබේ ප්‍රශ්නය වෙනස් ආකාරයකින් ඇසීමට උත්සාහ කරන්න.'
              : 'I searched for information but couldn\'t find recent results. Please try rephrasing your question.';
          }
        }
        
        const response: ChatApiResponse = {
          message: responseText,
          analysis: existingAnalysis, // Keep existing analysis
        };

        return NextResponse.json(response);
      } else {
        // Handle questions about the previous analysis
        console.log('Generating follow-up response...');
        let responseText = '';
        try {
          responseText = await generateFollowUpResponse(
            userInput,
            existingAnalysis,
            messages,
            language
          );
        } catch (error: any) {
          // Fallback if Gemini fails
          console.log('Gemini failed, using fallback response');
          const verdictText = language === 'si' 
            ? { fake: 'ව්‍යාජ', real: 'සත්‍ය', uncertain: 'අවිනිශ්චිත', unanalyzable: 'විශ්ලේෂණ කළ නොහැක' }
            : { fake: 'FAKE', real: 'REAL', uncertain: 'UNCERTAIN', unanalyzable: 'Cannot be analyzed' };
          
          responseText = language === 'si'
            ? `විශ්ලේෂණය මත පදනම්ව:\n\n**තීරණය:** ${verdictText[existingAnalysis.verdict]}\n**විශ්වාසය:** ${(existingAnalysis.confidence * 100).toFixed(0)}%\n\n`
            : `Based on the analysis:\n\n**Verdict:** ${existingAnalysis.verdict.toUpperCase()}\n**Confidence:** ${(existingAnalysis.confidence * 100).toFixed(0)}%\n\n`;
          
          if (existingAnalysis.supportLinks.length > 0) {
            responseText += language === 'si' ? `**සහාය දක්වන මූලාශ්‍ර:**\n` : `**Supporting sources:**\n`;
            existingAnalysis.supportLinks.slice(0, 3).forEach(link => {
              responseText += `- [${link.title}](${link.url})\n`;
            });
          }
          
          if (existingAnalysis.debunkLinks.length > 0) {
            responseText += language === 'si' ? `\n**කරුණු පරීක්ෂා මූලාශ්‍ර:**\n` : `\n**Fact-check sources:**\n`;
            existingAnalysis.debunkLinks.slice(0, 3).forEach(link => {
              responseText += `- [${link.title}](${link.url})${link.rating ? ` (${link.rating})` : ''}\n`;
            });
          }
        }

        const response: ChatApiResponse = {
          message: responseText,
          analysis: existingAnalysis, // Keep existing analysis
        };

        return NextResponse.json(response);
      }
    } else {
      // Handle new claim
      console.log('Processing new claim...');
      let claimText = userInput;
      let originalUrl: string | undefined;

      // ============================================
      // LINK ANALYSIS - Check if input contains links
      // ============================================
      console.log('Analyzing for links...');
      const linkAnalyses = await analyzeAllLinks(userInput);
      
      if (linkAnalyses.length > 0) {
        console.log(`Found ${linkAnalyses.length} link(s) to analyze`);
        
        // Check if any link is not fact-checkable
        const nonCheckableLinks = linkAnalyses.filter(analysis => !analysis.isFactCheckable);
        
        if (nonCheckableLinks.length > 0) {
          // Inform user about non-checkable content
          const link = nonCheckableLinks[0];
          const suggestions = getFactCheckingSuggestions(link);
          
          // Detect language from extracted content
          let contentLanguage = language;
          if (link.extractedContent) {
            contentLanguage = detectLanguage(link.extractedContent);
            console.log('Content language detected:', contentLanguage);
          }
          
          let responseText = '';
          
          if (contentLanguage === 'si') {
            responseText = `🔍 **අන්තර්ගත වර්ගය හඳුනාගන්නා ලදී**\n\n`;
            responseText += `මෙය **${link.contentType}** ලෙස හඳුනාගන්නා ලදී. ${link.reason}\n\n`;
            if (link.metadata?.title) {
              responseText += `**මාතෘකාව:** ${link.metadata.title}\n`;
            }
            if (link.metadata?.author) {
              responseText += `**කර්තෘ:** ${link.metadata.author}\n`;
            }
            responseText += `\n${suggestions}\n\n`;
            responseText += `කරුණාකර සත්‍යාපනය කළ හැකි නිශ්චිත කරුණු ඉදිරිපත් කරන්න.`;
          } else if (contentLanguage === 'ta') {
            responseText = `🔍 **உள்ளடக்க வகை அடையாளம் காணப்பட்டது**\n\n`;
            responseText += `இது **${link.contentType}** என அடையாளம் காணப்பட்டது. ${link.reason}\n\n`;
            if (link.metadata?.title) {
              responseText += `**தலைப்பு:** ${link.metadata.title}\n`;
            }
            if (link.metadata?.author) {
              responseText += `**ஆசிரியர்:** ${link.metadata.author}\n`;
            }
            responseText += `\n${suggestions}\n\n`;
            responseText += `சரிபார்க்கக்கூடிய குறிப்பிட்ட உண்மைகளை வழங்கவும்.`;
          } else {
            responseText = `🔍 **Content Type Identified**\n\n`;
            responseText += `This content is identified as **${link.contentType}**. ${link.reason}\n\n`;
            if (link.metadata?.title) {
              responseText += `**Title:** ${link.metadata.title}\n`;
            }
            if (link.metadata?.author) {
              responseText += `**Author:** ${link.metadata.author}\n`;
            }
            if (link.metadata?.publishDate) {
              responseText += `**Published:** ${link.metadata.publishDate}\n`;
            }
            responseText += `\n**How to fact-check this type of content:**\n${suggestions}\n\n`;
            responseText += `Please provide specific factual claims that can be verified.`;
          }
          
          // Add warnings
          if (link.warnings.length > 0) {
            responseText += contentLanguage === 'si' 
              ? `\n\n⚠️ **අවධානය:** ${link.warnings.join(', ')}`
              : contentLanguage === 'ta'
              ? `\n\n⚠️ **எச்சரிக்கை:** ${link.warnings.join(', ')}`
              : `\n\n⚠️ **Warnings:** ${link.warnings.join(', ')}`;
          }
          
          return NextResponse.json({
            message: responseText,
            analysis: undefined, // No fact-check analysis for non-checkable content
          });
        }
        
        // Extract content from the first checkable link
        const checkableLink = linkAnalyses.find(a => a.isFactCheckable);
        if (checkableLink && checkableLink.extractedContent) {
          console.log('Using content from analyzed link');
          claimText = checkableLink.extractedContent;
          originalUrl = checkableLink.url;
          
          // Detect language from extracted content and update language variable
          const extractedLanguage = detectLanguage(claimText);
          if (extractedLanguage !== 'en') {
            language = extractedLanguage;
            console.log('Updated language from extracted content:', language);
          }
          
          // Add link metadata to context
          if (checkableLink.metadata?.title) {
            claimText = `${checkableLink.metadata.title}\n\n${claimText}`;
          }
        }
      }

      // Extract content from URL if it's a direct URL (legacy support)
      if (isUrl(userInput) && !originalUrl) {
        console.log('Extracting content from URL (legacy)...');
        try {
          claimText = await extractContentFromUrl(userInput);
          originalUrl = userInput;
          console.log('Extracted text length:', claimText.length);
          
          // Detect language from extracted content
          const extractedLanguage = detectLanguage(claimText);
          if (extractedLanguage !== 'en') {
            language = extractedLanguage;
            console.log('Updated language from extracted content:', language);
          }
        } catch (error) {
          console.error('URL extraction failed:', error);
          return NextResponse.json(
            { error: 'Failed to extract content from URL. Please check the URL and try again.' },
            { status: 400 }
          );
        }
      }

      // Run fake detection
      console.log('Running fake detection...');
      const { score, reasons: detectionReasons } = detectFakeNews(claimText);
      const verdict = scoreToVerdict(score, detectionReasons);
      const confidence = scoreToConfidence(score);
      console.log('Verdict:', verdict, 'Score:', score);

      // ============================================
      // PARALLEL TRANSLATION & SEARCH
      // ============================================
      // Detect language and translate if needed (run in parallel with search)
      console.log('Detecting language and translating if needed...');
      const translationPromise = detectSinhalaTamilAndTranslate(claimText);

      // Search for evidence
      console.log('Searching for evidence...');
      const query = claimText.substring(0, 200); // Limit query length
      
      let serpApiResults = [];
      let factCheckResults = [];
      let serpApiResultsEnglish = [];
      
      try {
        // Start both original language search and translation in parallel
        const [searchResults, translationResult] = await Promise.all([
          Promise.all([
            searchBing(query, language),
            searchFactCheck(query),
          ]),
          translationPromise,
        ]);
        
        serpApiResults = searchResults[0];
        factCheckResults = searchResults[1];
        
        // If content was translated, also search with English translation
        if (translationResult.wasTranslated && translationResult.englishText !== claimText) {
          console.log('Searching with English translation...');
          const englishQuery = translationResult.englishText.substring(0, 200);
          serpApiResultsEnglish = await searchBing(englishQuery, 'en');
          console.log('Evidence found - Original:', serpApiResults.length, 'English:', serpApiResultsEnglish.length);
        } else {
          console.log('Evidence found - SerpAPI:', serpApiResults.length, 'FactCheck:', factCheckResults.length);
        }
      } catch (error) {
        console.error('Evidence search error:', error);
        // Continue with empty results
      }

      // Combine results from both searches, remove duplicates
      const allSerpResults = [...serpApiResults];
      if (serpApiResultsEnglish.length > 0) {
        // Add English results that aren't already in original results
        const existingUrls = new Set(serpApiResults.map(r => r.url));
        serpApiResultsEnglish.forEach(result => {
          if (!existingUrls.has(result.url)) {
            allSerpResults.push(result);
          }
        });
        console.log('Combined unique results:', allSerpResults.length);
      }

      // Classify links
      const { supportLinks, debunkLinks } = classifyLinks(allSerpResults, factCheckResults);
      console.log('Links classified - Support:', supportLinks.length, 'Debunk:', debunkLinks.length);
      
      // IMPORTANT: If content came from a direct URL that's a trusted Sri Lankan source,
      // add it to support links to give proper credit to the source
      if (originalUrl && checkableLink?.metadata) {
        const urlObj = new URL(originalUrl);
        const domain = urlObj.hostname.replace('www.', '');
        
        // Check if it's a trusted Sri Lankan source
        const trustedSources = [
          'newsfirst.lk', 'adaderana.lk', 'dailymirror.lk', 'economynext.com',
          'moe.gov.lk', 'gov.lk', 'dailynews.lk', 'sundaytimes.lk', 'island.lk',
          'colombogazette.com', 'ft.lk', 'newswire.lk', 'hirunews.lk',
          'lankadeepa.lk', 'divaina.lk', 'silumina.lk', 'thinakaran.lk',
          'virakesari.lk', 'president.gov.lk', 'police.lk', 'health.gov.lk', 'cbsl.gov.lk'
        ];
        
        const isTrustedSource = trustedSources.some(trusted => domain.includes(trusted));
        
        if (isTrustedSource && !supportLinks.some(link => link.url === originalUrl)) {
          supportLinks.unshift({
            title: checkableLink.metadata.title || 'Direct Source',
            url: originalUrl,
            snippet: checkableLink.extractedContent?.substring(0, 200) || '',
          });
          console.log('Added trusted source URL to support links:', domain);
        }
      }

      // ============================================
      // ADVANCED ANALYSIS LAYER
      // ============================================
      console.log('Running advanced analysis modules...');
      
      // Collect all source URLs for validation (from both searches)
      const allSourceUrls = [
        ...supportLinks.map(l => l.url),
        ...debunkLinks.map(l => l.url),
      ];
      
      // IMPORTANT: If content came from a direct URL, include it in source validation
      // This ensures trusted sources like Ada Derana get properly validated
      if (originalUrl && !allSourceUrls.includes(originalUrl)) {
        allSourceUrls.unshift(originalUrl); // Add at beginning for priority
        console.log('Added original source URL for validation:', originalUrl);
      }
      
      // Run all advanced analyses in parallel
      const [
        sriLankaAnalysis,
        historicalAnalysis,
        nlpAnalysis,
        expertVerification,
        sourceReputation,
        realTimeMonitoring,
      ] = await Promise.all([
        analyzeSriLankaContent(claimText, allSourceUrls),
        analyzeHistoricalContext(claimText),
        analyzeNLP(claimText),
        verifyWithExperts(claimText),
        analyzeSourceReputation(allSourceUrls),
        monitorRealTime(claimText),
      ]);
      
      console.log('Advanced analysis complete:', {
        sriLanka: sriLankaAnalysis.totalScoreAdjustment,
        historical: historicalAnalysis.scoreAdjustment,
        nlp: nlpAnalysis.scoreAdjustment,
        experts: expertVerification.scoreAdjustment,
        sources: sourceReputation.scoreAdjustment,
        realTime: realTimeMonitoring.scoreAdjustment,
      });
      
      // If content was translated, add note to reasons
      if (sriLankaAnalysis.details.translation.wasTranslated) {
        const langName = sriLankaAnalysis.details.translation.originalLanguage === 'si' ? 'Sinhala' : 'Tamil';
        detectionReasons.unshift(`Content translated from ${langName} for analysis`);
      }
      
      // Add Sri Lankan rumor pattern detection results
      if (sriLankaAnalysis.details.rumorPatterns.detectedPatterns.length > 0) {
        sriLankaAnalysis.details.rumorPatterns.detectedPatterns.forEach(pattern => {
          detectionReasons.push(pattern);
        });
      }
      
      // Add Sri Lankan source validation notes
      if (sriLankaAnalysis.details.sourceValidation.trustedCount > 0) {
        detectionReasons.push(
          `Confirmed by ${sriLankaAnalysis.details.sourceValidation.trustedCount} trusted Sri Lankan source(s)`
        );
      }
      
      // Add historical context warnings
      if (historicalAnalysis.isRecurringPattern) {
        detectionReasons.push(
          `Similar to previously debunked claim (${(historicalAnalysis.similarityScore * 100).toFixed(0)}% match)`
        );
      }
      if (historicalAnalysis.seasonalFlag) {
        detectionReasons.push('Common fake news pattern for this time period');
      }
      
      // Add NLP warnings
      nlpAnalysis.warnings.forEach(warning => detectionReasons.push(warning));
      
      // Add expert verification results
      if (expertVerification.factCheckers.length > 0) {
        const falseChecks = expertVerification.factCheckers.filter(fc => fc.verdict === 'false');
        if (falseChecks.length > 0) {
          detectionReasons.push(
            `Debunked by ${falseChecks.length} professional fact-checker(s): ${falseChecks.map(fc => fc.source).join(', ')}`
          );
        }
      }
      if (expertVerification.expertOpinions.length > 0) {
        expertVerification.expertOpinions.forEach(opinion => {
          detectionReasons.push(`${opinion.expert}: ${opinion.opinion}`);
        });
      }
      
      // Add source reputation warnings
      sourceReputation.warnings.forEach(warning => detectionReasons.push(warning));
      
      // Add real-time monitoring recommendations
      if (realTimeMonitoring.hasOfficialStatement) {
        detectionReasons.push('Official government statement available on this topic');
      }
      if (realTimeMonitoring.hasActiveAlert) {
        detectionReasons.push('Active emergency alert found - verify against official sources');
      }

      // Calculate final adjusted score with ALL factors
      let adjustedScore = score 
        + sriLankaAnalysis.totalScoreAdjustment
        + historicalAnalysis.scoreAdjustment
        + nlpAnalysis.scoreAdjustment
        + expertVerification.scoreAdjustment
        + sourceReputation.scoreAdjustment
        + realTimeMonitoring.scoreAdjustment;
      
      // Strong debunk evidence increases fake score
      if (debunkLinks.length > 0) {
        adjustedScore = Math.min(1, adjustedScore + 0.2 + (debunkLinks.length * 0.05));
      }
      
      // CRITICAL: Content from trusted Sri Lankan source directly should have STRONG credibility
      // This is different from search results mentioning the claim
      if (originalUrl && supportLinks.length > 0 && supportLinks[0].url === originalUrl) {
        const urlObj = new URL(originalUrl);
        const domain = urlObj.hostname.replace('www.', '');
        
        const trustedSources = [
          'newsfirst.lk', 'adaderana.lk', 'dailymirror.lk', 'economynext.com',
          'moe.gov.lk', 'gov.lk', 'dailynews.lk', 'sundaytimes.lk', 'island.lk',
          'colombogazette.com', 'ft.lk', 'newswire.lk', 'hirunews.lk',
          'lankadeepa.lk', 'divaina.lk', 'silumina.lk', 'thinakaran.lk',
          'virakesari.lk', 'president.gov.lk', 'police.lk', 'health.gov.lk', 'cbsl.gov.lk'
        ];
        
        const isTrustedSource = trustedSources.some(trusted => domain.includes(trusted));
        
        if (isTrustedSource) {
          // Strong reduction for content directly from trusted source
          adjustedScore = Math.max(0, adjustedScore - 0.35);
          console.log('Applied trusted source bonus (direct content):', domain);
          detectionReasons.unshift(`Content published directly by trusted source: ${domain}`);
        }
      }
      
      // Many support links with no debunks decreases fake score (more credible)
      if (supportLinks.length >= 3 && debunkLinks.length === 0) {
        adjustedScore = Math.max(0, adjustedScore - 0.15);
      }
      
      // Recalculate verdict and confidence with adjusted score
      const finalVerdict = scoreToVerdict(adjustedScore, detectionReasons);
      const finalConfidence = scoreToConfidence(adjustedScore);
      console.log('Final verdict after evidence:', finalVerdict, 'Adjusted score:', adjustedScore);

      // Build reasons list
      const reasons = [...detectionReasons];

      // Add evidence-based reasons
      if (supportLinks.length === 0 && debunkLinks.length === 0) {
        reasons.push('Limited verifiable sources found online for this claim');
      } else {
        if (supportLinks.length > 0) {
          reasons.push(`Found ${supportLinks.length} source(s) from trusted news outlets`);
        }
        if (debunkLinks.length > 0) {
          reasons.push(`Found ${debunkLinks.length} fact-checking article(s) addressing this claim`);
        }
      }

      // Build analysis object
      const analysis: Analysis = {
        claimText: claimText.substring(0, 500), // Store limited text
        verdict: finalVerdict,
        confidence: finalConfidence,
        reasons,
        supportLinks: supportLinks.slice(0, 5), // Limit to 5
        debunkLinks: debunkLinks.slice(0, 5),
      };
      console.log('Analysis object created');

      // Generate response with Gemini
      console.log('Calling Gemini API...');
      let responseText = '';
      try {
        responseText = await generateClaimResponse(analysis, language);
        console.log('Gemini response received:', responseText.substring(0, 100));
      } catch (error) {
        console.error('Gemini error:', error);
        // Fallback response
        const verdictText = language === 'si' 
          ? { fake: 'ව්‍යාජ', real: 'සත්‍ය', uncertain: 'අවිනිශ්චිත', unanalyzable: 'විශ්ලේෂණ කළ නොහැක' }
          : { fake: 'fake', real: 'real', uncertain: 'uncertain', unanalyzable: 'cannot be analyzed' };
        
        responseText = language === 'si'
          ? `විශ්ලේෂණය සම්පූර්ණයි. මෙම ප්‍රකාශය **${verdictText[finalVerdict]}** ලෙස පෙනී යන අතර විශ්වාසය ${(finalConfidence * 100).toFixed(0)}% කි.\n\n${reasons.join('\n\n')}\n\n*මෙය ස්වයංක්‍රීය තක්සේරුවකි. කරුණාකර නිල මූලාශ්‍ර සමඟ සත්‍යාපනය කරන්න.*`
          : `Analysis complete. This claim appears to be **${finalVerdict}** with ${(finalConfidence * 100).toFixed(0)}% confidence.\n\n${reasons.join('\n\n')}\n\n*This is an automated estimation. Please verify with official sources.*`;
      }

      const response: ChatApiResponse = {
        message: responseText,
        analysis,
      };

      console.log('Sending response to client');
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
