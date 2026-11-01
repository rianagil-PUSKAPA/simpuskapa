# SIM PUSKAPA Desktop

An online desktop client for **https://sim.puskapa.org**, packaged independently from the Next.js/NestJS application. It uses the existing production service and permissions. No database or server secrets are included in the application.

## Installers

The **SIM PUSKAPA Desktop installers** Actions workflow generates:

| Computer                 | Installer                                           |
| ------------------------ | --------------------------------------------------- |
| Windows x64              | `SIM-PUSKAPA-0.1.0-Windows-x64-Setup.exe` or `.msi` |
| Mac with Intel processor | `SIM-PUSKAPA-0.1.0-macOS-x64.dmg`                   |
| Mac with Apple Silicon   | `SIM-PUSKAPA-0.1.0-macOS-arm64.dmg`                 |

Open the successful run in GitHub → Actions, download its **Artifacts**, unzip the download, and choose the installer for your computer. Each artifact also contains `SHA256SUMS.txt`. Artifacts expire after 30 days.

Branch builds are **preview builds**: Windows installers are unsigned and Mac applications are ad-hoc signed, without Apple notarization. Operating systems may warn about or block these previews. Prepare organizational signing certificates and Apple notarization before distributing the application broadly. This workflow does not publish releases or deploy the production website.

## Run or build locally

Use Node.js 22 or later. Run from this directory, without installing the server's dependencies:

```sh
npm ci
npm test
npm run start
```

Build Windows installers on Windows:

```sh
npm run test:smoke
npm run dist:win
node scripts/checksums.cjs
```

Build both Mac installers on macOS:

```sh
npm run test:smoke
npm run dist:mac
node scripts/checksums.cjs
```

Output is written to `desktop/dist/`. The application bundle includes only the allowlisted desktop code and assets. The existing logo is used for the application icons.

## Google Workspace sign-in

Email/password sign-in uses the existing website immediately. Google Workspace sign-in uses the system browser, so its desktop connection support must first be deployed through the normal **frontend** deployment process. Deploy these files together:

- `src/pages/desktop/connect.tsx`
- `src/pages/api/desktop/session.ts`
- `desktop/handoff.cjs`

No NestJS routes, OAuth client configuration, database migrations, or approval rules need changing. The Next.js server uses its existing `JWT_SECRET` to verify the browser session. The endpoint deliberately supports only the production origin `https://sim.puskapa.org`.

Flow:

1. Choose **Continue with Google Workspace** in the desktop login page, or **File → Sign in with browser**.
2. The application starts a temporary listener bound only to `127.0.0.1` and opens `/desktop/connect` in the system browser.
3. Sign in through the browser tab, return to the connection tab, and choose **Connect to Desktop**.
4. The web server verifies the active account's existing JWT and encrypts the session for this application instance using RSA-OAEP/SHA-256 and AES-256-GCM. No plaintext credentials are sent to the local callback.
5. The application accepts the matching, unexpired transfer once, closes its listener, and uses the existing `/welcome` route to establish the desktop session.

The listener expires after five minutes; an encrypted transfer expires after one minute. Cross-origin exports, malformed keys, non-loopback callback destinations, inactive accounts, and invalid JWTs are rejected. No session tokens are logged by the new code. If the connection endpoint is not deployed, the application explains that browser sign-in is unavailable and keeps email/password sign-in available.

## Print, attachments, and navigation

- The existing **Print Form** code opens `about:blank`, writes its document, then prints. That opener relationship is preserved with sandboxing and context isolation enabled. The current web print dialog is retained; the user can select a printer or the OS's Save as PDF option.
- Website-generated PDF/Excel downloads use a native save dialog and retain the supplied filename. Google Drive and other external links open in the system browser.
- File selection/upload uses the existing HTML controls. Real authenticated uploads, production role-specific forms, and each Windows/macOS print dialog still require acceptance testing with a test account.
- Losing the connection shows a retry page. Transactions require internet; offline edits and synchronization are not implemented.
- The desktop session persists in the OS application data directory, separately from browser sessions. Use the website's normal Logout action to end the session.
- Web updates are received from the server. Changes to Electron or the desktop shell require a new installer; automatic binary updates are not enabled in this first version.

## Signed distribution

Preview CI intentionally receives no signing secrets. For a controlled release build, set `SIM_DESKTOP_SIGNED=true` in a protected build environment and supply the applicable electron-builder signing configuration:

- Windows: `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD`, or the organization's supported signing service configuration.
- macOS: `CSC_LINK`, `CSC_KEY_PASSWORD`, and Apple notarization credentials (`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, or the supported App Store Connect API-key variables).

The signed configuration requires code signing and macOS notarization. Credentials belong in protected CI secrets, never in source files or installer assets. See [electron-builder code signing](https://www.electron.build/v26/code-signing) and [Electron distribution](https://www.electronjs.org/docs/latest/tutorial/distribution-overview).

## Verification

`npm test` exercises origin restrictions, download names, encrypted handoff integrity/expiry, the real loopback receiver, cancellation, and the Next.js endpoint's session authorization. `npm run test:smoke` launches the actual Electron application against mocked website responses, checks renderer isolation, writes a print popup, generates an A4 PDF, downloads a blob, and verifies offline recovery. CI runs this smoke test on both Windows and macOS before packaging.

The rolling EC2 snapshot's root `.gitignore` ignores `.github/workflows/`. The desktop workflow is intentionally tracked as a build-only exception; use `git add -f .github/workflows/desktop-installers.yml` if recreating this change locally. Existing deployment automations remain outside this change.
