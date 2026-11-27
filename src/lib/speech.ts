'use client';

import { isNative } from './platform';

/**
 * Speech-to-text across web and the Capacitor app.
 *
 * The native plugin is @capgo/capacitor-speech-recognition. The earlier one,
 * @capacitor-community/speech-recognition, has no Package.swift, so a Swift
 * Package project (this app's ios/App/CapApp-SPM) never included it and the
 * microphone button silently did nothing on a phone (found on a device,
 * 2026-11-27, with no 'speech' line in CapApp-SPM/Package.swift).
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
  /**
   * Called just before onEnd when listening could not start, so the screen can say
   * why instead of the button silently doing nothing.
   */
  onError?: (reason: SpeechFailure) => void;
}

/** denied: the person said no (or iOS remembers a no). unavailable: nothing could be started. */
export type SpeechFailure = 'denied' | 'unavailable';

export function speechFailureText(reason: SpeechFailure, language: SpeechLang): string {
  if (reason === 'denied') {
    return language === 'ko'
      ? '마이크와 음성 인식 권한이 필요해요. 설정 > Novakitz에서 켜 주세요.'
      : 'Microphone and speech recognition access is needed. Turn it on in Settings > Novakitz.';
  }
  return language === 'ko' ? '지금은 음성 기록을 쓸 수 없어요. 글로 적어 주세요.' : 'Voice is not available right now. You can type it instead.';
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
  const { SpeechRecognition } = await import('@capgo/capacitor-speech-recognition');

  const permission = await SpeechRecognition.checkPermissions();
  if (permission.speechRecognition !== 'granted') {
    const asked = await SpeechRecognition.requestPermissions();
    if (asked.speechRecognition !== 'granted') {
      options.onError?.('denied');
      options.onEnd();
      return null;
    }
  }

  // partialResults keeps the plugin emitting while the user speaks; we only act
  // on the last value, but without it iOS can end the session early on a pause.
  await SpeechRecognition.addListener('partialResults', (data: { matches?: string[] }) => {
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
    options.onError?.('unavailable');
    options.onEnd();
    return null;
  }
}
