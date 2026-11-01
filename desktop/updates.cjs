const fs = require('node:fs')
const path = require('node:path')
const semver = require('semver')

const RELEASES = 'https://github.com/rianagil-PUSKAPA/simpuskapa/releases'

function updateMode({ packaged, platform, macSigned, installerType }) {
  if (!packaged) return 'development'
  if (platform === 'win32') return installerType === 'nsis' ? 'automatic' : 'manual-windows'
  if (platform === 'darwin') return macSigned ? 'automatic' : 'manual-mac'
  return 'unsupported'
}

function installerType(resources) {
  try {
    return fs.readFileSync(path.join(resources, 'installer-type'), 'utf8').trim()
  } catch {
    return null
  }
}

function createDesktopUpdater({
  app,
  dialog,
  shell,
  settings = {},
  platform = process.platform,
  installation = installerType(process.resourcesPath || ''),
  getUpdater = () => require('electron-updater').autoUpdater,
  timers = globalThis,
  onStatus = () => {},
}) {
  const mode = updateMode({
    packaged: app.isPackaged,
    platform,
    macSigned: settings.macSigned === true,
    installerType: installation,
  })
  let updater
  let state = 'idle'
  let info
  let busy = false
  let manual = false
  let prompt = false
  let disposed = false
  let startupTimer
  let interval
  const listeners = []
  const status = (value) => {
    state = value
    onStatus({ state, version: info?.version, mode })
  }
  const message = (options) => dialog.showMessageBox({ title: 'SIM PUSKAPA', type: 'info', ...options })

  async function openDownloads() {
    const version = semver.valid(info?.version)
    await shell.openExternal(version ? `${RELEASES}/tag/v${version}` : RELEASES)
  }

  async function showReady() {
    if (prompt || disposed) return
    prompt = true
    try {
      const result = await message({
        message: 'SIM PUSKAPA is ready to update',
        detail: `Version ${info.version} has been downloaded. Save your work before restarting.`,
        buttons: ['Restart to Update', 'Later'],
        defaultId: 1,
        cancelId: 1,
        noLink: true,
      })
      if (result.response === 0 && !disposed) {
        status('installing')
        updater.quitAndInstall(true, true)
      }
    } finally {
      prompt = false
    }
  }

  async function showManual() {
    if (prompt || disposed) return
    prompt = true
    try {
      const reason =
        mode === 'manual-mac'
          ? 'This Mac preview uses manual updates until Apple signing is configured.'
          : 'MSI and unpacked Windows installations use manual updates. Use the EXE installer to enable automatic updates.'
      const result = await message({
        message: 'A new SIM PUSKAPA update is available',
        detail: `Version ${info.version} is available. ${reason}`,
        buttons: ['Download Update', 'Later'],
        defaultId: 1,
        cancelId: 1,
        noLink: true,
      })
      if (result.response === 0 && !disposed) await openDownloads()
    } finally {
      prompt = false
    }
  }

  function fail() {
    const show = manual
    busy = false
    manual = false
    status('error')
    if (show && !disposed)
      void message({
        type: 'warning',
        message: 'Unable to update SIM PUSKAPA',
        detail:
          'Check your internet connection and try Help → Check for Updates again. You can keep working in the current version.',
      })
  }

  function initialize() {
    if (updater) return
    updater = getUpdater()
    updater.autoDownload = mode === 'automatic'
    // Installation always follows the explicit Restart to Update choice, including after Later or OS shutdown.
    updater.autoInstallOnAppQuit = false
    updater.autoRunAppAfterInstall = true
    updater.channel = settings.channel || 'beta'
    updater.allowPrerelease = updater.channel !== 'latest'
    updater.allowDowngrade = false
    updater.disableWebInstaller = true
    const listen = (event, handler) => {
      updater.on(event, handler)
      listeners.push([event, handler])
    }
    listen('error', fail)
    listen('update-available', (value) => {
      if (!semver.valid(value?.version) || !semver.gt(value.version, app.getVersion())) {
        fail()
        return
      }
      info = value
      if (mode === 'automatic') status('downloading')
      else {
        busy = false
        manual = false
        status('available')
        void showManual().catch(fail)
      }
    })
    listen('update-not-available', () => {
      busy = false
      status('idle')
      if (manual && !disposed)
        void message({ message: 'SIM PUSKAPA is up to date', detail: `You are using version ${app.getVersion()}.` })
      manual = false
    })
    listen('download-progress', () => {
      if (state !== 'installing') status('downloading')
    })
    listen('update-downloaded', (value) => {
      if (mode !== 'automatic' || !semver.valid(value?.version) || !semver.gt(value.version, app.getVersion())) {
        fail()
        return
      }
      info = value
      busy = false
      manual = false
      status('ready')
      void showReady().catch(fail)
    })
  }

  async function check(userInitiated = true) {
    if (disposed) return
    if (mode === 'development' || mode === 'unsupported') {
      if (userInitiated)
        await message({
          message: 'Updates are available in the installed desktop app',
          detail: 'Install SIM PUSKAPA for Windows or macOS to check for desktop updates.',
        })
      return
    }
    if (state === 'ready') {
      if (userInitiated) await showReady()
      return
    }
    if (busy || state === 'installing') {
      if (userInitiated)
        await message({
          message: state === 'downloading' ? 'Downloading the update…' : 'Checking for updates…',
          detail: 'You can keep working. SIM PUSKAPA will notify you when the update is ready.',
        })
      return
    }
    manual = userInitiated
    busy = true
    status('checking')
    try {
      initialize()
      const result = await updater.checkForUpdates()
      // electron-updater starts the download itself. Observe its promise so a
      // failed transfer never becomes an unhandled rejection in the main process.
      if (result?.downloadPromise) void result.downloadPromise.catch(() => {})
    } catch {
      if (state !== 'error') fail()
    }
  }

  function start() {
    if (disposed || startupTimer || interval || mode === 'development' || mode === 'unsupported') return
    startupTimer = timers.setTimeout(() => {
      void check(false)
    }, 10_000)
    interval = timers.setInterval(() => {
      void check(false)
    }, 4 * 60 * 60 * 1000)
    startupTimer?.unref?.()
    interval?.unref?.()
  }

  function dispose() {
    disposed = true
    timers.clearTimeout(startupTimer)
    timers.clearInterval(interval)
    for (const [event, handler] of listeners) updater.removeListener(event, handler)
    // A final error may arrive as the process exits; retain an inert error handler.
    if (updater) updater.on('error', () => {})
  }

  return { start, check, dispose, getStatus: () => ({ state, version: info?.version, mode }) }
}

module.exports = { createDesktopUpdater, updateMode, installerType }
