'use client';

import { supabase } from './supabase';

/**
 * The Authorization header for a call to our own API.
 *
 * The routes used to take the caller's word for who they were — a `userId` or
 * an `adminEmail` in the request body — so nothing had to be sent. They verify
 * a token now, which means every call from the app has to carry one.
 *
 * Returns an empty object when nobody is signed in, so guest paths (a dream
 * reading without an account) still go through and the route decides.
 */
export async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { authorization: `Bearer ${token}` } : {};
}
