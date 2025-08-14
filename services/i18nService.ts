import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'es'

interface Translations {
  [key: string]: string | Translations
}

interface I18nContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

class I18nService {
  private translations: Record<Language, Translations> = {
    en: {},
    es: {},
  }

  private currentLanguage: Language = 'en'
  private listeners: ((lang: Language) => void)[] = []

  async loadTranslations() {
    try {
      // In a real app, these would be loaded from files
      // For now, we'll use inline translations
      const enModule: any = await import('@/lang/en.json')
      const esModule: any = await import('@/lang/es.json')
      this.translations.en = enModule?.default ?? enModule ?? {}
      this.translations.es = esModule?.default ?? esModule ?? {}
    } catch (error) {
      console.error('Failed to load translations:', error)
    }
  }

  setLanguage(language: Language) {
    this.currentLanguage = language
    localStorage.setItem('keymaker_language', language)
    this.listeners.forEach((listener) => listener(language))
  }

  getLanguage(): Language {
    return this.currentLanguage
  }

  translate(key: string, params?: Record<string, string>): string {
    const keys = key.split('.')
    let value: any = this.translations[this.currentLanguage]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to English
        value = this.translations.en
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k]
          } else {
            return key // Return key if translation not found
          }
        }
        break
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(`{${param}}`, val)
      })
    }

    return value
  }

  subscribe(listener: (lang: Language) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }
}

export const i18nService = new I18nService()

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Load saved language
    const saved = localStorage.getItem('keymaker_language') as Language
    if (saved && (saved === 'en' || saved === 'es')) {
      setLanguageState(saved)
      i18nService.setLanguage(saved)
    }

    // Load translations
    i18nService.loadTranslations()

    // Subscribe to language changes
    return i18nService.subscribe((lang) => {
      setLanguageState(lang)
    })
  }, [])

  const setLanguage = (lang: Language) => {
    i18nService.setLanguage(lang)
  }

  const t = (key: string, params?: Record<string, string>) => {
    return i18nService.translate(key, params)
  }

  return React.createElement(
    I18nContext.Provider,
    { value: { language, setLanguage, t } },
    children,
  )
}
