const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const yaml = require('js-yaml')
const { releaseInfo } = require('./release-info.cjs')

function releaseFiles(directory) {
  return fs
    .readdirSync(directory)
    .filter(
      (name) =>
        /\.(exe|msi|dmg|zip|blockmap)$/.test(name) ||
        /^(latest|alpha|beta|rc)(-mac)?\.yml$/.test(name) ||
        name === 'SHA256SUMS.txt',
    )
    .sort()
}

function verifyArtifacts(directory, platform = process.platform) {
  const { version, channel } = releaseInfo()
  const platforms = platform === 'all' ? ['win32', 'darwin'] : [platform]
  const check = (filename) => assert.ok(fs.statSync(path.join(directory, filename)).size > 0, `Missing ${filename}`)
  const stem = `SIM-PUSKAPA-${version}`
  for (const target of platforms) {
    const manifestName = channel + (target === 'darwin' ? '-mac' : '') + '.yml'
    const manifest = yaml.load(fs.readFileSync(path.join(directory, manifestName), 'utf8'))
    assert.equal(manifest.version, version)
    assert.ok(Array.isArray(manifest.files) && manifest.files.length)
    const urls = []
    for (const file of manifest.files) {
      const name = decodeURIComponent(file.url)
      assert.equal(path.basename(name), name, 'Update URLs must name local release artifacts')
      check(name)
      const digest = createHash('sha512')
        .update(fs.readFileSync(path.join(directory, name)))
        .digest('base64')
      assert.equal(file.sha512, digest, `Incorrect update checksum: ${name}`)
      urls.push(name)
    }
    if (target === 'win32') {
      const installer = `${stem}-Windows-x64-Setup.exe`
      check(installer)
      check(`${stem}-Windows-x64-Setup.msi`)
      check(installer + '.blockmap')
      assert.ok(urls.includes(installer), 'Windows update metadata must select the NSIS EXE')
    } else if (target === 'darwin') {
      for (const arch of ['x64', 'arm64']) {
        check(`${stem}-macOS-${arch}.dmg`)
        assert.ok(urls.includes(`${stem}-macOS-${arch}.zip`), `Missing Mac ${arch} update ZIP`)
      }
    } else throw new Error('Unsupported installer verification platform')
  }
  console.log(`Verified ${version} update manifests, architectures and SHA-512 checksums (${platform})`)
}

if (require.main === module) verifyArtifacts(path.join(__dirname, '../dist'), process.argv[2] || process.platform)
module.exports = { releaseFiles, verifyArtifacts }
