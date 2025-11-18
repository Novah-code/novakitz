const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const lines = envContent.split('\n');
const envObj = {};
lines.forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) envObj[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(envObj.NEXT_PUBLIC_SUPABASE_URL, envObj.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '3ecc6565-ec23-4bbe-b985-703a547c013d';
  
  console.log('Testing subscription query with JOIN...\n');
  
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('id, status, subscription_plans:plan_id(plan_slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  console.log('Query result:');
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(subscription, null, 2));
})();
