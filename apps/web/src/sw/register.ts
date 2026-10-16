/**
 * Registers the service worker built by vite/service-worker-plugin.ts (production only).
 * A new version waits until every tab is closed instead of taking over mid-workout;
 * unsent data lives in IndexedDB, so an update never drops the outbox.
 */
export async function registerServiceWorker(): Promise<void> {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  try {
    // Imported lazily: the root module is also evaluated on the server, where this CJS package fails.
    const { Workbox } = await import('workbox-window');
    await new Workbox('/sw.js').register();
  } catch (err) {
    console.error('Service worker registration failed', err);
  }
}
