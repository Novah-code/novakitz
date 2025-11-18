const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('./novakitz-main/.env.local', 'utf-8');
const lines = envContent.split('\n');
const envObj = {};
lines.forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) envObj[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(envObj.NEXT_PUBLIC_SUPABASE_URL, envObj.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Get user ID for qkrwld250@gmail.com
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === 'qkrwld250@gmail.com');

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('✅ User:', user.email);

  // Get recent dreams
  const { data: dreams } = await supabase
    .from('dreams')
    .select('id, title, dream_description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n📝 Recent dreams:', dreams?.length || 0);

  if (dreams && dreams.length > 0) {
    dreams.forEach((dream, i) => {
      console.log(`\n[${i+1}] Dream ID: ${dream.id.substring(0, 8)}...`);
      console.log('  Title:', dream.title);
      console.log('  Created:', dream.created_at);
    });

    // Check for intentions for these dreams
    const dreamIds = dreams.map(d => d.id);
    const { data: intentions } = await supabase
      .from('daily_intentions')
      .select('dream_id, intention_1, intention_2, intention_3, created_at')
      .in('dream_id', dreamIds);

    console.log('\n🎯 Intentions for these dreams:', intentions?.length || 0);
    if (intentions && intentions.length > 0) {
      intentions.forEach(int => {
        console.log(`  Dream: ${int.dream_id?.substring(0, 8) || 'none'}... -> I1: ${int.intention_1?.substring(0, 30)}`);
      });
    } else {
      console.log('⚠️  No intentions found for recent dreams');
    }
  }

  // Check all intentions for this user (regardless of dream_id)
  const { data: allIntentions } = await supabase
    .from('daily_intentions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  console.log('\n📊 All intentions for user:', allIntentions?.length || 0);
  if (allIntentions && allIntentions.length > 0) {
    allIntentions.slice(0, 3).forEach((int, i) => {
      console.log(`\n[${i+1}] Created: ${int.created_at}`);
      console.log('  Dream ID:', int.dream_id);
      console.log('  I1:', int.intention_1?.substring(0, 40));
    });
  }
})();
