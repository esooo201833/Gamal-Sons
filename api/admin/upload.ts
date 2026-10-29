import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  AdminConfigurationError,
  getAuthenticatedAdmin,
  getRequestJson,
  isSameOrigin,
  setNoStore,
} from '../../server/admin.js'
import {
  BlobStorageConfigurationError,
  saveProductImage,
} from '../../server/site-content.js'

const MAX_IMAGE_SIZE = 3 * 1024 * 1024

type ImageFormat = {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp'
  extension: 'jpg' | 'png' | 'webp'
  signature: (bytes: Buffer) => boolean
}

const imageFormats: Record<string, ImageFormat> = {
  'image/jpeg': {
    contentType: 'image/jpeg',
    extension: 'jpg',
    signature: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  'image/png': {
    contentType: 'image/png',
    extension: 'png',
    signature: (bytes) => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    contentType: 'image/webp',
    extension: 'webp',
    signature: (bytes) => bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
  },
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  setNoStore(response)
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
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

    const body = getRequestJson(request)
    if (typeof body?.image !== 'string') {
      response.status(400).json({ message: 'اختر صورة بصيغة JPG أو PNG أو WebP.' })
      return
    }

    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(body.image)
    if (!match) {
      response.status(400).json({ message: 'صيغة الصورة غير مدعومة.' })
      return
    }

    const format = imageFormats[match[1]]
    const bytes = Buffer.from(match[2], 'base64')
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_SIZE || !format.signature(bytes)) {
      response.status(400).json({ message: 'الصورة غير صالحة أو أكبر من 3 ميجابايت.' })
      return
    }

    response.status(201).json({
      image: await saveProductImage(bytes, format.contentType, format.extension),
    })
  } catch (error) {
    if (error instanceof AdminConfigurationError) {
      response.status(503).json({ message: error.message })
      return
    }
    if (error instanceof BlobStorageConfigurationError) {
      response.status(503).json({ message: error.message })
      return
    }

    console.error('Unable to upload product image:', error)
    response.status(500).json({ message: 'تعذر رفع الصورة إلى Vercel Blob.' })
  }
}
