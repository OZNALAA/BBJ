const CACHE_NAME = 'bbj-app-v3.4';

const CORE_ASSETS = [
    'index.html',
    'css/style.css',
    'css/efb_wizard.css',
    'manifest.json',
    'logo BBJ.jpeg',
    'trim graph.jpeg',
    'js/airports.js',
    'js/app.js',
    'js/auth.js',
    'js/calculations.js',
    'js/crew.js',
    'js/data.js',
    'js/flightlog.js',
    'js/flights.js',
    'js/settings.js',
    'js/trim.js',
    'js/users.js',
    'js/wizard.js',
    'js/sheets/fuel.js',
    'js/sheets/limitations.js',
    'js/sheets/sheetdata.js',
    'js/sheets/trims.js',
    'img/banner.png',
    'img/diagram_right.png',
    'img/flightlog_logo.png',
    'img/icon-192.png',
    'img/icon-512.png',
    'img/logo_topleft.png',
    'img/logo_topright.png'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(CORE_ASSETS).catch(function(e) {
                console.warn('SW: certains fichiers non mis en cache', e);
            });
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.filter(function(k) {
                return k !== CACHE_NAME;
            }).map(function(k) {
                return caches.delete(k);
            }));
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            if (cached) return cached;
            return fetch(event.request).then(function(response) {
                if (response.ok && new URL(event.request.url).origin === self.location.origin) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, copy);
                    });
                }
                return response;
            }).catch(function() {
                return caches.match('index.html');
            });
        })
    );
});
