<template>
  <div class="d-inline-block">
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          icon
          color="white"
          v-bind="attrs"
          class="github-btn"
          v-on="on"
          @click="openGitHub"
        >
          <v-icon>mdi-github</v-icon>
        </v-btn>
      </template>
      <span>{{ $t('view_source_code') }}</span>
    </v-tooltip>

    <!-- GitHub Share Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card dark class="github-card">
        <v-card-title class="headline d-flex align-center">
          <v-icon large class="mr-3" color="white">mdi-github</v-icon>
          {{ $t('open_source_project') }}
        </v-card-title>

        <v-card-text>
          <div class="text-center py-4">
            <p class="body-1 mb-4">
              {{ $t('github_description') }}
            </p>
            
            <div class="d-flex align-center justify-center mb-4 pa-3 grey darken-3 rounded">
              <v-icon left color="white">mdi-link</v-icon>
              <span class="font-weight-bold">{{ githubUrl }}</span>
              <v-btn
                icon
                small
                color="primary"
                class="ml-2"
                :disabled="copied"
                @click="copyToClipboard"
              >
                <v-icon small>{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
              </v-btn>
            </div>

            <div class="d-flex flex-wrap justify-center gap-2">
              <v-btn
                color="primary"
                :href="githubUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="ma-1"
              >
                <v-icon left>mdi-github</v-icon>
                {{ $t('view_on_github') }}
              </v-btn>
              
              <v-btn
                color="success"
                :href="githubUrl + '/fork'"
                target="_blank"
                rel="noopener noreferrer"
                class="ma-1"
              >
                <v-icon left>mdi-source-fork</v-icon>
                {{ $t('fork_project') }}
              </v-btn>
              
              <v-btn
                color="warning"
                :href="githubUrl + '/issues'"
                target="_blank"
                rel="noopener noreferrer"
                class="ma-1"
              >
                <v-icon left>mdi-bug</v-icon>
                {{ $t('report_issue') }}
              </v-btn>
            </div>

            <v-divider class="my-4"></v-divider>

            <div class="text-left">
              <h4 class="mb-2">{{ $t('features') }}:</h4>
              <ul class="body-2">
                <li>{{ $t('feature_realtime_data') }}</li>
                <li>{{ $t('feature_price_analytics') }}</li>
                <li>{{ $t('feature_riven_tracking') }}</li>
                <li>{{ $t('feature_open_source') }}</li>
              </ul>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialog = false">
            {{ $t('cerrar') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'GitHubShare',
  data() {
    return {
      dialog: false,
      copied: false,
      githubUrl: 'https://github.com/eduair94/warframe'
    }
  },
  methods: {
    openGitHub() {
      this.dialog = true
    },
    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.githubUrl)
        this.copied = true
        this.$nuxt.$emit('show-snackbar', {
          message: this.$t('url_copied'),
          color: 'success'
        })
        setTimeout(() => {
          this.copied = false
        }, 3000)
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = this.githubUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        this.copied = true
        setTimeout(() => {
          this.copied = false
        }, 3000)
      }
    }
  }
}
</script>

<style scoped>
.github-btn {
  transition: transform 0.2s ease;
}

.github-btn:hover {
  transform: scale(1.1);
}

.github-card {
  background: linear-gradient(135deg, #1f1f2f 0%, #2c2c54 100%);
}

.gap-2 > * {
  margin: 4px;
}
</style>
