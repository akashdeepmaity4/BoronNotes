"""Test: verify /open-terminal picks the right shell + args. Spawn is stubbed."""
"""NOT NEEDED IN THE APP"""

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import app.app as appmod  # noqa: E402

calls = []


class FakePopen:
    def __init__(self, cmd, **kw):
        calls.append({"cmd": cmd, "kw": kw})


appmod.subprocess.Popen = FakePopen
c = appmod.app.test_client()

# Force a clean host-independent environment for the fallback tests.
appmod.shutil.which = lambda name: None
appmod.os.path.isfile = lambda p: False
appmod.os.environ["ComSpec"] = r"C:\Windows\System32\cmd.exe"

r = c.post("/open-terminal")
data = r.get_json()
print("HTTP", r.status_code)
print("JSON", data)
print("SPAWN", calls)

assert r.status_code == 200, "expected 200"
assert data["status"] == "success", "expected success"
assert data["shell"] == "cmd", f"expected cmd on this box, got {data['shell']}"
assert calls, "no shell was spawned"
got = calls[0]["cmd"]
assert os.path.basename(got[0]).lower() == "cmd.exe", got
assert got[1] == "/K" and "cd /d" in got[2], got
expected_root = os.path.abspath("C:\\") if os.path.exists("C:\\") else os.path.abspath(os.sep)
assert calls[0]["kw"]["cwd"] == expected_root, calls[0]["kw"]
assert calls[0]["kw"].get("creationflags") == appmod.subprocess.CREATE_NEW_CONSOLE
print("\nPASS: cmd selected, /K cd /d used, cwd = OS root, new console requested")

# --- default behavior: when nothing is open, use the Windows root ---
appmod.shutil.which = lambda name: None
appmod.os.path.isfile = lambda p: False
appmod.os.path.isdir = lambda p: False
appmod.os.path.exists = lambda p: p.lower() == "c:\\"
calls.clear()
r = c.post("/open-terminal")
data = r.get_json()
print("\nwith no active target ->", data["shell"], data["path"], calls[0]["kw"]["cwd"])
expected_root = os.path.abspath("C:\\")
assert data["path"] == expected_root, data
assert calls[0]["kw"]["cwd"] == expected_root, calls[0]["kw"]
print("PASS: default terminal directory is C:/ when nothing is open")

# --- simulate bash present on PATH -> must win over cmd ---
appmod.shutil.which = lambda name: r"C:\fake\bash.exe" if name == "bash" else None
calls.clear()
r = c.post("/open-terminal")
data = r.get_json()
print("\nwith bash on PATH ->", data["shell"], calls[0]["cmd"])
assert data["shell"] == "bash", data
assert calls[0]["cmd"] == [r"C:\fake\bash.exe", "--login"], calls[0]["cmd"]
print("PASS: bash takes priority over cmd")

# --- simulate no bash, Git Bash present -> must win over cmd ---
appmod.shutil.which = lambda name: None
real_isfile = os.path.isfile
gitbash = os.path.join(os.environ["ProgramFiles"], "Git", "bin", "bash.exe")
appmod.os.path.isfile = lambda p: True if os.path.normcase(p) == os.path.normcase(gitbash) else False
calls.clear()
r = c.post("/open-terminal")
data = r.get_json()
print("\nwith only Git Bash ->", data["shell"], calls[0]["cmd"])
assert data["shell"] == "git-bash", data
assert calls[0]["cmd"] == [gitbash, "--login", "-i"], calls[0]["cmd"]
print("PASS: Git Bash is the middle fallback")

# --- simulate no bash, no standard Git Bash install, but Start Menu shortcut exists -> must beat cmd ---
startmenu_lnk = r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Git\Git Bash.lnk"
appmod.os.path.isfile = lambda p: True if os.path.normcase(p) == os.path.normcase(startmenu_lnk) else False
calls.clear()
r = c.post("/open-terminal")
data = r.get_json()
print("\nwith only Start Menu Git Bash shortcut ->", data["shell"], calls[0]["cmd"])
assert data["shell"] == "git-bash-start-menu", data
assert calls[0]["cmd"] == [startmenu_lnk], calls[0]["cmd"]
print("PASS: Start Menu Git Bash shortcut is the second fallback")

# --- explicit opened path should win over storage folder ---
repo_root = r"D:\repo\project"
appmod.os.path.isfile = lambda p: False
appmod.os.path.isdir = lambda p: p == repo_root
calls.clear()
r = c.post("/open-terminal", json={"path": repo_root})
data = r.get_json()
print("\nwith explicit repo root ->", data["shell"], data["path"], calls[0]["kw"]["cwd"])
assert data["path"] == repo_root, data
assert calls[0]["kw"]["cwd"] == repo_root, calls[0]["kw"]
print("PASS: explicit file/folder/repo path is used as the terminal working directory")

print("\nALL PASS")
