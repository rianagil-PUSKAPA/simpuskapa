# Notification links in Desktop 0.2.0

New notification emails keep the existing SIM PUSKAPA email template. Dashboard button URLs go through `https://sim.puskapa.org/open?target=...`, where users can select **Open in Desktop** or the text link **Continue in Browser**. The page uses the same compact white/orange design as the desktop announcement.

On Windows/macOS the page attempts `simpuskapa://open?target=...`. A browser may require the user to click **Open in Desktop** before showing its native permission dialog. That dialog belongs to the browser/operating system and cannot be styled by the website. Install Desktop 0.2.0 to register the protocol; Desktop 0.1.0 does not support it.

There is no dependable browser API for detecting whether an arbitrary desktop application is installed. An unavailable or blocked launch normally falls back to the original browser destination after six seconds. The fallback pauses when the page loses focus, allowing time to respond to the browser prompt. If the page becomes hidden, automatic fallback stops; users can still choose the browser link when they return. These focus/visibility signals are best effort and do not prove that the app opened.

Mobile browsers continue directly to the website. Email links opened inside the desktop client go straight to their destination. The path and query parameters survive password and Google Workspace sign-in; forced password changes still apply. Only production-origin dashboard destinations are accepted. Tokens and arbitrary external URLs are rejected.

The shared mail transport covers existing workflow notifications and the AAR sender. Recipient selection, approval rules, AAR's test recipient, PDF attachments, subjects, password-reset links, and the email HTML layout are preserved. Previously delivered emails retain their original links.

## Deployment

1. Merge the PR after the Windows/macOS checks pass. Wait for the latest desktop release to contain the Windows EXE/MSI, both Mac DMGs and SHA256SUMS.txt.
2. From the existing EC2 checkout, run `deployment/apply-email-desktop-links.py` with the merged commit SHA. This deployment must rebuild both the frontend and backend: the backend creates the new email URLs.
3. Install Desktop 0.3.0-beta.1 on Windows/macOS. Existing users install this update manually once; see [AUTO_UPDATES.md](AUTO_UPDATES.md) for automatic Windows EXE updates and Mac/MSI limitations.
4. Open a new notification email. Verify the browser permission prompt, desktop navigation to the specific item, browser choice, browser fallback without a registered handler, and destination preservation after signing out. No real notification emails are sent by the automated tests or deployment helper.

The helper fetches source from the public repository without switching the EC2 repository, branch or Git index. It merges local source changes against the previous desktop release; overlapping edits stop deployment before any live files change. Both builds complete in a private staging directory before the two identified PM2 processes stop. Source and builds are backed up, with rollback if switching or public checks fail. It runs no migrations and changes no dependencies. It accepts `SIM_PUSKAPA_FRONTEND` / `SIM_PUSKAPA_BACKEND` when PM2 names cannot be identified automatically; it refuses watch processes or an unknown backend build path. It must be run on EC2 by an operator with the existing server access.
