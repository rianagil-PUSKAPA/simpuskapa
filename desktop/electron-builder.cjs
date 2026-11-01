const signed = process.env.SIM_DESKTOP_SIGNED === 'true'
const { channel, prerelease } = require('./scripts/release-info.cjs').releaseInfo()

module.exports = {
  appId: 'org.puskapa.sim.desktop',
  productName: 'SIM PUSKAPA',
  copyright: 'Copyright © PUSKAPA',
  asar: true,
  forceCodeSigning: signed,
  extraMetadata: { simDesktopUpdates: { channel, macSigned: signed } },
  directories: { output: 'dist', buildResources: 'assets' },
  files: [
    '*.cjs',
    'assets/**',
    'package.json',
    '!test/**',
    { from: '../src/shared', to: '.', filter: ['app-links.cjs'] },
  ],
  protocols: [{ name: 'SIM PUSKAPA', schemes: ['simpuskapa'] }],
  msiProjectCreated: require('./scripts/msi-protocol.cjs'),
  afterPack: require('./scripts/verify-package.cjs'),
  electronFuses: {
    runAsNode: false,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true,
  },
  win: {
    icon: 'assets/icon.ico',
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'msi', arch: ['x64'] },
    ],
    artifactName: 'SIM-PUSKAPA-${version}-Windows-${arch}-Setup.${ext}',
  },
  nsis: {
    include: 'assets/installer.nsh',
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'SIM PUSKAPA',
    deleteAppDataOnUninstall: false,
  },
  msi: { perMachine: false, oneClick: false, createDesktopShortcut: true, createStartMenuShortcut: true },
  mac: {
    icon: 'assets/icon.icns',
    category: 'public.app-category.productivity',
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] },
    ],
    artifactName: 'SIM-PUSKAPA-${version}-macOS-${arch}.${ext}',
    identity: signed ? undefined : '-',
    hardenedRuntime: signed,
    notarize: signed,
  },
  dmg: { title: 'SIM PUSKAPA ${version}', sign: signed },
  publish: {
    provider: 'github',
    owner: 'rianagil-PUSKAPA',
    repo: 'simpuskapa',
    releaseType: prerelease ? 'prerelease' : 'release',
    channel,
  },
}
