const CACHE_NAME = 'c4wc-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/site.webmanifest'
];

// Add base path for GitHub Pages
const BASE_PATH = '/children4worldchildren';
const isGhPages = window.location.hostname.includes('github.io');
const getCacheUrl = (url) => isGhPages ? `${BASE_PATH}${url}` : url;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache each resource individually to prevent the entire cache from failing
        return Promise.all(
          urlsToCache.map((url) => {
            const fullUrl = getCacheUrl(url);
            return fetch(fullUrl, { credentials: 'same-origin', mode: 'no-cors' })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return cache.put(fullUrl, response);
              })
              .catch(err => {
                console.warn(`Failed to cache ${fullUrl}:`, err);
              });
          })
        );
      })
  );
  // Activate the new service worker immediately
  self.skipWaiting();
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response;
      }
      
      // Clone the request
      const fetchRequest = event.request.clone();
      
      // Fetch from network and cache the response
      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache the response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});