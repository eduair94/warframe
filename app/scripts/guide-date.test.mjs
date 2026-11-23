import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { formatGuideReviewDate, formatRepositoryDate } from '../app/utils/guide-date.ts'

test('repository dates expose a stable localized calendar date and reject malformed records', () => {
  assert.equal(formatRepositoryDate('2026-11-22T00:30:00Z', 'en'), 'Nov 22, 2026')
  assert.equal(formatRepositoryDate('2026-11-21T21:30:00-03:00', 'en'), 'Nov 22, 2026')
  assert.match(formatRepositoryDate('2026-11-22T00:30:00Z', 'es'), /^22 .+ 2026$/)
  assert.equal(formatRepositoryDate('2026-11-22T00:30:00Z', 'ja'), '2026年11月22日')
  for (const value of [undefined, '', 'invalid', '2026-02-30T00:00:00Z', '2026-11-22T00:30:00']) {
    assert.equal(formatRepositoryDate(value, 'es'), '—')
  }
})

test('review dates keep the same day across UTC and negative browser/server timezones', () => {
  const helperUrl = new URL('../app/utils/guide-date.ts', import.meta.url).href
  const script = `
    import { formatGuideReviewDate } from ${JSON.stringify(helperUrl)};
    console.log(JSON.stringify(['2026-09-01', '2026-01-01', '2024-02-29']
      .map(date => formatGuideReviewDate(date, 'en'))));
  `
  for (const timezone of ['UTC', 'America/Montevideo', 'America/Los_Angeles']) {
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      env: { ...process.env, TZ: timezone },
      encoding: 'utf8',
    })
    assert.equal(child.status, 0, child.stderr)
    assert.deepEqual(JSON.parse(child.stdout), ['Sep 1, 2026', 'Jan 1, 2026', 'Feb 29, 2024'], timezone)
  }
})

test('review date formatting retains the selected locale and includes the day', () => {
  assert.equal(formatGuideReviewDate('2026-09-21', 'en'), 'Sep 21, 2026')
  assert.match(formatGuideReviewDate('2026-09-21', 'es'), /^21 .+ 2026$/)
  assert.equal(formatGuideReviewDate('2026-09-21', 'ja'), '2026年9月21日')
})

test('invalid review dates and unsupported locale syntax retain the original value', () => {
  for (const value of ['', 'not-a-date', '2026-02-30', '2026-13-01', '2026-09-21T00:00:00Z']) {
    assert.equal(formatGuideReviewDate(value, 'en'), value)
  }
  assert.equal(formatGuideReviewDate('2026-09-21', 'invalid_locale'), '2026-09-21')
})
