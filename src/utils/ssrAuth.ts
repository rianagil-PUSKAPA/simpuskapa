import { decodeJwt } from 'jose'

type SetCookieHeader = string | number | string[] | undefined

// Safely extract the auth_token value from the `set-cookie` header that the
// middleware writes (see https://github.com/vercel/next.js/issues/36049).
// The raw chained split() throws a TypeError if the header is missing or has an
// unexpected shape; this returns undefined instead.
export function parseAuthTokenFromSetCookie(setCookie: SetCookieHeader): string | undefined {
  if (!setCookie) return undefined
  const first = Array.isArray(setCookie) ? setCookie[0] : String(setCookie)
  if (!first) return undefined
  const afterName = first.split('auth_token=')[1]
  if (!afterName) return undefined
  return afterName.split('; Path=/')[0] || undefined
}

// Resolve the effective auth_token for a getServerSideProps request: prefer the
// freshly-refreshed token from the middleware's set-cookie header, falling back
// to the request cookie.
export function resolveAuthToken(setCookie: SetCookieHeader, cookieAuthToken: string | undefined): string | undefined {
  return parseAuthTokenFromSetCookie(setCookie) || cookieAuthToken
}

// Decode a JWT without throwing. Returns null for missing/malformed tokens so
// callers can redirect to /refresh instead of crashing the page with a 500.
export function safeDecodeJwt<T = Record<string, unknown>>(token: string | undefined): T | null {
  if (!token) return null
  try {
    return decodeJwt(token) as unknown as T
  } catch {
    return null
  }
}
