import type { Ref } from 'vue'
import { translations, faqTranslations, type LangCode, type FaqItem } from '~/utils/translations'

export function useTranslations(lang: Ref<LangCode>) {
  function t(key: string): string {
    return translations[lang.value]?.[key] ?? translations.en[key] ?? key
  }

  function faqs(): FaqItem[] {
    return faqTranslations[lang.value] ?? faqTranslations.en ?? []
  }

  return { t, faqs }
}