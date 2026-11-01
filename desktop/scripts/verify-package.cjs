const assert = require('node:assert/strict')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const asar = require('@electron/asar')

module.exports = async function verifyPackage({ appOutDir, electronPlatformName, packager }) {
  const mac = electronPlatformName === 'darwin'
  const resources = mac
    ? path.join(appOutDir, `${packager.appInfo.productFilename}.app`, 'Contents', 'Resources')
    : path.join(appOutDir, 'resources')
  const archive = path.join(resources, 'app.asar')
  const source = asar.extractFile(archive, 'app-links.cjs').toString()
  assert.ok(source.includes('parseDesktopProtocolUrl'), 'The desktop link policy must be in the packaged app')
  const info = JSON.parse(asar.extractFile(archive, 'package.json').toString())
  assert.equal(info.version, '0.2.0')
  if (mac) {
    const plist = JSON.parse(
      execFileSync('plutil', ['-convert', 'json', '-o', '-', path.join(resources, '..', 'Info.plist')], {
        encoding: 'utf8',
      }),
    )
    assert.ok(
      plist.CFBundleURLTypes.some((type) => type.CFBundleURLSchemes.includes('simpuskapa')),
      'The macOS bundle must register simpuskapa://',
    )
  }
  console.log('Verified packaged desktop link policy' + (mac ? ' and macOS protocol registration' : ''))
}
