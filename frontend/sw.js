const CACHE_NAME = 'learnx-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './courses.html',
  './about.html',
  './contact.html',
  './dashboard.html',
  './assets/css/navbar.css',
  './assets/css/dark-theme.css',
  './assets/css/index.css',
  './assets/css/dashboard.css',
  './assets/js/theme.js',
  './assets/js/auth-modal.js',
  './assets/js/dashboard.js',
  './assets/js/index.js',
  './assets/images/learnx-logo-img.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

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
