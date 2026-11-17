// Used only by the Electron main process and the Next.js server, never a renderer.
const {
  constants,
  createCipheriv,
  createDecipheriv,
  createPrivateKey,
  createPublicKey,
  generateKeyPair,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
  timingSafeEqual,
} = require('node:crypto')
const { promisify } = require('node:util')

const ORIGIN = 'https://sim.puskapa.org'
const SESSION_TTL = 60_000
const b64 = (value) => Buffer.from(value).toString('base64url')
const unb64 = (value) => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding')
  return Buffer.from(value, 'base64url')
}

function validateHandshake(input) {
  if (!input || typeof input !== 'object') throw new Error('Invalid desktop connection')
  const { port, state, publicKey } = input
  if (
    !['number', 'string'].includes(typeof port) ||
    !/^\d{4,5}$/.test(String(port)) ||
    Number(port) < 1024 ||
    Number(port) > 65535
  ) {
    throw new Error('Invalid callback port')
  }
  if (typeof state !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(state)) throw new Error('Invalid state')
  if (typeof publicKey !== 'string' || publicKey.length > 1100) throw new Error('Invalid public key')
  const key = createPublicKey({ key: unb64(publicKey), format: 'der', type: 'spki' })
  const bits = key.asymmetricKeyDetails?.modulusLength
  if (key.asymmetricKeyType !== 'rsa' || !bits || bits < 2048 || bits > 4096) {
    throw new Error('Invalid public key')
  }
  return { port: Number(port), state, publicKey }
}

async function createKeys() {
  const pair = await promisify(generateKeyPair)('rsa', { modulusLength: 2048 })
  return {
    publicKey: b64(pair.publicKey.export({ format: 'der', type: 'spki' })),
    privateKey: pair.privateKey,
    state: b64(randomBytes(32)),
  }
}

function validTokens(tokens) {
  const jwt = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
  return ['authToken', 'refreshToken'].every(
    (key) => typeof tokens?.[key] === 'string' && tokens[key].length <= 12_000 && jwt.test(tokens[key]),
  )
}

function sealSession(input, tokens, now = Date.now()) {
  const handshake = validateHandshake(input)
  if (!validTokens(tokens)) throw new Error('Invalid session')
  const key = randomBytes(32)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const plaintext = JSON.stringify({ ...tokens, state: handshake.state, expiresAt: now + SESSION_TTL })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const wrappedKey = publicEncrypt(
    {
      key: createPublicKey({ key: unb64(handshake.publicKey), format: 'der', type: 'spki' }),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    key,
  )
  return b64(JSON.stringify({ v: 1, k: b64(wrappedKey), i: b64(iv), t: b64(cipher.getAuthTag()), c: b64(encrypted) }))
}

function openSession(payload, privateKey, expectedState, now = Date.now()) {
  if (typeof payload !== 'string' || payload.length > 50_000) throw new Error('Invalid session')
  const envelope = JSON.parse(unb64(payload).toString('utf8'))
  if (envelope.v !== 1) throw new Error('Invalid session version')
  const iv = unb64(envelope.i)
  const tag = unb64(envelope.t)
  const wrappedKey = unb64(envelope.k)
  if (iv.length !== 12 || tag.length !== 16 || wrappedKey.length > 512) throw new Error('Invalid session')
  const key = privateDecrypt(
    {
      key: typeof privateKey === 'string' ? createPrivateKey(privateKey) : privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    wrappedKey,
  )
  const cipher = createDecipheriv('aes-256-gcm', key, iv)
  cipher.setAuthTag(tag)
  const result = JSON.parse(Buffer.concat([cipher.update(unb64(envelope.c)), cipher.final()]).toString('utf8'))
  const state = Buffer.from(String(result.state))
  const expected = Buffer.from(String(expectedState))
  if (state.length !== expected.length || !timingSafeEqual(state, expected)) throw new Error('Invalid state')
  if (
    !validTokens(result) ||
    !Number.isFinite(result.expiresAt) ||
    result.expiresAt <= now ||
    result.expiresAt > now + SESSION_TTL + 5000
  ) {
    throw new Error('Expired or invalid session')
  }
  return { authToken: result.authToken, refreshToken: result.refreshToken }
}

function isTrustedRequest(headers) {
  const type = headers['content-type'] || ''
  return (
    headers.origin === ORIGIN &&
    typeof type === 'string' &&
    type.split(';')[0].trim().toLowerCase() === 'application/json' &&
    (!headers['sec-fetch-site'] || headers['sec-fetch-site'] === 'same-origin')
  )
}

function callbackUrl(input, payload) {
  const handshake = validateHandshake(input)
  const url = new URL(`http://127.0.0.1:${handshake.port}/callback`)
  url.searchParams.set('state', handshake.state)
  url.searchParams.set('payload', payload)
  return url.href
}

module.exports = { SESSION_TTL, validateHandshake, createKeys, sealSession, openSession, isTrustedRequest, callbackUrl }
