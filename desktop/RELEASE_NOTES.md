SIM PUSKAPA Desktop 0.3.0-beta.2 keeps desktop update checking and adds release information for the website.

- The browser download popup reads the latest complete published release at runtime. Version text, Windows/macOS installer links and the email launch-page download link follow the current release without an EC2 rebuild for every new desktop version.
- The popup distinguishes the latest installer from the version installed on a computer. If GitHub cannot be reached, it labels the last available download instead of claiming it is current.
- Publisher status comes from release metadata. The previous generic security-warning sentence is replaced by a specific signing status and a link to release notes.
- Windows EXE/NSIS keeps automatic background downloads with **Restart to Update** / **Later**. Mac previews and MSI keep manual downloads; Mac automatic installation requires proper Apple signing.
- Existing Desktop 0.3.0-beta.1 EXE users can receive this release through the updater. Older versions need a one-time manual installation.

Signing for this release: Windows installers are {{WINDOWS_SIGNING}}; Mac applications are {{MAC_SIGNING}}. Signing identifies a publisher; it is not an antivirus scan result. Functional tests and checksums do not certify that a file is free of all malware.

Choose Windows x64 EXE/MSI, Apple Silicon arm64 DMG or Intel x64 DMG. ZIPs, blockmaps and YAML files support the update system. SHA256SUMS.txt covers installers and update files. An internet connection is required.
