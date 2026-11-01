// Real Electron HTTP/download/checksum path, with an inert test payload.
// Never executes an installer, contacts production, or modifies an installed app.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
const { createHash } = require('node:crypto')
const { _electron: electron } = require('playwright')

test(
  'real updater downloads a verified payload, defers restart, and rejects a corrupt payload',
  { skip: process.platform !== 'win32', timeout: 90_000 },
  async () => {
    const data = await fs.mkdtemp(path.join(os.tmpdir(), 'sim-update-test-'))
    const payload = Buffer.from('inert-update-fixture-not-an-executable')
    const requests = []
    const server = http.createServer((request, response) => {
      requests.push({ url: request.url, cookie: request.headers.cookie, auth: request.headers.authorization })
      if (request.url.includes('.yml')) {
        const checksum = createHash('sha512')
          .update(request.url.startsWith('/corrupt') ? 'different-bytes' : payload)
          .digest('base64')
        response.setHeader('Content-Type', 'application/yaml')
        response.end(
          `version: 0.3.0-beta.2\nfiles:\n  - url: setup.exe\n    sha512: ${checksum}\n    size: ${payload.length}\npath: setup.exe\nsha512: ${checksum}\nreleaseDate: '2026-11-01T00:00:00Z'\n`,
        )
      } else {
        response.setHeader('Content-Length', payload.length)
        response.end(payload)
      }
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const baseUrl = `http://127.0.0.1:${server.address().port}`
    const env = { ...process.env, SIM_DESKTOP_SMOKE_TEST: '1', SIM_DESKTOP_TEST_DATA: data }
    delete env.ELECTRON_RUN_AS_NODE
    const application = await electron.launch({ args: [path.join(__dirname, '..')], env })
    try {
      await application.firstWindow()
      const result = await application.evaluate(
        async ({ app }, { baseUrl, data }) => {
          const require = process.getBuiltinModule('module').createRequire(app.getAppPath() + '/package.json')
          const path = require('node:path')
          const fs = require('node:fs')
          const { NsisUpdater } = require(path.join(app.getAppPath(), 'node_modules/electron-updater'))
          const { ElectronHttpExecutor } = require(path.join(
            app.getAppPath(),
            'node_modules/electron-updater/out/electronHttpExecutor',
          ))
          const { createDesktopUpdater } = require(path.join(app.getAppPath(), 'updates.cjs'))
          const run = async (corrupt) => {
            const folder = path.join(data, corrupt ? 'corrupt' : 'valid')
            fs.mkdirSync(folder, { recursive: true })
            const config = path.join(folder, 'app-update.yml')
            fs.writeFileSync(config, 'updaterCacheDirName: test-cache\n')
            const adapter = {
              version: '0.3.0-beta.1',
              name: 'SIM updater test',
              isPackaged: true,
              appUpdateConfigPath: config,
              userDataPath: folder,
              baseCachePath: folder,
              whenReady: () => Promise.resolve(),
              onQuit() {},
              quit() {},
              relaunch() {},
            }
            const updater = new NsisUpdater(null, adapter)
            updater.httpExecutor = new ElectronHttpExecutor()
            updater.setFeedURL({ provider: 'generic', url: baseUrl + (corrupt ? '/corrupt/' : '/valid/') })
            updater.logger = null
            updater.disableDifferentialDownload = true
            const installs = []
            updater.quitAndInstall = (...args) => installs.push(args)
            const messages = []
            let response = 1
            const controller = createDesktopUpdater({
              app: { isPackaged: true, getVersion: () => adapter.version },
              platform: 'win32',
              installation: 'nsis',
              getUpdater: () => updater,
              dialog: {
                showMessageBox: async (options) => {
                  messages.push(options.message)
                  return { response }
                },
              },
              shell: {
                openExternal: async () => {
                  throw Error('No external links in this test')
                },
              },
            })
            await controller.check(false)
            const deadline = Date.now() + 15000
            while (!['ready', 'error'].includes(controller.getStatus().state) && Date.now() < deadline) {
              await new Promise((resolve) => setTimeout(resolve, 30))
            }
            const status = controller.getStatus().state
            const downloaded =
              updater.installerPath && fs.existsSync(updater.installerPath)
                ? fs.readFileSync(updater.installerPath, 'utf8')
                : null
            const beforeRestart = installs.length
            if (!corrupt) {
              response = 0
              await controller.check(true)
            }
            controller.dispose()
            return {
              status,
              downloaded,
              beforeRestart,
              installs,
              messages,
              autoInstallOnAppQuit: updater.autoInstallOnAppQuit,
            }
          }
          return { valid: await run(false), corrupt: await run(true) }
        },
        { baseUrl, data },
      )
      assert.equal(result.valid.status, 'ready')
      assert.equal(result.valid.downloaded, payload.toString())
      assert.equal(result.valid.beforeRestart, 0)
      assert.deepEqual(result.valid.installs, [[true, true]])
      assert.equal(result.valid.autoInstallOnAppQuit, false)
      assert.equal(result.corrupt.status, 'error')
      assert.equal(result.corrupt.downloaded, null)
      assert.equal(result.corrupt.installs.length, 0)
      assert.ok(requests.some((r) => r.url.includes('/valid/setup.exe')))
      assert.ok(requests.some((r) => r.url.includes('/corrupt/setup.exe')))
      assert.ok(
        requests.every((r) => !r.cookie && !r.auth),
        'Application sessions must not be sent to the update server',
      )
    } finally {
      await application.close()
      await new Promise((resolve) => server.close(resolve))
      await fs.rm(data, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    }
  },
)
