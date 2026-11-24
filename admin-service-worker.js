
const CACHE_NAME = "barq-admin-v1";

const APP_FILES = [
    "./admin-dashboard.html",
    "./admin-manifest.json"
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
                            key.startsWith("barq-admin-") &&
                            key !== CACHE_NAME
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

    const isAdminFile =
        path.endsWith("/admin-dashboard.html") ||
        path.endsWith("/admin-manifest.json");

    if (!isAdminFile) return;

    event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
            const cached = await cache.match(event.request);

            if (cached) return cached;

            const response = await fetch(event.request);

            if (response && response.status === 200) {
                await cache.put(event.request, response.clone());
            }

            return response;
        })
    );
});
