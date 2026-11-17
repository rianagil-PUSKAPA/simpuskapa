const REPOSITORY = 'rianagil-PUSKAPA/simpuskapa'
const API_URL = `https://api.github.com/repos/${REPOSITORY}/releases?per_page=20`
const PUBLIC_URL = `https://github.com/${REPOSITORY}`
const MARKER = 'sim-puskapa-desktop-release'
const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|preview|rc)\.(\d+))?$/
const TTL = 5 * 60 * 1000

function compareVersions(a, b) {
  const parts = (version) => {
    const match = VERSION.exec(version)
    const rank = { alpha: 0, beta: 1, preview: 2, rc: 3 }
    return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] ? rank[match[4]] : 4, Number(match[5] || 0)]
  }
  const left = parts(a)
  const right = parts(b)
  for (let index = 0; index < left.length; index++) if (left[index] !== right[index]) return left[index] - right[index]
  return 0
}

function releaseMetadata(version, channel, signed) {
  if (!VERSION.test(version) || typeof signed !== 'boolean') throw new Error('Invalid desktop release metadata')
  return { schema: 1, version, channel, signing: { windows: signed, macOS: signed } }
}

function metadataComment(metadata) {
  return `<!-- ${MARKER}: ${JSON.stringify(metadata)} -->`
}

function parseRelease(value) {
  if (
    !value ||
    value.draft ||
    !value.published_at ||
    !Array.isArray(value.assets) ||
    typeof value.tag_name !== 'string'
  )
    return null
  const tag = value.tag_name
  if (!/^v\d+\.\d+\.\d+(?:-(alpha|beta|preview|rc)\.\d+)?$/.test(tag)) return null
  const assets = value.assets.filter((asset) => asset.state === 'uploaded' && asset.size > 0)
  const exe = assets.find((asset) => /^SIM-PUSKAPA-(.+)-Windows-x64-Setup\.exe$/.test(asset.name))
  if (!exe) return null
  const version = /^SIM-PUSKAPA-(.+)-Windows-x64-Setup\.exe$/.exec(exe.name)[1]
  if (!VERSION.test(version) || version.length > 80) return null
  const base = `${PUBLIC_URL}/releases/download/${tag}/SIM-PUSKAPA-${version}`
  const assetUrl = (suffix) => {
    const url = `${base}-${suffix}`
    return assets.some((asset) => asset.browser_download_url === url) ? url : null
  }
  const windows = { exe: assetUrl('Windows-x64-Setup.exe'), msi: assetUrl('Windows-x64-Setup.msi') }
  const macOS = { x64: assetUrl('macOS-x64.dmg'), arm64: assetUrl('macOS-arm64.dmg') }
  if (![windows.exe, windows.msi, macOS.x64, macOS.arm64].every(Boolean)) return null
  let signing = { windows: null, macOS: null }
  const body = typeof value.body === 'string' ? value.body.slice(0, 100000) : ''
  const match = new RegExp(`<!-- ${MARKER}: ([^\\n]*?) -->`).exec(body)
  if (match) {
    try {
      const data = JSON.parse(match[1])
      if (
        data.schema === 1 &&
        data.version === version &&
        tag === `v${version}` &&
        typeof data.signing?.windows === 'boolean' &&
        typeof data.signing?.macOS === 'boolean'
      ) {
        signing = { windows: data.signing.windows, macOS: data.signing.macOS }
      }
    } catch {
      /* Older/manual releases can still download, with unknown signing status. */
    }
  }
  const channel = value.prerelease
    ? version.includes('-beta.')
      ? 'Beta'
      : version.includes('-alpha.')
      ? 'Alpha'
      : 'Preview'
    : 'Stable'
  return { version, channel, releasePage: `${PUBLIC_URL}/releases/tag/${tag}`, windows, macOS, signing }
}

function latestRelease(values) {
  if (!Array.isArray(values)) throw new Error('Invalid release list')
  return (
    values
      .map(parseRelease)
      .filter(Boolean)
      .sort((a, b) => compareVersions(b.version, a.version))[0] || null
  )
}

function createReleaseLoader({ fallback, fetchFn = (...args) => fetch(...args), now = Date.now, timeoutMs = 6000 }) {
  let cached
  let freshUntil = 0
  let retryAfter = 0
  let inFlight
  const lastAvailable = () =>
    cached ? { ...cached, source: 'cached' } : { release: fallback, source: 'fallback', checkedAt: null }
  async function read() {
    if (cached && now() < freshUntil) return cached
    if (now() < retryAfter) return lastAvailable()
    if (inFlight) return inFlight
    inFlight = (async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const response = await fetchFn(API_URL, {
          headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'SIM-PUSKAPA-release-info' },
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Release service unavailable')
        const text = await response.text()
        if (text.length > 1000000) throw new Error('Release response too large')
        const release = latestRelease(JSON.parse(text))
        if (!release) throw new Error('No complete public installer release')
        cached = { release, source: 'github', checkedAt: new Date(now()).toISOString() }
        freshUntil = now() + TTL
        retryAfter = 0
        return cached
      } catch {
        retryAfter = now() + 30000
        return lastAvailable()
      } finally {
        clearTimeout(timeout)
        inFlight = null
      }
    })()
    return inFlight
  }
  return read
}

module.exports = {
  API_URL,
  MARKER,
  TTL,
  compareVersions,
  releaseMetadata,
  metadataComment,
  parseRelease,
  latestRelease,
  createReleaseLoader,
}
