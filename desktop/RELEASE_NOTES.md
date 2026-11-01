SIM PUSKAPA Desktop 0.3.0-beta.1 adds desktop update checking.

- Windows EXE/NSIS installations check for new releases after startup and every four hours, downloading updates in the background.
- When an update is ready, choose **Restart to Update** or **Later**. Updates never install automatically when quitting or shutting down.
- Use **Help → Check for Updates** to check manually or reopen a deferred update.
- Mac preview and Windows MSI installations notify you about new releases and offer **Download Update**. Automatic Mac installation requires a properly signed/notarized release; current Mac previews remain ad-hoc signed.
- Existing 0.1.0/0.2.0 users must install this version manually once. For automatic Windows updates, use the EXE installer.
- Notification email links, printing, downloads and browser sign-in remain available.

Install the Windows x64 EXE/MSI, macOS Apple Silicon arm64 DMG, or Intel x64 DMG. ZIPs, blockmaps and YAML files are update-system assets; users normally choose EXE or DMG. The app uses the same SIM PUSKAPA account, data and permissions and requires internet.

This beta release uses the beta update channel and can receive later beta releases and stable releases. Windows preview binaries are unsigned; Mac previews are ad-hoc signed without notarization. Operating system installation warnings may appear. SHA256SUMS.txt covers installers and update assets.
