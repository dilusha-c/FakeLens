import { prisma } from '@/lib/prisma';

export type ApiType = 
  | 'serp' 
  | 'factcheck' 
  | 'gemini' 
  | 'vision' 
  | 'sightengine' 
  | 'search';

/**
 * Track API usage for analytics
 * Call this function whenever you make an API call to track usage
 * 
 * @param userId - The user ID making the API call
 * @param apiType - The type of API being called
 * @param count - Number of calls (default: 1)
 */
export async function trackApiUsage(
  userId: string, 
  apiType: ApiType, 
  count: number = 1
) {
  try {
    const fieldMap: Record<ApiType, string> = {
      serp: 'serpApiCalls',
      factcheck: 'factCheckApiCalls',
      gemini: 'geminiApiCalls',
      vision: 'visionApiCalls',
      sightengine: 'sightEngineApiCalls',
      search: 'searchApiCalls',
    };

    const field = fieldMap[apiType];

    await prisma.analytics.upsert({
      where: { userId },
      create: {
        userId,
        apiCalls: count,
        [field]: count,
      },
      update: {
        apiCalls: { increment: count },
        [field]: { increment: count },
        lastActive: new Date(),
      },
    });
  } catch (error) {
    console.error(`Failed to track ${apiType} API usage:`, error);
    // Don't throw - we don't want analytics tracking to break the app
  }
}

/**
 * Get total API usage for a specific user
 */
export async function getUserApiUsage(userId: string) {
  try {
    const analytics = await prisma.analytics.findUnique({
      where: { userId },
      select: {
        apiCalls: true,
        serpApiCalls: true,
        factCheckApiCalls: true,
        geminiApiCalls: true,
        visionApiCalls: true,
        sightEngineApiCalls: true,
        searchApiCalls: true,
      },
    });

    return analytics || {
      apiCalls: 0,
      serpApiCalls: 0,
      factCheckApiCalls: 0,
      geminiApiCalls: 0,
      visionApiCalls: 0,
      sightEngineApiCalls: 0,
      searchApiCalls: 0,
    };
  } catch (error) {
    console.error('Failed to get user API usage:', error);
    return null;
  }
}

/**
 * Get total API usage across all users (for admin dashboard)
 */
export async function getTotalApiUsage() {
  try {
    const result = await prisma.analytics.aggregate({
      _sum: {
        apiCalls: true,
        serpApiCalls: true,
        factCheckApiCalls: true,
        geminiApiCalls: true,
        visionApiCalls: true,
        sightEngineApiCalls: true,
        searchApiCalls: true,
      },
    });

    return {
      total: result._sum.apiCalls || 0,
      serpApiCalls: result._sum.serpApiCalls || 0,
      factCheckApiCalls: result._sum.factCheckApiCalls || 0,
      geminiApiCalls: result._sum.geminiApiCalls || 0,
      visionApiCalls: result._sum.visionApiCalls || 0,
      sightEngineApiCalls: result._sum.sightEngineApiCalls || 0,
      searchApiCalls: result._sum.searchApiCalls || 0,
    };
  } catch (error) {
    console.error('Failed to get total API usage:', error);
    return null;
  }
}
