"""Test: verify /open-terminal picks the right shell + args. Spawn is stubbed."""
"""NOT NEEDED IN THE APP"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import app as appmod  # noqa: E402

calls = []


class FakePopen:
    def __init__(self, cmd, **kw):
        calls.append({"cmd": cmd, "kw": kw})


appmod.subprocess.Popen = FakePopen
c = appmod.app.test_client()

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
assert "/K" in got and "cd /d" in got[1], got
assert calls[0]["kw"]["cwd"] == appmod.STORAGE_PATH, calls[0]["kw"]
assert calls[0]["kw"].get("creationflags") == appmod.subprocess.CREATE_NEW_CONSOLE
print("\nPASS: cmd selected, /K cd /d used, cwd = STORAGE_PATH, new console requested")

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
appmod.os.path.isfile = lambda p: True if os.path.normcase(p) == os.path.normcase(gitbash) else real_isfile(p)
calls.clear()
r = c.post("/open-terminal")
data = r.get_json()
print("\nwith only Git Bash ->", data["shell"], calls[0]["cmd"])
assert data["shell"] == "git-bash", data
assert calls[0]["cmd"] == [gitbash, "--login", "-i"], calls[0]["cmd"]
print("PASS: Git Bash is the middle fallback")

print("\nALL PASS")
