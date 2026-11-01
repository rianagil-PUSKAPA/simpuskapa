import { Button } from '@/components/Button'
import { useDesktopRelease } from '@/utils/use-desktop-release'
import { desktopProtocolUrl } from '@/shared/app-links.cjs'
import { isDesktopClient } from '@/utils/desktop-announcement'
import { startDesktopLaunch } from '@/utils/desktop-launch.cjs'
import { ArrowUpRight, Check, Monitor } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from './DesktopDownloadAnnouncement.module.css'
import launchStyles from './NotificationLinkLauncher.module.css'

type Props = { target: string | null }

export function NotificationLinkLauncher({ target }: Props) {
  const [status, setStatus] = useState('ready')
  const [supported, setSupported] = useState(true)
  const stop = useRef<() => void>(() => {})
  const destination = target || '/dashboard'
  const { release } = useDesktopRelease(Boolean(target))

  function openDesktop() {
    stop.current()
    stop.current = startDesktopLaunch({
      win: window,
      doc: document,
      protocolUrl: desktopProtocolUrl(destination),
      browserUrl: destination,
      onStatus: setStatus,
    })
  }

  useEffect(() => {
    if (!target) return
    const desktopOS =
      /Windows NT|Macintosh|Mac OS X/i.test(navigator.userAgent) && !/Android|iPhone|iPad/i.test(navigator.userAgent)
    setSupported(desktopOS)
    if (isDesktopClient() || !desktopOS) {
      window.location.replace(target)
      return
    }
    // Browsers may require a user gesture; the visible button provides a retry.
    openDesktop()
    return () => stop.current()
  }, [target])

  return (
    <main className={launchStyles.page}>
      <section className={`${styles.panel} ${launchStyles.card}`} aria-labelledby="notification-launch-title">
        <div className={styles.content}>
          <div className={styles.brand}>
            <Image src="/images/logo-simpuskapa.png" alt="SIM PUSKAPA" width={38} height={38} />
            <span>SIM PUSKAPA</span>
          </div>
          <div className={styles.introduction}>
            <div className={styles.heroIcon} aria-hidden="true">
              <Monitor size={35} strokeWidth={1.7} />
              <span className={styles.heroCheck}>
                <Check size={13} strokeWidth={3} />
              </span>
            </div>
            <span className={styles.eyebrow}>YOUR WORK, ONE CLICK AWAY</span>
            <h1 id="notification-launch-title" className={styles.title}>
              {target ? 'Open in SIM PUSKAPA' : 'This link is unavailable'}
            </h1>
            <p className={styles.description}>
              {target
                ? 'Continue to your notification in the desktop app or your browser. Sign in with your SIM PUSKAPA account if asked.'
                : 'Please open your dashboard to find the latest notifications.'}
            </p>
            {target && supported && (
              <Button
                btnType="normal"
                type="button"
                size="xl"
                variant="primary"
                className={`${styles.primaryButton} ${launchStyles.openButton}`}
                onClick={openDesktop}
              >
                <Monitor size={18} aria-hidden="true" /> Open in Desktop <ArrowUpRight size={17} aria-hidden="true" />
              </Button>
            )}
            <a href={destination} onClick={() => stop.current()} className={styles.stayLink}>
              {target ? 'Continue in Browser' : 'Go to Dashboard'}
            </a>
            <p role="status" aria-live="polite" className={launchStyles.status}>
              {status === 'opening'
                ? 'Choose Open SIM PUSKAPA if your browser asks. If the app does not open, we’ll continue in your browser.'
                : status === 'opened'
                ? 'If the desktop app opened, you can close this tab. You can also continue in your browser.'
                : ''}
            </p>
            <p className={launchStyles.download}>
              Need the desktop app?{' '}
              <a href={release.releasePage} target="_blank" rel="noopener noreferrer">
                Download for Windows or macOS
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
