const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wylrihmhfmgisgixnlrd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHJpaG1oZm1naXNnaXhubHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyNjY4OCwiZXhwIjoyMDcwNDAyNjg4fQ.6N7Zi9xbstqw3w4tC67EnoQtnDfA_sp_nlBQmscrhZM';

const email = 'jeongnewna@gmail.com';
const userId = '3ecc6565-ec23-4bbe-b985-703a547c013d';

async function testAuthenticatedContext() {
  console.log('=== Testing Authenticated Context for Subscription Query ===\n');

  // Create admin client
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Step 1: Get user's auth token
  console.log('Step 1: Creating authenticated session for user...');

  try {
    // Check if user exists
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
      console.log('ERROR: User not found!');
      return;
    }

    console.log('User found:', user.email);
    console.log('User ID:', user.id);
    console.log('');

    // Step 2: Generate an access token for this user (admin operation)
    console.log('Step 2: Generating access token...');

    // NOTE: In production, the user would log in and get this token
    // For testing, we simulate what happens when user is authenticated
    const { data: tokenData, error: tokenError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (tokenError) {
      console.log('Error generating token:', tokenError);
    } else {
      console.log('Token generated successfully');
      console.log('');
    }

    // Step 3: Test query with impersonated auth context
    console.log('Step 3: Testing subscription query with authenticated context...');
    console.log('(Using service key with RLS bypass)');
    console.log('');

    // Query as if user is authenticated
    const { data: subscription, error: subError } = await adminClient
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans:plan_id(
          plan_slug,
          plan_name,
          ai_interpretations_per_month,
          history_days
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      console.log('ERROR querying subscription:', subError);
    } else if (!subscription) {
      console.log('No active subscription found');
    } else {
      console.log('SUCCESS! Subscription found:');
      console.log('  Plan:', subscription.subscription_plans?.plan_name);
      console.log('  Plan Slug:', subscription.subscription_plans?.plan_slug);
      console.log('  Status:', subscription.status);
      console.log('  Expires:', subscription.expires_at);
      console.log('  AI Interpretations/month:', subscription.subscription_plans?.ai_interpretations_per_month);
      console.log('  History Days:', subscription.subscription_plans?.history_days);
    }

    console.log('');
    console.log('=== Analysis ===');
    console.log('');
    console.log('The subscription EXISTS in the database.');
    console.log('When queried with service key (bypassing RLS), it is visible.');
    console.log('');
    console.log('For the CLIENT APP to see this subscription:');
    console.log('1. User MUST be logged in (authenticated)');
    console.log('2. The auth session must have a valid access token');
    console.log('3. The RLS policy checks: auth.uid() = user_id');
    console.log('4. Only when auth.uid() matches the user_id will the subscription be visible');
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. Verify user is actually LOGGED IN when checking subscription');
    console.log('2. Check browser console for auth errors');
    console.log('3. Verify the session token is valid and not expired');
    console.log('4. Check if user needs to re-login');
    console.log('');

    // Step 4: Check if there are any other active sessions
    console.log('Step 4: Checking for active sessions...');
    const { data: sessions, error: sessionsError } = await adminClient.auth.admin.getUserById(userId);

    if (sessionsError) {
      console.log('Error getting user sessions:', sessionsError);
    } else {
      console.log('Last sign in:', sessions.user.last_sign_in_at);
      console.log('Created at:', sessions.user.created_at);
      console.log('Email confirmed:', sessions.user.email_confirmed_at ? 'Yes' : 'No');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAuthenticatedContext();
