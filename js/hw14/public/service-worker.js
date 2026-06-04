const CACHE_NAME = 'students-catalog-cache-v1'
const API_CACHE_NAME = 'students-api-cache-v1'

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
]

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching static assets')
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('SW: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - Check cache before loading or cache dynamically
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip development websocket/hot reloading and chrome extensions
  if (
    url.pathname.includes('@vite') ||
    url.pathname.includes('node_modules') ||
    url.pathname.includes('hot-update') ||
    url.protocol !== self.location.protocol
  ) {
    return
  }

  const isApiRequest =
    url.origin === 'http://127.0.0.1:8000' ||
    url.pathname.startsWith('/api/') ||
    url.origin === 'https://example.com'

  if (isApiRequest) {
    // Network-First strategy for API requests
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
        .catch((error) => {
          console.log('SW: API request failed, serving from cache:', url.pathname)
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            throw error
          })
        })
    )
  } else {
    // Cache-First strategy for static assets (HTML, CSS, JS, etc.)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated version in the background to keep cache fresh
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse)
                })
              }
            })
            .catch(() => { /* Ignore background update errors */ })

          return cachedResponse
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
            return response
          })
          .catch((error) => {
            // Fallback for navigation requests when offline
            if (event.request.mode === 'navigate') {
              return caches.match('/')
            }
            throw error
          })
      })
    )
  }
})
