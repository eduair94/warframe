// Browser-only singleton over one Socket.IO connection to the warframe-live server.
// Pages subscribe by url_name and receive { book, verdict } pushes. Auto-imported.
// SSR-safe: every entry short-circuits off-browser so useAsyncData/SSR never opens a socket.
import { io, type Socket } from 'socket.io-client'
import type { LiveUpdate } from '~/utils/liveTypes'

type Cb = (u: LiveUpdate) => void

let socket: Socket | null = null
const listeners = new Map<string, Set<Cb>>()
const connected = ref(false)

function liveUrl(): string {
  return useRuntimeConfig().public.liveURL as string
}

function ensureSocket(): Socket | null {
  if (!import.meta.client) return null
  if (socket) return socket
  socket = io(liveUrl(), { transports: ['websocket'], reconnection: true })
  socket.on('connect', () => {
    connected.value = true
    // Re-subscribe every active room on (re)connect. This is also how the FIRST
    // subscribe reaches the server when it was issued before the socket connected.
    listeners.forEach((_set, url) => socket!.emit('subscribe', { url_name: url }))
  })
  socket.on('disconnect', () => {
    connected.value = false
  })
  socket.on('update', (u: LiveUpdate) => {
    const set = listeners.get(u.url_name)
    if (set) set.forEach((cb) => cb(u))
  })
  return socket
}

// Subscribe a callback to one item's live updates; returns an unsubscribe fn.
// Emits 'subscribe' for the FIRST listener of a url, and only when already connected
// — otherwise the 'connect' handler re-subscribes all active urls, so exactly one
// 'subscribe' reaches the server (a naive direct emit double-counts viewers server-side).
export function subscribeLive(urlName: string, cb: Cb): () => void {
  if (!import.meta.client || !urlName) return () => {}
  const s = ensureSocket()
  let set = listeners.get(urlName)
  if (!set) {
    set = new Set()
    listeners.set(urlName, set)
  }
  const firstForUrl = set.size === 0
  set.add(cb)
  if (s && firstForUrl && s.connected) s.emit('subscribe', { url_name: urlName })
  return () => {
    const cur = listeners.get(urlName)
    if (!cur) return
    cur.delete(cb)
    if (cur.size === 0) {
      listeners.delete(urlName)
      if (s) s.emit('unsubscribe', { url_name: urlName })
    }
  }
}

export function useLiveFeed() {
  return { connected, subscribe: subscribeLive }
}

// Component helper: track one item's latest LiveUpdate, auto (un)subscribing with the
// component lifecycle. urlName may be a ref, getter, or plain string.
export function useLiveItem(urlName: MaybeRefOrGetter<string>) {
  const update = ref<LiveUpdate | null>(null)
  let off: (() => void) | null = null

  function bind(name: string) {
    if (off) {
      off()
      off = null
    }
    update.value = null
    if (name) off = subscribeLive(name, (u) => { update.value = u })
  }

  onMounted(() => {
    bind(toValue(urlName))
    watch(() => toValue(urlName), (n) => bind(n))
  })
  onBeforeUnmount(() => {
    if (off) {
      off()
      off = null
    }
  })

  return { update }
}
