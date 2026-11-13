import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { authenticate, denied } from '../../../src/lib/apiAuth';

/*
 * Delete the caller's account: their rows, their files, and the sign-in record.
 *
 * The app used to do this from the browser, and could only do part of it. It
 * deleted six tables (dreams, profile, nickname, community posts and likes,
 * subscription) and signed out. Mood check-ins, affirmations, keywords and
 * everything else stayed, and so did the account itself — the browser has no
 * right to remove a row from auth.users, so the same email and password still
 * signed in afterwards, to an account that merely looked empty. Apple's
 * guideline 5.1.1(v) asks for the account to be deleted, not emptied.
 *
 * Only the service role can remove the sign-in record, so it happens here, and
 * identity comes from the token (never from the request body).
 *
 * Order: files, then rows, then the user. The schema files in /database give
 * most tables `ON DELETE CASCADE` on auth.users, which would make the explicit
 * row deletes redundant — but the live database was built by hand over time and
 * is not guaranteed to match those files, so nothing here relies on it.
 */

/** Tables that carry the user's id in `user_id`. Children before parents. */
const USER_TABLES = [
  'post_likes',
  'community_likes',
  'community_posts',
  'dream_patterns',
  'dream_keywords',
  'dream_insights',
  'dream_statistics',
  'daily_intentions',
  'evening_reflections',
  'affirmations',
  'ai_usage',
  'monthly_reports',
  'unconscious_profiles',
  'checkins',
  'dreams',
  'nicknames',
  'user_subscriptions',
  'subscriptions',
  'user_profiles',
] as const;

/**
 * A table or column that is not there is not a failure: this list is the union
 * of every table the code has ever written to, and some were never created in
 * production. Anything else is a real error and is reported.
 */
function isMissingRelation(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();
  return (
    code === '42P01' || // undefined_table
    code === '42703' || // undefined_column
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('could not find the')
  );
}

/** Remove every object under `prefix` (a folder, or '' with a name search). */
async function removeFiles(admin: SupabaseClient, bucket: string, folder: string, search?: string): Promise<string | null> {
  const paths: string[] = [];
  // Page through the listing; a person can have more images than one page holds.
  for (let offset = 0; offset < 10000; offset += 100) {
    const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100, offset, search });
    if (error) {
      // A bucket that does not exist has nothing in it to delete.
      if ((error.message ?? '').toLowerCase().includes('not found')) return null;
      return `${bucket}: ${error.message}`;
    }
    if (!data || data.length === 0) break;
    for (const file of data) {
      // Folders come back with a null id; only files are removable.
      if (!file.id) continue;
      // `search` is a loose match on the server, so a root-level listing is checked
      // again here: only names that begin with the search term are this person's.
      if (search && !file.name.startsWith(search)) continue;
      paths.push(folder ? `${folder}/${file.name}` : file.name);
    }
    if (data.length < 100) break;
  }
  if (paths.length === 0) return null;
  const { error } = await admin.storage.from(bucket).remove(paths);
  return error ? `${bucket}: ${error.message}` : null;
}

export async function POST(request: NextRequest) {
  const authed = await authenticate(request);
  if (!authed) return denied();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[delete-account] Supabase service credentials missing.');
    return NextResponse.json({ ok: false, error: 'Server is not configured to delete accounts.' }, { status: 500 });
  }
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const userId = authed.id;

  const problems: string[] = [];

  // 1. Files. Avatars sit at the bucket root as `<userId>-<time>.<ext>`; the two
  //    image buckets keep one folder per user.
  for (const problem of await Promise.all([
    removeFiles(admin, 'avatars', '', userId),
    removeFiles(admin, 'dream-images', userId),
    removeFiles(admin, 'community-images', userId),
  ])) {
    if (problem) problems.push(`storage ${problem}`);
  }

  // 2. Rows.
  for (const table of USER_TABLES) {
    const { error } = await admin.from(table).delete().eq('user_id', userId);
    if (error && !isMissingRelation(error)) problems.push(`${table}: ${error.message}`);
  }

  // An archetype result unlocked with this email as a guest holds the address too.
  if (authed.email) {
    const { error } = await admin.from('guest_archetype_results').update({ email: null, is_subscribed: false }).eq('email', authed.email);
    if (error && !isMissingRelation(error)) problems.push(`guest_archetype_results: ${error.message}`);
  }

  // 3. The sign-in record itself. This is the step that makes it a deletion.
  const { error: userError } = await admin.auth.admin.deleteUser(userId);
  if (userError) {
    console.error('[delete-account] could not delete auth user', userId, userError.message, problems);
    return NextResponse.json(
      { ok: false, error: 'Your records were removed, but the account itself could not be deleted. Please contact support.' },
      { status: 500 },
    );
  }

  if (problems.length > 0) {
    // The account is gone; these are leftovers worth knowing about, not a failure for the person.
    console.error('[delete-account] deleted user with leftovers', userId, problems);
  }

  return NextResponse.json({ ok: true });
}
