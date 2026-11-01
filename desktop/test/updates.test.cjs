const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { createDesktopUpdater, updateMode } = require('../updates.cjs')
const { releaseInfo } = require('../scripts/release-info.cjs')

test('only NSIS and properly signed Mac builds automatically install updates', () => {
  for (const [platform, installerType, macSigned, expected] of [
    ['win32', 'nsis', false, 'automatic'],
    ['win32', null, false, 'manual-windows'],
    ['win32', 'msi', false, 'manual-windows'],
    ['darwin', null, false, 'manual-mac'],
    ['darwin', null, true, 'automatic'],
    ['linux', 'nsis', true, 'unsupported'],
  ]) {
    assert.equal(updateMode({ packaged: true, platform, installerType, macSigned }), expected)
    assert.equal(updateMode({ packaged: false, platform, installerType, macSigned }), 'development')
  }
})

function fixture({ platform = 'win32', installation = 'nsis', macSigned = false, packaged = true, response = 1 } = {}) {
  const updater = new EventEmitter()
  const messages = []
  const installs = []
  const opened = []
  const timeouts = new Map()
  const intervals = new Map()
  let checks = 0
  let nextResponse = response
  updater.checkForUpdates = async () => {
    checks++
    return {}
  }
  updater.quitAndInstall = (...args) => installs.push(args)
  const controller = createDesktopUpdater({
    app: { isPackaged: packaged, getVersion: () => '0.3.0-beta.1' },
    dialog: {
      showMessageBox: async (options) => {
        messages.push(options)
        return { response: nextResponse }
      },
    },
    shell: { openExternal: async (url) => opened.push(url) },
    platform,
    installation,
    settings: { channel: 'beta', macSigned },
    getUpdater: () => updater,
    timers: {
      setTimeout: (fn, ms) => {
        timeouts.set(1, { fn, ms })
        return 1
      },
      clearTimeout: (id) => timeouts.delete(id),
      setInterval: (fn, ms) => {
        intervals.set(2, { fn, ms })
        return 2
      },
      clearInterval: (id) => intervals.delete(id),
    },
  })
  return {
    updater,
    controller,
    messages,
    installs,
    opened,
    timeouts,
    intervals,
    checks: () => checks,
    respond: (value) => {
      nextResponse = value
    },
  }
}
const next = { version: '0.3.0-beta.2' }
const flush = () => new Promise((resolve) => setImmediate(resolve))

test('automatic downloads never install on quit; Later retains a ready update', async () => {
  const f = fixture()
  await f.controller.check(false)
  assert.equal(f.updater.autoDownload, true)
  assert.equal(f.updater.autoInstallOnAppQuit, false)
  assert.equal(f.updater.allowDowngrade, false)
  assert.equal(f.updater.disableWebInstaller, true)
  assert.equal(f.updater.channel, 'beta')
  f.updater.emit('update-available', next)
  assert.equal(f.controller.getStatus().state, 'downloading')
  f.updater.emit('update-downloaded', next)
  await flush()
  assert.equal(f.controller.getStatus().state, 'ready')
  assert.deepEqual(f.messages[0].buttons, ['Restart to Update', 'Later'])
  assert.equal(f.messages[0].defaultId, 1)
  assert.equal(f.installs.length, 0)
  f.controller.dispose()
  assert.equal(f.installs.length, 0)
})

test('a deferred update installs only after the explicit Restart to Update choice', async () => {
  const f = fixture()
  await f.controller.check(false)
  f.updater.emit('update-downloaded', next)
  await flush()
  f.respond(0)
  await f.controller.check(true)
  assert.deepEqual(f.installs, [[false, true]])
  assert.equal(f.checks(), 1, 'A ready update must not download again')
  f.controller.dispose()
})

test('unsigned Mac and MSI builds check for new versions without automatic downloads', async () => {
  for (const options of [
    { platform: 'darwin', macSigned: false },
    { platform: 'win32', installation: null },
  ]) {
    const f = fixture({ ...options, response: 0 })
    await f.controller.check(false)
    assert.equal(f.updater.autoDownload, false)
    f.updater.emit('update-available', next)
    await flush()
    assert.deepEqual(f.opened, ['https://github.com/rianagil-PUSKAPA/simpuskapa/releases/tag/v0.3.0-beta.2'])
    assert.deepEqual(f.messages[0].buttons, ['Download Update', 'Later'])
    assert.equal(f.installs.length, 0)
    f.updater.emit('update-downloaded', next)
    assert.equal(f.installs.length, 0, 'Unsupported installations must never install even if an event is received')
    f.controller.dispose()
  }
})

test('automatic checks are delayed, periodic and completely disabled in development', async () => {
  const f = fixture()
  f.controller.start()
  f.controller.start()
  assert.equal(f.timeouts.size, 1)
  assert.equal(f.timeouts.get(1).ms, 10000)
  assert.equal(f.intervals.get(2).ms, 4 * 60 * 60 * 1000)
  f.timeouts.get(1).fn()
  await flush()
  assert.equal(f.checks(), 1)
  f.controller.dispose()
  assert.equal(f.timeouts.size + f.intervals.size, 0)
  const dev = fixture({ packaged: false })
  dev.controller.start()
  await dev.controller.check()
  assert.equal(dev.checks(), 0)
  assert.equal(dev.timeouts.size, 0)
})

test('overlapping manual and scheduled checks share one transfer and one set of event handlers', async () => {
  const f = fixture()
  await f.controller.check(false)
  await f.controller.check(true)
  assert.equal(f.checks(), 1)
  assert.equal(f.updater.listenerCount('update-downloaded'), 1)
  assert.match(f.messages[0].detail, /keep working/)
  f.controller.dispose()
  assert.equal(f.updater.listenerCount('update-downloaded'), 0)
})

test('failed and rejected downloads preserve the running app and allow a later retry', async () => {
  const f = fixture()
  await f.controller.check(false)
  f.updater.emit('error', new Error('Offline'))
  assert.equal(f.messages.length, 0, 'A background network failure must not interrupt a form')
  await f.controller.check(true)
  f.updater.emit('error', new Error('sha512 mismatch'))
  assert.equal(f.messages.length, 1)
  assert.equal(f.controller.getStatus().state, 'error')
  assert.equal(f.installs.length, 0)
  await f.controller.check(false)
  assert.equal(f.checks(), 3)
  f.controller.dispose()
})

test('invalid versions and downgrades cannot reach restart or arbitrary download URLs', async () => {
  for (const version of ['invalid', 'https://evil.test', '0.2.0', '0.3.0-beta.0']) {
    const f = fixture()
    await f.controller.check(false)
    f.updater.emit('update-downloaded', { version })
    await flush()
    assert.equal(f.controller.getStatus().state, 'error')
    assert.equal(f.installs.length + f.opened.length, 0)
    f.controller.dispose()
  }
})

test('release tags and update channels follow the package version', () => {
  assert.deepEqual(releaseInfo('0.3.0-beta.1'), {
    version: '0.3.0-beta.1',
    tag: 'v0.3.0-beta.1',
    channel: 'beta',
    prerelease: true,
  })
  assert.deepEqual(releaseInfo('0.3.0'), { version: '0.3.0', tag: 'v0.3.0', channel: 'latest', prerelease: false })
  assert.throws(() => releaseInfo('version; invalid'))
})
