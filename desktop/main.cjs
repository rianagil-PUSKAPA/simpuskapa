const { app, BrowserWindow, Menu, dialog, net, session, shell } = require('electron')
const path = require('node:path')
const {
  APP_ORIGIN,
  isAppUrl,
  isAppBlob,
  isGoogleSignIn,
  isExternalUrl,
  isDownloadUrl,
  safeFilename,
  browserUrl,
} = require('./policy.cjs')
const { createBrowserSignIn } = require('./browser-auth.cjs')
const { createDesktopUpdater } = require('./updates.cjs')
const { PROTOCOL, parseDesktopProtocolUrl, safeDashboardTarget } = require(app.isPackaged
  ? './app-links.cjs'
  : '../src/shared/app-links.cjs')

const smokeTest = !app.isPackaged && process.env.SIM_DESKTOP_SMOKE_TEST === '1'
if (smokeTest && process.env.SIM_DESKTOP_TEST_DATA) app.setPath('userData', process.env.SIM_DESKTOP_TEST_DATA)
app.setAppUserModelId('org.puskapa.sim.desktop')
app.enableSandbox()

const webPreferences = {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  webviewTag: false,
}
const windows = new Set()
let mainWindow
let signInAttempt
let signInStarting = false
let pendingTarget = process.argv.map(parseDesktopProtocolUrl).find(Boolean) || null
const desktopUpdates = createDesktopUpdater({
  app,
  dialog,
  shell,
  settings: require('./package.json').simDesktopUpdates,
  onStatus: ({ state }) => {
    const item = Menu.getApplicationMenu()?.getMenuItemById('desktop-update')
    if (item)
      item.label =
        state === 'ready'
          ? 'Restart to Update…'
          : state === 'downloading'
          ? 'Downloading Update…'
          : 'Check for Updates…'
  },
})

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) createMainWindow()
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function openDesktopLink(url) {
  const target = parseDesktopProtocolUrl(url)
  if (!target) return false
  pendingTarget = target
  if (app.isReady()) {
    const existed = mainWindow && !mainWindow.isDestroyed()
    focusMainWindow()
    if (existed) void mainWindow.loadURL(new URL(target, APP_ORIGIN).href).catch(() => {})
  }
  return true
}

// macOS can deliver a cold-start link before app.whenReady().
app.on('open-url', (event, url) => {
  event.preventDefault()
  openDesktopLink(url)
})

function openExternal(url) {
  if (isExternalUrl(url))
    void shell.openExternal(url).catch(() => {
      void dialog.showMessageBox({ type: 'error', message: 'Unable to open your browser. Please try again.' })
    })
}

async function browserSignIn() {
  if (signInStarting || signInAttempt) return
  signInStarting = true
  try {
    const support = await net.fetch(`${APP_ORIGIN}/api/desktop/session`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    if (!support.ok || (await support.json()).version !== 1) throw new Error('Browser sign-in is not deployed')
    signInAttempt = await createBrowserSignIn({
      onSession: async ({ authToken, refreshToken }) => {
        signInAttempt = null
        if (!mainWindow || mainWindow.isDestroyed()) createMainWindow()
        const url = new URL('/welcome', APP_ORIGIN)
        url.searchParams.set('auth_token', authToken)
        url.searchParams.set('refresh_token', refreshToken)
        if (pendingTarget) url.searchParams.set('next', pendingTarget)
        mainWindow.show()
        mainWindow.focus()
        await mainWindow.loadURL(url.href)
      },
      onTimeout: () => {
        signInAttempt = null
        void dialog.showMessageBox({ type: 'info', message: 'Browser sign-in expired. Please try again.' })
      },
    })
    await shell.openExternal(signInAttempt.url)
  } catch {
    signInAttempt?.cancel()
    signInAttempt = null
    await dialog.showMessageBox({
      type: 'info',
      message: 'Browser sign-in is currently unavailable.',
      detail:
        'Use your SIM PUSKAPA email and password in this window. Google Workspace sign-in requires the desktop connection page to be deployed on sim.puskapa.org.',
    })
  } finally {
    signInStarting = false
  }
}

function wireWindow(win, inheritedAppOrigin = false) {
  windows.add(win)
  win.on('closed', () => windows.delete(win))
  win.webContents.on('will-attach-webview', (event) => event.preventDefault())
  const trusted = () =>
    isAppUrl(win.webContents.getURL()) ||
    isAppBlob(win.webContents.getURL()) ||
    (inheritedAppOrigin && win.webContents.getURL() === 'about:blank')
  const navigation = (event, url) => {
    if (isAppUrl(url) || isAppBlob(url)) return
    event.preventDefault()
    if (trusted()) {
      if (openDesktopLink(url)) return
      if (isGoogleSignIn(url)) void browserSignIn()
      else openExternal(url)
    }
  }
  win.webContents.on('will-navigate', navigation)
  win.webContents.on('will-redirect', navigation)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!trusted()) return { action: 'deny' }
    if ((url === 'about:blank' || isAppUrl(url) || isAppBlob(url)) && windows.size < 10) {
      // Preserve the opener relationship for Print Form's document.write(). Both renderers remain sandboxed.
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          title: 'Print Doc',
          width: 1050,
          height: 850,
          backgroundColor: '#ffffff',
          autoHideMenuBar: true,
          webPreferences,
        },
      }
    }
    if (openDesktopLink(url)) return { action: 'deny' }
    if (isGoogleSignIn(url)) void browserSignIn()
    else openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('did-create-window', (child) => wireWindow(child, true))
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'SIM PUSKAPA',
    width: 1440,
    height: 950,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: { ...webPreferences, partition: 'persist:sim-puskapa' },
  })
  const win = mainWindow
  wireWindow(win)
  win.once('ready-to-show', () => win.show())
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
  win.webContents.on('did-navigate', (_event, url) => {
    if (pendingTarget && safeDashboardTarget(url) === pendingTarget) pendingTarget = null
  })
  win.webContents.on('did-fail-load', (_event, code, _description, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && isAppUrl(url)) {
      void win.loadFile(path.join(__dirname, 'assets/offline.html')).catch(() => {})
      win.show()
    }
  })
  if (!smokeTest) void win.loadURL(pendingTarget ? new URL(pendingTarget, APP_ORIGIN).href : APP_ORIGIN).catch(() => {})
  else void win.loadFile(path.join(__dirname, 'assets/offline.html'))
  return win
}

function installMenu() {
  const menu = []
  if (process.platform === 'darwin') menu.push({ role: 'appMenu' })
  menu.push({
    label: 'File',
    submenu: [
      {
        label: 'Home',
        click: () => {
          if (mainWindow) void mainWindow.loadURL(APP_ORIGIN).catch(() => {})
        },
      },
      {
        label: 'Sign in with browser',
        click: () => {
          void browserSignIn()
        },
      },
      {
        label: 'Open in Browser',
        click: () => openExternal(browserUrl(BrowserWindow.getFocusedWindow()?.webContents.getURL())),
      },
      { type: 'separator' },
      { role: process.platform === 'darwin' ? 'close' : 'quit' },
    ],
  })
  menu.push(
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
    {
      label: 'Help',
      submenu: [
        {
          id: 'desktop-update',
          label: 'Check for Updates…',
          click: () => {
            void desktopUpdates.check()
          },
        },
        {
          label: 'About SIM PUSKAPA',
          click: () => {
            void dialog.showMessageBox({
              type: 'info',
              title: 'SIM PUSKAPA',
              message: `SIM PUSKAPA Desktop ${app.getVersion()}`,
              detail: 'Connected to sim.puskapa.org. An internet connection is required.',
            })
          },
        },
      ],
    },
  )
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
}

const singleInstance = smokeTest || app.requestSingleInstanceLock()
if (!singleInstance) app.quit()
else {
  app.on('second-instance', (_event, commandLine) => {
    const link = (commandLine || []).find((value) => parseDesktopProtocolUrl(value))
    if (link) openDesktopLink(link)
    else if (app.isReady()) focusMainWindow()
  })
  app.whenReady().then(() => {
    // Installers declare the handler too. Avoid registering development/test executables.
    if (app.isPackaged) app.setAsDefaultProtocolClient(PROTOCOL)
    const persistentSession = session.fromPartition('persist:sim-puskapa')
    persistentSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
    persistentSession.setPermissionCheckHandler(() => false)
    persistentSession.on('will-download', (event, item, contents) => {
      const owner = [...windows].find((win) => !win.isDestroyed() && win.webContents === contents)
      if (!owner || !isDownloadUrl(item.getURL())) {
        event.preventDefault()
        return
      }
      item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), safeFilename(item.getFilename())) })
      item.once('done', (_event, state) => {
        if (state === 'interrupted')
          void dialog.showMessageBox({
            type: 'error',
            message: 'The download was interrupted. Please try again.',
          })
      })
    })
    installMenu()
    createMainWindow()
    desktopUpdates.start()
    app.on('activate', () => {
      if (!mainWindow) createMainWindow()
      else mainWindow.show()
    })
  })
}
app.on('before-quit', () => {
  signInAttempt?.cancel()
  desktopUpdates.dispose()
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
