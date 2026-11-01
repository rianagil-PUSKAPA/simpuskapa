const fs = require('node:fs')
const path = require('node:path')
const asar = require('@electron/asar')
const { version } = require('../package.json')

const directory = path.join(__dirname, '../dist')
const archive =
  process.platform === 'win32'
    ? path.join(directory, 'win-unpacked/resources/app.asar')
    : path.join(directory, 'mac-arm64/SIM PUSKAPA.app/Contents/Resources/app.asar')
const metadata = JSON.parse(asar.extractFile(archive, 'package.json'))
if (metadata.version !== version || typeof metadata.simDesktopUpdates?.macSigned !== 'boolean')
  throw new Error('Missing packaged signing configuration')
fs.writeFileSync(
  path.join(directory, `signing-${process.platform}.json`),
  JSON.stringify({ version, signed: metadata.simDesktopUpdates.macSigned }),
)
