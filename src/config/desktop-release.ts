const releaseBase = 'https://github.com/rianagil-PUSKAPA/simpuskapa/releases/download/v0.3.0-beta.1'

export const DESKTOP_RELEASE = {
  version: '0.3.0-beta.1',
  releasePage: 'https://github.com/rianagil-PUSKAPA/simpuskapa/releases/tag/v0.3.0-beta.1',
  channel: 'Preview',
  windows: {
    exe: `${releaseBase}/SIM-PUSKAPA-0.3.0-beta.1-Windows-x64-Setup.exe`,
    msi: `${releaseBase}/SIM-PUSKAPA-0.3.0-beta.1-Windows-x64-Setup.msi`,
  },
  macOS: {
    arm64: `${releaseBase}/SIM-PUSKAPA-0.3.0-beta.1-macOS-arm64.dmg`,
    x64: `${releaseBase}/SIM-PUSKAPA-0.3.0-beta.1-macOS-x64.dmg`,
  },
}
