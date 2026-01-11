import { supabase } from './supabase';
import { getUserPlan } from './subscription';

export interface Affirmation {
  id: string;
  user_id: string;
  dream_id?: string;
  affirmation_text: string;
  daily_count: number;
  check_in_time: 'morning' | 'afternoon' | 'evening';
  language: 'en' | 'ko';
  created_at: string;
  date: string;
  updated_at: string;
}

/**
 * Generate affirmations based on dream content using Gemini API
 * Returns 1 for free users, 3 for premium users
 */
export async function generateAffirmationsFromDream(
  userId: string,
  dreamText: string,
  language: 'en' | 'ko' = 'en'
): Promise<string[]> {
  try {
    // Call server-side API route for affirmation generation
    const response = await fetch('/api/generate-affirmations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        dreamText,
        language
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Affirmation generation API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data.affirmations || [];
  } catch (error) {
    console.error('Error generating affirmations:', error);
    return [];
  }
}

/**
 * Save affirmations to database
 */
export async function saveAffirmations(
  userId: string,
  affirmations: string[],
  checkInTime: 'morning' | 'afternoon' | 'evening',
  dreamId?: string,
  language: 'en' | 'ko' = 'en'
): Promise<boolean> {
  try {
    // Get current date in YYYY-MM-DD format (local time)
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const affirmationRecords = affirmations.map((text, index) => ({
      user_id: userId,
      dream_id: dreamId || null,
      affirmation_text: text,
      daily_count: index + 1,
      check_in_time: checkInTime,
      language: language,
      date: date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('affirmations')
      .insert(affirmationRecords);

    if (error) {
      console.error('Error saving affirmations:', error);
      return false;
    }

    console.log(`Saved ${affirmations.length} affirmations for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error in saveAffirmations:', error);
    return false;
  }
}

/**
 * Get today's affirmations for a user
 */
export async function getTodayAffirmations(userId: string): Promise<Affirmation[]> {
  try {
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching today\'s affirmations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTodayAffirmations:', error);
    return [];
  }
}

/**
 * Get affirmations for a specific time slot (morning/afternoon/evening)
 */
export async function getAffirmationsByTime(
  userId: string,
  checkInTime: 'morning' | 'afternoon' | 'evening'
): Promise<Affirmation[]> {
  try {
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('check_in_time', checkInTime)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error fetching ${checkInTime} affirmations:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAffirmationsByTime:', error);
    return [];
  }
}

/**
 * Check if user already has affirmations for a specific time slot today
 */
export async function hasAffirmationsForTime(
  userId: string,
  checkInTime: 'morning' | 'afternoon' | 'evening'
): Promise<boolean> {
  try {
    const affirmations = await getAffirmationsByTime(userId, checkInTime);
    return affirmations.length > 0;
  } catch (error) {
    console.error('Error checking affirmations:', error);
    return false;
  }
}

/**
 * Delete affirmations for a specific time slot today
 */
export async function deleteAffirmationsForTime(
  userId: string,
  checkInTime: 'morning' | 'afternoon' | 'evening'
): Promise<boolean> {
  try {
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const { error } = await supabase
      .from('affirmations')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('check_in_time', checkInTime);

    if (error) {
      console.error('Error deleting affirmations:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAffirmationsForTime:', error);
    return false;
  }
}

/**
 * Generate affirmations based on recent dreams (for "No dream" days)
 * Premium users only - generates 3 affirmations from last 7 days of dreams
 */
export async function generateAffirmationsFromRecentDreams(
  userId: string,
  language: 'en' | 'ko' = 'en'
): Promise<string[]> {
  try {
    // Call server-side API route with useRecentDreams flag
    const response = await fetch('/api/generate-affirmations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        language,
        useRecentDreams: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recent dreams affirmation generation error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data.affirmations || [];
  } catch (error) {
    console.error('Error generating affirmations from recent dreams:', error);
    return [];
  }
}
