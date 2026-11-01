const path = require('node:path')
const { execFileSync, spawnSync } = require('node:child_process')
const { releaseInfo } = require('./release-info.cjs')
const { releaseFiles, verifyArtifacts } = require('./verify-update-artifacts.cjs')

const directory = path.join(__dirname, '../dist')
const { tag, version, prerelease } = releaseInfo()
verifyArtifacts(directory, 'all')
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
    path.join(__dirname, '../RELEASE_NOTES.md'),
  ])
}
// Draft assets are invisible to installed updaters. Publish only after every
// installer, update ZIP, blockmap and manifest has been uploaded successfully.
gh(['release', 'upload', tag, ...files.map((file) => path.join(directory, file)), '--clobber'])
gh(['release', 'edit', tag, '--draft=false', `--prerelease=${prerelease}`, `--latest=${!prerelease}`])
