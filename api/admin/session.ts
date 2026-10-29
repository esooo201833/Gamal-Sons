import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  AdminConfigurationError,
  clearSessionCookie,
  getAuthenticatedAdmin,
  getRequestJson,
  isLoginRateLimited,
  isSameOrigin,
  recordFailedLogin,
  setNoStore,
  setSessionCookie,
  verifyAdminCredentials,
} from '../../server/admin.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  setNoStore(response)

  try {
    if (request.method === 'GET') {
      response.status(200).json({ authenticated: Boolean(getAuthenticatedAdmin(request)) })
      return
    }

    if (!['POST', 'DELETE'].includes(request.method ?? '')) {
      response.setHeader('Allow', 'GET, POST, DELETE')
      response.status(405).json({ message: 'الطريقة غير مدعومة.' })
      return
    }

    if (!isSameOrigin(request)) {
      response.status(403).json({ message: 'تعذر التحقق من مصدر الطلب.' })
      return
    }

    if (request.method === 'DELETE') {
      clearSessionCookie(response)
      response.status(200).json({ authenticated: false })
      return
    }

    if (isLoginRateLimited(request)) {
      response.setHeader('Retry-After', '900')
      response.status(429).json({ message: 'محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة.' })
      return
    }

    const body = getRequestJson(request)
    if (
      !body ||
      typeof body.username !== 'string' ||
      typeof body.password !== 'string' ||
      body.username.length > 120 ||
      body.password.length > 200
    ) {
      recordFailedLogin(request)
      response.status(401).json({ message: 'اسم الدخول أو كلمة المرور غير صحيحة.' })
      return
    }

    if (!verifyAdminCredentials(body.username, body.password)) {
      recordFailedLogin(request)
      response.status(401).json({ message: 'اسم الدخول أو كلمة المرور غير صحيحة.' })
      return
    }

    setSessionCookie(response, body.username)
    response.status(200).json({ authenticated: true })
  } catch (error) {
    if (error instanceof AdminConfigurationError) {
      response.status(503).json({ message: error.message })
      return
    }

    console.error('Admin session request failed:', error)
    response.status(500).json({ message: 'تعذر إتمام تسجيل الدخول حاليًا.' })
  }
}
