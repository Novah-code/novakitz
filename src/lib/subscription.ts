import { supabase } from './supabase';

/**
 * Get user's current subscription plan and limits
 */
export async function getUserPlan(userId: string) {
  try {
    // First, try to get active subscription
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
      aiInterpretationsPerMonth: 10,
      historyDays: 30,
      isActive: false
    };
  } catch (error) {
    console.error('Error fetching user plan:', error);
    // Default to free plan on error
    return {
      planSlug: 'free',
      aiInterpretationsPerMonth: 10,
      historyDays: 30,
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
      remaining: 10,
      limit: 10
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
      limit: 10,
      remaining: 10,
      isUnlimited: false
    };
  }
}
