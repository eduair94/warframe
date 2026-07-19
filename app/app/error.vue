<template>
  <div class="nf">
    <!-- Ambient void: two drifting star layers + a breathing nebula (behind). -->
    <div class="nf__sky" aria-hidden="true" />
    <div class="nf__sky nf__sky--far" aria-hidden="true" />
    <div class="nf__scan" aria-hidden="true" />

    <!-- Branding + escape hatch (no app-bar renders on the error boundary). -->
    <a
      class="nf__brand"
      href="/"
      :aria-label="t('error404.homeCta')"
      @click.prevent="go('/')"
    >
      <img src="/img/logo.png" alt="Warframe Market Analytics" />
    </a>

    <main class="nf__console">
      <p class="nf__eyebrow">
        <span class="nf__eyebrow-node" aria-hidden="true" />
        {{ eyebrow }}
      </p>

      <!-- Signature: Orokin targeting reticle around the glitching code. -->
      <div class="nf__rift">
        <div class="nf__ring nf__ring--outer" aria-hidden="true">
          <span class="nf__node nf__node--n" />
          <span class="nf__node nf__node--e" />
          <span class="nf__node nf__node--s" />
          <span class="nf__node nf__node--w" />
        </div>
        <div class="nf__ring nf__ring--mid" aria-hidden="true" />
        <div class="nf__ring nf__ring--inner" aria-hidden="true" />
        <div class="nf__num" :data-text="String(code)">{{ code }}</div>
      </div>

      <h1 class="nf__title">{{ title }}</h1>
      <p class="nf__lede">{{ lede }}</p>

      <div class="nf__actions">
        <a class="nf__btn nf__btn--gold" href="/" @click.prevent="go('/')">
          {{ t('error404.homeCta') }}
        </a>
        <a
          class="nf__btn nf__btn--ghost"
          href="/star-chart"
          @click.prevent="go('/star-chart')"
        >
          {{ t('error404.chartCta') }}
        </a>
      </div>

      <!-- Tenno HUD readout — the design system's stat strip, re-flavoured. -->
      <dl class="nf__readout">
        <div class="nf__stat">
          <dt class="nf__stat-lbl">{{ t('error404.statusLabel') }}</dt>
          <dd class="nf__stat-val is-rose">{{ t('error404.statusValue') }}</dd>
        </div>
        <div class="nf__stat">
          <dt class="nf__stat-lbl">{{ t('error404.codeLabel') }}</dt>
          <dd class="nf__stat-val is-gold">{{ code }}</dd>
        </div>
        <div class="nf__stat">
          <dt class="nf__stat-lbl">{{ t('error404.sectorLabel') }}</dt>
          <dd class="nf__stat-val">{{ t('error404.sectorValue') }}</dd>
        </div>
      </dl>

      <nav class="nf__waypoints" :aria-label="t('error404.waypoints')">
        <p class="nf__waypoints-lbl">{{ t('error404.waypoints') }}</p>
        <div class="nf__chips">
          <a
            v-for="w in waypoints"
            :key="w.to"
            class="nf__chip"
            :href="w.to"
            @click.prevent="go(w.to)"
          >
            <span class="nf__chip-node" aria-hidden="true" />
            {{ t(w.key) }}
          </a>
        </div>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error?: NuxtError }>()

// The error boundary can render even when a plugin failed to set up, so i18n and
// the locale router helper are resolved defensively — a 404 page must never
// throw its own error. Falls back to English literals if the composables are
// unavailable (only reachable on a hard SSR fault, not a normal createError).
const FALLBACK: Record<string, string> = {
  'error404.signalLost': 'Void Signal Lost',
  'error404.systemFault': 'System Fault',
  'error404.errorLabel': 'Error {code}',
  'error404.title404': 'These coordinates lead nowhere',
  'error404.titleError': 'A rift has destabilized',
  'error404.lede404':
    'The page you seek has drifted into the Void — moved, vaulted, or never charted. Set a new waypoint below.',
  'error404.ledeError':
    'An unexpected fault interrupted the transmission. Return to the Origin and try again.',
  'error404.homeCta': 'Return to Origin',
  'error404.chartCta': 'Open Star Chart',
  'error404.waypoints': 'Set a new waypoint',
  'error404.statusLabel': 'Status',
  'error404.statusValue': 'Link severed',
  'error404.codeLabel': 'Code',
  'error404.sectorLabel': 'Sector',
  'error404.sectorValue': 'Uncharted',
  'nav.items.setPrices': 'Set Prices',
  'nav.items.relicValue': 'Relic Value',
  'nav.items.flipFinder': 'Flip Finder',
  'nav.items.ducats': 'Ducats',
  'nav.items.knowledgeCenter': 'Knowledge Center',
}

let i18nT: ((key: string, params?: Record<string, unknown>) => string) | null =
  null
try {
  const i = useI18n()
  i18nT = (key, params) => i.t(key, (params ?? {}) as any)
} catch {
  i18nT = null
}

/** Translate with a safe English fallback (manual {name} interpolation). */
function t(key: string, params?: Record<string, unknown>): string {
  if (i18nT) return i18nT(key, params)
  let s = FALLBACK[key] ?? key
  if (params)
    for (const [k, v] of Object.entries(params))
      s = s.replace(`{${k}}`, String(v))
  return s
}

let localePath: (p: string) => string
try {
  const lp = useLocalePath()
  localePath = (p) => lp(p)
} catch {
  localePath = (p) => p
}

/** Clear the error boundary and navigate (keeps the visitor's locale prefix). */
function go(path: string): void {
  clearError({ redirect: localePath(path) })
}

const code = computed(() => props.error?.statusCode || 404)
const is404 = computed(() => code.value === 404)

const eyebrow = computed(
  () =>
    `${is404.value ? t('error404.signalLost') : t('error404.systemFault')} · ${t('error404.errorLabel', { code: code.value })}`,
)
const title = computed(() =>
  is404.value ? t('error404.title404') : t('error404.titleError'),
)
const lede = computed(() =>
  is404.value ? t('error404.lede404') : t('error404.ledeError'),
)

// Recovery destinations — labels reuse the existing (all-locale) nav keys.
const waypoints = [
  { to: '/set', key: 'nav.items.setPrices' },
  { to: '/relics-value', key: 'nav.items.relicValue' },
  { to: '/flip', key: 'nav.items.flipFinder' },
  { to: '/ducats', key: 'nav.items.ducats' },
  { to: '/guides', key: 'nav.items.knowledgeCenter' },
]

useHead({
  title: computed(() => `${code.value} · ${title.value}`),
  meta: [{ name: 'robots', content: 'noindex, follow' }],
})

// Project rule: the global route-loading overlay (#spinner-wrapper) must be
// hidden on mount or it spins forever. It usually isn't present on the error
// boundary, so the retry is bounded and simply no-ops if it never appears.
function finishLoading(attempt = 0): void {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}
onMounted(() => finishLoading())
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Rajdhani:wght@500;600;700&display=swap');

.nf {
  --void: #0d0e17;
  --void-2: #080910;
  --orokin: #c8a85c;
  --gold-ink: #e7cf95;
  --energy: #35d6d0;
  --energy-hi: #7af0ea;
  --rose: #d98a8a;
  --ink: #eef1f8;
  --ink-dim: #868ca6;
  --line: rgba(200, 168, 92, 0.32);
  --font-display: 'Cinzel', 'Trajan Pro', Georgia, serif;
  --font-hud: 'Rajdhani', 'Oxanium', 'Segoe UI', sans-serif;

  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 92px 20px 48px;
  overflow: hidden;
  color: var(--ink);
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(200, 168, 92, 0.07), transparent 55%),
    radial-gradient(90% 60% at 90% 110%, rgba(53, 214, 208, 0.06), transparent 60%),
    linear-gradient(180deg, var(--void) 0%, var(--void-2) 100%);
}

/* Breathing void-nebula behind the console. */
.nf::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 46%;
  width: min(760px, 96vw);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle at 50% 50%, rgba(53, 214, 208, 0.14), transparent 42%),
    radial-gradient(circle at 50% 50%, rgba(200, 168, 92, 0.1), transparent 62%);
  filter: blur(14px);
  animation: nf-breathe 9s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

/* ---- Drifting starfields (two parallax layers) ------------------------- */
.nf__sky,
.nf__sky--far {
  position: absolute;
  inset: -25%;
  pointer-events: none;
  z-index: 0;
  background-repeat: repeat;
}
.nf__sky {
  background-image:
    radial-gradient(1.6px 1.6px at 18% 24%, rgba(255, 255, 255, 0.75), transparent 60%),
    radial-gradient(1.4px 1.4px at 72% 12%, rgba(231, 207, 149, 0.7), transparent 60%),
    radial-gradient(1.2px 1.2px at 42% 68%, rgba(255, 255, 255, 0.6), transparent 60%),
    radial-gradient(1.8px 1.8px at 88% 54%, rgba(122, 240, 234, 0.55), transparent 60%),
    radial-gradient(1.3px 1.3px at 28% 88%, rgba(255, 255, 255, 0.5), transparent 60%),
    radial-gradient(1.5px 1.5px at 62% 40%, rgba(200, 168, 92, 0.6), transparent 60%);
  background-size: 420px 420px;
  animation: nf-sky 120s linear infinite;
}
.nf__sky--far {
  background-image:
    radial-gradient(1px 1px at 12% 52%, rgba(255, 255, 255, 0.4), transparent 60%),
    radial-gradient(1px 1px at 55% 22%, rgba(200, 168, 92, 0.42), transparent 60%),
    radial-gradient(1px 1px at 82% 78%, rgba(255, 255, 255, 0.36), transparent 60%),
    radial-gradient(1px 1px at 33% 34%, rgba(122, 240, 234, 0.34), transparent 60%);
  background-size: 260px 260px;
  opacity: 0.7;
  animation: nf-sky-far 200s linear infinite;
}

/* Faint CRT scanlines over everything (static). */
.nf__scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.16) 0,
    rgba(0, 0, 0, 0.16) 1px,
    transparent 2px,
    transparent 4px
  );
  opacity: 0.4;
  mix-blend-mode: multiply;
}

/* ---- Brand / escape hatch ---------------------------------------------- */
.nf__brand {
  position: absolute;
  top: 22px;
  left: 24px;
  z-index: 3;
  display: inline-flex;
  opacity: 0.9;
  transition: opacity 0.2s ease;
}
.nf__brand:hover {
  opacity: 1;
}
.nf__brand img {
  width: 190px;
  max-width: 46vw;
  height: auto;
}
.nf__brand:focus-visible {
  outline: 2px solid var(--energy);
  outline-offset: 4px;
}

/* ---- Voidglass console ------------------------------------------------- */
.nf__console {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 660px;
  padding: 40px 34px 34px;
  text-align: center;
  background:
    radial-gradient(120% 90% at 100% 0%, rgba(200, 168, 92, 0.08) 0%, transparent 45%),
    linear-gradient(180deg, rgba(20, 22, 42, 0.86) 0%, rgba(11, 12, 20, 0.92) 100%);
  border: 1px solid var(--line);
  clip-path: polygon(
    20px 0, 100% 0, 100% calc(100% - 20px),
    calc(100% - 20px) 100%, 0 100%, 0 20px
  );
  filter: drop-shadow(0 26px 54px rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(2px);
}
/* Signature diamond node, top-left of the console (design-system marker). */
.nf__console::before {
  content: '';
  position: absolute;
  top: 13px;
  left: 13px;
  width: 7px;
  height: 7px;
  background: var(--orokin);
  transform: rotate(45deg);
  box-shadow: 0 0 8px rgba(200, 168, 92, 0.6);
}

.nf__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 22px;
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.32em;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--orokin);
}
.nf__eyebrow-node {
  width: 5px;
  height: 5px;
  background: var(--orokin);
  transform: rotate(45deg);
}

/* ---- Rift reticle + code ----------------------------------------------- */
.nf__rift {
  position: relative;
  width: clamp(230px, 60vw, 400px);
  aspect-ratio: 1;
  margin: 4px auto 26px;
  display: grid;
  place-items: center;
}
.nf__ring {
  position: absolute;
  border-radius: 50%;
}
.nf__ring--outer {
  inset: 0;
  border: 1px solid var(--line);
  box-shadow: inset 0 0 44px rgba(200, 168, 92, 0.06);
  animation: nf-spin 48s linear infinite;
}
.nf__ring--mid {
  inset: 12%;
  border: 1px dashed rgba(200, 168, 92, 0.26);
  animation: nf-spin 66s linear infinite reverse;
}
.nf__ring--inner {
  inset: 26%;
  border: 1px solid rgba(53, 214, 208, 0.32);
  box-shadow:
    0 0 30px rgba(53, 214, 208, 0.14),
    inset 0 0 30px rgba(53, 214, 208, 0.1);
  animation: nf-pulse 4.6s ease-in-out infinite;
}
.nf__node {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 9px;
  height: 9px;
  background: var(--orokin);
  transform: translate(-50%, -50%) rotate(45deg);
  box-shadow: 0 0 10px rgba(200, 168, 92, 0.7);
}
.nf__node--n { top: 0; }
.nf__node--s { top: 100%; }
.nf__node--e { left: 100%; }
.nf__node--w { left: 0; }

.nf__num {
  position: relative;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(4.6rem, 19vw, 9.5rem);
  line-height: 1;
  letter-spacing: 0.02em;
  color: var(--gold-ink);
  text-shadow:
    0 0 26px rgba(200, 168, 92, 0.35),
    0 0 60px rgba(200, 168, 92, 0.16);
}
.nf__num::before,
.nf__num::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  opacity: 0;
}
.nf__num::before {
  color: var(--energy-hi);
  text-shadow: none;
  animation: nf-glitch-a 7s steps(1) infinite;
}
.nf__num::after {
  color: var(--rose);
  text-shadow: none;
  animation: nf-glitch-b 7s steps(1) infinite;
}

.nf__title {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.35rem, 3.6vw, 2rem);
  line-height: 1.14;
  color: var(--gold-ink);
}
.nf__lede {
  margin: 0 auto 26px;
  max-width: 46ch;
  color: var(--ink-dim);
  font-size: 1rem;
  line-height: 1.62;
}

/* ---- Actions ----------------------------------------------------------- */
.nf__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 30px;
}
.nf__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-family: var(--font-hud);
  font-weight: 700;
  font-size: 0.92rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}
.nf__btn--gold {
  background: var(--orokin);
  color: #17130a;
  border: 1px solid var(--orokin);
}
.nf__btn--gold:hover {
  background: var(--gold-ink);
  border-color: var(--gold-ink);
}
.nf__btn--ghost {
  background: rgba(53, 214, 208, 0.06);
  color: var(--energy-hi);
  border: 1px solid rgba(53, 214, 208, 0.4);
}
.nf__btn--ghost:hover {
  background: rgba(53, 214, 208, 0.16);
  color: #fff;
}
.nf__btn:focus-visible {
  outline: 2px solid var(--energy);
  outline-offset: 3px;
}

/* ---- HUD readout strip ------------------------------------------------- */
.nf__readout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0 0 28px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.24);
}
.nf__stat {
  position: relative;
  padding: 14px 10px;
}
.nf__stat + .nf__stat::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 1px;
  background: var(--line);
}
.nf__stat + .nf__stat::after {
  content: '';
  position: absolute;
  left: -3px;
  top: 50%;
  width: 5px;
  height: 5px;
  margin-top: -3px;
  background: var(--orokin);
  transform: rotate(45deg);
  opacity: 0.7;
}
.nf__stat-lbl {
  font-family: var(--font-hud);
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ink-dim);
}
.nf__stat-val {
  margin: 6px 0 0;
  font-family: var(--font-hud);
  font-weight: 700;
  font-size: 1.02rem;
  letter-spacing: 0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
.nf__stat-val.is-gold { color: var(--gold-ink); }
.nf__stat-val.is-rose { color: var(--rose); }

/* ---- Recovery waypoints ------------------------------------------------ */
.nf__waypoints-lbl {
  margin: 0 0 12px;
  font-family: var(--font-hud);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--orokin);
}
.nf__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  justify-content: center;
}
.nf__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-family: var(--font-hud);
  font-weight: 600;
  font-size: 0.82rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  color: #cdd2e4;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.nf__chip-node {
  width: 5px;
  height: 5px;
  background: var(--orokin);
  transform: rotate(45deg);
  opacity: 0.75;
  transition: opacity 0.15s ease;
}
.nf__chip:hover {
  background: rgba(200, 168, 92, 0.12);
  color: var(--gold-ink);
  border-color: var(--line);
}
.nf__chip:hover .nf__chip-node { opacity: 1; }
.nf__chip:focus-visible {
  outline: 2px solid var(--energy);
  outline-offset: 2px;
}

/* ---- Motion ------------------------------------------------------------ */
@keyframes nf-spin {
  to { transform: rotate(360deg); }
}
@keyframes nf-pulse {
  0%, 100% {
    opacity: 0.5;
    box-shadow: 0 0 22px rgba(53, 214, 208, 0.1), inset 0 0 22px rgba(53, 214, 208, 0.07);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 46px rgba(53, 214, 208, 0.26), inset 0 0 40px rgba(53, 214, 208, 0.15);
  }
}
@keyframes nf-breathe {
  0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.96); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
}
@keyframes nf-sky {
  from { background-position: 0 0; }
  to { background-position: 420px -420px; }
}
@keyframes nf-sky-far {
  from { background-position: 0 0; }
  to { background-position: -260px 260px; }
}
/* Rare, brief RGB-split flicker — invisible (opacity 0) most of the cycle. */
@keyframes nf-glitch-a {
  0%, 90%, 100% { opacity: 0; transform: translate(0, 0); }
  91% { opacity: 0.85; transform: translate(-3px, 1px); clip-path: inset(18% 0 56% 0); }
  94% { opacity: 0.7; transform: translate(2px, -1px); clip-path: inset(58% 0 12% 0); }
  97% { opacity: 0.6; transform: translate(-2px, 0); clip-path: inset(34% 0 40% 0); }
}
@keyframes nf-glitch-b {
  0%, 90%, 100% { opacity: 0; transform: translate(0, 0); }
  91% { opacity: 0.75; transform: translate(3px, -1px); clip-path: inset(60% 0 10% 0); }
  94% { opacity: 0.65; transform: translate(-2px, 1px); clip-path: inset(20% 0 52% 0); }
  97% { opacity: 0.55; transform: translate(2px, 0); clip-path: inset(42% 0 30% 0); }
}

/* ---- Responsive -------------------------------------------------------- */
@media (max-width: 560px) {
  .nf {
    padding: 84px 14px 40px;
  }
  .nf__console {
    padding: 32px 20px 28px;
  }
  .nf__brand img {
    width: 140px;
  }
  .nf__stat-val {
    font-size: 0.9rem;
  }
  .nf__eyebrow {
    letter-spacing: 0.22em;
    font-size: 0.66rem;
  }
}

/* ---- Reduced motion ---------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .nf::before,
  .nf__sky,
  .nf__sky--far,
  .nf__ring--outer,
  .nf__ring--mid,
  .nf__ring--inner {
    animation: none;
  }
  .nf__num::before,
  .nf__num::after {
    display: none;
  }
}
</style>

<!-- Global: keep the page dark behind the fixed-height error view (no layout /
     Vuetify <v-app> renders on the error boundary to paint the body). -->
<style>
body {
  background: #0d0e17;
}
</style>
