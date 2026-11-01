import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { DESKTOP_RELEASE } from '@/config/desktop-release'
import { theme } from '@/types/themes'
import { desktopAnnouncementDismissed, dismissDesktopAnnouncement, isDesktopClient } from '@/utils/desktop-announcement'
import { Dialog, Tab } from '@headlessui/react'
import { ArrowLeft, Check, Download, Laptop, Monitor, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './DesktopDownloadAnnouncement.module.css'

type Props = { userId?: string }
type DownloadStep = 'announcement' | 'download'

export function DesktopDownloadAnnouncement({ userId }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<DownloadStep>('announcement')
  const [platform, setPlatform] = useState(0)
  const [windowsFormat, setWindowsFormat] = useState<'exe' | 'msi'>('exe')
  const [macProcessor, setMacProcessor] = useState<'arm64' | 'x64'>('arm64')

  useEffect(() => {
    if (!userId || isDesktopClient() || desktopAnnouncementDismissed(userId)) {
      setOpen(false)
      return
    }
    setPlatform(/Macintosh|Mac OS X/i.test(navigator.userAgent) ? 1 : 0)
    setStep('announcement')
    setOpen(true)
  }, [userId])

  const dismiss = () => {
    if (userId) dismissDesktopAnnouncement(userId)
    setOpen(false)
  }

  const downloadUrl = platform === 0 ? DESKTOP_RELEASE.windows[windowsFormat] : DESKTOP_RELEASE.macOS[macProcessor]
  const downloadLabel = platform === 0 ? 'Download for Windows' : 'Download for macOS'

  return (
    <Modal
      icon={null}
      theme={theme.PRIMARY}
      modalTitle="SIM PUSKAPA Desktop"
      modalDescription=""
      stateModal={open}
      handleCloseModal={dismiss}
      isSeamless
      modalSizeStyles={styles.panel}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <Image src="/images/logo-simpuskapa.png" alt="SIM PUSKAPA" width={38} height={38} />
            <span>SIM PUSKAPA</span>
          </div>
          <button type="button" className={styles.close} aria-label="Close desktop announcement" onClick={dismiss}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {step === 'announcement' ? (
          <div className={styles.introduction}>
            <div className={styles.heroIcon} aria-hidden="true">
              <Monitor size={35} strokeWidth={1.7} />
              <span className={styles.heroCheck}>
                <Check size={13} strokeWidth={3} />
              </span>
            </div>
            <span className={styles.eyebrow}>A NEW WAY TO WORK</span>
            <Dialog.Title as="h2" className={styles.title}>
              SIM PUSKAPA,
              <br />
              now on desktop.
            </Dialog.Title>
            <Dialog.Description className={styles.description}>
              Keep your projects, forms, and approvals close at hand with the SIM PUSKAPA desktop app.
            </Dialog.Description>
            <p className={styles.sameAccount}>
              <Check size={15} aria-hidden="true" />
              Same account. Same SIM PUSKAPA data.
            </p>
            <Button
              btnType="normal"
              type="button"
              size="xl"
              variant="primary"
              className={styles.primaryButton}
              onClick={() => setStep('download')}
            >
              <Download size={18} aria-hidden="true" />
              Download SIM PUSKAPA
            </Button>
            <button type="button" className={styles.stayLink} onClick={dismiss}>
              Stay on browser
            </button>
            <p className={styles.availability}>Available for Windows and macOS</p>
          </div>
        ) : (
          <div className={styles.downloadContent}>
            <button type="button" className={styles.backLink} onClick={() => setStep('announcement')}>
              <ArrowLeft size={15} aria-hidden="true" />
              Back
            </button>
            <Dialog.Title as="h2" className={styles.downloadTitle}>
              Download SIM PUSKAPA
            </Dialog.Title>
            <Dialog.Description className={styles.downloadDescription}>
              Choose your computer to get started.
            </Dialog.Description>

            <Tab.Group selectedIndex={platform} onChange={setPlatform}>
              <Tab.List className={styles.tabs} aria-label="Operating system">
                <Tab className={({ selected }) => `${styles.tab} ${selected ? styles.selectedTab : ''}`}>
                  <Monitor size={19} aria-hidden="true" />
                  Windows
                </Tab>
                <Tab className={({ selected }) => `${styles.tab} ${selected ? styles.selectedTab : ''}`}>
                  <Laptop size={19} aria-hidden="true" />
                  macOS
                </Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel className={styles.options}>
                  <label htmlFor="sim-desktop-windows-format" className={styles.fieldLabel}>
                    Installer type
                  </label>
                  <select
                    id="sim-desktop-windows-format"
                    value={windowsFormat}
                    onChange={(event) => setWindowsFormat(event.target.value as 'exe' | 'msi')}
                    className={styles.select}
                  >
                    <option value="exe">Windows installer (.exe) — Recommended</option>
                    <option value="msi">MSI package (.msi)</option>
                  </select>
                  <p className={styles.fieldHint}>For Windows computers with a 64-bit Intel or AMD processor.</p>
                </Tab.Panel>
                <Tab.Panel className={styles.options}>
                  <label htmlFor="sim-desktop-mac-processor" className={styles.fieldLabel}>
                    Mac processor
                  </label>
                  <select
                    id="sim-desktop-mac-processor"
                    value={macProcessor}
                    onChange={(event) => setMacProcessor(event.target.value as 'arm64' | 'x64')}
                    className={styles.select}
                  >
                    <option value="arm64">Apple Silicon (M series)</option>
                    <option value="x64">Intel</option>
                  </select>
                  <p className={styles.fieldHint}>Check Apple menu → About This Mac to find your processor.</p>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>

            <Button btnType="normal" size="xl" variant="primary" asChild className={styles.primaryButton}>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" aria-label={downloadLabel}>
                <Download size={18} aria-hidden="true" />
                {downloadLabel}
              </a>
            </Button>
            <p className={styles.releaseInfo}>
              Version {DESKTOP_RELEASE.version} · {DESKTOP_RELEASE.channel} · Internet connection required
            </p>
            <p className={styles.previewNote}>This preview may show a security warning during installation.</p>
            <button type="button" className={styles.stayLink} onClick={dismiss}>
              Stay on browser
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
