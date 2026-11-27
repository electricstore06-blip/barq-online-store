
const CACHE_NAME = "barq-customer-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./auth.js",
    "./firebase-config.js",
    "./i18n.js",
    "./customer-manifest.json",
    "./favicon.ico",
    "./checkout.html",
    "./checkout.css",
    "./checkout.js",
    "./orders.html",
    "./product-details.html",
    "./product-details.js",
    "./product-reviews.js",
    "./order-success.html",
    "./order-success.css",
    "./order-success.js"
];

// INSTALL
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.allSettled(
                    APP_FILES.map(file => cache.add(file))
                );
            })
            .then(() => self.skipWaiting())
    );
});

// ACTIVATE
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name =>
                        name.startsWith("barq-customer-") &&
                        name !== CACHE_NAME
                    )
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// FETCH
self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);

    // Only handle requests from this website
    if (
        request.method !== "GET" ||
        url.origin !== self.location.origin
    ) {
        return;
    }

    // Pages: try the network first
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, copy);
                        });
                    }
                    return response;
                })
                .catch(async () => {
                    return (
                        await caches.match(request)
                    ) || (
                        await caches.match("./index.html")
                    );
                })
        );
        return;
    }

    // Other local files: use cache first
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then(response => {
                if (response.ok && response.type === "basic") {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, copy);
                    });
                }

                return response;
            });
        })
    );
});
