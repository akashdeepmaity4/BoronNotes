"""Run the app exactly as launcher.py does, and dump what is actually served.

This mirrors launcher.py (webview.create_window(url=app)) so we can see the
real HTTP surface pywebview exposes, without opening a GUI window.
"""
import os
import sys
import threading
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.app import app  # noqa: E402

print("app object:", app)

# pywebview wraps the WSGI app in its own server. Inspect its attributes to
# understand how it will serve / route requests.
print("has wsgi_app:", hasattr(app, "wsgi_app"))
print("type:", type(app))

# What does the app return for the root page?
with app.test_client() as c:
    resp = c.get("/")
    body = resp.get_data(as_text=True)
    print("=== ROOT STATUS:", resp.status_code)
    print("=== ROOT LENGTH:", len(body))
    print("=== PIPEWEBVIEW API SCRIPT PRESENT:",
          "pywebview" in body)
    # print the script/input tags so we can see the pickers
    for line in body.splitlines():
        low = line.lower()
        if ("script" in low or "input" in low or "accept" in low):
            print("    TAG:", line.strip()[:200])
