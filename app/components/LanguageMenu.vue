<template>
  <div class="text-center">
    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn color="primary" dark v-bind="attrs" v-on="on">
          {{ locale }} <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(item, index) in availableLocales"
          :key="index"
          link
          :to="switchLocalePath(item.code)"
        >
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>


<script>
export default {
  data() {
    return {
      locale: '',
    }
  },
  computed: {
    availableLocales() {
      return this.$i18n.locales.filter((i) => i.code !== this.$i18n.locale)
    },
  },
  watch: {
    '$i18n.locale'(val) {
      this.locale = val
      this.$vuetify.lang.current = val
    },
  },
  mounted() {
    this.locale = this.$i18n.locale
  },
}
</script>