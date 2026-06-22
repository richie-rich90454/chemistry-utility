// Service Worker for Chemistry Utility PWA
// Update CACHE_VERSION when deploying new assets to bust the cache
var CACHE_VERSION = 'chemutil-v1';

// Critical assets to pre-cache on install
var PRECACHE_URLS = [
	'/',
	'/index.html',
	'/ptable.json',
	'/favicon.png',
	'/favicon.ico',
	'/apple-touch-icon.png',
	'/EBGaramond-VariableFont_wght.woff2',
	'/NotoSans-VariableFont_wdth,wght.woff2'
];

// File extensions that should use cache-first strategy (immutable assets)
var CACHE_FIRST_EXTENSIONS = [
	'.css', '.js', '.woff2', '.woff', '.ttf', '.png', '.jpg', '.jpeg',
	'.svg', '.ico', '.webp', '.json'
];

// Install event: pre-cache critical assets
self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE_VERSION).then(function(cache) {
			return cache.addAll(PRECACHE_URLS);
		}).then(function() {
			return self.skipWaiting();
		})
	);
});

// Activate event: clean up old caches
self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(name) {
					return name !== CACHE_VERSION;
				}).map(function(name) {
					return caches.delete(name);
				})
			);
		}).then(function() {
			return self.clients.claim();
		})
	);
});

// Fetch event: cache-first for immutable assets, network-first for HTML, offline fallback
self.addEventListener('fetch', function(event) {
	var requestUrl = new URL(event.request.url);

	// Only handle same-origin requests
	if (requestUrl.origin !== self.location.origin) {
		return;
	}

	// Navigation requests: network-first with offline fallback to cached index.html
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch(function() {
				return caches.match('/index.html');
			})
		);
		return;
	}

	// Check if the request is for an immutable asset (cache-first)
	var isCacheFirst = CACHE_FIRST_EXTENSIONS.some(function(ext) {
		return requestUrl.pathname.endsWith(ext);
	});

	if (isCacheFirst) {
		event.respondWith(
			caches.match(event.request).then(function(cachedResponse) {
				if (cachedResponse) {
					return cachedResponse;
				}
				return fetch(event.request).then(function(networkResponse) {
					if (networkResponse && networkResponse.status === 200) {
						var responseClone = networkResponse.clone();
						caches.open(CACHE_VERSION).then(function(cache) {
							cache.put(event.request, responseClone);
						});
					}
					return networkResponse;
				});
			})
		);
		return;
	}

	// Default: network-first, fall back to cache
	event.respondWith(
		fetch(event.request).then(function(networkResponse) {
			if (networkResponse && networkResponse.status === 200) {
				var responseClone = networkResponse.clone();
				caches.open(CACHE_VERSION).then(function(cache) {
					cache.put(event.request, responseClone);
				});
			}
			return networkResponse;
		}).catch(function() {
			return caches.match(event.request);
		})
	);
});
