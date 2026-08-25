import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Who is actually calling an API route.
 *
 * Every route here used to decide this from the request body — a `userId`
 * field, or an `adminEmail` field compared against a constant. Both are
 * written by the caller, so both were decorative: sending someone else's id,
 * or the admin's own address, was a matter of typing it. The browser checked
 * these things too, but a browser check only protects people who use the
 * browser.
 *
 * The Supabase access token is the one thing a caller cannot forge, because
 * verifying it means asking Supabase. So identity comes from the token and
 * nowhere else, and any `userId` in a body is ignored.
 */

export interface AuthedUser {
  id: string;
  email: string | null;
}

/**
 * Addresses allowed to reach the admin routes.
 *
 * Set ADMIN_EMAILS (comma-separated) to change this without a deploy. The
 * fallback is the address that was already hardcoded in the routes, so
 * behaviour does not change if the variable is unset.
 */
function adminEmails(): string[] {
  const configured = process.env.ADMIN_EMAILS;
  const raw = configured && configured.trim() ? configured : 'jeongnewna@gmail.com';
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function bearer(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim() || null;
}

/**
 * The user behind this request, or null.
 *
 * Unlike the quota check, this deliberately fails *closed* when Supabase
 * credentials are missing: a deployment that cannot verify anyone must not
 * decide that everyone is fine.
 */
export async function authenticate(request: Request): Promise<AuthedUser | null> {
  const token = bearer(request);
  if (!token) return null;

  const supabase = admin();
  if (!supabase) {
    console.error('[auth] Supabase service credentials missing; refusing.');
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  return { id: data.user.id, email: data.user.email ?? null };
}

/** The user behind this request, if they are an admin. */
export async function authenticateAdmin(request: Request): Promise<AuthedUser | null> {
  const user = await authenticate(request);
  if (!user?.email) return null;
  return adminEmails().includes(user.email.toLowerCase()) ? user : null;
}

/**
 * One response for "not signed in" and "signed in, but not you".
 *
 * Telling the two apart would confirm which addresses are admins to anyone
 * who asks, and there is nothing a caller can usefully do with the
 * distinction.
 */
export function denied(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
