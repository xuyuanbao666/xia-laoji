"""Verify real app login UI on a clean emulator, without hiding app failures."""
from pathlib import Path
import subprocess
import re
import time
import xml.etree.ElementTree as ET

OUTPUT = Path("android-evidence")
PKG = "com.xialaojinew"
ACTIVITY = PKG + "/.MainActivity"

def adb(*args, timeout=20):
    return subprocess.check_output(["adb", *args], timeout=timeout)

def start_app():
    result = adb("shell", "am", "start", "-W", "-n", ACTIVITY, timeout=60).decode()
    print(result, flush=True)
    if "Status: ok" not in result:
        raise RuntimeError("Activity did not launch successfully")

def check_crash():
    crashes = adb("logcat", "-b", "crash", "-d").decode(errors="replace")
    if PKG in crashes:
        raise RuntimeError("App crash detected in Android crash log")
    exits = adb("shell", "dumpsys", "activity", "exit-info", PKG).decode(errors="replace")
    (OUTPUT / "exit-info.txt").write_text(exits)
    if re.search(r"reason=\d+ \((?:CRASH|CRASH_NATIVE|ANR)\)", exits):
        raise RuntimeError("App crash or ANR detected in process exit history")

def main():
    try:
        adb("shell", "input", "keyevent", "82")
        time.sleep(5)
        adb("install", str(OUTPUT / "xia-laoji-emulator-test.apk"), timeout=120)
        adb("logcat", "-c")
        start_app()
        deadline = time.monotonic() + 150
        recovered = False
        while time.monotonic() < deadline:
            try:
                check_crash()
                adb("shell", "rm", "-f", "/sdcard/xia-window.xml")
                adb("shell", "uiautomator", "dump", "/sdcard/xia-window.xml", timeout=12)
                xml = adb("exec-out", "cat", "/sdcard/xia-window.xml")
                (OUTPUT / "window.xml").write_bytes(xml)
                nodes = list(ET.fromstring(xml).iter("node"))
                labels = " ".join(n.get("text", "") + " " + n.get("content-desc", "")
                                  for n in nodes if n.get("package") == PKG)
                if "邮箱" in labels and "密码" in labels and "登录" in labels:
                    check_crash()
                    print("Actual APK login screen verified.", flush=True)
                    return
                packages = {n.get("package", "") for n in nodes}
                print("Visible packages:", packages, flush=True)
                failures = [n.get("text", "") for n in nodes if "isn't responding" in n.get("text", "") or "keeps stopping" in n.get("text", "")]
                if failures:
                    raise RuntimeError(f"System or app failure dialog: {failures}")
                if any(p in packages for p in ("com.android.launcher3", "com.google.android.apps.nexuslauncher")) and not recovered:
                    # Only recover from a home screen with the app process still alive.
                    if not adb("shell", "pidof", PKG).strip():
                        raise RuntimeError("App process exited before the login screen")
                    recovered = True
                    start_app()
            except (subprocess.SubprocessError, ET.ParseError):
                pass
            time.sleep(2)
        raise RuntimeError("App login screen not visible")
    finally:
        for name, args in [
            ("login.png", ("exec-out", "screencap", "-p")),
            ("logcat.txt", ("logcat", "-d", "-v", "threadtime")),
            ("crash.txt", ("logcat", "-b", "crash", "-d")),
            ("activity.txt", ("shell", "dumpsys", "activity", "activities")),
        ]:
            try:
                (OUTPUT / name).write_bytes(adb(*args, timeout=30))
            except subprocess.SubprocessError:
                pass

if __name__ == "__main__":
    main()
