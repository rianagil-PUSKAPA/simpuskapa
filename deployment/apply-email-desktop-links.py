#!/usr/bin/env python3
"""Stage and deploy email desktop links on the existing EC2 checkout.

Preserves Git remotes/index/branch and merges local edits before building. No
database migration, dependency installation, or test email is performed.
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
BASE = "caf43d4ea574310007b6ae03f08e324a00be177a"
RELEASE = "https://github.com/rianagil-PUSKAPA/simpuskapa/releases/download/v0.2.0-preview.1"
FILES = [
    "src/shared/app-links.cjs", "src/utils/desktop-launch.cjs",
    "src/utils/post-login-destination.ts", "src/pages/open.tsx",
    "src/components/NotificationLinkLauncher.tsx",
    "src/components/NotificationLinkLauncher.module.css",
    "src/config/desktop-release.ts", "src/middleware.ts", "src/pages/login.tsx",
    "src/pages/welcome.tsx", "src/pages/change-password.tsx",
    "src/server/commands/mail.transporter.ts",
]
INSTALLERS = ["Windows-x64-Setup.exe", "Windows-x64-Setup.msi", "macOS-arm64.dmg", "macOS-x64.dmg"]


def capture(args, root):
    return subprocess.check_output(args, cwd=str(root), text=True).strip()


def select_processes(root):
    apps = json.loads(capture(["pm2", "jlist"], root))
    selected = {}
    for kind in ["FRONTEND", "BACKEND"]:
        candidates = []
        override = os.environ.get("SIM_PUSKAPA_" + kind)
        for app in apps:
            env = app.get("pm2_env", {})
            if Path(env.get("pm_cwd", "/")).resolve() != root:
                continue
            args = env.get("args", [])
            args = " ".join(map(str, args)) if isinstance(args, list) else str(args)
            command = str(env.get("pm_exec_path", "")) + " " + args
            if override:
                match = app["name"] == override
            elif kind == "FRONTEND":
                match = "next" in command.lower() or app["name"].lower() in {"web", "frontend", "simpuskapa-web", "sim-puskapa-web"}
            else:
                match = bool(re.search(r"dist(?:-server)?[/\\]server[/\\]main\.js|start:(?:nest|prod)\b", command))
            if match:
                if env.get("watch") or "--watch" in command or "start:nest-dev" in command or "next dev" in command:
                    raise RuntimeError("PM2 watch mode is enabled; use the normal server deployment process.")
                candidates.append((app["name"], command))
        names = {name for name, command in candidates}
        if len(names) != 1:
            raise RuntimeError("Cannot identify one " + kind.lower() + ". Set SIM_PUSKAPA_" + kind + " to its exact PM2 name and rerun.")
        selected[kind] = candidates[0]
    if selected["FRONTEND"][0] == selected["BACKEND"][0]:
        raise RuntimeError("Frontend and backend must be separate PM2 processes.")
    command = selected["BACKEND"][1]
    scripts = json.loads((root / "package.json").read_text())["scripts"]
    for name, script in scripts.items():
        if re.search(r"(?:^|\s)" + re.escape(name) + r"(?:\s|$)", command):
            command += " " + script
    match = re.search(r"(?:^|\s|/)(dist-server|dist)[/\\]server[/\\]main\.js\b", command)
    if not match:
        raise RuntimeError("Cannot identify the backend build directory from its PM2 command.")
    return selected["FRONTEND"][0], selected["BACKEND"][0], match.group(1)


def normalize_welcome(name, data):
    # The previous EC2 helper inserted this import at the top of the file.
    # Normalize its position so a three-way merge can retain unrelated edits.
    if name != "src/pages/welcome.tsx":
        return data
    text = data.decode()
    line = "import { resetDesktopAnnouncement } from '@/utils/desktop-announcement'"
    anchor = "import { MAIN_URL_BE } from '@/utils/constant'"
    if text.count(line) == 1 and text.count(anchor) == 1:
        text = text.replace(line + "\n", "")
        text = text.replace(anchor, anchor + "\n" + line)
    return text.encode()


def merge_source(root, stage, name, incoming):
    current = (root / name).read_bytes() if (root / name).exists() else None
    base = subprocess.run(["git", "show", BASE + ":" + name], cwd=str(root), stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    if base.returncode:
        if current is not None and current != incoming:
            raise RuntimeError("A new feature file already has different local content: " + name)
        return incoming
    if current is None:
        raise RuntimeError("Existing source file is missing: " + name)
    paths = [stage / "merge-current", stage / "merge-base", stage / "merge-incoming"]
    for path, data in zip(paths, [current, base.stdout, incoming]):
        path.write_bytes(normalize_welcome(name, data))
    result = subprocess.run(["git", "merge-file", "-p", *map(str, paths)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError("Local changes overlap this update: " + name + ". No live source/build was changed.")
    return result.stdout


def public_check():
    target = "/dashboard/aar/deployment-check?preview=1"
    from urllib.parse import quote
    for _ in range(8):
        try:
            req = Request("https://sim.puskapa.org/open?target=" + quote(target, safe="") + "&check=" + str(int(time.time())),
                          headers={"Cache-Control": "no-cache"})
            with urlopen(req, timeout=5) as response:
                if response.status != 200 or b"Open in SIM PUSKAPA" not in response.read(250000):
                    raise ValueError("Launch page is not ready")
            try:
                urlopen("https://api.sim.puskapa.org/v1/users/me", timeout=5).close()
                raise ValueError("Expected an unauthenticated API response")
            except HTTPError as error:
                if error.code != 401:
                    raise
            return True
        except (OSError, ValueError):
            time.sleep(2)
    return False


def main():
    root = Path.cwd().resolve()
    if not (root / "src/components/DesktopDownloadAnnouncement.tsx").is_file():
        raise RuntimeError("Run from the existing production checkout after deploying the desktop announcement.")
    if Path(capture(["git", "rev-parse", "--show-toplevel"], root)).resolve() != root:
        raise RuntimeError("Run from the root of the existing Git checkout.")
    for command in ["git", "node", "pnpm", "pm2"]:
        if not shutil.which(command):
            raise RuntimeError("Required command not found: " + command)
    processes = select_processes(root)
    frontend, backend, backend_build = processes
    for directory in [".next", backend_build]:
        if not (root / directory).is_dir() or (root / directory).is_symlink():
            raise RuntimeError("Expected an existing application build directory: " + directory)
    print("PM2 frontend:", frontend, "; backend:", backend, "; backend build:", backend_build, flush=True)
    before = [capture(args, root) for args in [["git", "rev-parse", "HEAD"], ["git", "remote", "-v"], ["git", "rev-parse", "--abbrev-ref", "HEAD"]]]
    for suffix in INSTALLERS:
        with urlopen(Request(RELEASE + "/SIM-PUSKAPA-0.2.0-" + suffix, method="HEAD"), timeout=30) as response:
            if response.status != 200 or "text/html" in response.headers.get("Content-Type", ""):
                raise RuntimeError("Wait for the four 0.2.0 release installers to finish publishing.")
    subprocess.run(["git", "fetch", "--no-tags", SOURCE, "trunk"], cwd=str(root), check=True)
    commit = sys.argv[1] if len(sys.argv) > 1 else capture(["git", "rev-parse", "FETCH_HEAD"], root)
    if not re.fullmatch(r"[a-f0-9]{40}", commit):
        raise RuntimeError("Invalid source commit")

    stage = Path(tempfile.mkdtemp(prefix=root.name + "-email-links-build-", dir=str(root.parent)))
    backup = None
    stopped = []
    moved_old = []
    moved_new = []
    original = {}
    try:
        merged = {}
        for name in FILES:
            incoming = subprocess.check_output(["git", "show", commit + ":" + name], cwd=str(root))
            original[name] = (root / name).read_bytes() if (root / name).exists() else None
            merged[name] = merge_source(root, stage, name, incoming)
        build_root = stage / "project"
        ignore = shutil.ignore_patterns(".git", "node_modules", ".next", ".next-*", "dist", "dist-*", "desktop", "storage", ".aws", "coverage", "test-results", "playwright-report", ".pnpm-store", "backup*", "*.backup*", "*.pem", "*.key", "*.zip", "*.log", "*.tsbuildinfo")
        shutil.copytree(str(root), str(build_root), ignore=ignore)
        (build_root / "node_modules").symlink_to(root / "node_modules", target_is_directory=True)
        (build_root / "desktop").mkdir()
        shutil.copy2(str(root / "desktop/handoff.cjs"), str(build_root / "desktop/handoff.cjs"))
        for name, data in merged.items():
            dest = build_root / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
        subprocess.run(["pnpm", "exec", "prettier", "--write", *FILES], cwd=str(build_root), check=True)
        print("Building frontend and backend in a private staging directory...", flush=True)
        subprocess.run(["pnpm", "run", "build:next"], cwd=str(build_root), check=True)
        subprocess.run(["pnpm", "exec", "nest", "build", "--path", "./tsconfig.server.json"], cwd=str(build_root), check=True)
        for file in [".next/BUILD_ID", "dist-server/server/main.js", "dist-server/shared/app-links.cjs"]:
            if not (build_root / file).is_file():
                raise RuntimeError("Staged build is incomplete: " + file)
        if select_processes(root) != processes:
            raise RuntimeError("PM2 configuration changed during build; stopped before deployment.")
        if any(((root / name).read_bytes() if (root / name).exists() else None) != data for name, data in original.items()):
            raise RuntimeError("Source changed during build; stopped before deployment.")
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        backup = root.parent / (root.name + "-email-links-backup-" + stamp)
        backup.mkdir(mode=0o700)
        for name, data in original.items():
            if data is not None:
                dest = backup / "source" / name
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
        (backup / "manifest.json").write_text(json.dumps({"source_commit": commit, "frontend": frontend, "backend": backend, "backend_build": backend_build, "new_files": [name for name, data in original.items() if data is None]}, indent=2))
        for name in [frontend, backend]:
            subprocess.run(["pm2", "stop", name], cwd=str(root), check=True)
            stopped.append(name)
        for live, staged in [(".next", ".next"), (backend_build, "dist-server")]:
            if (root / live).exists():
                (root / live).rename(backup / ("previous-" + live))
                moved_old.append(live)
            (build_root / staged).rename(root / live)
            moved_new.append(live)
        for name in FILES:
            dest = root / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes((build_root / name).read_bytes())
        for name in [backend, frontend]:
            subprocess.run(["pm2", "restart", name], cwd=str(root), check=True)
        if not public_check():
            raise RuntimeError("Public launch page/API health checks failed.")
        after = [capture(args, root) for args in [["git", "rev-parse", "HEAD"], ["git", "remote", "-v"], ["git", "rev-parse", "--abbrev-ref", "HEAD"]]]
        if before != after:
            raise RuntimeError("Git configuration changed during deployment; inspect it before proceeding.")
        print("SUCCESS: desktop email links deployed. Backup:", backup, flush=True)
        print("New notification emails now use the desktop/browser launch page. Install Desktop 0.2.0 to open them in the app.", flush=True)
    except BaseException:
        if stopped:
            print("Restoring previous source and both application builds...", flush=True)
            for name in stopped:
                subprocess.run(["pm2", "stop", name], cwd=str(root), check=False)
            for live in moved_new:
                if (root / live).exists():
                    (root / live).rename(backup / ("failed-" + live))
            for live in moved_old:
                (backup / ("previous-" + live)).rename(root / live)
            for name, data in original.items():
                if data is None:
                    if (root / name).exists():
                        (root / name).unlink()
                else:
                    (root / name).write_bytes(data)
            for name in reversed(stopped):
                subprocess.run(["pm2", "restart", name], cwd=str(root), check=False)
        raise
    finally:
        shutil.rmtree(str(stage), ignore_errors=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("ERROR:", error, file=sys.stderr)
        sys.exit(1)
