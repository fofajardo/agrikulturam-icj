const CACHE_VERSION = "1.0.0-41d8013eba6dc75c";
const CACHE_NAME = "agriculturam-${CACHE_VERSION}";

const OFFLINE_URL = "";
const CACHE_ASSETS = [
    `${OFFLINE_URL}`,
    "assets/common.css",
    "assets/common.js",
    "assets/common.proto.css",
    "assets/branding/favicon.png",
    "assets/branding/icon-192.png",
    "assets/branding/icon-32.svg",
    "assets/branding/icon-512.png",
    "assets/branding/maskable_icon_x128.png",
    "assets/branding/maskable_icon_x192.png",
    "assets/branding/maskable_icon_x384.png",
    "assets/branding/maskable_icon_x48.png",
    "assets/branding/maskable_icon_x512.png",
    "assets/branding/maskable_icon_x72.png",
    "assets/branding/maskable_icon_x96.png",
    "assets/images/404.svg",
    "assets/images/done.svg",
    "assets/images/entry.svg",
    "assets/images/home-1.svg",
    "assets/images/home-2.svg",
    "assets/images/home-3.svg",
    "assets/images/no-data.svg",
    "views/detect.html",
    "views/health.html",
    "views/home.html",
    "views/pests-0.html",
    "views/pests-1.html",
    "views/pests-2.html",
    "views/settings.html",
    "views/statistics.html"
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
              .then(cache => {
            return cache.addAll(CACHE_ASSETS)
                        .then(() => self.skipWaiting());
        })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        if ("navigationPreload" in self.registration) {
            await self.registration.navigationPreload.enable();
        }
    })());

    self.clients.claim();
});

self.addEventListener("fetch", event => {
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(
            event.request,
            { ignoreSearch: true }
        );
        if (cachedResponse) {
            return cachedResponse;
        }

        try {
            const preloadResponse = await event.preloadResponse;
            if (preloadResponse) {
                return preloadResponse;
            }

            const networkResponse = await fetch(event.request);
            return networkResponse;
        } catch (e) {
            if (event.request.mode === "navigate") {
                const offlineResponse = await cache.match(OFFLINE_URL);
                return offlineResponse;
            }
            return e;
        }
    })());
});
