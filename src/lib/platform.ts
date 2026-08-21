'use client';

import { Capacitor } from '@capacitor/core';

/** True inside the Capacitor shell, false on the web. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Navigate to another page of the app.
 *
 * The exported bundle writes each route as a directory index —
 * out/pricing/index.html — and Capacitor's file handler does not resolve a
 * directory to that index. An unresolved path falls back to the root document,
 * so tapping Pricing in the app quietly landed on the home screen instead of
 * failing visibly. Naming the file directly removes the resolution step; on the
 * web the clean URL is kept, where Next resolves it as usual.
 *
 * `path` is expected to end in a slash, matching `trailingSlash: true`.
 */
export function goTo(path: string): void {
  window.location.href = isNative() ? `${path}index.html` : path;
}
