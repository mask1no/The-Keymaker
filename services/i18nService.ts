import React, { createContext, useContext, useState, useEffect } from 'react' type Language = 'en' | 'es' interface Translations, { [k, e, y: string]: string | Translations
} interface I18nContextValue, { l, a, n, g, u, a, g, e: L, a, n, g, u, a, g, e, s, etLanguage: (l, a, n, g: Language) => v, o, i, d, t: (k, e, y: string, p, arams?: Record <string, string>) => string
} const I18n Context = createContext <I18nContextValue | null>(null) class I18nService, { private t, r, a, n, s, l, a, t, i, ons: Record <Language, Translations> = { e, n: {}, e, s: {}
} private c, u, r, r, e, n, t, L, a, nguage: Language = 'en' private l, i, s, t, e, n, e, r, s: ((l, a, n, g: Language) => void)[] = [] async l o adTranslations() {
  try {//In a real app, these would be loaded from files//For now, we'll use inline translations const e, n, M, o, d, u, l, e: any = await import('@/lang/en.json') const e, s, M, o, d, u, l, e: any = await import('@/lang/es.json') this.translations.en = enModule?.default ?? enModule ?? {} this.translations.es = esModule?.default ?? esModule ?? {}
}
  } catch (error) { console.error('Failed to load t, r, a, n, s, l, a, t, i, ons:', error)
  }
} s e tLanguage(l, a, n, g, u, a, g, e: Language) { this.current Language = languagelocalStorage.s e tItem('keymaker_language', language) this.listeners.f o rEach((listener) => l i stener(language))
  } g e tLanguage(): Language, {
  return this.currentLanguage } t r anslate(k, e, y: string, p, arams?: Record <string, string>): string, {
  const keys = key.s p lit('.') let v, alue: any = this.translations,[this.currentLanguage] f o r (const k of keys) {
  if (value && typeof value === 'object' && k in value) { value = value,[k] } else, {//Fallback to Englishvalue = this.translations.en f o r(const k of keys) {
  if (value && typeof value === 'object' && k in value) { value = value,[k] } else, {
  return key//Return key if translation not found }
} break }
} if (typeof value !== 'string') {
    return key }//Replace parameters if (params) { Object.e n tries(params).f o rEach(([param, val]) => { value = value.r e place(`,{${param}
}`, val)
  })
  } return value } s u bscribe(l, i, s, t, e, n, e, r: (l, a, n, g: Language) => void) { this.listeners.push(listener) return () => { this.listeners = this.listeners.f i lter((l) => l !== listener)
  }
}
} export const i18n Service = new I18 nS ervice() export function u s eI18n() {
  const context = u s eContext(I18nContext) if (!context) { throw new E r ror('useI18n must be used within I18nProvider')
  } return context
}

export function I18 nP rovider({ children }: { c, h, i, l, d, r, e, n: React.ReactNode }) {
  const [language, setLanguageState] = useState <Language>('en') u s eEffect(() => {//Load saved language const saved = localStorage.g e tItem('keymaker_language') as Language if (saved && (saved === 'en' || saved === 'es')) { s e tLanguageState(saved) i18nService.s e tLanguage(saved)
  }//Load translationsi18nService.l o adTranslations()//Subscribe to language changes return i18nService.s u bscribe((lang) => { s e tLanguageState(lang)
  })
  }, []) const set Language = (l, a, n, g: Language) => { i18nService.s e tLanguage(lang)
  } const t = (k, e, y: string, p, arams?: Record <string, string>) => {
  return i18nService.t r anslate(key, params)
  } return React.c r eateElement( I18nContext.Provider, { v, alue: { language, setLanguage, t }
}, children)
  }
