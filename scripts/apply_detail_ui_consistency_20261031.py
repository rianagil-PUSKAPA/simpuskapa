#!/usr/bin/env python3
"""Apply isolated RF/Vendor/Employee detail UI polish to a divergent EC2 trunk.

Run after:
    git fetch --no-tags origin feature/modern-detail-ui-consistency-20261031
    git show FETCH_HEAD:scripts/apply_detail_ui_consistency_20261031.py > /tmp/sim-detail-ui-fix.py
    python3 /tmp/sim-detail-ui-fix.py

Only touches targeted class markers and appends isolated CSS. No backend,
schema, approval, merging, or new backups.
"""
from pathlib import Path
import os
import stat
import subprocess
import tempfile

ROOT = Path("/home/ec2-user/simpuskapa")
CSS_PATH = "src/styles/modern-dashboard.css"
CSS_MARKER = "/* Form detail consistency v4: RF pending body + Vendor/Employee detail. */"

REPLACEMENTS = {
    "src/layout/procurement/RequisitionDetail.tsx": (
        "<div className={cn(!isApprovedByPMHOO && 'px-10 py-8')}>",
        "<div className={cn(!isApprovedByPMHOO && 'px-10 py-8 sim-rf-pending-panel')}>",
    ),
    "src/pages/dashboard/external/vendor-adm/[id].tsx": (
        'className="sim-ui-v3 sim-ui-v3--vendor"',
        'className="sim-ui-v3 sim-ui-v3--vendor sim-ui-v3--detail-vendor"',
    ),
    "src/pages/dashboard/internal/employee/[id].tsx": (
        'className="sim-ui-v3 sim-ui-v3--people"',
        'className="sim-ui-v3 sim-ui-v3--people sim-ui-v3--detail-employee"',
    ),
}

def abort(message: str) -> None:
    raise SystemExit("ABORT: " + message)

def git(*args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        abort("git " + " ".join(args) + ": " + result.stderr[:500])
    return result.stdout

def fmt(path: str, text: str) -> bytes:
    result = subprocess.run(
        [str(ROOT / "node_modules/.bin/prettier"), "--stdin-filepath", path],
        cwd=ROOT,
        input=text,
        capture_output=True,
        text=True,
    )
    if result.returncode:
        abort(f"Prettier failed in {path}:\n{result.stderr[:700]}")
    return result.stdout.encode("utf-8")

def main() -> None:
    print("===== MODERN RF + VENDOR + EMPLOYEE DETAIL UI =====")
    print("Workflow/approval changes: NONE | Backup: NONE")
    if git("branch", "--show-current").strip() != "trunk":
        abort("Expected EC2 local trunk")
    if not (ROOT / "node_modules/.bin/prettier").exists():
        abort("Local Prettier is not installed")

    fetched_css = git("show", f"FETCH_HEAD:{CSS_PATH}")
    if fetched_css.count(CSS_MARKER) != 1:
        abort("Expected latest feature branch CSS marker once")
    css_addition = fetched_css[fetched_css.index(CSS_MARKER):]
    required = [
        "sim-rf-pending-panel",
        "sim-ui-v3--detail-vendor",
        "sim-ui-v3--detail-employee",
        "@media (max-width: 600px)",
    ]
    for marker in required:
        if marker not in css_addition:
            abort(f"Missing expected UI style: {marker}")

    paths = [*REPLACEMENTS, CSS_PATH]
    old_bytes = {}
    new_bytes = {}

    for path in paths:
        file = ROOT / path
        if not file.is_file():
            abort(f"Missing local file: {path}")
        old_bytes[path] = file.read_bytes()

    for path, (old, new) in REPLACEMENTS.items():
        text = old_bytes[path].decode("utf-8")
        old_count, new_count = text.count(old), text.count(new)
        if new_count == 1 and old_count == 0:
            print("SKIP already present:", path)
            continue
        if old_count != 1 or new_count != 0:
            abort(f"Unsafe local structure in {path}: old={old_count}, new={new_count}")
        new_bytes[path] = fmt(path, text.replace(old, new, 1))
        print("PREPARED:", path)

    local_css = old_bytes[CSS_PATH].decode("utf-8")
    if CSS_MARKER not in local_css:
        new_bytes[CSS_PATH] = fmt(CSS_PATH, local_css.rstrip() + "\n\n" + css_addition)
        print("PREPARED:", CSS_PATH)
    elif local_css.count(CSS_MARKER) != 1:
        abort("Duplicate style marker in local CSS")
    else:
        print("SKIP already present: ", CSS_PATH)

    if not new_bytes:
        print("PASS: All detail UI patches are already applied")
        return

    # All format and source checks completed before any local write.
    staged = []
    written = []
    try:
        for path, blob in new_bytes.items():
            destination = ROOT / path
            fd, name = tempfile.mkstemp(prefix=".sim-detail-ui-", dir=destination.parent)
            os.close(fd)
            temporary = Path(name)
            temporary.write_bytes(blob)
            os.chmod(temporary, stat.S_IMODE(destination.stat().st_mode))
            staged.append((path, temporary))
        for path, temporary in staged:
            os.replace(temporary, ROOT / path)
            written.append(path)
    except Exception:
        for path in written:
            (ROOT / path).write_bytes(old_bytes[path])
        raise
    finally:
        for _, temporary in staged:
            temporary.unlink(missing_ok=True)

    print("======================================")
    print("DETAIL UI CONSISTENCY PATCH SUCCESS")
    print("Pending/revision/rejected RF panel: MODERN")
    print("Approved RF tab behavior: UNCHANGED")
    print("Vendor Detail: MODERN")
    print("Employee Detail: MODERN")
    print("PR/APR/TE: UNCHANGED")
    print("Backend, approvals, Print Doc: UNCHANGED")
    print("Build/restart: NOT PERFORMED")
    print("======================================")

if __name__ == "__main__":
    main()
