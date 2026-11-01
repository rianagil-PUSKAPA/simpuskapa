import { JwtLib } from '@/shared/jwt.lib'
import type { NextApiRequest, NextApiResponse } from 'next'
import { callbackUrl, isTrustedRequest, sealSession, validateHandshake } from '../../../../desktop/handoff.cjs'

export const config = { api: { bodyParser: { sizeLimit: '8kb' } } }

export default async function desktopSession(request: NextApiRequest, response: NextApiResponse) {
  response.setHeader('Cache-Control', 'no-store, max-age=0')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')

  // Public capability probe contains no account or session information.
  if (request.method === 'GET') return response.status(200).json({ version: 1 })
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }
  if (!isTrustedRequest(request.headers)) return response.status(403).json({ error: 'Invalid request origin' })

  let handshake
  try {
    handshake = validateHandshake(request.body)
  } catch {
    return response.status(400).json({ error: 'Invalid desktop connection. Start again from the desktop application.' })
  }
  const authToken = request.cookies.auth_token
  const refreshToken = request.cookies.refresh_token
  if (!authToken || !refreshToken) return response.status(401).json({ error: 'Sign in to SIM PUSKAPA first.' })
  try {
    const claims = await JwtLib.decodeJwtToken(authToken)
    if (!claims.is_active) return response.status(403).json({ error: 'This account is inactive.' })
  } catch {
    return response.status(401).json({ error: 'Your session has expired. Sign in to SIM PUSKAPA again.' })
  }
  try {
    const encrypted = sealSession(handshake, { authToken, refreshToken })
    return response.status(200).json({ callbackUrl: callbackUrl(handshake, encrypted) })
  } catch {
    return response.status(400).json({ error: 'Unable to connect. Start again from the desktop application.' })
  }
}
