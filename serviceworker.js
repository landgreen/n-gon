const CACHE_NAME = "version-3";
const urlsToCache = [
    "/",
    '/index.html',
    '/js/bullet.js',
    '/js/engine.js',
    '/js/index.js',
    '/js/level.js',
    '/js/lore.js',
    '/js/mob.js',
    '/js/player.js',
    '/js/powerup.js',
    '/js/simulation.js',
    '/js/spawn.js',
    '/js/tech.js',
    '/js/visibility.js',
    '/lib/decomp.min.js',
    '/lib/matter.min.js',
    '/lib/randomColor.min.js',
    '/favicon1.ico',
    '/style.css'
];

// Install the service worker and open the cache and add files mentioned in array to cache
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});
// Listens to request from application.
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    // The requested file exists in the cache so we return it from the cache.
                    return response;
                }

                // The requested file is not present in cache so we send it forward to the internet
                return fetch(event.request);
            }
        )
    );
});

//CoderMuffin was here :D
