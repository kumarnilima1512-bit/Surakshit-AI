import type { LangCode } from '~/utils/translations'

export const useAppLanguage = () =>
  useState<LangCode>('app-language', () => 'en')