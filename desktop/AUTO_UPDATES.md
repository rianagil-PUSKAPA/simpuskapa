# Desktop updates

Desktop 0.3.0-beta.2 introduces `electron-updater` 6.8.12 with GitHub Releases as the public update source. No GitHub token is shipped to users. The updater uses a separate Electron network session from the signed-in website.

## Installed application behavior

- Check ten seconds after startup, then every four hours; **Help → Check for Updates** runs a manual check.
- Windows EXE/NSIS: download in the background and show **Restart to Update** / **Later** after checksum verification. Only the explicit restart choice calls `quitAndInstall`. `autoInstallOnAppQuit` is disabled, so Later also defers installation across quitting or shutdown. A cached download can be offered again on the next launch.
- The updater never intentionally downgrades. Network/transfer errors leave the current version running. Background errors stay quiet; a manual check explains an error.
- Windows MSI: offer **Download Update** / **Later**. A marker written by the NSIS installer distinguishes it from MSI/unpacked installations; no MSI installation is automatically replaced with NSIS.
- macOS preview: check and offer manual download. Automatic installation is enabled only in builds configured with proper Apple signing. Existing ad-hoc installs require a manual transition to the first properly signed build. The native Mac updater verifies future updates against the installed signing identity.
- Development/smoke sessions never query the update source automatically. No web page or renderer IPC can request installation.

## First installation

Existing 0.1.0/0.2.0 users install 0.3.0-beta.2 once. On Windows, choose EXE to enable automatic updates. MSI users who want to switch should uninstall the MSI first, then install EXE, to avoid two installer registrations. Mac previews keep manual updates until signing is ready. Application data uses the existing app ID/data location; normal account permissions and website login still apply.

Website features continue to come from EC2 and do not need desktop version bumps. Desktop runtime/shell changes need a new desktop release. Building the desktop installers happens on native GitHub runners, never on EC2.

## Publishing a new version

1. Bump `desktop/package.json` and its lockfile. Use a real semver version such as `0.3.0-beta.3` or a later stable version. The browser reads published release metadata automatically; its compiled fallback in `src/config/desktop-release.ts` can be refreshed during a normal website deployment.
2. Push the desktop branch; run the tests, native runtime checks, update transfer/checksum fixture and installers. `verify-update-artifacts.cjs` checks manifest hashes, the Windows EXE, and both Mac update ZIPs.
3. Merge to trunk. The workflow derives its tag/channel/artifact names from the package version, generates EXE/MSI, both DMGs, both update ZIPs, blockmaps, manifests and checksums. It uploads everything to a draft release and publishes only after the complete upload succeeds. Public releases are preserved on reruns; never replace published binaries under the same version.
4. Beta builds subscribe to beta releases and can move to stable. Stable builds subscribe only to stable releases. Updater metadata and checksums must remain in the release; ZIPs are required for macOS even though users install from DMG.

For a signed build, bump the version first and run **SIM PUSKAPA Desktop installers → Run workflow → signed=true** on trunk. Configure repository secrets `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`, `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` for the applicable platforms. Do not put credentials into source, chat, release notes or installer assets. Signing secrets are referenced only by the explicit signed build step on trunk; branch/push builds remain unsigned/ad-hoc. Missing signing/notarization credentials must cause the signed build to fail. A signed Windows build retains electron-updater's publisher signature verification; no verification bypass is configured. Unsigned Windows previews rely on the configured HTTPS GitHub source and artifact checksum rather than an Authenticode publisher identity.

## EC2 deployment

The existing helper `deployment/apply-email-desktop-links.py <commit-sha>` now applies the 0.3.0 download URLs together with the prior notification link changes, preserving known 0.1/0.2 configurations and merging other source edits. It **already builds both frontend and backend and restarts their PM2 processes** after staging succeeds. If an earlier run ended with SUCCESS, those builds already happened. Do not follow it with another `pnpm build`.

The helper still checks release availability, keeps the Git remotes/branch/index, stages both builds, backs up the previous source/builds and rolls back a failed switch/public check. No desktop dependency is installed on EC2. Tests exercise the real update download and SHA-512 rejection with an inert payload; actual installation/relaunch with production accounts needs acceptance checking on an installed Windows EXE and a properly signed Mac build.

## Website release information

Deploy the runtime endpoint once: `/api/desktop/releases`. It reads the public GitHub release list server-side, coalesces concurrent requests and caches a successful result for five minutes. The popup refreshes on opening/focus and periodically while open. Only complete, published releases with the four expected official installer URLs are offered. Drafts, in-progress uploads and foreign URLs are rejected. New releases do not require an EC2 rebuild just to update the displayed version/download links.

The publisher records each native build's signing configuration and appends version-matched JSON metadata to the release notes. A signed release is labelled as such only when its metadata matches the version; legacy releases have unknown publisher status. The UI does not present signing, functional tests or checksums as antivirus certification. Outages are labelled with a last-available-download fallback. The latest installer version is separate from Help → About's installed application version.
