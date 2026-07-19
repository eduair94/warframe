/**
 * @fileoverview Unit tests for the Web Push alert evaluator (Spec B).
 * Pure logic — no mocks needed (pushEval/pushMessages have no I/O imports).
 */
import { describe, expect, it } from '@jest/globals'
import {
  evaluateSubscription,
  mergeAlerts,
  hasAnyCondition,
  NEAR_ATL_PCT,
  type StoredAlert,
  type PriceMap,
} from './services/pushEval'
import { parseSubscribeBody } from './services/pushValidate'

function alert(partial: Partial<StoredAlert>): StoredAlert {
  return {
    url_name: 'ash_prime_set',
    item_name: 'Ash Prime Set',
    below: null,
    above: null,
    atl: false,
    notifiedBelow: false,
    notifiedAbove: false,
    notifiedAtl: false,
    ...partial,
  }
}

describe('evaluateSubscription — below', () => {
  it('fires when sell <= below and not yet notified', () => {
    const alerts = [alert({ below: 100 })]
    const prices: PriceMap = { ash_prime_set: { sell: 95 } }
    const { pushes, changed, alerts: next } = evaluateSubscription(alerts, prices)
    expect(pushes).toHaveLength(1)
    expect(pushes[0].tag).toBe('ash_prime_set-below')
    expect(pushes[0].url).toBe('/set/ash_prime_set')
    expect(pushes[0].body).toContain('95p')
    expect(changed).toBe(true)
    expect(next[0].notifiedBelow).toBe(true)
  })

  it('does not re-fire while still below and already notified', () => {
    const alerts = [alert({ below: 100, notifiedBelow: true })]
    const prices: PriceMap = { ash_prime_set: { sell: 90 } }
    const { pushes, changed } = evaluateSubscription(alerts, prices)
    expect(pushes).toHaveLength(0)
    expect(changed).toBe(false)
  })

  it('re-arms (hysteresis) once price climbs back above the threshold', () => {
    const alerts = [alert({ below: 100, notifiedBelow: true })]
    const prices: PriceMap = { ash_prime_set: { sell: 120 } }
    const { pushes, changed, alerts: next } = evaluateSubscription(alerts, prices)
    expect(pushes).toHaveLength(0)
    expect(changed).toBe(true)
    expect(next[0].notifiedBelow).toBe(false)
  })

  it('does not mutate the input alerts', () => {
    const alerts = [alert({ below: 100 })]
    evaluateSubscription(alerts, { ash_prime_set: { sell: 50 } })
    expect(alerts[0].notifiedBelow).toBe(false)
  })
})

describe('evaluateSubscription — above', () => {
  it('fires when sell >= above and not yet notified', () => {
    const { pushes, alerts: next } = evaluateSubscription(
      [alert({ above: 200 })],
      { ash_prime_set: { sell: 210 } },
    )
    expect(pushes).toHaveLength(1)
    expect(pushes[0].tag).toBe('ash_prime_set-above')
    expect(next[0].notifiedAbove).toBe(true)
  })

  it('re-arms once price falls back below the threshold', () => {
    const { pushes, changed, alerts: next } = evaluateSubscription(
      [alert({ above: 200, notifiedAbove: true })],
      { ash_prime_set: { sell: 150 } },
    )
    expect(pushes).toHaveLength(0)
    expect(changed).toBe(true)
    expect(next[0].notifiedAbove).toBe(false)
  })
})

describe('evaluateSubscription — all-time low', () => {
  it('fires when pctFromAtl <= NEAR_ATL_PCT', () => {
    const { pushes } = evaluateSubscription(
      [alert({ atl: true })],
      { ash_prime_set: { sell: 80, pctFromAtl: NEAR_ATL_PCT - 1, atl: 78 } },
    )
    expect(pushes).toHaveLength(1)
    expect(pushes[0].tag).toBe('ash_prime_set-atl')
    expect(pushes[0].body).toContain('78p')
  })

  it('re-arms once price moves clear of the low', () => {
    const { changed, alerts: next } = evaluateSubscription(
      [alert({ atl: true, notifiedAtl: true })],
      { ash_prime_set: { pctFromAtl: 20 } },
    )
    expect(changed).toBe(true)
    expect(next[0].notifiedAtl).toBe(false)
  })
})

describe('evaluateSubscription — edge cases', () => {
  it('skips an item with no price data', () => {
    const { pushes, changed } = evaluateSubscription([alert({ below: 100 })], {})
    expect(pushes).toHaveLength(0)
    expect(changed).toBe(false)
  })

  it('can fire below and above on different items in one pass', () => {
    const alerts = [
      alert({ url_name: 'a', item_name: 'A', below: 100 }),
      alert({ url_name: 'b', item_name: 'B', above: 50 }),
    ]
    const prices: PriceMap = { a: { sell: 90 }, b: { sell: 60 } }
    const { pushes } = evaluateSubscription(alerts, prices)
    expect(pushes.map((p) => p.tag).sort()).toEqual(['a-below', 'b-above'])
  })

  it('localizes the copy when a supported locale is given', () => {
    const { pushes } = evaluateSubscription([alert({ below: 100 })], { ash_prime_set: { sell: 90 } }, 'es')
    expect(pushes[0].body).toContain('Ahora')
  })
})

describe('mergeAlerts', () => {
  it('preserves notified flags when thresholds are unchanged', () => {
    const existing = [alert({ below: 100, notifiedBelow: true })]
    const merged = mergeAlerts(existing, [{ url_name: 'ash_prime_set', item_name: 'Ash Prime Set', below: 100 }])
    expect(merged[0].notifiedBelow).toBe(true)
  })

  it('re-arms (resets flags) when a threshold changes', () => {
    const existing = [alert({ below: 100, notifiedBelow: true })]
    const merged = mergeAlerts(existing, [{ url_name: 'ash_prime_set', item_name: 'Ash Prime Set', below: 80 }])
    expect(merged[0].below).toBe(80)
    expect(merged[0].notifiedBelow).toBe(false)
  })

  it('drops alerts no longer present in the incoming list', () => {
    const existing = [alert({ url_name: 'a', below: 100 }), alert({ url_name: 'b', below: 50 })]
    const merged = mergeAlerts(existing, [{ url_name: 'a', item_name: 'A', below: 100 }])
    expect(merged).toHaveLength(1)
    expect(merged[0].url_name).toBe('a')
  })

  it('normalises missing fields to null/false', () => {
    const merged = mergeAlerts([], [{ url_name: 'a', item_name: 'A' }])
    expect(merged[0]).toMatchObject({ below: null, above: null, atl: false })
  })
})

describe('hasAnyCondition', () => {
  it('is false for an empty alert and true when any threshold is set', () => {
    expect(hasAnyCondition({ url_name: 'a', item_name: 'A' })).toBe(false)
    expect(hasAnyCondition({ url_name: 'a', item_name: 'A', below: 10 })).toBe(true)
    expect(hasAnyCondition({ url_name: 'a', item_name: 'A', atl: true })).toBe(true)
  })
})

describe('parseSubscribeBody', () => {
  const goodSub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'k', auth: 'a' } }

  it('accepts a valid body and coerces alert fields', () => {
    const r = parseSubscribeBody({
      deviceId: 'dev-1',
      subscription: goodSub,
      alerts: [{ url_name: 'ash_prime_set', item_name: 'Ash Prime Set', below: '90', atl: 1 }],
      locale: 'es',
    })
    expect('value' in r).toBe(true)
    if ('value' in r) {
      expect(r.value.deviceId).toBe('dev-1')
      expect(r.value.locale).toBe('es')
      expect(r.value.alerts[0]).toMatchObject({ below: 90, atl: true, above: null })
    }
  })

  it('rejects a missing deviceId', () => {
    expect(parseSubscribeBody({ subscription: goodSub, alerts: [] })).toEqual({ error: 'deviceId required' })
  })

  it('rejects a non-HTTPS endpoint', () => {
    const r = parseSubscribeBody({ deviceId: 'd', subscription: { endpoint: 'http://x', keys: { p256dh: 'k', auth: 'a' } }, alerts: [] })
    expect(r).toEqual({ error: 'invalid subscription' })
  })

  it('drops malformed alert rows and caps the list', () => {
    const many = Array.from({ length: 300 }, (_, i) => ({ url_name: 'u' + i, item_name: 'U', below: 1 }))
    const r = parseSubscribeBody({ deviceId: 'd', subscription: goodSub, alerts: [{ bad: true }, ...many] })
    expect('value' in r).toBe(true)
    if ('value' in r) expect(r.value.alerts.length).toBeLessThanOrEqual(250)
  })
})
