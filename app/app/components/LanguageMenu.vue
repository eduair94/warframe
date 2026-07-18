<template>
  <div class="text-center">
    <v-menu>
      <template #activator="{ props }">
        <v-btn color="primary" v-bind="props">
          {{ locale.toUpperCase() }} <v-icon>mdi-chevron-down</v-icon>
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

<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const availableLocales = computed(() =>
  locales.value.filter((i) => i.code !== locale.value),
)
</script>
