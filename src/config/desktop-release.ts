const releaseBase = 'https://github.com/rianagil-PUSKAPA/simpuskapa/releases/download/v0.1.0-preview.1'

export const DESKTOP_RELEASE = {
  version: '0.1.0',
  channel: 'Preview',
  windows: {
    exe: `${releaseBase}/SIM-PUSKAPA-0.1.0-Windows-x64-Setup.exe`,
    msi: `${releaseBase}/SIM-PUSKAPA-0.1.0-Windows-x64-Setup.msi`,
  },
  macOS: {
    arm64: `${releaseBase}/SIM-PUSKAPA-0.1.0-macOS-arm64.dmg`,
    x64: `${releaseBase}/SIM-PUSKAPA-0.1.0-macOS-x64.dmg`,
  },
}
