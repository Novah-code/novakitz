const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wylrihmhfmgisgixnlrd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHJpaG1oZm1naXNnaXhubHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyNjY4OCwiZXhwIjoyMDcwNDAyNjg4fQ.6N7Zi9xbstqw3w4tC67EnoQtnDfA_sp_nlBQmscrhZM';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSubscription() {
  const email = 'jeongnewna@gmail.com';

  console.log('=== Checking subscription for:', email, '===\n');

  try {
    // 1. Find user by email
    console.log('Step 1: Finding user by email...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
      console.log('User not found with email:', email);
      return;
    }

    console.log('User found:');
    console.log('  - User ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Created at:', user.created_at);
    console.log('');

    // 2. Get subscription plans
    console.log('Step 2: Fetching subscription plans...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*');

    if (plansError) {
      console.error('Plans error:', plansError);
    } else {
      console.log('Available plans:');
      plans.forEach(plan => {
        console.log(`  - ${plan.plan_name} (${plan.plan_slug}): ID = ${plan.id}`);
        console.log(`    AI Interpretations: ${plan.ai_interpretations_per_month}/month`);
        console.log(`    History Days: ${plan.history_days}`);
      });
      console.log('');
    }

    // 3. Check user subscriptions
    console.log('Step 3: Checking user subscriptions...');
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans:plan_id (
          plan_name,
          plan_slug,
          ai_interpretations_per_month,
          history_days
        )
      `)
      .eq('user_id', user.id);

    if (subError) {
      console.error('Subscription error:', subError);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('NO SUBSCRIPTIONS FOUND for this user!');
      console.log('This is the problem - the user should have a subscription but none exists.');
      console.log('');
    } else {
      console.log(`Found ${subscriptions.length} subscription(s):`);
      subscriptions.forEach((sub, idx) => {
        console.log(`\nSubscription ${idx + 1}:`);
        console.log('  - Subscription ID:', sub.id);
        console.log('  - Plan:', sub.subscription_plans?.plan_name, `(${sub.subscription_plans?.plan_slug})`);
        console.log('  - Status:', sub.status);
        console.log('  - Started at:', sub.started_at);
        console.log('  - Expires at:', sub.expires_at || 'No expiration');
        console.log('  - Gumroad License Key:', sub.gumroad_license_key || 'None');
        console.log('  - Gumroad Product ID:', sub.gumroad_product_id || 'None');
        console.log('  - AI Interpretations/month:', sub.subscription_plans?.ai_interpretations_per_month);
        console.log('  - History Days:', sub.subscription_plans?.history_days);

        // Check if subscription is valid
        const isActive = sub.status === 'active';
        const isNotExpired = !sub.expires_at || new Date(sub.expires_at) > new Date();
        console.log('  - Is Active:', isActive);
        console.log('  - Is Not Expired:', isNotExpired);
        console.log('  - Should Work:', isActive && isNotExpired ? 'YES' : 'NO');
      });
    }

    // 4. Check AI usage
    console.log('\nStep 4: Checking AI usage for current month...');
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthString = currentMonth.toISOString().split('T')[0];

    const { data: usage, error: usageError } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('year_month', monthString);

    if (usageError) {
      console.error('Usage error:', usageError);
    } else {
      console.log(`AI Usage count for ${monthString}:`, usage?.length || 0);
      if (usage && usage.length > 0) {
        console.log('Recent usage:');
        usage.slice(0, 5).forEach((u, idx) => {
          console.log(`  ${idx + 1}. Type: ${u.interpretation_type}, Created: ${u.created_at}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkSubscription();
