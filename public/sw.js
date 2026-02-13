// Service Worker for Lost & Found PWA
// Version 1.0.0

const CACHE_NAME = 'lost-found-v1';
const RUNTIME_CACHE = 'lost-found-runtime-v1';
const IMAGE_CACHE = 'lost-found-images-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/home',
    '/my-reports',
    '/profile',
    '/rewards',
    '/offline.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Auth endpoints that should NEVER be cached
const AUTH_ENDPOINTS = [
    '/api/auth',
    '/auth/callback'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== IMAGE_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - differentiated caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip chrome-extension and other unsupported schemes
    if (!url.protocol.startsWith('http')) {
        console.log('[SW] Skipping non-http(s) request:', url.protocol);
        return;
    }

    // NEVER cache POST, PUT, DELETE, PATCH requests (uploads, mutations)
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        console.log('[SW] Network-only for', request.method, 'request:', url.href);
        return event.respondWith(fetch(request).catch(error => {
            console.error('[SW] Network request failed:', error);
            return new Response(JSON.stringify({
                error: 'Network request failed',
                message: 'Unable to connect to server. Please check your internet connection.'
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }));
    }

    // Never cache Supabase auth/API/Storage endpoints
    if (url.hostname.includes('supabase.co')) {
        console.log('[SW] Network-only for Supabase:', url.href);
        return event.respondWith(fetch(request).catch(error => {
            console.error('[SW] Supabase request failed:', error);
            return new Response(JSON.stringify({
                error: 'Service temporarily unavailable',
                message: 'Supabase is currently unreachable. Please try again.'
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }));
    }

    // Never cache auth endpoints
    if (AUTH_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
        console.log('[SW] Network-only for auth:', url.pathname);
        return event.respondWith(fetch(request));
    }

    // Cache-first for static assets
    if (request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'font' ||
        url.pathname.startsWith('/_next/static')) {
        event.respondWith(cacheFirst(request, CACHE_NAME));
        return;
    }

    // Stale-while-revalidate for images (but not from Supabase storage)
    if (request.destination === 'image') {
        event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
        return;
    }

    // Network-first for API calls
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request, RUNTIME_CACHE));
        return;
    }

    // Network-first for HTML pages
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, RUNTIME_CACHE));
        return;
    }

    // Default: network-first
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        console.log('[SW] Cache hit:', request.url);
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

// Network-first strategy with timeout
async function networkFirst(request, cacheName, timeout = 3000) {
    const cache = await caches.open(cacheName);

    try {
        const networkPromise = fetch(request);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeout)
        );

        const response = await Promise.race([networkPromise, timeoutPromise]);

        // Only cache GET requests with successful responses
        if (response.ok && request.method === 'GET') {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlinePage = await cache.match('/offline.html');
            if (offlinePage) return offlinePage;
        }

        // Return JSON error for API requests
        if (request.url.includes('/api/') || request.url.includes('supabase.co')) {
            return new Response(JSON.stringify({
                error: 'Network Error',
                message: 'Unable to connect. Please check your internet connection.'
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response('Offline', { status: 503 });
    }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    });

    return cached || fetchPromise;
}

// Background Sync for chat messages
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-chat-messages') {
        event.waitUntil(syncChatMessages());
    }

    if (event.tag === 'sync-report-submission') {
        event.waitUntil(syncReportSubmissions());
    }
});

// Sync queued chat messages
async function syncChatMessages() {
    try {
        const queue = await getQueuedMessages('chat');
        console.log('[SW] Syncing', queue.length, 'chat messages');

        for (const message of queue) {
            try {
                const response = await fetch('/api/chat/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message)
                });

                if (response.ok) {
                    await removeFromQueue('chat', message.id);
                }
            } catch (error) {
                console.error('[SW] Failed to sync message:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Sync queued report submissions
async function syncReportSubmissions() {
    try {
        const queue = await getQueuedMessages('reports');
        console.log('[SW] Syncing', queue.length, 'reports');

        for (const report of queue) {
            try {
                const response = await fetch('/api/reports/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(report)
                });

                if (response.ok) {
                    await removeFromQueue('reports', report.id);
                }
            } catch (error) {
                console.error('[SW] Failed to sync report:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Helper functions for queue management
async function getQueuedMessages(queueName) {
    // Implementation would use IndexedDB
    return [];
}

async function removeFromQueue(queueName, id) {
    // Implementation would use IndexedDB
    return true;
}

// Message event for communication with app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
