import { createHmac, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SESSION_COOKIE = 'gamal_admin'
const SESSION_DURATION_SECONDS = 8 * 60 * 60
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5

type AdminSecrets = {
  username: string
  password: string
  sessionSecret: string
}

type SessionPayload = {
  username: string
  expiresAt: number
}

type LoginWindow = {
  attempts: number
  expiresAt: number
}

const loginWindows = new Map<string, LoginWindow>()

export class AdminConfigurationError extends Error {
  constructor() {
    super('إعدادات الإدارة غير مكتملة. أضف أسرار ADMIN_USERNAME وADMIN_PASSWORD وADMIN_SESSION_SECRET في Vercel.')
  }
}

function getAdminSecrets(): AdminSecrets {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = process.env
  if (
    !ADMIN_USERNAME ||
    !ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < 16 ||
    !ADMIN_SESSION_SECRET ||
    ADMIN_SESSION_SECRET.length < 32
  ) {
    throw new AdminConfigurationError()
  }

  return {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
    sessionSecret: ADMIN_SESSION_SECRET,
  }
}

function safeCompare(left: string, right: string, secret: string): boolean {
  const leftDigest = createHmac('sha256', secret).update(left).digest()
  const rightDigest = createHmac('sha256', secret).update(right).digest()
  return timingSafeEqual(leftDigest, rightDigest)
}

function signSession(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function readSessionCookie(request: VercelRequest): string | undefined {
  return request.cookies?.[SESSION_COOKIE]
}

export function getAuthenticatedAdmin(request: VercelRequest): string | null {
  const secrets = getAdminSecrets()
  const token = readSessionCookie(request)
  if (!token) return null

  const [encodedPayload, signature, extra] = token.split('.')
  if (!encodedPayload || !signature || extra !== undefined) return null

  const expectedSignature = signSession(encodedPayload, secrets.sessionSecret)
  if (!safeCompare(signature, expectedSignature, secrets.sessionSecret)) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload
    if (
      typeof payload.username !== 'string' ||
      typeof payload.expiresAt !== 'number' ||
      payload.expiresAt <= Date.now() ||
      !safeCompare(payload.username, secrets.username, secrets.sessionSecret)
    ) {
      return null
    }

    return payload.username
  } catch {
    return null
  }
}

export function isSameOrigin(request: VercelRequest): boolean {
  const origin = request.headers.origin
  const hostHeader = request.headers['x-forwarded-host'] ?? request.headers.host
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader?.split(',')[0]?.trim()
  if (typeof origin !== 'string' || !host) return false

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase()
  } catch {
    return false
  }
}

export function getRequestJson(request: VercelRequest): Record<string, unknown> | null {
  let body: unknown = request.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return null
    }
  }

  return body !== null && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : null
}

export function setNoStore(response: VercelResponse): void {
  response.setHeader('Cache-Control', 'no-store, max-age=0')
  response.setHeader('X-Content-Type-Options', 'nosniff')
}

export function setSessionCookie(response: VercelResponse, username: string): void {
  const secrets = getAdminSecrets()
  const payload: SessionPayload = {
    username,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = signSession(encodedPayload, secrets.sessionSecret)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodedPayload}.${signature}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure}`,
  )
}

export function clearSessionCookie(response: VercelResponse): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
  )
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const secrets = getAdminSecrets()
  return (
    safeCompare(username, secrets.username, secrets.sessionSecret) &&
    safeCompare(password, secrets.password, secrets.sessionSecret)
  )
}

export function isLoginRateLimited(request: VercelRequest): boolean {
  const forwardedFor = request.headers['x-forwarded-for']
  const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const current = loginWindows.get(ip)

  if (!current || current.expiresAt <= now) {
    loginWindows.set(ip, { attempts: 0, expiresAt: now + LOGIN_WINDOW_MS })
    return false
  }

  return current.attempts >= MAX_LOGIN_ATTEMPTS
}

export function recordFailedLogin(request: VercelRequest): void {
  const forwardedFor = request.headers['x-forwarded-for']
  const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const current = loginWindows.get(ip)

  if (!current || current.expiresAt <= now) {
    loginWindows.set(ip, { attempts: 1, expiresAt: now + LOGIN_WINDOW_MS })
    return
  }

  current.attempts += 1
}
