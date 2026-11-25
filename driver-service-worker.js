const DRIVER_CACHE_NAME = "barq-driver-v6";
const ADMIN_CACHE_NAME = "barq-admin-v1";

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
const ADMIN_FILES = [
    "./admin-dashboard.html",
    "./admin-manifest.json",
    "./firebase-config.js",
    "./favicon.ico"
];
// INSTALL
self.addEventListener("install", event => {
    event.waitUntil(
        Promise.all([
            caches.open(DRIVER_CACHE_NAME)
                .then(cache => cache.addAll(APP_FILES)),

            caches.open(ADMIN_CACHE_NAME)
                .then(cache => cache.addAll(ADMIN_FILES))
        ])
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
                            (
                                key.startsWith("barq-driver-") &&
                                key !== DRIVER_CACHE_NAME
                            ) ||
                            (
                                key.startsWith("barq-admin-") &&
                                key !== ADMIN_CACHE_NAME
                            )
                        )
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

// FETCH
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) return;

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

    const isAdminFile =
        path.endsWith("/admin-dashboard.html") ||
        path.endsWith("/admin-manifest.json") ||
        path.endsWith("/firebase-config.js") ||
        path.endsWith("/favicon.ico");

    if (!isDriverFile && !isAdminFile) return;

    const cacheName = isDriverFile
        ? DRIVER_CACHE_NAME
        : ADMIN_CACHE_NAME;

    event.respondWith(
        caches.open(cacheName).then(async cache => {
            const cachedResponse = await cache.match(event.request);

            if (cachedResponse) return cachedResponse;

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
