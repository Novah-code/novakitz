import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  console.error('Toss payment failed:', { code, message });

  // Redirect to home with error message
  return NextResponse.redirect(new URL(`/?payment=failed&error=${encodeURIComponent(message || 'Payment failed')}`, request.url));
}
