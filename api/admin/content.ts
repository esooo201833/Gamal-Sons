import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  AdminConfigurationError,
  getAuthenticatedAdmin,
  isSameOrigin,
  setNoStore,
} from '../../server/admin.js'
import {
  BlobStorageConfigurationError,
  saveSiteContent,
  SiteContentValidationError,
} from '../../server/site-content.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  setNoStore(response)
  if (request.method !== 'PUT') {
    response.setHeader('Allow', 'PUT')
    response.status(405).json({ message: 'الطريقة غير مدعومة.' })
    return
  }

  try {
    if (!getAuthenticatedAdmin(request)) {
      response.status(401).json({ message: 'سجّل الدخول إلى لوحة الإدارة أولًا.' })
      return
    }
    if (!isSameOrigin(request)) {
      response.status(403).json({ message: 'تعذر التحقق من مصدر الطلب.' })
      return
    }

    response.status(200).json(await saveSiteContent(request.body))
  } catch (error) {
    if (error instanceof AdminConfigurationError) {
      response.status(503).json({ message: error.message })
      return
    }
    if (error instanceof BlobStorageConfigurationError) {
      response.status(503).json({ message: error.message })
      return
    }
    if (error instanceof SiteContentValidationError) {
      response.status(400).json({ message: error.message })
      return
    }

    console.error('Unable to save site content:', error)
    response.status(500).json({ message: 'تعذر حفظ تعديلات الموقع حاليًا.' })
  }
}
