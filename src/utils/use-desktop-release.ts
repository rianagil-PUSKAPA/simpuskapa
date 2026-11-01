import { DESKTOP_RELEASE, DesktopRelease } from '@/config/desktop-release'
import { useEffect, useState } from 'react'

export function useDesktopRelease(active: boolean) {
  const [release, setRelease] = useState<DesktopRelease>(DESKTOP_RELEASE)
  const [status, setStatus] = useState<'loading' | 'github' | 'cached' | 'fallback'>('loading')
  useEffect(() => {
    if (!active) return
    setStatus('loading')
    let mounted = true
    let busy = false
    let lastAttempt = 0
    async function load() {
      if (busy || Date.now() - lastAttempt < 30000) return
      busy = true
      lastAttempt = Date.now()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const response = await fetch('/api/desktop/releases', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('Release service unavailable')
        const result = await response.json()
        if (
          !result.release?.version ||
          !result.release?.releasePage ||
          !result.release?.windows?.exe ||
          !result.release?.windows?.msi ||
          !result.release?.macOS?.arm64 ||
          !result.release?.macOS?.x64 ||
          !result.release?.signing
        )
          throw new Error('Invalid release')
        if (mounted) {
          setRelease(result.release)
          setStatus(['github', 'cached'].includes(result.source) ? result.source : 'fallback')
        }
      } catch {
        if (mounted) setStatus('fallback')
      } finally {
        clearTimeout(timeout)
        busy = false
      }
    }
    void load()
    const interval = setInterval(() => {
      void load()
    }, 5 * 60 * 1000)
    const refresh = () => {
      void load()
    }
    window.addEventListener('focus', refresh)
    return () => {
      mounted = false
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [active])
  return { release, status }
}
