import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user's IP from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
               request.headers.get('x-real-ip') ||
               'unknown';

    console.log('Detected IP:', ip);

    // For localhost/development, use a fallback or return mock data
    if (ip === 'unknown' || ip.includes('127.0.0.1') || ip.includes('::1')) {
      return NextResponse.json({
        ip: ip,
        country_code: 'US',
        country_name: 'United States',
        city: 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isMock: true
      });
    }

    // Use ipapi.co for geolocation (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'novakitz-dream-app'
      }
    });

    if (!response.ok) {
      throw new Error(`Geolocation API failed: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      ip: data.ip || ip,
      country_code: data.country_code || 'US',
      country_name: data.country_name || 'United States',
      city: data.city || 'Unknown',
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      isMock: false
    });

  } catch (error) {
    console.error('Error getting location:', error);

    // Fallback to browser timezone
    return NextResponse.json({
      ip: 'unknown',
      country_code: 'US',
      country_name: 'United States',
      city: 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isMock: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
