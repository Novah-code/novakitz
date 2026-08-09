'use client';

import { Capacitor } from '@capacitor/core';

/** True inside the Capacitor shell, false on the web. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Whether the browser can transcribe speech.
 *
 * iOS WKWebView — which is what the Capacitor app runs in — does not implement
 * the Web Speech API, even though Safari on the same device does. Without this
 * check the microphone button renders in the app and silently does nothing when
 * tapped.
 */
export function supportsSpeechRecognition(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}
