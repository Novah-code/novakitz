import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAdmin, denied } from '../../../../src/lib/apiAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Deletes someone's subscription. Same forgeable check as add-subscription had.
export async function POST(request: NextRequest) {
  if (!(await authenticateAdmin(request))) return denied();

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Delete the user's subscription to make them "free"
    const { error: deleteError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Delete subscription error:', deleteError);
      return NextResponse.json({ error: 'Failed to deactivate subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription deactivated',
      userId
    });
  } catch (error) {
    console.error('Admin deactivate subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
