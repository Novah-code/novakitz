'use client';

import { isNative } from './platform';

/**
 * Speech-to-text across web and the Capacitor app.
 *
 * iOS WKWebView does not implement the Web Speech API even though Safari on the
 * same device does, so the app needs the native plugin. Both paths are hidden
 * behind one interface here rather than branching at each call site.
 *
 * The native plugin hands the audio to iOS, which returns text — the recording
 * itself never reaches our servers, so no audio is collected.
 */

export type SpeechLang = 'en' | 'ko';

export interface SpeechSession {
  stop: () => void;
}

interface StartOptions {
  language: SpeechLang;
  onResult: (transcript: string) => void;
  /** Called when listening finishes, whether by result, cancellation, or error. */
  onEnd: () => void;
}

function locale(language: SpeechLang): string {
  return language === 'ko' ? 'ko-KR' : 'en-US';
}

function webRecognition(): (new () => never) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => never) | null;
}

/**
 * Whether a microphone button should be shown at all.
 * Sync so it can be read during render; the native plugin ships with the app,
 * so its presence follows the platform rather than a runtime check.
 */
export function speechSupported(): boolean {
  return isNative() || webRecognition() !== null;
}

async function startNative(options: StartOptions): Promise<SpeechSession | null> {
  const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');

  const permission = await SpeechRecognition.checkPermissions();
  if (permission.speechRecognition !== 'granted') {
    const asked = await SpeechRecognition.requestPermissions();
    if (asked.speechRecognition !== 'granted') {
      options.onEnd();
      return null;
    }
  }

  // partialResults keeps the plugin emitting while the user speaks; we only act
  // on the last value, but without it iOS can end the session early on a pause.
  await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
    if (data.matches?.length) options.onResult(data.matches[0]);
  });

  await SpeechRecognition.start({
    language: locale(options.language),
    maxResults: 1,
    partialResults: true,
    popup: false,
  });

  return {
    stop: () => {
      void SpeechRecognition.stop().finally(() => {
        void SpeechRecognition.removeAllListeners();
        options.onEnd();
      });
    },
  };
}

function startWeb(options: StartOptions): SpeechSession | null {
  const Recognition = webRecognition();
  if (!Recognition) {
    options.onEnd();
    return null;
  }

  const recognition = new Recognition() as unknown as {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: { results: Array<Array<{ transcript: string }>> }) => void;
    onerror: () => void;
    onend: () => void;
    start: () => void;
    abort: () => void;
  };

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = locale(options.language);
  recognition.onresult = (event) => options.onResult(event.results[0][0].transcript);
  recognition.onerror = () => options.onEnd();
  recognition.onend = () => options.onEnd();
  recognition.start();

  return { stop: () => recognition.abort() };
}

/**
 * Begin listening. Returns null when unavailable or the user declined, having
 * already called onEnd so callers can clear their recording state either way.
 */
export async function startListening(options: StartOptions): Promise<SpeechSession | null> {
  try {
    return isNative() ? await startNative(options) : startWeb(options);
  } catch (error) {
    console.error('[speech] Failed to start listening:', error);
    options.onEnd();
    return null;
  }
}
