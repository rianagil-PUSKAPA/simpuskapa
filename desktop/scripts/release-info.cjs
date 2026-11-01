function releaseInfo(version = require('../package.json').version) {
  const match = /^(\d+\.\d+\.\d+)(?:-(alpha|beta|rc)\.\d+)?$/.exec(version)
  if (!match) throw new Error('Desktop version must be stable, alpha.N, beta.N or rc.N')
  return { version, tag: `v${version}`, channel: match[2] || 'latest', prerelease: Boolean(match[2]) }
}

if (require.main === module) {
  for (const [key, value] of Object.entries(releaseInfo())) console.log(`${key}=${value}`)
}
module.exports = { releaseInfo }
