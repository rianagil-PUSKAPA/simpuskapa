const APP_ORIGIN = 'https://sim.puskapa.org'
const API_ORIGIN = 'https://api.sim.puskapa.org'

function parseUrl(value) {
  try {
    const url = new URL(value)
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

function isAppUrl(value) {
  const url = parseUrl(value)
  return Boolean(url && url.origin === APP_ORIGIN)
}

function isAppBlob(value) {
  const url = parseUrl(value)
  return Boolean(url && url.protocol === 'blob:' && url.origin === APP_ORIGIN)
}

function isGoogleSignIn(value) {
  const url = parseUrl(value)
  return Boolean(
    url &&
      ((url.origin === API_ORIGIN && url.pathname === '/v1/auth/oauth/google') ||
        (url.origin === APP_ORIGIN && url.pathname === '/v1/auth/oauth/google') ||
        url.origin === 'https://accounts.google.com'),
  )
}

function isExternalUrl(value) {
  const url = parseUrl(value)
  return Boolean(url && (url.protocol === 'https:' || url.protocol === 'mailto:'))
}

function isDownloadUrl(value) {
  const url = parseUrl(value)
  return Boolean(url && (url.origin === APP_ORIGIN || url.origin === API_ORIGIN || isAppBlob(value)))
}

function safeFilename(value) {
  const name = String(value || 'download')
    .split(/[\\/]/)
    .pop()
    .replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g, '_')
    .replace(/[. ]+$/g, '')
    .slice(0, 180)
  if (!name || name === '.' || name === '..') return 'download'
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name) ? `_${name}` : name
}

function browserUrl(value) {
  const url = parseUrl(value)
  if (!url || !isAppUrl(value) || /\/(welcome|refresh|desktop\/connect)(?:\/|$)/.test(url.pathname)) {
    return APP_ORIGIN
  }
  // Never copy a login credential from the web client's URL to the system browser.
  if ([...url.searchParams.keys()].some((key) => /token|password|secret|code/i.test(key))) return APP_ORIGIN
  url.hash = ''
  return url.href
}

module.exports = {
  APP_ORIGIN,
  API_ORIGIN,
  isAppUrl,
  isAppBlob,
  isGoogleSignIn,
  isExternalUrl,
  isDownloadUrl,
  safeFilename,
  browserUrl,
}
