const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')

const directory = path.join(__dirname, '..', 'dist')
const names = fs
  .readdirSync(directory)
  .filter((name) => /\.(exe|msi|dmg)$/.test(name))
  .sort()
if (!names.length) throw new Error('No installers were generated')
const lines = names.map(
  (name) =>
    `${createHash('sha256')
      .update(fs.readFileSync(path.join(directory, name)))
      .digest('hex')}  ${name}`,
)
fs.writeFileSync(path.join(directory, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`)
