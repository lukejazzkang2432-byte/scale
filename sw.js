/* SCALE 서비스워커 v3 — 항상 최신 화면 + 푸시 알림 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD5YrglrzgjbNxQmIwga-8TRnGmc3fXscU",
  authDomain: "scalejungsan1launch.firebaseapp.com",
  projectId: "scalejungsan1launch",
  storageBucket: "scalejungsan1launch.firebasestorage.app",
  messagingSenderId: "52732836281",
  appId: "1:52732836281:web:054742fbd7cadf41121e68"
});
firebase.messaging();

const CACHE = 'scale-v3';
const SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-urgent.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

/* 화면과 코드는 항상 서버에서 먼저 가져옵니다(네트워크 우선).
   인터넷이 없을 때만 저장해둔 걸 씁니다. 그래서 새로 올리면 바로 반영돼요. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;

  const isImage = /\.(png|jpg|jpeg|svg|webp|ico)$/i.test(u.pathname);

  if (isImage) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    })));
    return;
  }

  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    if (clients.openWindow) return clients.openWindow('./index.html');
  }));
});
