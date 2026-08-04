const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

let installed = false;

function rewrite(url: string): string {
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')) {
      return API_BASE + parsed.pathname + parsed.search;
    }
  } catch {
    // Not a URL we can parse — leave it for fetch to reject as it normally would.
  }
  return url;
}

/**
 * Point relative `/api/*` calls at the deployed API.
 *
 * Inside the Capacitor shell the UI is served from a local origin
 * (capacitor://localhost), so the ~30 existing `fetch('/api/...')` call sites
 * would resolve against that origin and 404. Patching fetch rewrites them all
 * at once and keeps future call sites working without an import.
 *
 * No-op on the web, where NEXT_PUBLIC_API_BASE is unset and the relative paths
 * already resolve correctly.
 */
export function installApiBase(): void {
  if (installed || !API_BASE || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
      return originalFetch(rewrite(input), init);
    }
    if (input instanceof URL) {
      return originalFetch(rewrite(input.href), init);
    }
    if (input instanceof Request) {
      const target = rewrite(input.url);
      return target === input.url
        ? originalFetch(input, init)
        : originalFetch(new Request(target, input), init);
    }
    return originalFetch(input, init);
  };
}
