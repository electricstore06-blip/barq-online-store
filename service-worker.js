const CACHE_NAME = "barq-driver-v4";

const APP_FILES = [
    "./",
    "./driver-login.html",
    "./driver-login.js",
    "./manifest.json",
    "./barq-driver-icon-192.png",
    "./barq-driver-icon-512.png"
];

// INSTALL
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

// ACTIVATE
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// FETCH
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request);
            })
    );
});
