const CACHE_NAME = "barq-driver-v4";

const APP_FILES = [
    "./driver-login.html",
    "./driver-login.js",
    "./driver-dashboard.html",
    "./driver-dashboard.css",
    "./driver-dashboard.js",
    "./driver-firebase-config.js",
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
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key =>
                            key.startsWith("barq-driver-") &&
                            key !== CACHE_NAME
                        )
                        .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// FETCH
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Handle only requests from this origin.
    if (url.origin !== self.location.origin) return;

    // Do not intercept customer-store pages or assets.
    const path = url.pathname;

    const isDriverFile =
        path.endsWith("/driver-login.html") ||
        path.endsWith("/driver-login.js") ||
        path.endsWith("/driver-dashboard.html") ||
        path.endsWith("/driver-dashboard.css") ||
        path.endsWith("/driver-dashboard.js") ||
        path.endsWith("/driver-firebase-config.js") ||
        path.endsWith("/manifest.json") ||
        path.endsWith("/barq-driver-icon-192.png") ||
        path.endsWith("/barq-driver-icon-512.png");

    if (!isDriverFile) return;

    event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
            const cachedResponse = await cache.match(event.request);

            if (cachedResponse) {
                return cachedResponse;
            }

            const networkResponse = await fetch(event.request);

            if (
                networkResponse &&
                networkResponse.status === 200 &&
                networkResponse.type === "basic"
            ) {
                await cache.put(
                    event.request,
                    networkResponse.clone()
                );
            }

            return networkResponse;
        })
    );
});
