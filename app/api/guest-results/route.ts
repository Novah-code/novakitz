import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      primary_archetype,
      secondary_archetype,
      archetype_scores,
      dream_content,
      quiz_answers,
      language
    } = body;

    // Get user's location from IP using ip-api.com (free, 45 req/min)
    let locationData = null;
    try {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');

      if (ip && !ip.includes('127.0.0.1') && !ip.includes('::1')) {
        const locationResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`);

        if (locationResponse.ok) {
          const data = await locationResponse.json();

          // ip-api.com returns different field names
          if (data.status === 'success') {
            locationData = {
              country_code: data.countryCode,
              country_name: data.country,
              city: data.city,
            };
          }
        }
      }
    } catch (err) {
      console.log('Failed to get location, continuing without it:', err);
    }

    // Insert guest result
    const { data, error } = await supabase
      .from('guest_archetype_results')
      .insert({
        primary_archetype,
        secondary_archetype,
        archetype_scores,
        dream_content,
        quiz_answers,
        language: language || 'ko',
        country_code: locationData?.country_code || null,
        country_name: locationData?.country_name || null,
        city: locationData?.city || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving guest result:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('Error saving guest result:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Fetch guest result
    const { data, error } = await supabase
      .from('guest_archetype_results')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching guest result:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Increment view count
    await supabase.rpc('increment_guest_result_view_count', { result_id: id });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching guest result:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
