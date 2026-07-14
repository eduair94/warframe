import translations from './translations'

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'es',
  messages: translations,
}))
