// Exercise the real browser modal with the existing UI components in an isolated fixture.
// No account, backend service, or production page is contacted.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { _electron: electron } = require('playwright')

const root = path.resolve(__dirname, '../..')
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-browser-ui-'))
const output = path.join(root, 'desktop/test-results/browser-popup')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

async function main() {
  fs.mkdirSync(output, { recursive: true })
  const sourcePackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json')))
  const packages = [
    'react',
    'react-dom',
    '@headlessui/react',
    'lucide-react',
    '@radix-ui/react-slot',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'tailwindcss',
    '@tailwindcss/forms',
    'tailwind-scrollbar',
    'tailwindcss-animate',
  ]
  const dependencies = Object.fromEntries(
    packages.map((name) => [name, sourcePackage.dependencies[name] || sourcePackage.devDependencies[name]]),
  )
  dependencies.esbuild = '0.25.9'
  fs.writeFileSync(
    path.join(temporary, 'package.json'),
    JSON.stringify({ name: 'sim-browser-ui-check', private: true, dependencies }),
  )
  execFileSync(npm, ['install', '--no-audit', '--no-fund'], {
    cwd: temporary,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  const esbuild = require(path.join(temporary, 'node_modules/esbuild'))
  const logo = fs.readFileSync(path.join(root, 'public/images/logo-simpuskapa.png')).toString('base64')
  fs.writeFileSync(
    path.join(temporary, 'image.tsx'),
    `export default function Image(props) { return <img {...props} src="data:image/png;base64,${logo}" /> }`,
  )
  fs.writeFileSync(
    path.join(temporary, 'entry.tsx'),
    `
    import { createRoot } from 'react-dom/client'
    import { useState } from 'react'
    import { DesktopDownloadAnnouncement } from ${JSON.stringify(
      path.join(root, 'src/components/DesktopDownloadAnnouncement'),
    )}
    import { resetDesktopAnnouncement } from ${JSON.stringify(path.join(root, 'src/utils/desktop-announcement'))}
    function Preview() {
      const [version, setVersion] = useState(0)
      return <><main style={{padding:40,minHeight:'100vh',background:'#f7f8fa'}}>
        <p style={{color:'#e56f00',fontSize:12,fontWeight:700}}>SIM PUSKAPA</p>
        <h1 style={{fontSize:30,fontWeight:600,marginTop:24}}>Main dashboard</h1>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginTop:30}}>
          {['Need Approval','Need Action','Request Tracking'].map(label=><div key={label} style={{background:'white',padding:24,borderRadius:16,border:'1px solid #edf0f4'}}>{label}</div>)}
        </div>
        <button onClick={()=>{resetDesktopAnnouncement();setVersion(version+1)}}>Simulate new sign-in</button>
      </main><DesktopDownloadAnnouncement key={version} userId="browser-qa-user" /></>
    }
    createRoot(document.getElementById('root')).render(<Preview />)
  `,
  )
  esbuild.buildSync({
    entryPoints: [path.join(temporary, 'entry.tsx')],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    outfile: path.join(temporary, 'popup.js'),
    tsconfig: path.join(root, 'tsconfig.json'),
    nodePaths: [path.join(temporary, 'node_modules')],
    alias: { 'next/image': path.join(temporary, 'image.tsx') },
  })
  esbuild.stop()
  fs.copyFileSync(path.join(root, 'tailwind.config.js'), path.join(temporary, 'tailwind.config.cjs'))
  execFileSync(
    process.execPath,
    [
      path.join(temporary, 'node_modules/tailwindcss/lib/cli.js'),
      '-i',
      path.join(root, 'src/styles/globals.css'),
      '-c',
      path.join(temporary, 'tailwind.config.cjs'),
      '-o',
      path.join(temporary, 'global.css'),
      '--minify',
    ],
    { cwd: root, stdio: 'inherit' },
  )
  fs.copyFileSync(path.join(root, 'src/styles/modern-dashboard.css'), path.join(temporary, 'modern.css'))
  fs.writeFileSync(
    path.join(temporary, 'index.html'),
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SIM PUSKAPA browser UI QA</title><link rel="stylesheet" href="global.css"><link rel="stylesheet" href="modern.css"><link rel="stylesheet" href="popup.css"><style>body{font-family:Arial,sans-serif}</style><div id="root"></div><script src="popup.js"></script></html>',
  )

  fs.mkdirSync(path.join(temporary, 'user-data'), { recursive: true })
  const env = { ...process.env, SIM_DESKTOP_SMOKE_TEST: '1', SIM_DESKTOP_TEST_DATA: path.join(temporary, 'user-data') }
  delete env.ELECTRON_RUN_AS_NODE
  const application = await electron.launch({ args: [path.join(root, 'desktop')], env })
  try {
    const page = await application.firstWindow()
    await page.waitForURL('**/offline.html', { waitUntil: 'load' })
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].webContents.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36',
      ),
    )
    // Serve the fixture through the same mocked HTTPS origin as the existing desktop smoke test.
    // This also exercises normal browser sessionStorage instead of file-URL storage semantics.
    await page.route('https://sim.puskapa.org/**', async (route) => {
      const filename = {
        '/browser-ui-qa': 'index.html',
        '/global.css': 'global.css',
        '/modern.css': 'modern.css',
        '/popup.css': 'popup.css',
        '/popup.js': 'popup.js',
      }[new URL(route.request().url()).pathname]
      if (!filename) return route.fulfill({ status: 404, body: '' })
      await route.fulfill({ path: path.join(temporary, filename) })
    })
    await page.goto('https://sim.puskapa.org/browser-ui-qa')
    const modal = page.getByRole('dialog')
    await modal.waitFor({ state: 'attached' })
    await page.getByRole('heading', { name: 'SIM PUSKAPA, now on desktop.' }).waitFor()
    const panel = page.locator('[id^="headlessui-dialog-panel-"]')
    const bounds = await panel.boundingBox()
    assert.ok(bounds.width <= 545 && bounds.height < 700, 'The modal must stay compact')
    const linkStyle = await page.getByRole('button', { name: 'Stay on browser' }).evaluate((element) => {
      const style = getComputedStyle(element)
      return { background: style.backgroundColor, border: style.borderTopWidth }
    })
    assert.equal(linkStyle.background, 'rgba(0, 0, 0, 0)')
    assert.equal(linkStyle.border, '0px')
    await page.screenshot({ path: path.join(output, '01-announcement-desktop.png'), animations: 'disabled' })

    await page.getByRole('button', { name: 'Download SIM PUSKAPA', exact: true }).click()
    await page.getByRole('heading', { name: 'Download SIM PUSKAPA', exact: true }).waitFor()
    assert.match(await page.getByRole('link', { name: 'Download for Windows' }).getAttribute('href'), /Setup\.exe$/)
    await page.getByLabel('Installer type').selectOption('msi')
    assert.match(await page.getByRole('link', { name: 'Download for Windows' }).getAttribute('href'), /Setup\.msi$/)
    await page.getByRole('tab', { name: 'macOS' }).click()
    assert.match(await page.getByRole('link', { name: 'Download for macOS' }).getAttribute('href'), /arm64\.dmg$/)
    await page.getByLabel('Mac processor').selectOption('x64')
    assert.match(await page.getByRole('link', { name: 'Download for macOS' }).getAttribute('href'), /x64\.dmg$/)
    await page.screenshot({ path: path.join(output, '02-download-options-desktop.png'), animations: 'disabled' })
    await page.getByRole('button', { name: 'Stay on browser' }).click()
    await modal.waitFor({ state: 'detached' })
    await page.getByRole('heading', { name: 'Main dashboard' }).waitFor()
    await page.reload()
    assert.equal(await page.getByRole('dialog').count(), 0, 'Reload must keep the popup dismissed')

    await page.getByRole('button', { name: 'Simulate new sign-in' }).click()
    await modal.waitFor({ state: 'attached' })
    await page.getByRole('heading', { name: 'SIM PUSKAPA, now on desktop.' }).waitFor()
    await page.setViewportSize({ width: 390, height: 844 })
    const mobileBounds = await panel.boundingBox()
    assert.ok(mobileBounds.x >= 0 && mobileBounds.x + mobileBounds.width <= 391, 'The mobile layout must not overflow')
    await page.screenshot({ path: path.join(output, '03-announcement-mobile.png'), animations: 'disabled' })
    await page.keyboard.press('Escape')
    await modal.waitFor({ state: 'detached' })

    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].webContents.setUserAgent(
        'Mozilla/5.0 Electron/45.2.1 SIM-PUSKAPA-Desktop/0.1.0',
      ),
    )
    await page.reload()
    await page.getByRole('button', { name: 'Simulate new sign-in' }).click()
    assert.equal(
      await page.getByRole('dialog').count(),
      0,
      'The desktop client must never show the browser announcement',
    )
    console.log(
      'PASS: compact two-step modal, four installers, text-only browser dismissal, refresh/new-login behavior, responsive layout, Escape, and desktop suppression.',
    )
  } finally {
    await application.close()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    try {
      fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
    } catch {
      console.warn('The runner will remove the temporary UI check directory during job cleanup.')
    }
  })
