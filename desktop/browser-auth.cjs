const { createServer } = require('node:http')
const { createKeys, openSession } = require('./handoff.cjs')
const { APP_ORIGIN } = require('./policy.cjs')

const RESULT_HTML =
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>SIM PUSKAPA</title><body><h1>Connected to SIM PUSKAPA Desktop</h1><p>You can close this tab and return to the desktop application.</p></body></html>'

async function createBrowserSignIn({ onSession, onTimeout, timeoutMs = 300_000 }) {
  const keys = await createKeys()
  let finished = false
  let timer
  const server = createServer({ maxHeaderSize: 60_000 }, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    const port = server.address()?.port
    if (finished || req.method !== 'GET' || req.headers.host !== `127.0.0.1:${port}`) {
      res.writeHead(400).end('Invalid desktop connection')
      return
    }
    try {
      const url = new URL(req.url, `http://127.0.0.1:${port}`)
      if (url.pathname !== '/callback' || url.searchParams.get('state') !== keys.state)
        throw new Error('Invalid callback')
      const session = openSession(url.searchParams.get('payload'), keys.privateKey, keys.state)
      finished = true
      clearTimeout(timer)
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.writeHead(200).end(RESULT_HTML)
      server.close()
      server.closeIdleConnections()
      await onSession(session)
    } catch {
      if (!res.headersSent)
        res.writeHead(400).end('Invalid or expired desktop connection. Try again from the application.')
    }
  })
  server.requestTimeout = 10_000
  server.headersTimeout = 10_000
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject)
      resolve()
    })
  })
  const url = new URL('/desktop/connect', APP_ORIGIN)
  url.searchParams.set('port', String(server.address().port))
  url.searchParams.set('state', keys.state)
  url.searchParams.set('publicKey', keys.publicKey)
  const cancel = () => {
    finished = true
    clearTimeout(timer)
    server.close()
    server.closeIdleConnections()
  }
  timer = setTimeout(() => {
    cancel()
    onTimeout?.()
  }, timeoutMs)
  timer.unref()
  return { url: url.href, cancel }
}

module.exports = { createBrowserSignIn }
