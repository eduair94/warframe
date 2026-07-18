<script setup lang="ts">
// Orokin "Void Ledger" OG card — 1200x630, rendered by nuxt-og-image (satori ->
// resvg). Satori supports only a CSS subset: inline styles only, every element
// with >1 child must be explicit display:flex, no external classes/stylesheets.
// Fonts (Cinzel 700, Rajdhani 500/700) are supplied via ogImage.fonts in
// nuxt.config. Keep everything inline and flex.
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: 'Warframe Market Analytics',
    description:
      'Live Warframe Market prices, prime set values, ducat efficiency, riven worth and trading signals.',
  },
)
</script>

<template>
  <div
    style="
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px 80px;
      background: linear-gradient(135deg, #0b0c16 0%, #14162e 55%, #0d1120 100%);
      font-family: 'Rajdhani', 'Noto Sans', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans SC', 'Noto Sans TC';
      position: relative;
    "
  >
    <!-- Gold hairline frame -->
    <div
      style="
        position: absolute;
        top: 28px;
        left: 28px;
        right: 28px;
        bottom: 28px;
        border: 1px solid rgba(212, 175, 90, 0.45);
        border-radius: 6px;
        display: flex;
      "
    />

    <!-- Eyebrow: diamond-node glyph + brand -->
    <div style="display: flex; align-items: center;">
      <svg width="54" height="54" viewBox="0 0 52 52" style="margin-right: 20px;">
        <path d="M26 2 L50 26 L26 50 L2 26 Z" fill="none" stroke="#d4af5a" stroke-width="2.5" />
        <path d="M26 15 L37 26 L26 37 L15 26 Z" fill="#4fb3bf" />
      </svg>
      <div
        style="
          display: flex;
          font-family: 'Cinzel', 'Noto Sans', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans SC', 'Noto Sans TC';
          font-weight: 700;
          font-size: 30px;
          letter-spacing: 6px;
          color: #d4af5a;
          text-transform: uppercase;
        "
      >
        Warframe Market Analytics
      </div>
    </div>

    <!-- Main: title + description -->
    <div style="display: flex; flex-direction: column;">
      <!-- Cyan accent tick above the title -->
      <div
        style="
          display: flex;
          width: 84px;
          height: 5px;
          background: #4fb3bf;
          border-radius: 3px;
          margin-bottom: 26px;
        "
      />
      <div
        style="
          display: flex;
          font-family: 'Cinzel', 'Noto Sans', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans SC', 'Noto Sans TC';
          font-weight: 700;
          font-size: 62px;
          line-height: 1.12;
          color: #f4f5fb;
          max-width: 1010px;
        "
      >
        {{ title }}
      </div>
      <div
        v-if="description"
        style="
          display: flex;
          font-size: 30px;
          font-weight: 500;
          line-height: 1.35;
          color: #9aa0b4;
          margin-top: 24px;
          max-width: 980px;
        "
      >
        {{ description }}
      </div>
    </div>

    <!-- Footer host -->
    <div
      style="
        display: flex;
        align-items: center;
        font-size: 24px;
        font-weight: 600;
        letter-spacing: 1px;
        color: #6b7290;
      "
    >
      warframe-app.digitalshopuy.com
    </div>
  </div>
</template>
