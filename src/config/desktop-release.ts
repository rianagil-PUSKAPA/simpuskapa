const releaseBase = 'https://github.com/rianagil-PUSKAPA/simpuskapa/releases/download/v0.3.0-beta.2'

export type DesktopRelease = {
  version: string
  releasePage: string
  channel: string
  windows: { exe: string; msi: string }
  macOS: { arm64: string; x64: string }
  signing: { windows: boolean | null; macOS: boolean | null }
}

// Last-known public download. The website reads newer releases at runtime.
export const DESKTOP_RELEASE: DesktopRelease = {
  version: '0.3.0-beta.2',
  releasePage: 'https://github.com/rianagil-PUSKAPA/simpuskapa/releases/tag/v0.3.0-beta.2',
  channel: 'Beta',
  signing: { windows: false, macOS: false },
  windows: {
    exe: `${releaseBase}/SIM-PUSKAPA-0.3.0-beta.2-Windows-x64-Setup.exe`,
    msi: `${releaseBase}/SIM-PUSKAPA-0.3.0-beta.2-Windows-x64-Setup.msi`,
  },
  macOS: {
    arm64: `${releaseBase}/SIM-PUSKAPA-0.3.0-beta.2-macOS-arm64.dmg`,
    x64: `${releaseBase}/SIM-PUSKAPA-0.3.0-beta.2-macOS-x64.dmg`,
  },
}
