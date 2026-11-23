const CACHE_NAME = 'gomacart-cache-v3';

const urlsToCache = [
    './Goma.html',
    './Cart.css',
    './GomaCart.js',
    './manifest.json',
    './Sakura-2.png',
    './Sakura.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName =>
                        cacheName.startsWith('gomacart-cache-') &&
                        cacheName !== CACHE_NAME
                    )
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});