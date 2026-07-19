/**
 * Web Push client for /portfolio alerts (Spec B). Wraps the browser
 * PushManager + the API's /push/* endpoints so alerts fire with the tab closed.
 *
 * No accounts: a subscription is keyed by an anonymous `deviceId` (localStorage)
 * plus the browser's PushSubscription. The push handler lives in the vite-pwa SW
 * (see app/public/push-sw.js). SSR-safe: every browser API is import.meta.client
 * guarded.
 */
import { ref } from 'vue'

export interface AlertPayload {
  url_name: string
  item_name: string
  below: number | null
  above: number | null
  atl: boolean
}

export type SubscribeResult = 'subscribed' | 'denied' | 'unsupported' | 'disabled' | 'error'

const DEVICE_KEY = 'wf_push_device'

function isSupported(): boolean {
  return (
    import.meta.client &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function getDeviceId(): string {
  let id = ''
  try {
    id = window.localStorage.getItem(DEVICE_KEY) || ''
    if (!id) {
      id =
        (window.crypto && 'randomUUID' in window.crypto && window.crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(DEVICE_KEY, id)
    }
  } catch {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
  return id
}

// VAPID public keys are base64url; PushManager needs a Uint8Array.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function usePushAlerts() {
  const base = useApiBase()
  const { locale } = useI18n()

  const supported = ref(false)
  const subscribed = ref(false)
  const serverEnabled = ref(false) // API has VAPID configured

  async function fetchPublicKey(): Promise<{ key: string; enabled: boolean } | null> {
    try {
      return await $fetch<{ key: string; enabled: boolean }>(`${base}/push/public-key`)
    } catch {
      return null
    }
  }

  async function postSubscribe(sub: PushSubscription, alerts: AlertPayload[]): Promise<void> {
    await $fetch(`${base}/push/subscribe`, {
      method: 'POST',
      body: {
        deviceId: getDeviceId(),
        subscription: sub.toJSON(),
        alerts,
        locale: locale.value,
      },
    })
  }

  /** Turn on background push: permission -> browser subscription -> server sync. */
  async function subscribe(alerts: AlertPayload[]): Promise<SubscribeResult> {
    if (!isSupported()) return 'unsupported'
    const info = await fetchPublicKey()
    if (!info || !info.enabled || !info.key) return 'disabled'
    let perm: NotificationPermission = Notification.permission
    if (perm === 'default') perm = await Notification.requestPermission()
    if (perm !== 'granted') return 'denied'
    try {
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          // Cast: TS 5.7's Uint8Array<ArrayBufferLike> doesn't structurally match
          // BufferSource, though it is a valid application server key at runtime.
          applicationServerKey: urlBase64ToUint8Array(info.key) as BufferSource,
        })
      }
      await postSubscribe(sub, alerts)
      subscribed.value = true
      return 'subscribed'
    } catch {
      return 'error'
    }
  }

  /** Push the current alert list to the server (no-op unless already subscribed). */
  async function syncAlerts(alerts: AlertPayload[]): Promise<void> {
    if (!isSupported()) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      await postSubscribe(sub, alerts)
    } catch {
      /* offline / transient — the next sync will catch up */
    }
  }

  async function unsubscribe(): Promise<void> {
    const deviceId = getDeviceId()
    if (isSupported()) {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe().catch(() => {})
      } catch {
        /* ignore */
      }
    }
    await $fetch(`${base}/push/unsubscribe`, { method: 'POST', body: { deviceId } }).catch(() => {})
    subscribed.value = false
  }

  /** Detect capability + whether this browser already has a live subscription. */
  async function refreshState(): Promise<void> {
    supported.value = isSupported()
    if (!supported.value) return
    const info = await fetchPublicKey()
    serverEnabled.value = !!info?.enabled
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      subscribed.value = !!sub
    } catch {
      subscribed.value = false
    }
  }

  return { supported, subscribed, serverEnabled, subscribe, unsubscribe, syncAlerts, refreshState }
}
