<template>
  <v-btn
    :class="buttonClass"
    :color="color"
    :icon="icon"
    :small="small"
    :href="githubUrl"
    target="_blank"
    rel="noopener noreferrer"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <v-icon :left="!icon" :small="small">mdi-github</v-icon>
    <span v-if="!icon">{{ text || $t('view_source_code') }}</span>
  </v-btn>
</template>

<script>
export default {
  name: 'GitHubButton',
  props: {
    color: {
      type: String,
      default: 'white'
    },
    text: {
      type: String,
      default: ''
    },
    icon: {
      type: Boolean,
      default: false
    },
    outlined: {
      type: Boolean,
      default: false
    },
    small: {
      type: Boolean,
      default: false
    },
    buttonClass: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      githubUrl: 'https://github.com/eduair94/warframe'
    }
  }
}
</script>

<style scoped>
.v-btn {
  transition: all 0.2s ease;
}

.v-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>
