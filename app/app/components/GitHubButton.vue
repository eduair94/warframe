<template>
  <v-btn
    :class="buttonClass"
    :color="color"
    :icon="icon"
    :size="small ? 'small' : undefined"
    :href="githubUrl"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="icon ? (text || $t('view_source_code')) : undefined"
    v-bind="$attrs"
  >
    <v-icon :class="{ 'me-2': !icon }" :size="small ? 'small' : undefined">mdi-github</v-icon>
    <span v-if="!icon">{{ text || $t('view_source_code') }}</span>
  </v-btn>
</template>

<script>
export default {
  name: 'GitHubButton',
  inheritAttrs: false,
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
