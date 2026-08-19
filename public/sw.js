const CACHE = 'macrotrack-v2'
const STATIC = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/Kayven.PNG',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Skip API calls — always network
  if (url.pathname.startsWith('/api/')) return

  // For navigation — network first, cache fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
          return res
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('/dashboard')))
    )
    return
  }

  // Static assets — cache first
  if (url.pathname.match(/\.(png|jpg|svg|ico|woff2|css|js)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()))
          return res
        })
      })
    )
    return
  }
})

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'MacroTrack', {
      body: data.body || 'Time to log your meal!',
      icon: '/Kayven.PNG',
      badge: '/Kayven.PNG',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/log' }
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/log'
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      const c = cs.find(x => x.url.includes(url))
      if (c) return c.focus()
      return clients.openWindow(url)
    })
  )
})
