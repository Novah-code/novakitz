import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('Auth callback received:', { code: !!code, error, error_description });

  // Handle error from OAuth provider
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/?error=auth_failed&message=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }

  // Exchange code for session
  if (code) {
    try {
      const cookieStore = await cookies();

      // Create Supabase client with cookie handling
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            flowType: 'pkce',
          },
          global: {
            headers: {
              cookie: cookieStore.toString(),
            },
          },
        }
      );

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        );
      }

      if (data.session) {
        console.log('Session created successfully for user:', data.session.user.id);

        // Set session cookies
        const response = NextResponse.redirect(new URL('/?success=logged_in', requestUrl.origin));

        // Set auth cookies
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });

        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });

        return response;
      }
    } catch (error: any) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL(`/?error=auth_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }
  }

  // No code or error - redirect to home
  console.warn('No code or error in callback');
  return NextResponse.redirect(new URL('/?error=no_session', requestUrl.origin));
}
