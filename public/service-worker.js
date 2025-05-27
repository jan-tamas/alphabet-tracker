const CACHE_NAME = 'alphabet-tracker-cache-v1';
const urlsToCache = [
  '/alphabet-tracker/', // Cache the GitHub Pages app root
  '/alphabet-tracker/index.html', // Explicitly cache index.html with GitHub Pages path
  '/alphabet-tracker/manifest.json', // Cache the manifest file with GitHub Pages path
  // Since we're using a base64 encoded icon directly in HTML, 
  // we don't need to cache separate icon files
];

// Install event: Cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: Serve from cache, fallback to network, then cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache if it's a data: URL or similar
                if (event.request.url.startsWith('http')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(error => {
            // If fetch fails, return a custom offline page or a fallback
            console.log('Fetch failed; returning offline page or fallback', error);
            
            // This is where you'd return a custom offline page if you had one
            // For now we just let the error propagate
            throw error;
          });
      })
  );
});

// Activate event: Clean up old caches (optional, but good practice)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
