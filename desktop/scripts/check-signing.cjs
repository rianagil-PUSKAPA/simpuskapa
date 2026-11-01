// Preview builds need no signing credentials. Explicit signed builds must not
// silently produce another unsigned/ad-hoc release.
if (process.env.SIM_DESKTOP_SIGNED === 'true') {
  const required =
    process.argv[2] === 'win32'
      ? ['WIN_CSC_LINK', 'WIN_CSC_KEY_PASSWORD']
      : ['CSC_LINK', 'CSC_KEY_PASSWORD', 'APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length) throw new Error('Signed build is missing: ' + missing.join(', '))
}
