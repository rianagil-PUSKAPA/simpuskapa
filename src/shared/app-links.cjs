// Shared by the email transport, website, and packaged desktop client.
const APP_ORIGIN = 'https://sim.puskapa.org'
const PROTOCOL = 'simpuskapa'

function safeDashboardTarget(value) {
  if (typeof value !== 'string' || !value || value.length > 8192 || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null
  if (!value.startsWith('/') && !value.startsWith(`${APP_ORIGIN}/`)) return null
  if (value.startsWith('//')) return null
  try {
    const url = new URL(value, APP_ORIGIN)
    if (url.origin !== APP_ORIGIN || url.username || url.password) return null
    if (url.pathname !== '/dashboard' && !url.pathname.startsWith('/dashboard/')) return null
    // Do not forward ambiguous encoded path separators or credentials in a deep link.
    const decodedPath = decodeURIComponent(url.pathname)
    if (/[\\\u0000-\u001f\u007f]/.test(decodedPath) || /%2f|%5c|%2e/i.test(decodedPath)) return null
    for (const key of url.searchParams.keys()) {
      if (/^(auth_token|refresh_token|access_token|password|secret)$/i.test(key)) return null
    }
    return url.pathname + url.search + url.hash
  } catch {
    return null
  }
}

function notificationLaunchUrl(value) {
  const target = safeDashboardTarget(value)
  if (!target) return null
  const url = new URL('/open', APP_ORIGIN)
  url.searchParams.set('target', target)
  return url.href
}

function desktopProtocolUrl(value) {
  const target = safeDashboardTarget(value)
  if (!target) return null
  const url = new URL(`${PROTOCOL}://open`)
  url.searchParams.set('target', target)
  return url.href
}

function parseDesktopProtocolUrl(value) {
  if (typeof value !== 'string' || value.length > 25000 || /[\u0000-\u001f\u007f]/.test(value)) return null
  try {
    const url = new URL(value)
    if (
      url.protocol !== `${PROTOCOL}:` ||
      url.hostname !== 'open' ||
      url.username ||
      url.password ||
      url.port ||
      (url.pathname !== '' && url.pathname !== '/') ||
      url.hash ||
      [...url.searchParams.keys()].some((key) => key !== 'target') ||
      url.searchParams.getAll('target').length !== 1
    )
      return null
    return safeDashboardTarget(url.searchParams.get('target'))
  } catch {
    return null
  }
}

function rewriteNotificationLinks(html) {
  if (typeof html !== 'string') return html
  // Keep Outlook/MSO markup intact; change only quoted href attribute values.
  return html.replace(/(\bhref\s*=\s*)(["'])([^"']*)\2/gi, (attribute, prefix, quote, href) => {
    const decoded = href.replace(/&amp;|&#0*38;|&#x0*26;/gi, '&')
    const launch = notificationLaunchUrl(decoded)
    return launch ? `${prefix}${quote}${launch.replace(/&/g, '&amp;')}${quote}` : attribute
  })
}

function notificationMessage(message) {
  return typeof message.html === 'string' ? { ...message, html: rewriteNotificationLinks(message.html) } : message
}

module.exports = {
  APP_ORIGIN,
  PROTOCOL,
  safeDashboardTarget,
  notificationLaunchUrl,
  desktopProtocolUrl,
  parseDesktopProtocolUrl,
  rewriteNotificationLinks,
  notificationMessage,
}
