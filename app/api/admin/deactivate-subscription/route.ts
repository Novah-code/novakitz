import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin email - only this email can access
const ADMIN_EMAIL = 'jeongnewna@gmail.com';

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, adminEmail } = await request.json();

    // Verify admin email
    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
