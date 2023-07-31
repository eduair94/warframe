<template>
  <div class="text-center">
    <v-bottom-sheet v-model="sheet" persistent inset>
      <v-sheet class="text-center py-2 grey darken-3" height="auto">
        <v-btn text class="font-weight-bold" color="warning" @click="close"
          >{{ $t('no_mostrar_nuevo') }}
        </v-btn>
        <v-btn
          text
          class="font-weight-bold"
          color="error"
          @click="sheet = false"
        >
          {{ $t('cerrar') }}
        </v-btn>
        <div class="pb-3 d-flex flex-wrap justify-center">
          <span class="mr-2">{{ $t('join_twitter') }}:</span>
          <a
            class="no_link white--text"
            href="https://twitter.com/cambio_uruguay"
            target="_blank"
          >
            <span class="mr-2 link_format"
              >https://twitter.com/cambio_uruguay</span
            >
            <v-icon color="#00acee">mdi-twitter</v-icon>
          </a>
        </div>
        <div class="pb-3 d-flex flex-wrap justify-center">
          <span class="mr-2">{{ $t('join_linkedin') }}:</span>
          <a
            class="no_link white--text"
            href="https://www.linkedin.com/company/cambio-uruguay/"
            target="_blank"
          >
            <span class="mr-2 link_format"
              >https://www.linkedin.com/company/cambio-uruguay/</span
            >
            <v-icon color="#0e76a8">mdi-linkedin</v-icon>
          </a>
        </div>
      </v-sheet>
    </v-bottom-sheet>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sheet: false,
    }
  },
  beforeDestroy() {
    if (this.timeoutFunction) {
      clearTimeout(this.timeoutFunction)
    }
  },
  mounted() {
    this.show()
  },
  methods: {
    close() {
      localStorage.setItem('not_show_twitter', true)
      this.sheet = false
    },
    show() {
      if (localStorage.getItem('not_show_twitter')) return
      const randomSeconds = Math.floor(Math.random() * 60) + 20
      const time = randomSeconds * 1000
      this.timeoutFunction = setTimeout(() => {
        this.sheet = true
      }, time)
    },
  },
}
</script>