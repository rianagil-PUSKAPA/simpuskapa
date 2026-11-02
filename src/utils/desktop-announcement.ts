const DISMISSAL_PREFIX = 'sim-puskapa:desktop-announcement:v1:'
const dismissedInMemory = new Set<string>()

export function isDesktopClient() {
  return typeof navigator !== 'undefined' && /Electron\/|SIM-PUSKAPA-Desktop\//i.test(navigator.userAgent)
}

export function desktopAnnouncementDismissed(userId: string) {
  if (dismissedInMemory.has(userId)) return true
  try {
    return window.sessionStorage.getItem(`${DISMISSAL_PREFIX}${userId}`) === 'dismissed'
  } catch {
    return false
  }
}

export function dismissDesktopAnnouncement(userId: string) {
  dismissedInMemory.add(userId)
  try {
    window.sessionStorage.setItem(`${DISMISSAL_PREFIX}${userId}`, 'dismissed')
  } catch {
    // The current page still closes normally if browser storage is unavailable.
  }
}

export function resetDesktopAnnouncement() {
  dismissedInMemory.clear()
  try {
    const storage = window.sessionStorage
    for (let index = storage.length - 1; index >= 0; index--) {
      const key = storage.key(index)
      if (key?.startsWith(DISMISSAL_PREFIX)) storage.removeItem(key)
    }
  } catch {
    // Login must not depend on a browser storage preference.
  }
}
