const CACHE_NAME = "rpg-unleashed-v23";

const APP_SHELL = [
    "./",
    "./index.html",
    "./owlbear-integration.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/apple-touch-icon.png",
    "./owlbear/manifest.json",
    "./owlbear/INSTALL.txt"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;

    if (
        request.method !== "GET" ||
        new URL(request.url).origin !== self.location.origin
    ) {
        return;
    }

    if (
        new URL(request.url).pathname.endsWith(
            "/owlbear-integration.js"
        )
    ) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(request, copy));

                    return response;
                })
                .catch(() =>
                    caches.match(request)
                )
        );

        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => cache.put("./index.html", copy));

                    return response;
                })
                .catch(() =>
                    caches.match("./index.html")
                )
        );

        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) {
                    return cached;
                }

                return fetch(request)
                    .then(response => {
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        const copy = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, copy));

                        return response;
                    });
            })
    );
});
