<template>
  <div>
    <!-- Persistent heart FAB — every page gets a one-tap way to support the project. -->
    <v-btn
      class="don-fab"
      icon
      size="large"
      elevation="0"
      :aria-label="t('donation.fabAria')"
      data-tour="donate"
      @click="onOpen"
    >
      <v-icon class="don-fab__heart">mdi-heart</v-icon>
    </v-btn>

    <v-dialog v-model="open" max-width="420" content-class="don-dialog">
      <div class="don">
        <header class="don__head">
          <v-icon class="don__head-heart" size="22">mdi-heart</v-icon>
          <span class="don__title">{{ t('donation.title') }}</span>
          <button type="button" class="don__close" :aria-label="t('donation.close')" @click="open = false">
            <v-icon size="20">mdi-close</v-icon>
          </button>
        </header>

        <p class="don__body">{{ t('donation.body') }}</p>

        <div class="don__btns">
          <v-btn
            class="don__pay don__pay--pp"
            variant="flat"
            block
            href="https://ko-fi.com/cambio_uruguay"
            target="_blank"
            rel="noopener"
            :aria-label="t('home.donate.paypalAria')"
            @click="trackAction('donate_click', { provider: 'kofi' })"
          >
            <picture class="don__ico">
              <source srcset="/img/paypal_icon.webp" type="image/webp" />
              <img src="/img/paypal_icon.png" alt="" width="22" height="22" />
            </picture>
            {{ t('donation.paypal') }}
          </v-btn>
          <v-btn
            class="don__pay don__pay--mp"
            variant="flat"
            block
            href="https://mpago.la/19j46vX"
            target="_blank"
            rel="noopener"
            :aria-label="t('home.donate.mercadopagoAria')"
            @click="trackAction('donate_click', { provider: 'mercadopago' })"
          >
            <picture class="don__ico">
              <source srcset="/img/mercadopago_icon.webp" type="image/webp" />
              <img src="/img/mercadopago_icon.png" alt="" width="22" height="22" />
            </picture>
            {{ t('donation.mercadopago') }}
          </v-btn>
        </div>

        <a
          class="don__reviews"
          href="https://www.reddit.com/r/Warframe/comments/1uuu7gj/built_a_free_opensource_market_analytics_tool_to/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <v-icon size="15">mdi-star</v-icon> {{ t('donation.reviews') }}
        </a>
      </div>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { t } = useI18n()
const { trackAction } = useAnalytics()
const open = ref(false)

// The FAB rides every page, so the open is the funnel step that tells us where
// support intent actually comes from (`tool` is stamped on by the event layer).
function onOpen() {
  open.value = true
  trackAction('donate_dialog_open')
}
</script>

<style scoped>
/* --- Floating heart button (Orokin gold ring, void-red heart) --------------- */
.don-fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 90;
  width: 54px;
  height: 54px;
  background: linear-gradient(160deg, #191c30, #0d0e17) !important;
  border: 1px solid rgba(200, 168, 92, 0.55);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.3);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.don-fab:hover {
  transform: translateY(-2px);
  border-color: rgba(231, 207, 149, 0.9);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 90, 110, 0.25);
}
.don-fab:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: 3px;
}
.don-fab__heart {
  color: #ff5a6e;
  animation: donpulse 2.4s ease-in-out infinite;
}
@keyframes donpulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.14); }
}

@media (max-width: 600px) {
  .don-fab {
    right: 14px;
    bottom: 14px;
    width: 48px;
    height: 48px;
  }
}

/* --- Dialog card ----------------------------------------------------------- */
.don {
  background: linear-gradient(180deg, #14162a 0%, #0c0d18 100%);
  border: 1px solid rgba(200, 168, 92, 0.34);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  color: #eef1f8;
  padding: 20px 22px 22px;
  font-family: 'Rajdhani', 'Segoe UI', sans-serif;
}
.don__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.don__head-heart {
  color: #ff5a6e;
  flex: none;
}
.don__title {
  font-family: 'Cinzel', 'Georgia', serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: #e7cf95;
  flex: 1;
  line-height: 1.15;
}
.don__close {
  flex: none;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: #9aa0b8;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.don__close:hover {
  color: #e7cf95;
  border-color: rgba(200, 168, 92, 0.5);
}
.don__close:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: 2px;
}
.don__body {
  font-size: 0.95rem;
  line-height: 1.55;
  color: #b6bcd0;
  margin: 0 0 18px;
}
.don__btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.don__pay {
  height: 46px !important;
  text-transform: none;
  letter-spacing: 0.01em;
  font-family: 'Rajdhani', 'Segoe UI', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  color: #fff !important;
  border-radius: 8px;
}
.don__pay--pp {
  background: #0070ba !important;
}
.don__pay--pp:hover {
  background: #0086dd !important;
}
.don__pay--mp {
  background: #009ee3 !important;
}
.don__pay--mp:hover {
  background: #22b6f5 !important;
}
.don__ico {
  display: inline-flex;
  margin-right: 8px;
}
.don__ico img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  border-radius: 4px;
}
.don__reviews {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  color: #8f95ab;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: color 0.15s ease;
}
.don__reviews:hover {
  color: #35d6d0;
}
.don__reviews .v-icon {
  color: #e7cf95;
}

@media (prefers-reduced-motion: reduce) {
  .don-fab__heart {
    animation: none;
  }
  .don-fab {
    transition: none;
  }
}
</style>
