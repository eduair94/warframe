// Microcopy for the browser-language suggestion banner (LocaleSuggestion.client.vue).
// Shown in the DETECTED language, so every locale needs these keys. {lang} is the
// detected locale's native name (e.g. "Español"). Namespaced under localeSuggest.*.
export default {
  en: { localeSuggest: { prompt: 'View this page in {lang}?', switch: 'Switch to {lang}', dismiss: 'No thanks', aria: 'Language suggestion' } },
  es: { localeSuggest: { prompt: '¿Ver esta página en {lang}?', switch: 'Cambiar a {lang}', dismiss: 'No, gracias', aria: 'Sugerencia de idioma' } },
  pt: { localeSuggest: { prompt: 'Ver esta página em {lang}?', switch: 'Mudar para {lang}', dismiss: 'Não, obrigado', aria: 'Sugestão de idioma' } },
  de: { localeSuggest: { prompt: 'Diese Seite auf {lang} ansehen?', switch: 'Zu {lang} wechseln', dismiss: 'Nein danke', aria: 'Sprachvorschlag' } },
  fr: { localeSuggest: { prompt: 'Voir cette page en {lang} ?', switch: 'Passer en {lang}', dismiss: 'Non merci', aria: 'Suggestion de langue' } },
  ru: { localeSuggest: { prompt: 'Открыть эту страницу на {lang}?', switch: 'Переключить на {lang}', dismiss: 'Нет, спасибо', aria: 'Предложение языка' } },
  ko: { localeSuggest: { prompt: '이 페이지를 {lang}(으)로 볼까요?', switch: '{lang}(으)로 전환', dismiss: '괜찮아요', aria: '언어 제안' } },
  ja: { localeSuggest: { prompt: 'このページを{lang}で表示しますか？', switch: '{lang}に切り替える', dismiss: 'いいえ', aria: '言語の提案' } },
  'zh-hans': { localeSuggest: { prompt: '用{lang}查看此页面？', switch: '切换到{lang}', dismiss: '不用了', aria: '语言建议' } },
  'zh-hant': { localeSuggest: { prompt: '用{lang}檢視此頁面？', switch: '切換到{lang}', dismiss: '不用了', aria: '語言建議' } },
  pl: { localeSuggest: { prompt: 'Wyświetlić tę stronę w języku {lang}?', switch: 'Przełącz na {lang}', dismiss: 'Nie, dziękuję', aria: 'Sugestia języka' } },
  it: { localeSuggest: { prompt: 'Vedere questa pagina in {lang}?', switch: 'Passa a {lang}', dismiss: 'No, grazie', aria: 'Suggerimento lingua' } },
  uk: { localeSuggest: { prompt: 'Переглянути цю сторінку {lang}?', switch: 'Перейти на {lang}', dismiss: 'Ні, дякую', aria: 'Пропозиція мови' } },
}
