import type { NextApiRequest, NextApiResponse } from 'next'
import { DESKTOP_RELEASE } from '@/config/desktop-release'
import { createReleaseLoader } from '@/shared/desktop-releases.cjs'

const readRelease = createReleaseLoader({ fallback: DESKTOP_RELEASE })

export default async function releases(request: NextApiRequest, response: NextApiResponse) {
  response.setHeader('Cache-Control', 'no-store, max-age=0')
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method not allowed' })
  }
  return response.status(200).json(await readRelease())
}
