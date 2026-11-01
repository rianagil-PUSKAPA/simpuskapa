const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const policy = require('../../src/shared/desktop-releases.cjs')

function fixture(version = '0.3.0-beta.2', signed = false) {
  const tag = 'v' + version
  return {
    draft: false,
    prerelease: version.includes('-'),
    published_at: '2026-11-01T00:00:00Z',
    tag_name: tag,
    body: policy.metadataComment(policy.releaseMetadata(version, version.includes('-') ? 'beta' : 'latest', signed)),
    assets: ['Windows-x64-Setup.exe', 'Windows-x64-Setup.msi', 'macOS-arm64.dmg', 'macOS-x64.dmg'].map((suffix) => {
      const name = `SIM-PUSKAPA-${version}-${suffix}`
      return {
        name,
        state: 'uploaded',
        size: 100,
        browser_download_url: `https://github.com/rianagil-PUSKAPA/simpuskapa/releases/download/${tag}/${name}`,
      }
    }),
  }
}
const response = (releases) => ({ ok: true, text: async () => JSON.stringify(releases) })

test('only complete public releases with official installer URLs are offered', () => {
  const good = fixture()
  assert.equal(policy.parseRelease(good).version, '0.3.0-beta.2')
  assert.equal(policy.parseRelease({ ...good, draft: true }), null)
  assert.equal(policy.parseRelease({ ...good, published_at: null }), null)
  assert.equal(policy.parseRelease({ ...good, assets: good.assets.slice(1) }), null)
  const foreign = fixture()
  foreign.assets[2].browser_download_url = 'https://evil.test/installer.dmg'
  assert.equal(policy.parseRelease(foreign), null)
  const uploading = fixture()
  uploading.assets[1].state = 'uploading'
  assert.equal(policy.parseRelease(uploading), null)
})

test('latest version follows semver and ignores an incomplete or draft newer release', () => {
  const draft = { ...fixture('9.0.0'), draft: true }
  const incomplete = { ...fixture('9.1.0'), assets: [] }
  const releases = [fixture('0.3.0-beta.9'), draft, fixture('0.3.0-beta.10'), incomplete, fixture('0.2.0')]
  assert.equal(policy.latestRelease(releases).version, '0.3.0-beta.10')
  assert.equal(policy.latestRelease([...releases, fixture('0.3.0')]).version, '0.3.0')
})

test('publisher status comes from matching release metadata; legacy releases remain unknown', () => {
  assert.deepEqual(policy.parseRelease(fixture()).signing, { windows: false, macOS: false })
  assert.deepEqual(policy.parseRelease(fixture('0.3.0', true)).signing, { windows: true, macOS: true })
  const legacy = fixture()
  delete legacy.body
  assert.deepEqual(policy.parseRelease(legacy).signing, { windows: null, macOS: null })
  const wrong = fixture()
  wrong.body = policy.metadataComment(policy.releaseMetadata('0.4.0', 'latest', true))
  assert.deepEqual(policy.parseRelease(wrong).signing, { windows: null, macOS: null })
})

test('runtime release lookup is cached/coalesced and advances without rebuilding the website', async () => {
  let time = 1000
  let calls = 0
  let current = '0.3.0-beta.2'
  const read = policy.createReleaseLoader({
    fallback: {},
    now: () => time,
    fetchFn: async (url, options) => {
      calls++
      assert.equal(url, policy.API_URL)
      assert.equal(options.headers.Authorization, undefined)
      assert.equal(options.headers.Cookie, undefined)
      await new Promise((resolve) => setImmediate(resolve))
      return response([fixture(current)])
    },
  })
  const values = await Promise.all([read(), read(), read()])
  assert.equal(calls, 1)
  assert.ok(values.every((value) => value.release.version === current && value.source === 'github'))
  await read()
  assert.equal(calls, 1)
  time += policy.TTL + 1
  current = '0.3.0-beta.3'
  assert.equal((await read()).release.version, current)
  assert.equal(calls, 2)
})

test('offline lookup clearly labels cached/fallback data and retries after a short backoff', async () => {
  let time = 1000
  let online = true
  let calls = 0
  const read = policy.createReleaseLoader({
    fallback: { version: '0.1.0' },
    now: () => time,
    fetchFn: async () => {
      calls++
      if (!online) throw new Error('Offline')
      return response([fixture()])
    },
  })
  await read()
  time += policy.TTL + 1
  online = false
  assert.equal((await read()).source, 'cached')
  assert.equal((await read()).source, 'cached')
  assert.equal(calls, 2)
  time += 30001
  online = true
  assert.equal((await read()).source, 'github')
  const unavailable = policy.createReleaseLoader({
    fallback: { version: '0.3.0-beta.2' },
    fetchFn: async () => ({ ok: false }),
  })
  assert.equal((await unavailable()).source, 'fallback')
})

test('release API is public read-only data and never forwards account credentials', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../../src/pages/api/desktop/releases.ts'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  let reads = 0
  vm.runInNewContext(compiled, {
    exports,
    require: (name) =>
      name.includes('desktop-release') && !name.includes('releases.cjs')
        ? { DESKTOP_RELEASE: {} }
        : {
            createReleaseLoader: () => async () => {
              reads++
              return { release: policy.parseRelease(fixture()), source: 'github' }
            },
          },
  })
  for (const method of ['GET', 'POST']) {
    const result = {
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value
      },
      status(code) {
        this.code = code
        return this
      },
      json(body) {
        this.body = body
        return this
      },
    }
    await exports.default({ method, cookies: { auth_token: 'private' } }, result)
    assert.equal(result.code, method === 'GET' ? 200 : 405)
    assert.equal(result.headers['Cache-Control'], 'no-store, max-age=0')
    assert.ok(!JSON.stringify(result.body).includes('private'))
  }
  assert.equal(reads, 1)
})
