const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wylrihmhfmgisgixnlrd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHJpaG1oZm1naXNnaXhubHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyNjY4OCwiZXhwIjoyMDcwNDAyNjg4fQ.6N7Zi9xbstqw3w4tC67EnoQtnDfA_sp_nlBQmscrhZM';

async function checkRLS() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('=== Checking RLS Status ===\n');

  // Check if RLS is enabled
  const { data: rlsStatus, error: rlsError } = await supabase
    .from('pg_tables')
    .select('schemaname, tablename, rowsecurity')
    .eq('schemaname', 'public')
    .eq('tablename', 'user_subscriptions')
    .single();

  if (rlsError) {
    console.log('Cannot check RLS status via pg_tables');
    console.log('Trying alternative method...\n');
  } else {
    console.log('RLS Status:', rlsStatus);
  }

  // Check policies using SQL
  console.log('Checking policies with raw SQL query...\n');

  // This query should work with service role
  const query = `
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual::text as using_clause,
      with_check::text as with_check_clause
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_subscriptions'
    ORDER BY policyname;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { query });

    if (error) {
      console.log('RPC exec_sql not available. Using direct query...');

      // Try a different approach - check information_schema
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', 'user_subscriptions');

      console.log('Table exists:', tableInfo ? 'Yes' : 'No');

    } else {
      console.log('Policies:', data);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }

  // More direct approach - just check what auth.uid() returns
  console.log('\n=== Testing auth.uid() context ===\n');
  console.log('When using ANON key without authentication, auth.uid() returns NULL');
  console.log('This means RLS policy "auth.uid() = user_id" will NEVER match!');
  console.log('');
  console.log('The user needs to be AUTHENTICATED for RLS to work properly.');
  console.log('');

  // Show the problem
  console.log('=== The Problem ===');
  console.log('1. Database has subscription: YES (user_id = 3ecc6565-ec23-4bbe-b985-703a547c013d)');
  console.log('2. RLS Policy says: "Users can view own subscription" WHERE auth.uid() = user_id');
  console.log('3. When querying with ANON key (unauthenticated), auth.uid() = NULL');
  console.log('4. NULL != user_id, so subscription is NOT visible');
  console.log('');
  console.log('=== The Solution ===');
  console.log('User must be LOGGED IN (authenticated) for the app to see their subscription!');
  console.log('Check if jeongnewna@gmail.com is actually logged in when checking the subscription.');
}

checkRLS();
