export type TestLanguage = 'ko' | 'en';

/**
 * The archetype test used to start in Korean for everyone, so an English phone
 * opened it in Korean. Order now: what the person picked on the test's own
 * switch, then the app's language, then the phone's.
 */
export function initialTestLanguage(): TestLanguage {
  try {
    const own = localStorage.getItem('test_language');
    if (own === 'ko' || own === 'en') return own;
    const app = localStorage.getItem('preferredLanguage');
    if (app === 'ko' || app === 'en') return app;
  } catch {
    /* storage can be blocked; fall through to the phone's language */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}
