'use client';

import { supabase } from './supabase';
import { isNative } from './platform';

/**
 * Sign in with Google.
 *
 * On the web this is the ordinary OAuth redirect and nothing changed.
 *
 * Inside the app it used to be the same call, and it dead-ended. The redirect
 * target was `window.location.origin`, which in the Capacitor shell is
 * `capacitor://localhost`: Google's account chooser opened in Safari and worked,
 * and then the trip back failed with "Safari cannot open the page because the
 * address is invalid", because that name only exists inside the web view and iOS
 * has no app registered for it (POST_LAUNCH §20, seen on a device 2026-10-20).
 *
 * The fix is to come back through an address iOS *does* know. The app registers
 * the URL scheme `com.novakitz.app` in Info.plist, Supabase is told that
 * `com.novakitz.app://auth/callback` is an allowed redirect, and the return trip
 * becomes: Google -> Supabase -> `com.novakitz.app://auth/callback#access_token=…`
 * -> iOS opens the app -> `appUrlOpen` fires here -> the tokens become a session.
 *
 * Both halves of that are outside the code. If either is missing the symptom is
 * specific, which is useful for telling them apart:
 *
 *   Safari lands on the novakitz.com website instead of returning to the app
 *     -> the redirect is not in Supabase's allow list (it fell back to Site URL).
 *   Safari says the address is invalid, as before
 *     -> the URL scheme is not registered in Info.plist.
 *
 * The session is read from the URL hash and applied with setSession, exactly as
 * SimpleDreamInterfaceWithAuth does on the web, because the client is configured
 * with flowType 'implicit' and detectSessionInUrl off.
 */

/** Must match the scheme in Info.plist and the entry in Supabase's redirect allow list. */
export const NATIVE_REDIRECT = 'com.novakitz.app://auth/callback';

class GoogleSignInCancelled extends Error {
  constructor() {
    super('Google sign-in cancelled');
    this.name = 'GoogleSignInCancelled';
  }
}

/** True when the person closed the Safari sheet — not worth surfacing as an error. */
export function isGoogleSignInCancelled(error: unknown): boolean {
  return error instanceof GoogleSignInCancelled;
}

const OAUTH_QUERY = { access_type: 'offline', prompt: 'consent' };

async function signInWeb(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      skipBrowserRedirect: false,
      queryParams: OAUTH_QUERY,
    },
  });
  if (error) throw error;
}

/** Pull a session out of the URL iOS handed to the app and apply it. */
async function applySessionFromUrl(url: string): Promise<void> {
  const hashAt = url.indexOf('#');
  const queryAt = url.indexOf('?');
  const hash = new URLSearchParams(hashAt >= 0 ? url.slice(hashAt + 1) : '');
  const query = new URLSearchParams(
    queryAt >= 0 ? url.slice(queryAt + 1, hashAt >= 0 && hashAt > queryAt ? hashAt : undefined) : '',
  );

  // Supabase reports a refused sign-in in the same places it reports a good one.
  const failure = hash.get('error_description') ?? query.get('error_description');
  if (failure) throw new Error(failure);

  const access_token = hash.get('access_token');
  const refresh_token = hash.get('refresh_token');
  if (!access_token || !refresh_token) {
    throw new Error('Google sign-in did not return a session.');
  }

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
}

async function signInNative(): Promise<void> {
  const [{ Browser }, { App }] = await Promise.all([
    import('@capacitor/browser'),
    import('@capacitor/app'),
  ]);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: NATIVE_REDIRECT,
      // Hand the address back instead of navigating the web view away from the
      // app: the web view stays put and Safari does the Google part.
      skipBrowserRedirect: true,
      queryParams: OAUTH_QUERY,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Google did not return a sign-in address.');

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let returned = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      handles.forEach((h) => { void h.remove(); });
      fn();
    };

    App.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith(NATIVE_REDIRECT)) return;
      // Set before closing the sheet: closing it fires `browserFinished`, which
      // would otherwise read as the person backing out.
      returned = true;
      try { await Browser.close(); } catch { /* already gone */ }
      try {
        await applySessionFromUrl(url);
        settle(resolve);
      } catch (e) {
        settle(() => reject(e));
      }
    }).then((h) => { if (settled) void h.remove(); else handles.push(h); });

    Browser.addListener('browserFinished', () => {
      // The return URL and the sheet closing can arrive in either order, so give
      // a real return a moment to claim the outcome before calling it a cancel.
      setTimeout(() => {
        if (!returned) settle(() => reject(new GoogleSignInCancelled()));
      }, 700);
    }).then((h) => { if (settled) void h.remove(); else handles.push(h); });

    Browser.open({ url: data.url }).catch((e) => settle(() => reject(e)));
  });
}

export async function signInWithGoogle(): Promise<void> {
  return isNative() ? signInNative() : signInWeb();
}
