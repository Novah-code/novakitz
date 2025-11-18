const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const lines = envContent.split('\n');
const envObj = {};
lines.forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) {
    envObj[key.trim()] = rest.join('=').trim();
  }
});

const supabase = createClient(envObj.NEXT_PUBLIC_SUPABASE_URL, envObj.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === 'qkrwld250@gmail.com');

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User:', user.email);

  const { data: dreams } = await supabase
    .from('dreams')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\nRecent dreams:', dreams?.length || 0);
  if (dreams) {
    dreams.forEach((dream, i) => {
      console.log('  ' + (i+1) + ') ' + dream.title);
    });
  }

  const { data: allIntentions } = await supabase
    .from('daily_intentions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  console.log('\nAll intentions:', allIntentions?.length || 0);
  if (allIntentions && allIntentions.length > 0) {
    allIntentions.slice(0, 3).forEach((int, i) => {
      console.log('\n[' + (i+1) + ']');
      console.log('  Created: ' + int.created_at);
      console.log('  Dream ID: ' + (int.dream_id || 'null'));
      console.log('  I1: ' + (int.intention_1 ? int.intention_1.substring(0, 50) : 'null'));
    });
  }
}

main().catch(console.error);
