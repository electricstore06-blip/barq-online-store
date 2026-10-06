const CACHE_NAME = "barq-driver-v2";

const APP_FILES = [
    "./driver-login.html",
    "./driver-login.js",

    "./driver-dashboard.html",
    "./driver-dashboard.css",
    "./driver-dashboard.js",

    "./firebase-config.js",

    "./manifest.json",

    "./barq-driver-icon-192.png",
    "./barq-driver-icon-512.png"
];


// INSTALL
self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(APP_FILES);

            })
            .then(() => {

                return self.skipWaiting();

            })

    );

});


// ACTIVATE
self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(keys => {

                return Promise.all(

                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))

                );

            })
            .then(() => {

                return self.clients.claim();

            })

    );

});


// FETCH
self.addEventListener("fetch", event => {

    // Only handle GET requests
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(

        caches.match(event.request)
            .then(cachedResponse => {

                // Use cached file if available
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise get it from the internet
                return fetch(event.request)
                    .then(networkResponse => {

                        // Save successful responses
                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            networkResponse.type === "basic"
                        ) {

                            const responseClone =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        event.request,
                                        responseClone
                                    );

                                });

                        }

                        return networkResponse;

                    });

            })

    );

});
