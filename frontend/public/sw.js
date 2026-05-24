// Multiverse Chat — Service Worker
// Strategy:
//   - Static assets (JS, CSS, fonts, icons): Cache-first
//   - API calls & socket: Network-only (never cached)
//   - HTML navigation: Network-first with cache fallback

const CACHE_NAME = 'multiverse-chat-v1'

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
]

// ── Install: precache shell ───────────────────────────────────────────────────

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS)
        }).then(() => self.skipWaiting())
    )
})

// ── Activate: clean old caches ────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        }).then(() => self.clients.claim())
    )
})

// ── Fetch: routing strategy ───────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url)

    // Never cache: API calls, socket.io, Firebase, external services
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/socket.io/') ||
        url.hostname.includes('firebaseapp.com') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('firebase.google.com') ||
        url.hostname.includes('identitytoolkit') ||
        event.request.method !== 'GET'
    ) {
        return  // Let the browser handle it normally
    }

    // Static assets (JS, CSS, images, fonts): Cache-first
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ttf|ico)$/)
    ) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response
                    }
                    const responseToCache = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache)
                    })
                    return response
                })
            })
        )
        return
    }

    // HTML navigation: Network-first, fallback to cached index.html (SPA)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/index.html')
            })
        )
        return
    }
})

// ── Push Notifications (placeholder for future use) ───────────────────────────

self.addEventListener('push', (event) => {
    if (!event.data) return
    const data = event.data.json()
    self.registration.showNotification(data.title || 'Multiverse Chat', {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
    })
})
