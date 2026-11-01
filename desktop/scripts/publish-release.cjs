const path = require('node:path')
const { execFileSync, spawnSync } = require('node:child_process')
const { releaseInfo } = require('./release-info.cjs')
const { releaseFiles, verifyArtifacts } = require('./verify-update-artifacts.cjs')
const fs = require('node:fs')
const { releaseMetadata, metadataComment } = require('../../src/shared/desktop-releases.cjs')

const directory = path.join(__dirname, '../dist')
const { tag, version, prerelease, channel } = releaseInfo()
verifyArtifacts(directory, 'all')
const states = ['win32', 'darwin'].map((platform) =>
  JSON.parse(fs.readFileSync(path.join(directory, `signing-${platform}.json`), 'utf8')),
)
if (states.some((state) => state.version !== version || typeof state.signed !== 'boolean'))
  throw new Error('Invalid release signing metadata')
const metadata = releaseMetadata(version, channel, false)
metadata.signing = { windows: states[0].signed, macOS: states[1].signed }
const notes = fs
  .readFileSync(path.join(__dirname, '../RELEASE_NOTES.md'), 'utf8')
  .replace('{{WINDOWS_SIGNING}}', metadata.signing.windows ? 'digitally signed' : 'unsigned')
  .replace(
    '{{MAC_SIGNING}}',
    metadata.signing.macOS ? 'signed and notarized' : 'ad-hoc signed without Apple notarization',
  )
const notesFile = path.join(directory, 'release-notes.md')
fs.writeFileSync(notesFile, notes + '\n\n' + metadataComment(metadata) + '\n')
const files = releaseFiles(directory)
const gh = (args) => execFileSync('gh', args, { stdio: 'inherit' })
const existing = spawnSync('gh', ['release', 'view', tag, '--json', 'isDraft,assets'], { encoding: 'utf8' })
if (existing.status === 0) {
  const release = JSON.parse(existing.stdout)
  if (!release.isDraft) {
    for (const file of files)
      if (!release.assets.some((asset) => asset.name === file))
        throw new Error('Existing public release is incomplete: ' + file)
    console.log('Preserving the existing public release. Bump desktop/package.json for a new update.')
    process.exit(0)
  }
} else {
  gh([
    'release',
    'create',
    tag,
    '--draft',
    '--target',
    process.env.GITHUB_SHA,
    '--title',
    `SIM PUSKAPA Desktop ${version}`,
    '--notes-file',
    notesFile,
  ])
}
// Draft assets are invisible to installed updaters. Publish only after every
// installer, update ZIP, blockmap and manifest has been uploaded successfully.
gh(['release', 'upload', tag, ...files.map((file) => path.join(directory, file)), '--clobber'])
gh(['release', 'edit', tag, '--draft=false', `--prerelease=${prerelease}`, `--latest=${!prerelease}`])
