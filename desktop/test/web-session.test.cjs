const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const crypto = require('../handoff.cjs')

let keys
test.before(async () => {
  keys = await crypto.createKeys()
})

function loadHandler(verify) {
  const source = fs.readFileSync(path.join(__dirname, '../../src/pages/api/desktop/session.ts'), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const exports = {}
  vm.runInNewContext(output.outputText, {
    exports,
    require: (name) => (name.includes('handoff') ? crypto : { JwtLib: { decodeJwtToken: verify } }),
  })
  return exports.default
}

function request(overrides = {}) {
  return {
    method: 'POST',
    headers: { origin: 'https://sim.puskapa.org', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
    body: { port: 49152, state: keys.state, publicKey: keys.publicKey },
    cookies: { auth_token: 'eyJ.auth.signature', refresh_token: 'eyJ.refresh.signature' },
    ...overrides,
  }
}

async function invoke(req, verify = async () => ({ is_active: true })) {
  const response = {
    code: 200,
    headers: {},
    body: null,
    setHeader(k, v) {
      this.headers[k] = v
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
  await loadHandler(verify)(req, response)
  return response
}

test('web endpoint does not export anonymous, inactive, or invalid sessions', async () => {
  assert.equal((await invoke(request({ cookies: {} }))).code, 401)
  assert.equal(
    (
      await invoke(request(), async () => {
        throw new Error('Invalid JWT')
      })
    ).code,
    401,
  )
  assert.equal((await invoke(request(), async () => ({ is_active: false }))).code, 403)
  assert.equal((await invoke(request({ headers: { origin: 'https://evil.test' } }))).code, 403)
  assert.equal((await invoke(request({ body: { ...request().body, port: 80 } }))).code, 400)
  assert.equal((await invoke(request({ method: 'DELETE' }))).code, 405)
})

test('public capability probe never includes cookies or account data', async () => {
  const response = await invoke(request({ method: 'GET' }), async () => assert.fail('Probe must not inspect a session'))
  assert.equal(response.code, 200)
  assert.equal(JSON.stringify(response.body), '{"version":1}')
  assert.equal(response.headers['Cache-Control'], 'no-store, max-age=0')
})

test('authorized session export returns only a local URL containing encrypted credentials', async () => {
  const req = request()
  let verified
  const response = await invoke(req, async (token) => {
    verified = token
    return { is_active: true }
  })
  assert.equal(response.code, 200)
  assert.equal(verified, req.cookies.auth_token)
  const url = new URL(response.body.callbackUrl)
  assert.equal(url.origin, 'http://127.0.0.1:49152')
  assert.equal(JSON.stringify(response.body).includes(req.cookies.auth_token), false)
  const result = crypto.openSession(url.searchParams.get('payload'), keys.privateKey, keys.state)
  assert.deepEqual(result, { authToken: req.cookies.auth_token, refreshToken: req.cookies.refresh_token })
})
