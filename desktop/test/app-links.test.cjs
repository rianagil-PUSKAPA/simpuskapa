const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const links = require('../../src/shared/app-links.cjs')
const { startDesktopLaunch } = require('../../src/utils/desktop-launch.cjs')

test('notification destinations round-trip through HTTPS and desktop links', () => {
  const targets = [
    '/dashboard/procurement/program/detail/project/request',
    '/dashboard/finance/payment-request/123',
    '/dashboard/project/123?tab=budget-needs&view=summary#budget',
    '/dashboard/aar/123?preview=1',
    '/dashboard/time-off',
  ]
  for (const target of targets) {
    assert.equal(links.safeDashboardTarget(links.APP_ORIGIN + target), target)
    const launch = new URL(links.notificationLaunchUrl(links.APP_ORIGIN + target))
    assert.equal(launch.origin, links.APP_ORIGIN)
    assert.equal(launch.searchParams.get('target'), target)
    assert.equal(links.parseDesktopProtocolUrl(links.desktopProtocolUrl(target)), target)
  }
})

test('deep links reject foreign origins, auth secrets, malformed and ambiguous input', () => {
  for (const target of [
    null,
    ['x'],
    'https://evil.test/dashboard',
    '//evil.test/dashboard',
    'javascript:alert(1)',
    '/login',
    '/dashboard-evil',
    '/dashboard/../../login',
    'https://sim.puskapa.org@evil.test/dashboard',
    '/dashboard/\\evil',
    '/dashboard/%255cevil',
    '/dashboard/%00',
    '/dashboard?auth_token=secret',
    '/dashboard?refresh_token=secret',
    '/dashboard/%',
    '/dashboard\r\nLocation:https://evil.test',
    '/dashboard/' + 'x'.repeat(8192),
  ]) {
    assert.equal(links.safeDashboardTarget(target), null, String(target))
  }
  for (const url of [
    'https://sim.puskapa.org/dashboard',
    'simpuskapa://wrong?target=%2Fdashboard',
    'simpuskapa://open?target=%2Fdashboard&target=%2Fdashboard%2Faar',
    'simpuskapa://open?target=%2Fdashboard&token=secret',
    'simpuskapa://open:123?target=%2Fdashboard',
    'simpuskapa://user@open?target=%2Fdashboard',
    'simpuskapa://open?target=%2Flogin',
    'simpuskapa://open?target=%2Fdashboard#fragment',
  ]) {
    assert.equal(links.parseDesktopProtocolUrl(url), null, url)
  }
})

test('email HTML retains its template; all dashboard buttons are wrapped exactly once', () => {
  const template = fs.readFileSync(path.join(__dirname, '../../src/server/common/mail.notif.template.html'), 'utf8')
  const target = '/dashboard/project/123?tab=budget-needs&view=summary'
  const html = template.replaceAll('{{.BUTTON_URL}}', links.APP_ORIGIN + target.replace('&', '&amp;'))
  const rewritten = links.rewriteNotificationLinks(html)
  const launch = links.notificationLaunchUrl(target)
  assert.equal(rewritten, html.replaceAll(links.APP_ORIGIN + target.replace('&', '&amp;'), launch))
  assert.equal(links.rewriteNotificationLinks(rewritten), rewritten)
  const untouched =
    '<a href="https://sim.puskapa.org/forgot-password">Reset</a><a href="https://example.org/dashboard">External</a>'
  assert.equal(links.rewriteNotificationLinks(untouched), untouched)
  assert.match(
    links.rewriteNotificationLinks("<a HREF = '/dashboard/aar/1?preview=1'>AAR</a>"),
    /HREF = 'https:\/\/sim.puskapa.org\/open\?/,
  )
})

function loadTs(relative, requireModule, extra = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../..', relative), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      experimentalDecorators: true,
    },
  }).outputText
  const exports = {}
  vm.runInNewContext(compiled, { exports, require: requireModule, ...extra })
  return exports
}

test('the real mail transporter wraps AAR/workflow links and preserves recipients and attachments', async () => {
  const calls = []
  const { MailTransporter } = loadTs(
    'src/server/commands/mail.transporter.ts',
    (name) => {
      if (name === '@nestjs/common') return { Injectable: () => (target) => target }
      if (name === 'mailtrap')
        return {
          MailtrapClient: class {
            async send(message) {
              calls.push(message)
              return { success: true }
            }
          },
        }
      if (name.endsWith('app-links.cjs')) return links
      throw new Error(name)
    },
    { process: { env: {} } },
  )
  const transporter = new MailTransporter()
  await transporter.onModuleInit()
  const message = {
    to: [{ email: 'test@example.org' }],
    from: { email: 'notification@sim.puskapa.org' },
    subject: 'AAR',
    html: '<a href="https://sim.puskapa.org/dashboard/aar/1?preview=1">View report</a>',
    attachments: [{ filename: 'AAR.pdf', content: 'mock-only', type: 'application/pdf' }],
  }
  await transporter.client.send(message)
  assert.equal(calls[0].to, message.to)
  assert.equal(calls[0].attachments, message.attachments)
  assert.equal(calls[0].subject, message.subject)
  assert.match(calls[0].html, /https:\/\/sim.puskapa.org\/open\?target=/)
  assert.ok(!message.html.includes('/open?'), 'The caller payload must not be mutated')
})

test('login destination survives OAuth, is consumed once, and expires', () => {
  const storage = new Map()
  let now = 1000
  const { rememberLoginDestination, loginDestination } = loadTs('src/utils/post-login-destination.ts', () => links, {
    window: {},
    Date: { now: () => now },
    sessionStorage: {
      getItem: (key) => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  })
  rememberLoginDestination('/dashboard/aar/1?preview=1')
  assert.equal(loginDestination(), '/dashboard/aar/1?preview=1')
  assert.equal(loginDestination(null, true), '/dashboard/aar/1?preview=1')
  assert.equal(loginDestination(), '/dashboard')
  rememberLoginDestination('/dashboard/project/1?tab=budget-needs')
  now += 21 * 60 * 1000
  assert.equal(loginDestination(), '/dashboard')
  assert.equal(rememberLoginDestination('//evil.test'), null)
  assert.equal(loginDestination('https://evil.test/dashboard'), '/dashboard')
})

function launchFixture() {
  const events = new Map()
  const timers = new Map()
  const navigations = []
  let id = 0
  const target = {
    hidden: false,
    addEventListener: (name, fn) => events.set(name, fn),
    removeEventListener: (name) => events.delete(name),
  }
  const win = {
    ...target,
    setTimeout: (fn) => {
      timers.set(++id, fn)
      return id
    },
    clearTimeout: (key) => timers.delete(key),
    location: { assign: (url) => navigations.push(['app', url]), replace: (url) => navigations.push(['browser', url]) },
  }
  const statuses = []
  const stop = startDesktopLaunch({
    win,
    doc: target,
    protocolUrl: links.desktopProtocolUrl('/dashboard/aar/1?preview=1'),
    browserUrl: '/dashboard/aar/1?preview=1',
    onStatus: (status) => statuses.push(status),
  })
  return {
    doc: target,
    events,
    timers,
    navigations,
    statuses,
    stop,
    tick: () => [...timers.values()].forEach((fn) => fn()),
  }
}

test('unavailable desktop falls back to the exact browser destination', () => {
  const f = launchFixture()
  f.tick()
  assert.deepEqual(f.navigations[1], ['browser', '/dashboard/aar/1?preview=1'])
  assert.equal(f.events.size, 0)
})

test('native permission prompt pauses fallback; cancelled prompt resumes it', () => {
  const f = launchFixture()
  f.events.get('blur')()
  f.tick()
  assert.equal(f.navigations.length, 1)
  f.events.get('focus')()
  f.tick()
  assert.equal(f.navigations[1][0], 'browser')
})

test('switching to the app or choosing browser cancels fallback listeners', () => {
  const f = launchFixture()
  f.doc.hidden = true
  f.events.get('visibilitychange')()
  f.tick()
  assert.equal(f.navigations.length, 1)
  assert.equal(f.statuses.at(-1), 'opened')
  f.doc.hidden = false
  f.events.get('visibilitychange')()
  assert.equal(f.events.size, 0)
  const browser = launchFixture()
  browser.stop()
  browser.tick()
  assert.equal(browser.events.size, 0)
  assert.equal(browser.navigations.length, 1)
})
