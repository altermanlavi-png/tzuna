// Tzuna: keeps the app on the phone so it opens with no internet.
// Pages: network first, so updates arrive as soon as there is a connection; the saved copy is used when offline.
// Fonts: the saved copy first.
var CACHE = 'tzuna-v1';
var CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
var LIBS = ['https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = req.url;
  if (req.method !== 'GET') return;
  var sameOrigin = url.indexOf(self.location.origin) === 0;
  var lib = LIBS.some(function (p) { return url.indexOf(p) === 0; });
  if (!sameOrigin && !lib) return;
  if (lib) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      });
    }));
    return;
  }
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined);
    });
  }));
});
