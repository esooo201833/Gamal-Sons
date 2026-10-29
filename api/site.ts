import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readSiteContent } from '../server/site-content.js'
import { setNoStore } from '../server/admin.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  setNoStore(response)
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ message: 'الطريقة غير مدعومة.' })
    return
  }

  try {
    response.status(200).json(await readSiteContent())
  } catch (error) {
    console.error('Unable to read site content:', error)
    response.status(500).json({ message: 'تعذر تحميل محتوى الموقع حاليًا.' })
  }
}
