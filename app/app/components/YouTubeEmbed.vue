<!-- Privacy-first, zero-CLS YouTube facade. Renders the thumbnail + a play
     button; only on click does it swap in the youtube-nocookie iframe. No
     external script, no cookies until the user opts in, no layout shift (fixed
     16:9 box). Styled to the Orokin "Void Ledger" system. Reused by every guide
     and the /creators page. -->
<template>
  <div class="yt" :style="{ maxWidth: max }">
    <button
      v-if="!playing"
      type="button"
      class="yt__poster"
      :aria-label="`Play: ${title}`"
      @click="playing = true"
    >
      <img
        class="yt__thumb"
        :src="thumb"
        :alt="title"
        loading="lazy"
        width="480"
        height="270"
        @error="onThumbError"
      />
      <span class="yt__scrim"></span>
      <span class="yt__play"><svg viewBox="0 0 68 48" width="62" height="44" aria-hidden="true"><path class="yt__play-bg" d="M66.5 7.7c-.8-2.9-2.5-5.4-5.4-6.2C55.8.2 34 0 34 0S12.2.2 6.9 1.5C4 2.3 2.3 4.8 1.5 7.7.2 13 0 24 0 24s.2 11 1.5 16.3c.8 2.9 2.5 5.4 5.4 6.2C12.2 47.8 34 48 34 48s21.8-.2 27.1-1.5c2.9-.8 4.6-3.3 5.4-6.2C67.8 35 68 24 68 24s-.2-11-1.5-16.3z"/><path d="M45 24 27 14v20z" fill="#fff"/></svg></span>
      <span class="yt__meta">
        <span class="yt__title">{{ title }}</span>
        <span v-if="channel" class="yt__chan">{{ channel }}</span>
      </span>
    </button>
    <iframe
      v-else
      class="yt__frame"
      :src="`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`"
      :title="title"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{ id: string; title?: string; channel?: string; max?: string }>(),
  { title: 'Warframe video guide', channel: '', max: '720px' },
)

const playing = ref(false)
// hqdefault is guaranteed to exist for every public video (maxres isn't).
const thumb = ref(`https://i.ytimg.com/vi/${props.id}/hqdefault.jpg`)
function onThumbError() {
  thumb.value = `https://i.ytimg.com/vi/${props.id}/mqdefault.jpg`
}
</script>

<style scoped>
.yt {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border: 1px solid var(--orokin-line, rgba(200, 168, 92, 0.32));
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  overflow: hidden;
}
.yt__poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  cursor: pointer;
  background: #000;
  display: block;
}
.yt__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* hqdefault is 4:3 with letterbox bars — scale up slightly to fill 16:9 */
  transform: scale(1.35);
  transition: transform 0.3s ease, filter 0.3s ease;
}
.yt__poster:hover .yt__thumb {
  transform: scale(1.42);
  filter: brightness(1.06);
}
.yt__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.15) 45%, rgba(8, 9, 16, 0.85) 100%);
}
.yt__play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
  transition: transform 0.2s ease;
}
.yt__poster:hover .yt__play {
  transform: translate(-50%, -55%) scale(1.08);
}
.yt__play-bg {
  fill: #d92b2b;
  transition: fill 0.2s ease;
}
.yt__poster:hover .yt__play-bg {
  fill: #f00;
}
.yt__meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}
.yt__title {
  font-family: var(--font-hud, 'Rajdhani', sans-serif);
  font-weight: 700;
  font-size: 0.92rem;
  color: #f2f4fb;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.yt__chan {
  font-family: var(--font-hud, 'Rajdhani', sans-serif);
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  color: var(--orokin, #c8a85c);
  text-transform: uppercase;
}
.yt__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
