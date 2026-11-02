const MAX_IMAGE_SIZE = 3 * 1024 * 1024
const SESSION_DURATION_SECONDS = 8 * 60 * 60
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5
const loginWindows = new Map<string, { attempts: number; expiresAt: number }>()

type JsonRecord = Record<string, unknown>

class RequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
  })
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info')
    headers.set('Access-Control-Max-Age', '86400')
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers })
}

function allowedOrigins(): Set<string> {
  const value = Deno.env.get('ALLOWED_ORIGINS')
  if (!value) throw new Error('ALLOWED_ORIGINS is not configured.')
  return new Set(value.split(',').map((origin) => origin.trim()).filter(Boolean))
}

function getOrigin(request: Request): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null
  if (!allowedOrigins().has(origin)) {
    throw new RequestError(403, 'تعذر التحقق من مصدر الطلب.')
  }
  return origin
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  return copy.buffer
}

function sessionSecret(): string {
  const value = Deno.env.get('ADMIN_SESSION_SECRET')
  if (!value || value.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.')
  }
  return value
}

async function signSession(payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(sessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
}

async function createSession(username: string): Promise<string> {
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    username,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  })))
  return `${payload}.${base64UrlEncode(await signSession(payload))}`
}

async function authenticated(request: Request): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return false
  const [encodedPayload, signature, extra] = token.split('.')
  if (!encodedPayload || !signature || extra !== undefined) return false
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(sessionSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      toArrayBuffer(base64UrlDecode(signature)),
      new TextEncoder().encode(encodedPayload),
    )
    if (!valid) return false
    const payload: unknown = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)))
    return isRecord(payload) &&
      payload.username === Deno.env.get('ADMIN_USERNAME') &&
      typeof payload.expiresAt === 'number' &&
      payload.expiresAt > Date.now()
  } catch {
    return false
  }
}

async function sameSecret(left: string, right: string): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(left)),
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(right)),
  ])
  const a = new Uint8Array(leftDigest)
  const b = new Uint8Array(rightDigest)
  let difference = 0
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index]
  return difference === 0
}

function getClientAddress(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    'unknown'
}

function isLoginRateLimited(address: string): boolean {
  const now = Date.now()
  const current = loginWindows.get(address)
  if (!current || current.expiresAt <= now) {
    loginWindows.set(address, { attempts: 0, expiresAt: now + LOGIN_WINDOW_MS })
    return false
  }
  return current.attempts >= MAX_LOGIN_ATTEMPTS
}

function recordFailedLogin(address: string): void {
  const now = Date.now()
  const current = loginWindows.get(address)
  if (!current || current.expiresAt <= now) {
    loginWindows.set(address, { attempts: 1, expiresAt: now + LOGIN_WINDOW_MS })
    return
  }
  current.attempts += 1
}

function serviceConfig(): { url: string; key: string } {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Supabase service credentials are not configured.')
  return { url: url.replace(/\/+$/, ''), key }
}

async function databaseRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const { url, key } = serviceConfig()
  const headers = new Headers(init.headers)
  headers.set('apikey', key)
  headers.set('Authorization', `Bearer ${key}`)
  return fetch(`${url}/rest/v1/${path}`, { ...init, headers })
}

function isSafeImageUrl(value: string): boolean {
  if (value.startsWith('/assets/') && !value.startsWith('//')) return true
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function isSafeSiteUrl(value: string): boolean {
  if (value.startsWith('/assets/') && !value.startsWith('//')) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function isFacebookVideoUrl(value: string): boolean {
  if (!value || value.length > 2000 || value !== value.trim()) return false
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      (hostname === 'fb.watch' || hostname === 'facebook.com' || hostname.endsWith('.facebook.com'))
  } catch {
    return false
  }
}

function validateContent(value: unknown): JsonRecord {
  if (!isRecord(value) || !isRecord(value.site) || !isRecord(value.translations) ||
    !Array.isArray(value.products) || !Array.isArray(value.categories) ||
    !Array.isArray(value.reviewVideos)) {
    throw new RequestError(400, 'بيانات الموقع غير صالحة.')
  }

  for (const [key, field] of Object.entries(value.site)) {
    if (typeof field !== 'string' || field.length > 2000) {
      throw new RequestError(400, `قيمة إعداد الموقع "${key}" غير صالحة.`)
    }
    if (key.endsWith('Url') && !isSafeSiteUrl(field)) {
      throw new RequestError(400, `الرابط "${key}" يجب أن يبدأ بـ https:// أو http://.`)
    }
  }

  for (const language of ['ar', 'en', 'fr']) {
    const translation = value.translations[language]
    if (!isRecord(translation) ||
      Object.values(translation).some((text) => typeof text !== 'string' || text.length > 6000)) {
      throw new RequestError(400, `ترجمات اللغة "${language}" غير صالحة.`)
    }
  }

  if (value.categories.length < 1 || value.categories.length > 100) {
    throw new RequestError(400, 'قائمة الفئات غير صالحة.')
  }
  const categories = new Map<string, Set<string>>()
  for (const [index, raw] of value.categories.entries()) {
    if (!isRecord(raw) || typeof raw.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(raw.id) || categories.has(raw.id) ||
      !isRecord(raw.label) || !Array.isArray(raw.subcategories) || raw.subcategories.length > 100) {
      throw new RequestError(400, `بيانات الفئة رقم ${index + 1} غير صالحة.`)
    }
    for (const language of ['ar', 'en', 'fr']) {
      const label = raw.label[language]
      if (typeof label !== 'string' || !label.trim() || label.length > 100) {
        throw new RequestError(400, `اسم الفئة رقم ${index + 1} غير صالح.`)
      }
    }
    const subcategoryIds = new Set<string>()
    for (const [subcategoryIndex, rawSubcategory] of raw.subcategories.entries()) {
      if (!isRecord(rawSubcategory) || typeof rawSubcategory.id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(rawSubcategory.id) ||
        subcategoryIds.has(rawSubcategory.id) || !isRecord(rawSubcategory.label)) {
        throw new RequestError(400, `بيانات القسم رقم ${subcategoryIndex + 1} في الفئة "${raw.id}" غير صالحة.`)
      }
      for (const language of ['ar', 'en', 'fr']) {
        const label = rawSubcategory.label[language]
        if (typeof label !== 'string' || !label.trim() || label.length > 100) {
          throw new RequestError(400, `اسم القسم رقم ${subcategoryIndex + 1} في الفئة "${raw.id}" غير صالح.`)
        }
      }
      subcategoryIds.add(rawSubcategory.id)
    }
    categories.set(raw.id, subcategoryIds)
  }

  if (value.products.length > 500) throw new RequestError(400, 'لا يمكن أن يزيد الكتالوج عن 500 موديل.')
  const productIds = new Set<string>()
  for (const [index, raw] of value.products.entries()) {
    if (!isRecord(raw) || typeof raw.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(raw.id) || productIds.has(raw.id) ||
      typeof raw.image !== 'string' || !isSafeImageUrl(raw.image) ||
      !Number.isInteger(raw.width) || Number(raw.width) < 1 || Number(raw.width) > 10000 ||
      !Number.isInteger(raw.height) || Number(raw.height) < 1 || Number(raw.height) > 10000 ||
      (raw.modelCode !== null && (typeof raw.modelCode !== 'string' || raw.modelCode.length > 80)) ||
      (raw.modelCodeStatus !== 'verified' && raw.modelCodeStatus !== 'needs-review') ||
      typeof raw.category !== 'string' || !categories.has(raw.category)) {
      throw new RequestError(400, `بيانات الموديل رقم ${index + 1} غير صالحة.`)
    }
    if (raw.subcategory !== undefined && raw.subcategory !== null &&
      (typeof raw.subcategory !== 'string' || !categories.get(raw.category)?.has(raw.subcategory))) {
      throw new RequestError(400, `بيانات القسم في الموديل رقم ${index + 1} غير صالحة.`)
    }
    productIds.add(raw.id)
  }

  if (value.reviewVideos.length > 50 ||
    value.reviewVideos.some((video) => typeof video !== 'string' || !isFacebookVideoUrl(video))) {
    throw new RequestError(400, 'قائمة فيديوهات التقييمات غير صالحة.')
  }
  return value
}

function imageBytes(dataUrl: string): { bytes: Uint8Array; contentType: string; extension: string } {
  if (dataUrl.length > Math.ceil(MAX_IMAGE_SIZE * 4 / 3) + 100) {
    throw new RequestError(400, 'الصورة غير صالحة أو أكبر من 3 ميجابايت.')
  }
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl)
  if (!match) throw new RequestError(400, 'صيغة الصورة غير مدعومة.')
  const contentType = match[1]
  const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0))
  const isJpeg = contentType === 'image/jpeg' && bytes.length >= 3 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng = contentType === 'image/png' && bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)
  const isWebp = contentType === 'image/webp' && bytes.length >= 12 &&
    new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP'
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_SIZE || !(isJpeg || isPng || isWebp)) {
    throw new RequestError(400, 'الصورة غير صالحة أو أكبر من 3 ميجابايت.')
  }
  return { bytes, contentType, extension: contentType === 'image/jpeg' ? 'jpg' : contentType.slice(6) }
}

async function handleSite(origin: string | null): Promise<Response> {
  const response = await databaseRequest('site_content?id=eq.main&select=content')
  if (!response.ok) throw new Error(`Supabase content read failed (${response.status}).`)
  const rows: unknown = await response.json()
  const content = Array.isArray(rows) && isRecord(rows[0]) ? rows[0].content : null
  return jsonResponse(content, 200, origin)
}

async function handleSession(request: Request, origin: string | null): Promise<Response> {
  if (request.method === 'GET') {
    return jsonResponse({ authenticated: await authenticated(request) }, 200, origin)
  }
  if (request.method === 'DELETE') {
    return jsonResponse({ authenticated: false }, 200, origin)
  }
  if (request.method !== 'POST') throw new RequestError(405, 'الطريقة غير مدعومة.')

  const address = getClientAddress(request)
  const window = loginWindows.get(address)
  if (window && window.expiresAt > Date.now() && isLoginRateLimited(address)) {
    return jsonResponse({ message: 'محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة.' }, 429, origin)
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new RequestError(400, 'بيانات تسجيل الدخول غير صالحة.')
  }
  const username = Deno.env.get('ADMIN_USERNAME')
  const password = Deno.env.get('ADMIN_PASSWORD')
  if (!username || !password || password.length < 16) {
    throw new Error('Admin credentials are not configured correctly.')
  }
  const valid = isRecord(body) && typeof body.username === 'string' &&
    typeof body.password === 'string' && body.username.length <= 120 && body.password.length <= 200 &&
    await sameSecret(body.username, username) && await sameSecret(body.password, password)
  if (!valid) {
    recordFailedLogin(address)
    return jsonResponse({ message: 'اسم الدخول أو كلمة المرور غير صحيحة.' }, 401, origin)
  }
  loginWindows.delete(address)
  return jsonResponse({ authenticated: true, token: await createSession(username) }, 200, origin)
}

async function handleUpload(request: Request, origin: string | null): Promise<Response> {
  if (request.method !== 'POST') throw new RequestError(405, 'الطريقة غير مدعومة.')
  if (!await authenticated(request)) throw new RequestError(401, 'سجّل الدخول إلى لوحة الإدارة أولًا.')
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new RequestError(400, 'اختر صورة بصيغة JPG أو PNG أو WebP.')
  }
  if (!isRecord(body) || typeof body.image !== 'string') {
    throw new RequestError(400, 'اختر صورة بصيغة JPG أو PNG أو WebP.')
  }
  const { bytes, contentType, extension } = imageBytes(body.image)
  const { url, key } = serviceConfig()
  const pathname = `products/${crypto.randomUUID()}.${extension}`
  const response = await fetch(`${url}/storage/v1/object/site-assets/${pathname}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body: toArrayBuffer(bytes),
  })
  if (!response.ok) {
    console.error('Supabase Storage upload failed:', response.status, await response.text())
    throw new Error('Supabase Storage upload failed.')
  }
  return jsonResponse({
    image: `${url}/storage/v1/object/public/site-assets/${pathname}`,
  }, 201, origin)
}

async function handleContent(request: Request, origin: string | null): Promise<Response> {
  if (request.method !== 'PUT') throw new RequestError(405, 'الطريقة غير مدعومة.')
  if (!await authenticated(request)) throw new RequestError(401, 'سجّل الدخول إلى لوحة الإدارة أولًا.')
  let rawContent: unknown
  try {
    rawContent = await request.json()
  } catch {
    throw new RequestError(400, 'بيانات الموقع غير صالحة.')
  }
  const content = validateContent(rawContent)
  const response = await databaseRequest('site_content?on_conflict=id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({ id: 'main', content, updated_at: new Date().toISOString() }),
  })
  if (!response.ok) {
    console.error('Supabase content save failed:', response.status, await response.text())
    throw new Error('Supabase content save failed.')
  }
  return jsonResponse(content, 200, origin)
}

Deno.serve(async (request) => {
  let origin: string | null = null
  try {
    origin = getOrigin(request)
    if (['POST', 'PUT', 'DELETE'].includes(request.method) && !origin) {
      throw new RequestError(403, 'تعذر التحقق من مصدر الطلب.')
    }
    if (request.method === 'OPTIONS') return jsonResponse({}, 204, origin)

    const action = new URL(request.url).searchParams.get('action')
    if (action === 'site' && request.method === 'GET') return await handleSite(origin)
    if (action === 'session') return await handleSession(request, origin)
    if (action === 'upload') return await handleUpload(request, origin)
    if (action === 'content') return await handleContent(request, origin)
    throw new RequestError(404, 'المسار غير موجود.')
  } catch (error) {
    if (error instanceof RequestError) {
      return jsonResponse({ message: error.message }, error.status, origin)
    }
    console.error('Supabase admin API request failed:', error)
    return jsonResponse({ message: 'تعذر إتمام العملية حاليًا.' }, 500, origin)
  }
})
