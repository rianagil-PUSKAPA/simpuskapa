const test = require('node:test')
const assert = require('node:assert/strict')
const { generateKeyPairSync } = require('node:crypto')
const {
  createKeys,
  validateHandshake,
  sealSession,
  openSession,
  callbackUrl,
  isTrustedRequest,
} = require('../handoff.cjs')
const { createBrowserSignIn } = require('../browser-auth.cjs')

const tokens = { authToken: 'eyJ.auth.signature', refreshToken: 'eyJ.refresh.signature' }
let keys
test.before(async () => {
  keys = await createKeys()
})
const handshake = () => ({ port: 49152, state: keys.state, publicKey: keys.publicKey })

test('session transfer is encrypted, bound to the desktop key, and expires after one minute', () => {
  const now = 1_800_000_000_000
  const payload = sealSession(handshake(), tokens, now)
  assert.deepEqual(openSession(payload, keys.privateKey, keys.state, now + 1000), tokens)
  assert.equal(Buffer.from(payload, 'base64url').toString().includes(tokens.refreshToken), false)
  assert.throws(() => openSession(payload, keys.privateKey, 'x'.repeat(43), now))
  assert.throws(() => openSession(payload, keys.privateKey, keys.state, now + 60_000))
  assert.throws(() => openSession(payload, keys.privateKey, keys.state, now - 10_000))
  const wrongKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
  assert.throws(() => openSession(payload, wrongKey, keys.state, now))
  const envelope = JSON.parse(Buffer.from(payload, 'base64url'))
  const encrypted = Buffer.from(envelope.c, 'base64url')
  encrypted[0] ^= 1
  envelope.c = encrypted.toString('base64url')
  const tampered = Buffer.from(JSON.stringify(envelope)).toString('base64url')
  assert.throws(() => openSession(tampered, keys.privateKey, keys.state, now))
})

test('callback destinations cannot be changed into remote or privileged addresses', () => {
  for (const port of ['80', 0, -1, 65536, '1234@evil.test', ['49152'], 'http://evil.test']) {
    assert.throws(() => validateHandshake({ ...handshake(), port }))
  }
  assert.throws(() => validateHandshake({ ...handshake(), state: 'bad' }))
  assert.throws(() => validateHandshake({ ...handshake(), publicKey: 'not-a-key' }))
  const url = new URL(callbackUrl(handshake(), 'encrypted'))
  assert.equal(url.origin, 'http://127.0.0.1:49152')
  assert.equal(url.pathname, '/callback')
  assert.equal(url.searchParams.get('state'), keys.state)
})

test('web session export requires an explicit same-origin JSON request', () => {
  const headers = {
    origin: 'https://sim.puskapa.org',
    'content-type': 'application/json',
    'sec-fetch-site': 'same-origin',
  }
  assert.equal(isTrustedRequest(headers), true)
  assert.equal(isTrustedRequest({ ...headers, origin: 'https://evil.test' }), false)
  assert.equal(isTrustedRequest({ ...headers, origin: undefined }), false)
  assert.equal(isTrustedRequest({ ...headers, 'sec-fetch-site': 'cross-site' }), false)
  assert.equal(isTrustedRequest({ ...headers, 'content-type': 'text/plain' }), false)
})

test('the real loopback receiver accepts one valid transfer and rejects a wrong state', async () => {
  let received
  const attempt = await createBrowserSignIn({
    onSession: (session) => {
      received = session
    },
  })
  try {
    const browser = new URL(attempt.url)
    const input = Object.fromEntries(browser.searchParams)
    assert.equal(browser.origin, 'https://sim.puskapa.org')
    const payload = sealSession(input, tokens)
    const url = new URL(callbackUrl(input, payload))
    url.searchParams.set('state', 'x'.repeat(43))
    const rejected = await fetch(url)
    assert.equal(rejected.status, 400)
    const accepted = await fetch(callbackUrl(input, payload))
    assert.equal(accepted.status, 200)
    assert.equal(accepted.headers.get('cache-control'), 'no-store')
    assert.deepEqual(received, tokens)
    assert.match(await accepted.text(), /Connected to SIM PUSKAPA Desktop/)
    await assert.rejects(fetch(callbackUrl(input, payload)))
  } finally {
    attempt.cancel()
  }
})

test('a cancelled browser sign-in closes its local listener', async () => {
  const attempt = await createBrowserSignIn({ onSession: () => assert.fail('Cancelled attempt must not sign in') })
  const input = Object.fromEntries(new URL(attempt.url).searchParams)
  attempt.cancel()
  await assert.rejects(fetch(callbackUrl(input, sealSession(input, tokens))))
})
