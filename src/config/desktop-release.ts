const releaseBase = 'https://github.com/rianagil-PUSKAPA/simpuskapa/releases/download/v0.2.0-preview.1'

export const DESKTOP_RELEASE = {
  version: '0.2.0',
  releasePage: 'https://github.com/rianagil-PUSKAPA/simpuskapa/releases/tag/v0.2.0-preview.1',
  channel: 'Preview',
  windows: {
    exe: `${releaseBase}/SIM-PUSKAPA-0.2.0-Windows-x64-Setup.exe`,
    msi: `${releaseBase}/SIM-PUSKAPA-0.2.0-Windows-x64-Setup.msi`,
  },
  macOS: {
    arm64: `${releaseBase}/SIM-PUSKAPA-0.2.0-macOS-arm64.dmg`,
    x64: `${releaseBase}/SIM-PUSKAPA-0.2.0-macOS-x64.dmg`,
  },
}
