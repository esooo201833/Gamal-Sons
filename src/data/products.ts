import type { Language } from '../i18n/translations.js'

export type LocalizedLabel = Record<Language, string>
export type ProductCategoryDefinition = {
  id: string
  label: LocalizedLabel
  subcategories: { id: string; label: LocalizedLabel }[]
}

const localized = (ar: string, en: string, fr: string): LocalizedLabel => ({ ar, en, fr })

export const productCategoryDefinitions: ProductCategoryDefinition[] = [
  {
    id: 'abaya',
    label: localized('عبايات', 'Abayas', 'Abayas'),
    subcategories: [
      { id: 'abaya-black', label: localized('عبايات سوداء', 'Black abayas', 'Abayas noires') },
      { id: 'abaya-colors', label: localized('عبايات ألوان', 'Colored abayas', 'Abayas colorées') },
      { id: 'umrah-hajj', label: localized('العمرة والحج', 'Umrah and Hajj', 'Omra et Hajj') },
      { id: 'abaya-reception', label: localized('عبايات استقبال', 'Reception abayas', 'Abayas de réception') },
    ],
  },
  { id: 'abaya-jeans', label: localized('عبايات جينز', 'Denim abayas', 'Abayas en jean'), subcategories: [] },
  {
    id: 'winter',
    label: localized('الملابس الشتوي', 'Winter clothing', 'Vêtements d’hiver'),
    subcategories: [
      { id: 'winter-shawl', label: localized('الشال', 'Shawls', 'Châles') },
      { id: 'winter-abaya', label: localized('العبايات الشتوي', 'Winter abayas', 'Abayas d’hiver') },
    ],
  },
  { id: 'isdaal', label: localized('إسدالات وأدنائات', 'Isdal and Adnae sets', 'Ensembles isdal et adnae'), subcategories: [] },
  { id: 'kids-abaya', label: localized('عبايات أطفال', 'Kids abayas', 'Abayas enfant'), subcategories: [] },
  {
    id: 'headwear',
    label: localized('طرح', 'Headscarves', 'Voiles'),
    subcategories: [
      { id: 'scarves', label: localized('طرح', 'Scarves', 'Foulards') },
      { id: 'khimar', label: localized('خمار', 'Khimar', 'Khimar') },
      { id: 'niqab', label: localized('نقاب', 'Niqab', 'Niqab') },
    ],
  },
  { id: 'lingerie', label: localized('لانجيري', 'Lingerie', 'Lingerie'), subcategories: [] },
]

export type ProductCategory = string
export type ProductSubcategory = string

export function isProductCategory(
  value: unknown,
  categories: readonly ProductCategoryDefinition[] = productCategoryDefinitions,
): value is ProductCategory {
  return categories.some((category) => category.id === value)
}

export function isProductSubcategory(
  category: ProductCategory,
  value: unknown,
  categories: readonly ProductCategoryDefinition[] = productCategoryDefinitions,
): value is ProductSubcategory {
  return categories
    .find((definition) => definition.id === category)
    ?.subcategories.some((subcategory) => subcategory.id === value) ?? false
}

export type Product = {
  id: string
  image: string
  width: number
  height: number
  modelCode: string | null
  modelCodeStatus: 'verified' | 'needs-review'
  category: ProductCategory
  subcategory?: ProductSubcategory | null
}

export const products: Product[] = []
