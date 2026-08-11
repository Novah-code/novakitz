'use client';

import { supabase } from './supabase';
import { isNative } from './platform';

/**
 * Sign in with Apple.
 *
 * App Review guideline 4.8 requires this wherever a third-party login is
 * offered, and Novakitz offers Google.
 *
 * The two platforms take different routes. On iOS, Apple expects the native
 * system sheet rather than a web redirect, so the plugin returns an identity
 * token that Supabase exchanges for a session. On the web there is no sheet, so
 * the usual OAuth redirect applies.
 */

/** Bundle ID doubles as the client id for the native sheet. Supabase must list it under Authorized Client IDs. */
const NATIVE_CLIENT_ID = 'com.novakitz.app';

function randomNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function signInNative(): Promise<void> {
  const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');

  // Apple only ever sees the hash; Supabase needs the raw value to verify that
  // the token it was handed belongs to this request.
  const nonce = randomNonce();

  const result = await SignInWithApple.authorize({
    clientId: NATIVE_CLIENT_ID,
    redirectURI: '',
    scopes: 'email name',
    nonce: await sha256(nonce),
  });

  const token = result.response?.identityToken;
  if (!token) {
    throw new Error('Apple did not return an identity token.');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token,
    nonce,
  });
  if (error) throw error;
}

async function signInWeb(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

/**
 * Resolves once signed in on native. On web it resolves as the browser
 * navigates away, so callers should keep their loading state until unmount.
 */
export async function signInWithApple(): Promise<void> {
  return isNative() ? signInNative() : signInWeb();
}

/** True when the user backed out of the sheet — not worth surfacing as an error. */
export function isAppleSignInCancelled(error: unknown): boolean {
  const message = (error as { message?: string })?.message ?? '';
  return /cancel/i.test(message) || /1001/.test(message);
}
