#!/usr/bin/env python3
"""Targeted RF Activity Name Print Form fix for divergent SIM PUSKAPA EC2 trunk.

The PDF must read requisitionFormDetail.about_request and never substitute
the project Activity. Applies to RF PC/TR/PH/SC without changing other forms.
No new backup, no git merge, no changes to workflows.
"""
from pathlib import Path
import os
import stat
import subprocess
import tempfile

ROOT = Path("/home/ec2-user/simpuskapa")
RF_PAGE = "src/pages/dashboard/procurement/[...slug].tsx"
PRINT = "src/utils/print-form-dom.ts"

def abort(msg: str) -> None:
    raise SystemExit("ABORT: " + msg)

def git(*args: str) -> str:
    p = subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, text=True)
    if p.returncode:
        abort(f"git {args[0]}: {p.stderr[:650]}")
    return p.stdout

def replace_once(source: str, old: str, new: str, description: str) -> str:
    n = source.count(old)
    if n != 1:
        abort(f"{description}: expected one exact anchor, found {n}. No files changed.")
    return source.replace(old, new, 1)

def formatted(path: str, source: str) -> bytes:
    p = subprocess.run(
        [str(ROOT / "node_modules/.bin/prettier"), "--stdin-filepath", path],
        cwd=ROOT,
        input=source,
        capture_output=True,
        text=True,
    )
    if p.returncode:
        abort(f"Prettier failed for {path}: {p.stderr[:950]}")
    return p.stdout.encode("utf-8")

def main() -> None:
    print("===== RF PRINT FORM: ACTIVITY NAME FROM ABOUT_REQUEST =====")
    if git("branch", "--show-current").strip() != "trunk":
        abort("EC2 local branch is not trunk")
    if not (ROOT / "node_modules/.bin/prettier").exists():
        abort("Prettier binary not installed")
    if not ROOT.joinpath(RF_PAGE).is_file() or not ROOT.joinpath(PRINT).is_file():
        abort("RF detail or Print Form utility missing")

    # Confirm FETCH_HEAD contains the reviewed two-file source fix.
    gh_page = git("show", f"FETCH_HEAD:{RF_PAGE}")
    gh_print = git("show", f"FETCH_HEAD:{PRINT}")
    if "data-sim-rf-activity-name=" not in gh_page or "function rfActivityName(" not in gh_print:
        abort("FETCH_HEAD is not the reviewed RF print fix branch")

    before = {
        RF_PAGE: (ROOT / RF_PAGE).read_bytes(),
        PRINT: (ROOT / PRINT).read_bytes(),
    }
    page = before[RF_PAGE].decode("utf-8")
    util = before[PRINT].decode("utf-8")

    # The RF detail page can be showing a different tab; expose RF.about_request
    # on the persistent modern-form root instead of scraping nearby label text.
    root_old = '          className="sim-modern-forms sim-modern-forms-rf"\n          data-sim-print-ready={'
    root_new = (
        '          className="sim-modern-forms sim-modern-forms-rf"\n'
        "          data-sim-rf-activity-name={procurementIdentifier === 'detail' ? requisitionFormDetail?.about_request ?? '' : undefined}\n"
        '          data-sim-print-ready={'
    )
    if "data-sim-rf-activity-name=" in page:
        if page.count("data-sim-rf-activity-name=") != 1:
            abort("RF data attribute duplicated")
        print("SKIP: Direct data attribute already present")
    else:
        page = replace_once(page, root_old, root_new, "RF page data attribute")
        print("PASS: React RF.about_request exposed to Print Form")

    # No label matching for RF Activity Name. Its value is read from one
    # explicit data attribute, with a fallback only to the exact Activity Name
    # field (data-testid), never the project Activity or Activity.description.
    pick_anchor = """function pick(root: HTMLElement, names: string[]): string {
  return findValue(root, names) || '—'
}
"""
    helper = """function pick(root: HTMLElement, names: string[]): string {
  return findValue(root, names) || '—'
}

// RF Activity Name = requisitionFormDetail.about_request, NOT project Activity.
function rfActivityName(root: HTMLElement): string {
  return (
    norm(root.getAttribute('data-sim-rf-activity-name')) ||
    textOf(root.querySelector('[data-testid="about-request-description"]'))
  )
}
"""
    if "function rfActivityName(" not in util:
        util = replace_once(util, pick_anchor, helper, "RF print reader")
        print("PASS: Dedicated RF Activity Name reader installed")
    elif util.count("function rfActivityName(") != 1:
        abort("RF print reader duplicated")

    candidates = [
        "    fieldHtml('Activity Name', pick(root, ['Activity Name', 'Activity'])),",
        "    fieldHtml('Activity Name', pick(root, isRF ? ['Activity Name'] : ['Activity Name', 'Activity'])),",
    ]
    proper = "    fieldHtml('Activity Name', isRF ? rfActivityName(root) : pick(root, ['Activity Name', 'Activity'])),"
    if proper in util:
        if util.count(proper) != 1:
            abort("RF printed field duplicated")
        print("SKIP: PDF already uses dedicated RF Activity Name reader")
    else:
        old = [x for x in candidates if x in util]
        if len(old) != 1:
            abort("Unknown/ambiguous local PDF Activity Name expression")
        util = replace_once(util, old[0], proper, "RF PDF Activity Name expression")
        print("PASS: PDF RF field corrected; other forms preserved")

    after_number = """  if (!number) {
    window.alert('Cannot print: the form number was not found. Please open the form detail page.')
    return
  }
"""
    guard = """  if (printKind(number) === 'RF' && !rfActivityName(root)) {
    window.alert('Cannot print: RF Activity Name is missing. Please reopen the requisition detail page.')
    return
  }
"""
    if guard not in util:
        util = replace_once(util, after_number, after_number + guard, "RF missing-name guard")
        print("PASS: Missing RF Activity Name blocks incorrect printing")
    elif util.count(guard) != 1:
        abort("Duplicate RF missing-name guard")

    for marker in [
        "requisitionFormDetail?.about_request",
        "data-sim-rf-activity-name=",
    ]:
        if marker not in page:
            abort(f"Missing RF page data marker: {marker}")
    for marker in [
        "function rfActivityName(",
        "norm(root.getAttribute('data-sim-rf-activity-name'))",
        proper,
        guard,
        "function buildDocument(",
    ]:
        if marker not in util:
            abort(f"Missing Print Form marker: {marker}")
    for wrong in candidates:
        if wrong in util:
            abort("Wrong Print Form field expression still present")

    changes = {}
    if page.encode("utf-8") != before[RF_PAGE]:
        changes[RF_PAGE] = formatted(RF_PAGE, page)
    if util.encode("utf-8") != before[PRINT]:
        changes[PRINT] = formatted(PRINT, util)
    if not changes:
        print("PASS: Direct RF Activity Name fix already installed")
        return

    staged = []
    written = []
    try:
        for name, value in changes.items():
            dest = ROOT / name
            fd, tmp = tempfile.mkstemp(prefix=".rf-print-activity-", dir=dest.parent)
            os.close(fd)
            temporary = Path(tmp)
            temporary.write_bytes(value)
            os.chmod(temporary, stat.S_IMODE(dest.stat().st_mode))
            staged.append((name, temporary))
        for name, temporary in staged:
            os.replace(temporary, ROOT / name)
            written.append(name)
    except Exception:
        for name in written:
            (ROOT / name).write_bytes(before[name])
        raise
    finally:
        for _, temporary in staged:
            temporary.unlink(missing_ok=True)

    print("==========================================")
    print("RF ACTIVITY NAME PRINT PATCH SUCCESS")
    print("PDF Activity Name = about_request")
    print("PDF Activity Name != project Activity")
    print("RF PC/TR/PH/Staff Cost: FIXED")
    print("PR/APR/APS/APF/TE: UNCHANGED")
    print("Approval/API/DB: UNCHANGED")
    print("No new backups; build/restart: NOT PERFORMED")
    print("==========================================")


if __name__ == "__main__":
    main()
