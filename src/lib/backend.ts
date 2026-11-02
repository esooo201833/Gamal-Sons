const adminSessionKey = 'awlad-gamal-admin-session'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const actions: Record<string, string> = {
  '/api/site': 'site',
  '/api/admin/session': 'session',
  '/api/admin/account': 'account',
  '/api/admin/content': 'content',
  '/api/admin/upload': 'upload',
}

export function setAdminSessionToken(token: string): void {
  sessionStorage.setItem(adminSessionKey, token)
}

export function clearAdminSessionToken(): void {
  sessionStorage.removeItem(adminSessionKey)
}

export function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return Promise.reject(new Error('إعداد اتصال Supabase غير مكتمل.'))
  }

  const action = actions[path]
  if (!action) return Promise.reject(new Error('مسار الخدمة غير معروف.'))

  let sessionToken: string | null
  try {
    sessionToken = sessionStorage.getItem(adminSessionKey)
  } catch {
    return Promise.reject(new Error('تعذر الوصول إلى جلسة الإدارة في هذا المتصفح.'))
  }
  const headers = new Headers(init.headers)
  headers.set('apikey', supabaseAnonKey)
  headers.set('Authorization', `Bearer ${sessionToken ?? supabaseAnonKey}`)

  return fetch(`${supabaseUrl}/functions/v1/admin-api?action=${action}`, {
    ...init,
    credentials: 'omit',
    headers,
  })
}
