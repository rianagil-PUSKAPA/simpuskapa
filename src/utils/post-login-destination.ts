import { safeDashboardTarget } from '@/shared/app-links.cjs'

const KEY = 'sim-puskapa:post-login-destination'
const TTL = 20 * 60 * 1000

export function rememberLoginDestination(value: unknown): string | null {
  const target = safeDashboardTarget(value)
  if (target && typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ target, expires: Date.now() + TTL }))
    } catch {}
  }
  return target
}

export function loginDestination(value?: unknown, consume = false): string {
  let target = safeDashboardTarget(value)
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null')
      if (!target && saved?.expires > Date.now()) target = safeDashboardTarget(saved.target)
      if (consume || (saved && saved.expires <= Date.now())) sessionStorage.removeItem(KEY)
    } catch {}
  }
  return target || '/dashboard'
}
