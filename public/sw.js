// Minimal service worker - just enough to make PropLedger installable as a PWA.
// It intentionally does NOT cache app assets, so every deploy is always fresh
// (no stale-content issues). Its presence + a fetch handler is what lets the
// browser offer "Install app" / "Add to Home Screen".
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
