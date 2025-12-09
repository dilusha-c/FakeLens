/**
 * Guest user credit system
 * Tracks usage for non-authenticated users using browser localStorage
 */

export const GUEST_TOTAL_CREDITS = 100;

export const CREDIT_COSTS = {
  message: 20,
  image: 50,
  document: 60,
};

export interface GuestCredits {
  totalCredits: number;
  resetDate: string; // ISO date string
}

const STORAGE_KEY = 'fakelens_guest_credits';

/**
 * Get guest credits from localStorage
 */
export function getGuestCredits(): GuestCredits {
  if (typeof window === 'undefined') {
    return {
      totalCredits: GUEST_TOTAL_CREDITS,
      resetDate: new Date().toISOString(),
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const credits: GuestCredits = JSON.parse(stored);
      
      // Check if credits should reset (24 hours)
      const resetDate = new Date(credits.resetDate);
      const now = new Date();
      const hoursSinceReset = (now.getTime() - resetDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceReset >= 24) {
        // Reset credits
        return resetGuestCredits();
      }
      
      return credits;
    }
  } catch (error) {
    console.error('Failed to get guest credits:', error);
  }

  // Initialize new credits
  return resetGuestCredits();
}

/**
 * Reset guest credits to full
 */
export function resetGuestCredits(): GuestCredits {
  const credits: GuestCredits = {
    totalCredits: GUEST_TOTAL_CREDITS,
    resetDate: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credits));
    } catch (error) {
      console.error('Failed to save guest credits:', error);
    }
  }

  return credits;
}

/**
 * Use a guest credit
 */
export function useGuestCredit(type: 'message' | 'image' | 'document'): boolean {
  const credits = getGuestCredits();
  const cost = CREDIT_COSTS[type];
  
  if (credits.totalCredits < cost) {
    return false; // No credits left
  }

  credits.totalCredits -= cost;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credits));
    } catch (error) {
      console.error('Failed to update guest credits:', error);
      return false;
    }
  }

  return true;
}

/**
 * Check if guest has credits available
 */
export function hasGuestCredit(type: 'message' | 'image' | 'document'): boolean {
  const credits = getGuestCredits();
  const cost = CREDIT_COSTS[type];
  return credits.totalCredits >= cost;
}

/**
 * Get remaining credits for display
 */
export function getRemainingCredits(): number {
  return getGuestCredits().totalCredits;
}
