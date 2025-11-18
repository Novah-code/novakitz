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
  const { data } = await supabase
    .from('subscription_plans')
    .select('*');
  
  console.log('Subscription Plans Data:');
  console.log(JSON.stringify(data, null, 2));
})();
