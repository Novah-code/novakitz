import { supabase } from './supabase';

/**
 * Get user's current subscription plan and limits
 */
export async function getUserPlan(userId: string) {
  try {
    // First, try to get active and non-expired subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans:plan_id(
          plan_slug,
          ai_interpretations_per_month,
          history_days
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();

    if (subscription && subscription.subscription_plans) {
      return {
        planSlug: subscription.subscription_plans.plan_slug,
        aiInterpretationsPerMonth: subscription.subscription_plans.ai_interpretations_per_month,
        historyDays: subscription.subscription_plans.history_days,
        isActive: true
      };
    }

    // No active subscription - return free plan
    return {
      planSlug: 'free',
      aiInterpretationsPerMonth: 7,
      historyDays: 999999, // Unlimited history for free users now
      isActive: false
    };
  } catch (error) {
    console.error('Error fetching user plan:', error);
    // Default to free plan on error
    return {
      planSlug: 'free',
      aiInterpretationsPerMonth: 7,
      historyDays: 999999,
      isActive: false
    };
  }
}

/**
 * Get current month's AI usage count for user
 */
export async function getCurrentMonthAIUsage(userId: string): Promise<number> {
  try {
    // Get current month in YYYY-MM-01 format
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthString = currentMonth.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ai_usage')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('year_month', monthString);

    if (error) {
      console.error('Error fetching AI usage:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in getCurrentMonthAIUsage:', error);
    return 0;
  }
}

/**
 * Check if user can analyze more dreams this month
 */
export async function canAnalyzeDream(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  message?: string;
}> {
  try {
    const plan = await getUserPlan(userId);
    const currentUsage = await getCurrentMonthAIUsage(userId);
    const limit = plan.aiInterpretationsPerMonth;
    const remaining = Math.max(0, limit - currentUsage);

    if (limit === 999999 || currentUsage < limit) {
      // Premium user or free user hasn't hit limit
      return {
        allowed: true,
        remaining: remaining === 999999 ? -1 : remaining, // -1 means unlimited
        limit: limit === 999999 ? -1 : limit
      };
    } else {
      // Hit the limit
      return {
        allowed: false,
        remaining: 0,
        limit: limit,
        message: `You've reached your monthly AI interpretation limit (${limit}/month). Upgrade to Premium for unlimited interpretations.`
      };
    }
  } catch (error) {
    console.error('Error checking dream analysis permission:', error);
    // Default to allow on error to avoid blocking users
    return {
      allowed: true,
      remaining: 7,
      limit: 7
    };
  }
}

/**
 * Record AI usage when dream is analyzed
 */
export async function recordAIUsage(
  userId: string,
  dreamId?: string,
  interpretationType: string = 'full_analysis'
): Promise<boolean> {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthString = currentMonth.toISOString().split('T')[0];

    const { error } = await supabase
      .from('ai_usage')
      .insert([
        {
          user_id: userId,
          year_month: monthString,
          dream_id: dreamId,
          interpretation_type: interpretationType,
          tokens_used: null, // Could track token usage later
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error recording AI usage:', error);
      return false;
    }

    console.log('AI usage recorded for user:', userId);
    return true;
  } catch (error) {
    console.error('Error in recordAIUsage:', error);
    return false;
  }
}

/**
 * Get remaining AI interpretations for user this month
 */
export async function getRemainingAIInterpretations(userId: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}> {
  try {
    const plan = await getUserPlan(userId);
    const used = await getCurrentMonthAIUsage(userId);

    if (plan.aiInterpretationsPerMonth === 999999) {
      return {
        used: 0,
        limit: -1,
        remaining: -1,
        isUnlimited: true
      };
    }

    return {
      used,
      limit: plan.aiInterpretationsPerMonth,
      remaining: Math.max(0, plan.aiInterpretationsPerMonth - used),
      isUnlimited: false
    };
  } catch (error) {
    console.error('Error getting remaining interpretations:', error);
    return {
      used: 0,
      limit: 7,
      remaining: 7,
      isUnlimited: false
    };
  }
}

/**
 * Get the history cutoff date based on user's subscription tier
 * Free: 30 days, Premium: unlimited (returns null)
 */
export async function getHistoryCutoffDate(userId: string): Promise<Date | null> {
  try {
    const plan = await getUserPlan(userId);

    // Premium users have unlimited history
    if (plan.historyDays === 999999) {
      return null;
    }

    // Free users: return cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - plan.historyDays);
    return cutoffDate;
  } catch (error) {
    console.error('Error getting history cutoff date:', error);
    // Default to 30-day cutoff on error
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    return cutoffDate;
  }
}

/**
 * Check if a dream should be visible to the user based on history limits
 * Returns true if the dream is within the user's allowed history window
 */
export async function isDreamWithinHistoryLimit(userId: string, dreamCreatedAt: string | Date): Promise<boolean> {
  try {
    const cutoffDate = await getHistoryCutoffDate(userId);

    // No cutoff = unlimited history (premium)
    if (!cutoffDate) {
      return true;
    }

    // Check if dream is within the allowed window
    const dreamDate = new Date(dreamCreatedAt);
    return dreamDate >= cutoffDate;
  } catch (error) {
    console.error('Error checking dream history limit:', error);
    return true; // Allow by default on error
  }
}

/**
 * Filter dreams to only show those within the user's history limit
 */
export async function filterDreamsByHistoryLimit(
  userId: string,
  dreams: Array<{ id?: string; created_at?: string }>
): Promise<Array<{ id?: string; created_at?: string }>> {
  try {
    const cutoffDate = await getHistoryCutoffDate(userId);

    // No cutoff = unlimited history (premium)
    if (!cutoffDate) {
      return dreams;
    }

    // Filter dreams within the allowed window
    return dreams.filter(dream => {
      if (!dream.created_at) return true;
      const dreamDate = new Date(dream.created_at);
      return dreamDate >= cutoffDate;
    });
  } catch (error) {
    console.error('Error filtering dreams by history limit:', error);
    return dreams; // Return all dreams on error
  }
}

/**
 * Get user's plan info including history limits
 */
export async function getUserPlanInfo(userId: string): Promise<{
  planSlug: string;
  planName: string;
  aiInterpretationsPerMonth: number;
  historyDays: number;
  isUnlimited: boolean;
}> {
  try {
    const plan = await getUserPlan(userId);

    return {
      planSlug: plan.planSlug,
      planName: plan.planSlug === 'premium' ? 'Premium' : 'Free',
      aiInterpretationsPerMonth: plan.aiInterpretationsPerMonth,
      historyDays: plan.historyDays,
      isUnlimited: plan.historyDays === 999999
    };
  } catch (error) {
    console.error('Error getting plan info:', error);
    return {
      planSlug: 'free',
      planName: 'Free',
      aiInterpretationsPerMonth: 7,
      historyDays: 30,
      isUnlimited: false
    };
  }
}
