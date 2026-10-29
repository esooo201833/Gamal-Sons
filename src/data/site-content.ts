import { site } from '../config/site.js'
import { products, type Product } from './products.js'
import { translations, type Language } from '../i18n/translations.js'

export type TranslationKey = keyof typeof translations.en
export type SiteSettings = Record<Extract<keyof typeof site, string>, string>
export type EditableTranslations = {
  [Key in Language]: { [Translation in TranslationKey]: string }
}

export type SiteContent = {
  site: SiteSettings
  products: Product[]
  reviewVideos: string[]
  translations: EditableTranslations
}

export function isFacebookVideoUrl(value: string): boolean {
  if (!value || value.length > 2000 || value !== value.trim()) return false

  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()
    const isFacebookHost = hostname === 'fb.watch' ||
      hostname === 'facebook.com' ||
      hostname.endsWith('.facebook.com')
    return url.protocol === 'https:' &&
      url.username === '' &&
      url.password === '' &&
      url.port === '' &&
      isFacebookHost
  } catch {
    return false
  }
}

export const defaultSiteContent: SiteContent = {
  site: { ...site },
  products: [...products],
  reviewVideos: [],
  translations: {
    ar: { ...translations.ar },
    en: { ...translations.en },
    fr: { ...translations.fr },
  },
}
