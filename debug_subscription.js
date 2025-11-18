const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wylrihmhfmgisgixnlrd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHJpaG1oZm1naXNnaXhubHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MjY2ODgsImV4cCI6MjA3MDQwMjY4OH0.8zZuGK4okp-NlljQ3HK50wVw6BgD-n5kd3U3mkOrl7c';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHJpaG1oZm1naXNnaXhubHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyNjY4OCwiZXhwIjoyMDcwNDAyNjg4fQ.6N7Zi9xbstqw3w4tC67EnoQtnDfA_sp_nlBQmscrhZM';

const userId = '3ecc6565-ec23-4bbe-b985-703a547c013d';

async function testWithAnonKey() {
  console.log('=== Testing with ANON KEY (client-side simulation) ===\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Simulate what SubscriptionManager does
  console.log('Query 1: SubscriptionManager style (no expires_at filter)');
  const { data: sub1, error: err1 } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      subscription_plans:plan_id(
        plan_slug,
        plan_name
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (err1) {
    console.log('ERROR:', err1);
  } else {
    console.log('Result:', sub1 ? 'Found subscription' : 'No subscription');
    if (sub1) {
      console.log('  Plan:', sub1.subscription_plans?.plan_name);
      console.log('  Status:', sub1.status);
      console.log('  Expires:', sub1.expires_at);
    }
  }
  console.log('');

  // Simulate what getUserPlan does
  console.log('Query 2: getUserPlan style (with expires_at filter)');
  const now = new Date().toISOString();
  const { data: sub2, error: err2 } = await supabase
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
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();

  if (err2) {
    console.log('ERROR:', err2);
  } else {
    console.log('Result:', sub2 ? 'Found subscription' : 'No subscription');
    if (sub2) {
      console.log('  Plan:', sub2.subscription_plans?.plan_slug);
      console.log('  Status:', sub2.status);
      console.log('  Expires:', sub2.expires_at);
      console.log('  AI Limit:', sub2.subscription_plans?.ai_interpretations_per_month);
    }
  }
  console.log('');
}

async function testRLS() {
  console.log('=== Testing RLS Policies ===\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Check RLS policies
  const { data: policies, error: policyError } = await supabase
    .rpc('pg_catalog.pg_get_userbyid', { userid: 10 });

  // Direct query with service key
  console.log('Direct query with service key:');
  const { data: subs, error: subsError } = await supabase
    .from('user_subscriptions')
    .select(`
      id,
      status,
      expires_at,
      subscription_plans:plan_id(plan_name, plan_slug)
    `)
    .eq('user_id', userId);

  if (subsError) {
    console.log('ERROR:', subsError);
  } else {
    console.log('Found', subs?.length || 0, 'subscription(s)');
    subs?.forEach(s => {
      console.log('  -', s.subscription_plans?.plan_name, '/', s.status, '/ expires:', s.expires_at);
    });
  }
  console.log('');
}

async function checkRLSPolicies() {
  console.log('=== Checking RLS Configuration ===\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await supabase
    .rpc('exec_sql', {
      sql_query: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_subscriptions'
        ORDER BY policyname;
      `
    });

  if (error) {
    console.log('Cannot query policies (expected - RPC might not exist)');
    console.log('Error:', error.message);
  } else {
    console.log('RLS Policies:', data);
  }
}

async function main() {
  await testWithAnonKey();
  await testRLS();
  // await checkRLSPolicies(); // This might fail if RPC doesn't exist
}

main();
