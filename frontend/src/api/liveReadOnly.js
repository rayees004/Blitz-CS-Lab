/**
 * Read-only guard for live mode (npm run dev:live).
 * Blocks non-GET requests to the production backend so local testing never changes real data.
 * Login and logout are allowed so you can sign in with real accounts.
 */
const ALLOWED_WRITES = ['/auth/login/', '/auth/logout/'];
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function installLiveReadOnlyGuard() {
  if (import.meta.env.VITE_LIVE_READONLY !== 'true') return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();

    if (!SAFE_METHODS.includes(method) && !ALLOWED_WRITES.some((path) => url.includes(path))) {
      const body = JSON.stringify({
        detail: 'Live read-only mode: changes are blocked so real data is not modified.',
      });
      return Promise.resolve(
        new Response(body, { status: 403, headers: { 'Content-Type': 'application/json' } })
      );
    }

    return originalFetch(input, init);
  };

  console.info('[Blitz] Live read-only mode: connected to', import.meta.env.VITE_API_URL);
}
