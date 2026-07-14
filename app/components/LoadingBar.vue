<template>
  <div id="spinner-wrapper">
    <div class="lds-ring">
      <div></div>
    </div>
  </div>
</template>

<script>
// Registered as Nuxt's `loading` component (nuxt.config.js). Previously it had
// no start()/finish() methods, so Nuxt could never drive it — the overlay only
// appeared on the very first (SSR) load and never again, leaving client-side
// navigation with zero feedback while the target page's chunk + data loaded.
// Implementing the loading interface makes Nuxt show it on every route change.
export default {
  name: 'LoadingBar',
  data() {
    return { timer: null, safety: null }
  },
  methods: {
    spinner() {
      return this.$el && this.$el.id === 'spinner-wrapper'
        ? this.$el
        : document.getElementById('spinner-wrapper')
    },
    show() {
      const el = this.spinner()
      if (el) el.style.display = 'flex'
    },
    hide() {
      const el = this.spinner()
      if (el) el.style.display = 'none'
    },
    start() {
      this.clear()
      // Small delay so instant (cached) transitions don't flash the overlay.
      this.timer = setTimeout(() => this.show(), 120)
      // Safety net: never let the overlay get stuck if finish() never fires.
      this.safety = setTimeout(() => this.hide(), 15000)
    },
    finish() {
      this.clear()
      this.hide()
    },
    fail() {
      this.finish()
    },
    clear() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
      if (this.safety) {
        clearTimeout(this.safety)
        this.safety = null
      }
    },
  },
  beforeDestroy() {
    this.clear()
  },
}
</script>

<style>
#spinner-wrapper {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.5);
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1021;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lds-ring div {
  box-sizing: border-box;
  display: block;
  width: 51px;
  height: 51px;
  margin: 6px;
  border: 6px solid #fff;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #fff transparent transparent transparent;
}

.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}

.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}

.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}

@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>