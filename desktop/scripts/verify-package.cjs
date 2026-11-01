const assert = require('node:assert/strict')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const asar = require('@electron/asar')
const fs = require('node:fs')
const yaml = require('js-yaml')

module.exports = async function verifyPackage({ appOutDir, electronPlatformName, packager }) {
  const mac = electronPlatformName === 'darwin'
  const resources = mac
    ? path.join(appOutDir, `${packager.appInfo.productFilename}.app`, 'Contents', 'Resources')
    : path.join(appOutDir, 'resources')
  const archive = path.join(resources, 'app.asar')
  const source = asar.extractFile(archive, 'app-links.cjs').toString()
  assert.ok(source.includes('parseDesktopProtocolUrl'), 'The desktop link policy must be in the packaged app')
  const info = JSON.parse(asar.extractFile(archive, 'package.json').toString())
  assert.equal(info.version, require('../package.json').version)
  assert.ok(asar.extractFile(archive, 'updates.cjs').toString().includes('autoInstallOnAppQuit = false'))
  assert.equal(JSON.parse(asar.extractFile(archive, 'node_modules/electron-updater/package.json')).version, '6.8.12')
  const feed = yaml.load(fs.readFileSync(path.join(resources, 'app-update.yml'), 'utf8'))
  assert.equal(feed.provider, 'github')
  assert.equal(feed.owner, 'rianagil-PUSKAPA')
  assert.equal(feed.repo, 'simpuskapa')
  assert.ok(!feed.token, 'No GitHub credential belongs in the packaged update feed')
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
  console.log(
    'Verified packaged link policy, updater dependency and public update feed' +
      (mac ? ', plus macOS protocol registration' : ''),
  )
}
