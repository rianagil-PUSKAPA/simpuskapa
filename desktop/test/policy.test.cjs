const test = require('node:test')
const assert = require('node:assert/strict')
const policy = require('../policy.cjs')

test('only the production website remains inside the desktop window', () => {
  assert.equal(policy.isAppUrl('https://sim.puskapa.org/dashboard?tab=requests'), true)
  for (const url of [
    'http://sim.puskapa.org/dashboard',
    'https://sim.puskapa.org.evil.test/',
    'https://sim.puskapa.org@evil.test/',
    'https://user@sim.puskapa.org/',
    'https://staging.sim.puskapa.org/',
    'https://api.sim.puskapa.org/',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'data:text/html,hello',
    'invalid',
  ])
    assert.equal(policy.isAppUrl(url), false, url)
  assert.equal(policy.isAppBlob('blob:https://sim.puskapa.org/a-document'), true)
  assert.equal(policy.isAppBlob('blob:https://evil.test/a-document'), false)
})

test('Google authentication is routed through the browser and OS protocols are restricted', () => {
  assert.equal(policy.isGoogleSignIn('https://api.sim.puskapa.org/v1/auth/oauth/google'), true)
  assert.equal(policy.isGoogleSignIn('https://accounts.google.com/o/oauth2/auth?client_id=example'), true)
  assert.equal(policy.isGoogleSignIn('https://accounts.google.com.evil.test/'), false)
  assert.equal(policy.isExternalUrl('https://drive.google.com/file/example'), true)
  assert.equal(policy.isExternalUrl('mailto:help@puskapa.org'), true)
  for (const url of [
    'file:///tmp/a',
    'ms-settings:privacy',
    'javascript:alert(1)',
    'https://user:password@example.org',
  ]) {
    assert.equal(policy.isExternalUrl(url), false)
  }
})

test('download filenames stay in the chosen download directory on both operating systems', () => {
  assert.equal(policy.safeFilename('../../PR-001.pdf'), 'PR-001.pdf')
  assert.equal(policy.safeFilename('C:\\private\\RF-001.xlsx'), 'RF-001.xlsx')
  assert.equal(policy.safeFilename('..'), 'download')
  assert.equal(policy.safeFilename('CON.pdf'), '_CON.pdf')
  assert.equal(policy.safeFilename('name?\u0000.pdf'), 'name__.pdf')
  assert.equal(policy.isDownloadUrl('blob:https://sim.puskapa.org/a'), true)
  assert.equal(policy.isDownloadUrl('https://api.sim.puskapa.org/v1/aar/1/pdf'), true)
  assert.equal(policy.isDownloadUrl('file:///tmp/private'), false)
})

test('opening the current page in the browser never exports credential URLs', () => {
  assert.equal(
    policy.browserUrl('https://sim.puskapa.org/dashboard/project/123'),
    'https://sim.puskapa.org/dashboard/project/123',
  )
  for (const path of [
    '/welcome?auth_token=secret',
    '/refresh',
    '/desktop/connect?publicKey=abc',
    '/dashboard?refresh_token=secret',
  ]) {
    assert.equal(policy.browserUrl(`https://sim.puskapa.org${path}`), policy.APP_ORIGIN)
  }
})
