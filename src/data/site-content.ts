import { site } from '../config/site.js'
import { productCategoryDefinitions, products, type Product, type ProductCategoryDefinition } from './products.js'
import { translations, type Language } from '../i18n/translations.js'

export type TranslationKey = keyof typeof translations.en
export type SiteSettings = Record<Extract<keyof typeof site, string>, string>
export type EditableTranslations = {
  [Key in Language]: { [Translation in TranslationKey]: string }
}

export type SiteContent = {
  site: SiteSettings
  products: Product[]
  categories: ProductCategoryDefinition[]
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
  categories: productCategoryDefinitions.map((category) => ({
    ...category,
    label: { ...category.label },
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      label: { ...subcategory.label },
    })),
  })),
  reviewVideos: [],
  translations: {
    ar: { ...translations.ar },
    en: { ...translations.en },
    fr: { ...translations.fr },
  },
}
