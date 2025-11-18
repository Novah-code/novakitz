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
  try {
    // Update both manually created subscriptions with dummy gumroad values
    const userIds = [
      '088ac948-6c58-4cb7-a12a-8378583f9b58', // qkrwld250
      '3ecc6565-ec23-4bbe-b985-703a547c013d'  // jeongnewna
    ];

    for (const userId of userIds) {
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          gumroad_license_key: 'manual_subscription',
          gumroad_product_id: 'novakitz_year'
        })
        .eq('user_id', userId)
        .is('gumroad_license_key', null);

      if (updateError) {
        console.error('Error updating subscription for user:', userId, updateError);
      } else {
        console.log('Updated user:', userId);
      }
    }

    // Get updated subscriptions
    const { data: subs } = await supabase
      .from('user_subscriptions')
      .select('*')
      .in('user_id', userIds);

    console.log('\n✅ Updated subscriptions:');
    subs?.forEach((sub) => {
      console.log(`User: ${sub.user_id.substring(0, 8)}... | License: ${sub.gumroad_license_key} | Product: ${sub.gumroad_product_id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
})();
