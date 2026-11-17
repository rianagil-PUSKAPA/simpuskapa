// A custom protocol has no reliable installation-detection API in browsers.
// Keep a browser fallback, pausing it while a native permission dialog has focus.
function startDesktopLaunch({ win, doc, protocolUrl, browserUrl, onStatus, fallbackMs = 6000 }) {
  let timer
  let stopped = false
  let hidden = false
  const clear = () => {
    if (timer) win.clearTimeout(timer)
  }
  const cleanup = () => {
    clear()
    win.removeEventListener('blur', blur)
    win.removeEventListener('focus', focus)
    win.removeEventListener('pagehide', stop)
    doc.removeEventListener('visibilitychange', visibility)
  }
  const stop = () => {
    stopped = true
    cleanup()
  }
  const schedule = () => {
    clear()
    if (!stopped && !doc.hidden)
      timer = win.setTimeout(() => {
        stop()
        win.location.replace(browserUrl)
      }, fallbackMs)
  }
  const blur = () => {
    clear()
  }
  const focus = () => {
    if (hidden) return
    schedule()
  }
  const visibility = () => {
    if (doc.hidden) {
      hidden = true
      clear()
      onStatus('opened')
    } else if (hidden) {
      // Returning from another app/tab is not evidence that installation failed.
      stop()
    }
  }
  win.addEventListener('blur', blur)
  win.addEventListener('focus', focus)
  win.addEventListener('pagehide', stop)
  doc.addEventListener('visibilitychange', visibility)
  onStatus('opening')
  schedule()
  try {
    win.location.assign(protocolUrl)
  } catch {
    /* A blocked launch falls back to the website. */
  }
  return stop
}

module.exports = { startDesktopLaunch }
