#!/usr/bin/env python3
"""Apply UI-only SIM PUSKAPA v3 patch to a divergent EC2 trunk checkout.

Usage (from /home/ec2-user/simpuskapa, after fetching feature branch):
  git show FETCH_HEAD:scripts/apply_modern_ui_completion_20261031.py > /tmp/sim-ui-completion.py
  python3 /tmp/sim-ui-completion.py

Never merges, resets, changes backend, or creates a backup.
Prettier + TypeScript + Next build should be run after this patch.
"""
from __future__ import annotations

import os
from pathlib import Path
import re
import stat
import subprocess
import tempfile

ROOT = Path("/home/ec2-user/simpuskapa")
CSS_PATH = "src/styles/modern-dashboard.css"
CSS_MARKER = "/* SIM PUSKAPA UI completion v3 — isolated to unfinished modules. */"
FILES = {
    "src/pages/dashboard/finance/reporting.tsx": "finance",
    "src/pages/dashboard/finance/payment-request/index.tsx": "finance",
    "src/pages/dashboard/finance/employees-tax.tsx": "finance",
    "src/pages/dashboard/procurement/index.tsx": "procurement",
    "src/pages/dashboard/external/vendor-adm/index.tsx": "vendor",
    "src/pages/dashboard/external/vendor-adm/[id].tsx": "vendor",
    "src/pages/dashboard/external/vendor-adm/add.tsx": "wizard",
    "src/pages/dashboard/external/vendor-adm/edit/[id].tsx": "wizard",
    "src/pages/dashboard/internal/employee/index.tsx": "people",
    "src/pages/dashboard/internal/employee/[id].tsx": "people",
    "src/pages/dashboard/internal/employee/add.tsx": "wizard",
    "src/pages/dashboard/internal/employment-contract.tsx": "people",
    "src/pages/dashboard/internal/evaluation/index.tsx": "people",
    "src/pages/dashboard/internal/timeoff/all.tsx": "timeoff",
    "src/pages/dashboard/internal/timeoff/requests.tsx": "timeoff",
    "src/pages/dashboard/admin-zone/user-management/index.tsx": "admin",
    "src/pages/dashboard/user/need-approval/index.tsx": "workflow",
    "src/pages/dashboard/user/need-action/index.tsx": "workflow",
    "src/pages/dashboard/user/request-tracking/index.tsx": "workflow",
    "src/pages/dashboard/project/add.tsx": "wizard",
    "src/pages/dashboard/project/edit/[id].tsx": "wizard",
}


def abort(message: str) -> None:
    raise SystemExit("ABORT: " + message)


def git(*args: str) -> str:
    p = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True,
        text=True,
    )
    if p.returncode:
        abort(f"git {' '.join(args)}: {p.stderr[:700]}")
    return p.stdout


def wrap_dashboard(source: str, module: str, filename: str) -> str:
    marker = f'sim-ui-v3 sim-ui-v3--{module}'
    if marker in source:
        print("SKIP: already marked:", filename)
        return source
    if "sim-ui-v3" in source:
        abort(f"Unexpected partial UI marker: {filename}")
    if len(re.findall(r"<Dashboard(?:\s|>)", source)) != 1:
        abort(f"Dashboard opening not unique: {filename}")
    if source.count("</Dashboard>") != 1:
        abort(f"Dashboard closing not unique: {filename}")

    start = source.index("<Dashboard")
    # The opening tag ends before the first line of actual children.
    match = re.search(r">\s*\n", source[start : start + 1800])
    if not match:
        abort(f"Dashboard opening terminator missing: {filename}")
    opening_end = start + match.end()
    closing_start = source.index("</Dashboard>", opening_end)
    if closing_start < opening_end:
        abort(f"Dashboard closing before opening: {filename}")

    source = (
        source[:opening_end]
        + f'        <div className="{marker}">\n'
        + source[opening_end:]
    )
    closing_start = source.index("</Dashboard>", opening_end)
    source = source[:closing_start] + "        </div>\n      " + source[closing_start:]

    if source.count(marker) != 1 or source.count("</Dashboard>") != 1:
        abort(f"Final JSX wrapper invalid: {filename}")
    return source


def main() -> None:
    print("===== SIM PUSKAPA MODERN UI COMPLETION =====")
    print("Scope: frontend-only; 21 pages + one scoped stylesheet")
    print("New backup: NONE; git merge/reset: NONE")
    if not ROOT.is_dir():
        abort("Application directory not found")
    if git("branch", "--show-current").strip() != "trunk":
        abort("EC2 current branch is not trunk")
    if not (ROOT / "node_modules/.bin/prettier").exists():
        abort("Local Prettier binary unavailable")

    # Confirm this source is fetched from the intended GitHub feature branch.
    branch_sha = git("rev-parse", "FETCH_HEAD").strip()
    remote_css = git("show", f"FETCH_HEAD:{CSS_PATH}")
    if remote_css.count(CSS_MARKER) != 1:
        abort("Feature branch CSS marker missing/duplicated")
    css_addition = remote_css[remote_css.index(CSS_MARKER):]
    # Some pages (for example Procurement) intentionally use the shared
    # .sim-ui-v3 rules rather than their own module-specific CSS selector.
    # Verify the common styling first; only require selectors for modules
    # that actually have dedicated rules in this bundle.
    if ".sim-ui-v3 {" not in css_addition:
        abort("Shared UI completion CSS is missing")
    dedicated_modules = {"finance", "vendor", "people", "timeoff", "admin", "workflow", "wizard"}
    for module in sorted(dedicated_modules):
        if f".sim-ui-v3--{module}" not in css_addition:
            abort(f"Dedicated CSS module missing: {module}")
    print("Feature branch:", branch_sha[:12])

    existing = {}
    staged_content = {}
    for filename, module in FILES.items():
        path = ROOT / filename
        if not path.is_file():
            abort(f"Target page missing: {filename}")
        original = path.read_bytes()
        existing[filename] = original
        local = original.decode("utf-8")
        result = wrap_dashboard(local, module, filename)
        if result != local:
            staged_content[filename] = result.encode("utf-8")

    css_file = ROOT / CSS_PATH
    if not css_file.is_file():
        abort("Modern dashboard stylesheet missing")
    existing[CSS_PATH] = css_file.read_bytes()
    local_css = existing[CSS_PATH].decode("utf-8")
    if CSS_MARKER not in local_css:
        staged_content[CSS_PATH] = (local_css.rstrip() + "\n\n" + css_addition).encode("utf-8")
    else:
        if local_css.count(CSS_MARKER) != 1:
            abort("Partial duplicated CSS detected")
        print("SKIP: scoped UI stylesheet already installed")

    # Validate JSX/CSS via Prettier on stdin before any file write.
    for filename, data in list(staged_content.items()):
        formatted = subprocess.run(
            [str(ROOT / "node_modules/.bin/prettier"), "--stdin-filepath", filename],
            input=data,
            capture_output=True,
            cwd=ROOT,
        )
        if formatted.returncode != 0:
            abort(f"Prettier validation for {filename}: {formatted.stderr.decode('utf-8', 'replace')[:900]}")
        staged_content[filename] = formatted.stdout

    if not staged_content:
        print("PASS: UI completion patch already applied")
        return

    print("Ready to update", len(staged_content), "files")
    pending = []
    written = []
    try:
        for filename, data in staged_content.items():
            dest = ROOT / filename
            fd, tmppath = tempfile.mkstemp(prefix=".sim-ui-v3-", dir=dest.parent)
            os.close(fd)
            temporary = Path(tmppath)
            temporary.write_bytes(data)
            os.chmod(temporary, stat.S_IMODE(dest.stat().st_mode))
            pending.append((filename, temporary))
        for filename, temporary in pending:
            os.replace(temporary, ROOT / filename)
            written.append(filename)
    except Exception:
        for filename in written:
            (ROOT / filename).write_bytes(existing[filename])
        raise
    finally:
        for _, temporary in pending:
            temporary.unlink(missing_ok=True)

    print("========================================")
    print("UI COMPLETION PATCH SUCCESS")
    print("Pages checked: 21; updated:", len(written))
    print("Finance / Procurement / Vendor: SCOPED")
    print("Employee / Time Off / User Management: SCOPED")
    print("Need Approval / Need Action / Tracking: SCOPED")
    print("Add/Edit project/vendor/employee: SCOPED")
    print("Original handlers / API / approvals: PRESERVED")
    print("Backend / Prisma: NOT TOUCHED")
    print("Build/restart: NOT PERFORMED")
    print("========================================")


if __name__ == "__main__":
    main()
