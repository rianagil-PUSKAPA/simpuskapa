const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { _electron: electron } = require('playwright')

test(
  'desktop runtime preserves print popups, sandboxing, downloads, and connection recovery',
  { timeout: 90_000 },
  async () => {
    const data = await fs.mkdtemp(path.join(os.tmpdir(), 'sim-desktop-test-'))
    const env = { ...process.env, SIM_DESKTOP_SMOKE_TEST: '1', SIM_DESKTOP_TEST_DATA: data }
    delete env.ELECTRON_RUN_AS_NODE
    const args = [path.join(__dirname, '..')]
    // Only the local, mocked Linux test harness uses these switches. Native CI uses the sandbox defaults.
    if (process.env.SIM_DESKTOP_TEST_ROOT === '1') args.push('--no-sandbox')
    if (process.env.SIM_DESKTOP_TEST_HEADLESS === '1') args.push('--ozone-platform=headless', '--disable-gpu')
    const application = await electron.launch({ args, env })
    try {
      const page = await application.firstWindow()
      await page.route('https://sim.puskapa.org/**', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><title>SIM PUSKAPA test</title><h1>Test form</h1>',
        }),
      )
      await page.goto('https://sim.puskapa.org/desktop-test')
      assert.equal(await page.evaluate(() => typeof window.require), 'undefined')
      assert.equal(await page.evaluate(() => typeof window.process), 'undefined')
      const preferences = await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),
      )
      assert.equal(preferences.sandbox, true)
      assert.equal(preferences.contextIsolation, true)
      assert.equal(preferences.nodeIntegration, false)
      assert.equal(
        await application.evaluate(({ BrowserWindow, session }) => {
          const actual = BrowserWindow.getAllWindows()[0].webContents.session
          return actual === session.fromPartition('persist:sim-puskapa') && actual.isPersistent()
        }),
        true,
      )

      const popupEvent = application.waitForEvent('window')
      const opened = await page.evaluate(() => {
        const popup = window.open('', '_blank')
        if (!popup) return false
        popup.document.open()
        popup.document.write('<!doctype html><title>RF-PC-TEST-001</title><h1>Print Form</h1><p>Activity Name</p>')
        popup.document.close()
        popup.opener = null
        return true
      })
      assert.equal(opened, true, 'The print document must retain document.write access to its popup')
      const popup = await popupEvent
      await popup.getByRole('heading', { name: 'Print Form' }).waitFor()
      assert.equal(await popup.evaluate(() => typeof window.require), 'undefined')
      const pdf = await application.evaluate(async ({ BrowserWindow }) => {
        const printWindow = BrowserWindow.getAllWindows().find((win) => win.webContents.getTitle() === 'RF-PC-TEST-001')
        const pdf = await printWindow.webContents.printToPDF({ pageSize: 'A4', printBackground: true })
        return { header: pdf.subarray(0, 4).toString(), length: pdf.length }
      })
      assert.equal(pdf.header, '%PDF')
      assert.ok(pdf.length > 1000)
      assert.equal(await page.evaluate(() => window.open('file:///private-file') === null), true)

      const filePath = path.join(data, 'RF-PC-TEST-001.pdf')
      const saved = application.evaluate(
        ({ session }, downloadPath) =>
          new Promise((resolve) => {
            session.fromPartition('persist:sim-puskapa').once('will-download', (_event, item) => {
              item.setSavePath(downloadPath)
              item.once('done', (_event, state) => resolve(state))
            })
          }),
        filePath,
      )
      await page.evaluate(() => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(new Blob(['test-pdf-download'], { type: 'application/pdf' }))
        link.download = 'RF-PC-TEST-001.pdf'
        document.body.append(link)
        link.click()
      })
      assert.equal(await saved, 'completed')
      assert.equal(await fs.readFile(filePath, 'utf8'), 'test-pdf-download')

      await page.unroute('https://sim.puskapa.org/**')
      await page.route('https://sim.puskapa.org/**', (route) => route.abort('internetdisconnected'))
      await page.goto('https://sim.puskapa.org/offline-test').catch(() => {})
      await page.getByRole('heading', { name: 'Let’s get you connected.' }).waitFor()
      await page.unroute('https://sim.puskapa.org/**')
      await page.route('https://sim.puskapa.org/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<h1>Connected again</h1>' }),
      )
      await page.getByRole('link', { name: 'Try again' }).click()
      await page.getByRole('heading', { name: 'Connected again' }).waitFor()
    } finally {
      await application.close()
      await fs.rm(data, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    }
  },
)
