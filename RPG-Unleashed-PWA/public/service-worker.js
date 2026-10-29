const CACHE_NAME = "rpg-unleashed-v101";

const APP_SHELL = [
    "/",
    "/index.html",
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/sheet-inspect.js",
    "/data/language-descriptions.json",
    "/data/sheet-reference-details.json",
    "/data/cultural-traits-one-v1.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                // Do not let one missing optional asset make the whole PWA
                // non-installable. Cache the guaranteed core one at a time.
                await Promise.allSettled(
                    APP_SHELL.map(url => cache.add(url))
                );
            })
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
