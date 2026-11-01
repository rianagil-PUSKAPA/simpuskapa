#!/usr/bin/env python3
"""Deploy the browser announcement and desktop sign-in bridge on the existing EC2 app.

Run from the production project directory. This script fetches source without
changing Git remotes, the checked-out branch, or the Git index. It builds in a
private staging directory and switches the frontend build only after success.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

SOURCE = "https://github.com/rianagil-PUSKAPA/simpuskapa.git"
RELEASE = "https://github.com/rianagil-PUSKAPA/simpuskapa/releases/download/v0.1.0-preview.1"
NEW_FILES = [
    "src/components/DesktopDownloadAnnouncement.tsx",
    "src/components/DesktopDownloadAnnouncement.module.css",
    "src/config/desktop-release.ts",
    "src/utils/desktop-announcement.ts",
    "src/pages/desktop/connect.tsx",
    "src/pages/api/desktop/session.ts",
    "desktop/handoff.cjs",
]
PATCH_FILES = ["src/pages/dashboard/index.tsx", "src/pages/welcome.tsx"]
INSTALLERS = [
    "SIM-PUSKAPA-0.1.0-Windows-x64-Setup.exe",
    "SIM-PUSKAPA-0.1.0-Windows-x64-Setup.msi",
    "SIM-PUSKAPA-0.1.0-macOS-arm64.dmg",
    "SIM-PUSKAPA-0.1.0-macOS-x64.dmg",
]


def capture(args, root):
    return subprocess.check_output(args, cwd=str(root), text=True).strip()


def patch_dashboard(text):
    import_line = "import { DesktopDownloadAnnouncement } from '@/components/DesktopDownloadAnnouncement'"
    tag = "<DesktopDownloadAnnouncement userId={userLoggedinInformation?.id} />"
    if "<DesktopDownloadAnnouncement" in text:
        if tag not in text:
            raise RuntimeError("An existing desktop announcement uses a different integration. Review it first.")
        return text
    anchors = list(re.finditer(r"<NextSeo\b[\s\S]*?/>", text))
    if len(anchors) != 1 or "userLoggedinInformation" not in text:
        raise RuntimeError("Cannot find a unique dashboard insertion point; no source was changed.")
    anchor = anchors[0]
    text = text[: anchor.end()] + "\n      " + tag + text[anchor.end() :]
    if import_line not in text:
        text = import_line + "\n" + text
    return text


def patch_welcome(text):
    import_line = "import { resetDesktopAnnouncement } from '@/utils/desktop-announcement'"
    if "resetDesktopAnnouncement()" in text:
        return text
    pattern = r"(if\s*\(auth_token\)\s*\{)"
    if len(re.findall(pattern, text)) != 1:
        raise RuntimeError("Cannot find a unique welcome-page insertion point; no source was changed.")
    text = re.sub(pattern, r"\1\n      resetDesktopAnnouncement()", text, count=1)
    if import_line not in text:
        text = import_line + "\n" + text
    return text


def select_frontend(root):
    apps = json.loads(capture(["pm2", "jlist"], root))
    selected = os.environ.get("SIM_PUSKAPA_FRONTEND", "")
    candidates = []
    for app in apps:
        env = app.get("pm2_env", {})
        cwd = Path(env.get("pm_cwd", "/")).resolve()
        if cwd != root:
            continue
        name = app.get("name", "")
        args = env.get("args", [])
        args = " ".join(map(str, args)) if isinstance(args, list) else str(args)
        command = str(env.get("pm_exec_path", "")) + " " + args
        if selected:
            matches = selected == name
        else:
            matches = "next" in command.lower() or name.lower() in {"web", "frontend", "simpuskapa-web", "sim-puskapa-web"}
        if matches:
            candidates.append(app)
    names = {app["name"] for app in candidates}
    if len(names) != 1:
        raise RuntimeError("Cannot identify one frontend in this folder. Set SIM_PUSKAPA_FRONTEND to its exact PM2 name and rerun.")
    if any(app.get("pm2_env", {}).get("watch") for app in candidates):
        raise RuntimeError("PM2 watch mode is enabled; use the server's normal deployment process instead.")
    return next(iter(names))


def verify_installers():
    for name in INSTALLERS:
        request = Request(RELEASE + "/" + name, method="HEAD", headers={"User-Agent": "SIM-PUSKAPA-deployment"})
        with urlopen(request, timeout=30) as response:
            if response.status != 200 or "text/html" in response.headers.get("Content-Type", ""):
                raise RuntimeError("The desktop release files are not available yet. Wait for the successful GitHub release build.")


def health_check():
    url = "https://sim.puskapa.org/api/desktop/session?deployment_check=" + str(int(time.time()))
    for _ in range(6):
        try:
            request = Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "SIM-PUSKAPA-deployment"})
            with urlopen(request, timeout=5) as response:
                if response.status == 200 and json.loads(response.read(4096)).get("version") == 1:
                    return True
        except (HTTPError, OSError, ValueError):
            pass
        time.sleep(2)
    return False


def main():
    root = Path.cwd().resolve()
    if not (root / "src/pages/dashboard/index.tsx").is_file():
        raise RuntimeError("Run this command from the existing SIM PUSKAPA production project directory.")
    if Path(capture(["git", "rev-parse", "--show-toplevel"], root)).resolve() != root:
        raise RuntimeError("The current folder must be the root of the existing Git checkout.")
    for command in ["git", "node", "pnpm", "pm2"]:
        if not shutil.which(command):
            raise RuntimeError("Required command not found: " + command)
    frontend = select_frontend(root)
    before_head = capture(["git", "rev-parse", "HEAD"], root)
    before_branch = capture(["git", "rev-parse", "--abbrev-ref", "HEAD"], root)
    before_remotes = capture(["git", "remote", "-v"], root)
    print("Frontend identified:", frontend, flush=True)
    print("Checking the four public installer downloads...", flush=True)
    verify_installers()

    subprocess.run(["git", "fetch", "--no-tags", SOURCE, "trunk"], cwd=str(root), check=True)
    source_sha = sys.argv[1] if len(sys.argv) > 1 else capture(["git", "rev-parse", "FETCH_HEAD"], root)
    if not re.fullmatch(r"[a-f0-9]{40}", source_sha):
        raise RuntimeError("Invalid source commit.")
    files = {
        name: subprocess.check_output(["git", "show", source_sha + ":" + name], cwd=str(root))
        for name in NEW_FILES
    }
    files[PATCH_FILES[0]] = patch_dashboard((root / PATCH_FILES[0]).read_text(encoding="utf-8")).encode()
    files[PATCH_FILES[1]] = patch_welcome((root / PATCH_FILES[1]).read_text(encoding="utf-8")).encode()
    original = {name: (root / name).read_bytes() if (root / name).is_file() else None for name in files}
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup = root.parent / (root.name + "-desktop-backup-" + stamp)
    backup.mkdir(mode=0o700)
    for name, data in original.items():
        if data is not None:
            target = backup / "source" / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
    (backup / "manifest.json").write_text(json.dumps({"source_commit": source_sha, "frontend": frontend, "new_files": [n for n, data in original.items() if data is None]}, indent=2))
    print("Source backup:", backup, flush=True)

    stage = None
    stopped = False
    old_build_moved = False
    new_build_moved = False
    try:
        for name, data in files.items():
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        subprocess.run(["pnpm", "exec", "prettier", "--write", *files.keys()], cwd=str(root), check=True)
        subprocess.run(["pnpm", "exec", "tsc", "--noEmit", "--pretty", "false"], cwd=str(root), check=True)

        stage = Path(tempfile.mkdtemp(prefix=root.name + "-desktop-build-", dir=str(root.parent)))
        # Keep credentials only in the private temporary build directory; never include signing keys or uploads.
        ignore = shutil.ignore_patterns(".git", "node_modules", ".next", ".next-*", "dist", "dist-*", "storage", "desktop", ".aws", "coverage", "test-results", "playwright-report", ".pnpm-store", "backup*", "*.backup*", "*.pem", "*.key", "*.zip", "*.log")
        build_root = stage / "project"
        shutil.copytree(str(root), str(build_root), ignore=ignore)
        (build_root / "node_modules").symlink_to(root / "node_modules", target_is_directory=True)
        (build_root / "desktop").mkdir(exist_ok=True)
        shutil.copy2(str(root / "desktop/handoff.cjs"), str(build_root / "desktop/handoff.cjs"))
        print("Building the frontend in a private staging folder...", flush=True)
        subprocess.run(["pnpm", "run", "build:next"], cwd=str(build_root), check=True)
        if not (build_root / ".next/BUILD_ID").is_file():
            raise RuntimeError("The new frontend build is incomplete.")
        if select_frontend(root) != frontend:
            raise RuntimeError("The frontend process changed while building. Deployment stopped.")

        subprocess.run(["pm2", "stop", frontend], cwd=str(root), check=True)
        stopped = True
        if (root / ".next").exists():
            (root / ".next").rename(backup / "previous-next")
            old_build_moved = True
        (build_root / ".next").rename(root / ".next")
        new_build_moved = True
        subprocess.run(["pm2", "restart", frontend], cwd=str(root), check=True)
        if not health_check():
            raise RuntimeError("The public desktop connection endpoint did not become healthy.")
        if (
            capture(["git", "rev-parse", "HEAD"], root) != before_head
            or capture(["git", "rev-parse", "--abbrev-ref", "HEAD"], root) != before_branch
            or capture(["git", "remote", "-v"], root) != before_remotes
        ):
            raise RuntimeError("Git configuration changed during deployment; inspect before continuing.")
        print("SUCCESS: desktop popup and browser sign-in deployed.", flush=True)
        print("Git remotes and the current branch were preserved.", flush=True)
        print("Verify in the browser: sign out, sign in, and open the main dashboard.", flush=True)
    except BaseException:
        print("Deployment failed. Restoring the previous source and frontend build...", flush=True)
        if stopped:
            subprocess.run(["pm2", "stop", frontend], cwd=str(root), check=False)
        if new_build_moved and (root / ".next").exists():
            (root / ".next").rename(backup / "failed-next")
        if old_build_moved:
            (backup / "previous-next").rename(root / ".next")
        for name, data in original.items():
            if data is None:
                if (root / name).exists():
                    (root / name).unlink()
            else:
                (root / name).write_bytes(data)
        if stopped:
            subprocess.run(["pm2", "restart", frontend], cwd=str(root), check=False)
        raise
    finally:
        if stage is not None:
            shutil.rmtree(str(stage), ignore_errors=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("ERROR:", error, file=sys.stderr)
        sys.exit(1)
