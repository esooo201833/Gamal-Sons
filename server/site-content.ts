import { randomUUID } from 'node:crypto'
import { list, put } from '@vercel/blob'
import { defaultSiteContent, isFacebookVideoUrl, type SiteContent, type SiteSettings, type TranslationKey } from '../src/data/site-content.js'
import type { Language } from '../src/i18n/translations.js'
import type { Product } from '../src/data/products.js'

const CONTENT_PATH = 'cms/site-content.json'
const SITE_KEYS = Object.keys(defaultSiteContent.site) as (keyof SiteSettings)[]
const TRANSLATION_KEYS = Object.keys(defaultSiteContent.translations.ar) as TranslationKey[]
const LANGUAGES: Language[] = ['ar', 'en', 'fr']

type UnknownRecord = Record<string, unknown>

export class SiteContentValidationError extends Error {}

export class BlobStorageConfigurationError extends Error {
  constructor() {
    super('تخزين Vercel Blob غير متصل بالمشروع.')
  }
}

function invalidContent(message: string): never {
  throw new SiteContentValidationError(message)
}

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isSafeImageUrl(value: string): boolean {
  if (value.startsWith('/assets/') && !value.startsWith('//')) return true

  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function validateSiteContent(value: unknown): SiteContent {
  if (!isRecord(value) || !isRecord(value.site) || !isRecord(value.translations) || !Array.isArray(value.products)) {
    return invalidContent('بيانات الموقع غير صالحة.')
  }

  const site: SiteSettings = { ...defaultSiteContent.site }
  for (const key of SITE_KEYS) {
    const field = value.site[key] === undefined ? defaultSiteContent.site[key] : value.site[key]
    if (typeof field !== 'string' || field.length > 2000) {
      invalidContent(`قيمة إعداد الموقع "${key}" غير صالحة.`)
    }
    if (key.endsWith('Url')) {
      try {
        const url = new URL(field)
        if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error()
      } catch {
        invalidContent(`الرابط "${key}" يجب أن يبدأ بـ https:// أو http://.`)
      }
    }
    site[key] = field
  }

  const translations = { ...defaultSiteContent.translations }
  for (const language of LANGUAGES) {
    const source = value.translations[language]
    if (!isRecord(source)) invalidContent(`ترجمات اللغة "${language}" غير صالحة.`)

    const copy = { ...defaultSiteContent.translations[language] }
    for (const key of TRANSLATION_KEYS) {
      const field = source[key] === undefined ? defaultSiteContent.translations[language][key] : source[key]
      if (typeof field !== 'string' || field.length > 6000) {
        invalidContent(`النص "${key}" في اللغة "${language}" غير صالح.`)
      }
      copy[key] = field
    }
    translations[language] = copy
  }

  if (value.products.length > 500) invalidContent('لا يمكن أن يزيد الكتالوج عن 500 موديل.')
  const ids = new Set<string>()
  const products: Product[] = value.products.map((item, index) => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) ||
      ids.has(item.id) ||
      typeof item.image !== 'string' ||
      !isSafeImageUrl(item.image) ||
      !Number.isInteger(item.width) ||
      !Number.isInteger(item.height) ||
      (item.width as number) < 1 ||
      (item.width as number) > 10000 ||
      (item.height as number) < 1 ||
      (item.height as number) > 10000 ||
      (item.modelCode !== null && (typeof item.modelCode !== 'string' || item.modelCode.length > 80)) ||
      (item.modelCodeStatus !== 'verified' && item.modelCodeStatus !== 'needs-review') ||
      (item.category !== 'abaya' && item.category !== 'isdaal')
    ) {
      invalidContent(`بيانات الموديل رقم ${index + 1} غير صالحة.`)
    }

    ids.add(item.id)
    return {
      id: item.id,
      image: item.image,
      width: item.width as number,
      height: item.height as number,
      modelCode: item.modelCode as string | null,
      modelCodeStatus: item.modelCodeStatus,
      category: item.category,
    }
  })

  const reviewVideos = value.reviewVideos === undefined ? [] : value.reviewVideos
  if (!Array.isArray(reviewVideos) || reviewVideos.length > 50) {
    invalidContent('قائمة فيديوهات التقييمات غير صالحة.')
  }

  const validatedReviewVideos = reviewVideos.map((video, index) => {
    if (typeof video !== 'string' || !isFacebookVideoUrl(video)) {
      invalidContent(`رابط فيديو التقييم رقم ${index + 1} غير صالح. أضف رابط فيديو عام من Facebook.`)
    }
    return video
  })

  return { site, products, reviewVideos: validatedReviewVideos, translations }
}

export async function readSiteContent(): Promise<SiteContent> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return defaultSiteContent

  const { blobs } = await list({ prefix: CONTENT_PATH, limit: 1, token })
  const contentBlob = blobs.find((blob) => blob.pathname === CONTENT_PATH)
  if (!contentBlob) return defaultSiteContent

  const response = await fetch(contentBlob.url, { cache: 'no-store' })
  if (!response.ok) throw new Error('تعذر قراءة محتوى الموقع المحفوظ.')
  return validateSiteContent(await response.json())
}

export async function saveSiteContent(value: unknown): Promise<SiteContent> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new BlobStorageConfigurationError()

  const content = validateSiteContent(value)
  await put(CONTENT_PATH, JSON.stringify(content), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    token,
  })
  return content
}

export async function saveProductImage(
  bytes: Buffer,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
  extension: 'jpg' | 'png' | 'webp',
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new BlobStorageConfigurationError()

  const blob = await put(`products/${randomUUID()}.${extension}`, bytes, {
    access: 'public',
    addRandomSuffix: false,
    contentType,
    token,
  })
  return blob.url
}
