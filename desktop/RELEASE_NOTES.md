SIM PUSKAPA Desktop 0.2.0 adds notification links for Windows and macOS.

- Open a SIM PUSKAPA notification email, then choose **Open in Desktop** or **Continue in Browser**.
- Windows and macOS recognize the `simpuskapa://` link after installing this version. Your browser may ask permission to open SIM PUSKAPA.
- The original notification destination is preserved through sign-in, including Google Workspace sign-in.
- If the app cannot be opened, the launch page continues in the browser. Browsers cannot reliably report whether an app is installed; a browser link is always available.
- Existing version 0.1.0 users must install this update to enable notification links. Desktop binary auto-update is not enabled.

Windows x64: choose the EXE installer or MSI. Mac: choose arm64 for Apple Silicon or x64 for Intel.

The app connects to https://sim.puskapa.org with the same account, data, and access permissions as the browser. An internet connection is required. The website and email transport must be deployed before new notification emails include the launch page.

This is a preview release. Windows installers are unsigned; Mac applications are ad-hoc signed without Apple notarization. Operating system installation warnings may appear. SHA-256 checksums are included.
