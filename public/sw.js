self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'MacroTrack', {
      body: data.body || 'Time to log your meal!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/log' },
      actions: [
        { action: 'log', title: '+ Log now' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.action === 'dismiss') return
  const url = e.notification.data?.url || '/log'
  e.waitUntil(clients.matchAll({ type: 'window' }).then(cs => {
    const c = cs.find(x => x.url.includes(url))
    if (c) return c.focus()
    return clients.openWindow(url)
  }))
})

// Local scheduled notifications via periodic check
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    const { reminders } = e.data
    // Store reminders
    self.reminders = reminders
  }
})
