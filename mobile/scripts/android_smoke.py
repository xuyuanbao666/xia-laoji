"""Verify a standalone, test-signed APK launches the real login screen."""
from pathlib import Path
import subprocess
import time
import xml.etree.ElementTree as ET

OUTPUT = Path("android-evidence")
PKG = "com.xialaojinew"

def adb(*args, timeout=20):
    return subprocess.check_output(["adb", *args], timeout=timeout)

def main():
    try:
        adb("logcat", "-c")
        adb("install", str(OUTPUT / "xia-laoji-emulator-test.apk"), timeout=120)
        adb("shell", "am", "start", "-W", "-n", PKG + "/.MainActivity", timeout=60)
        deadline = time.monotonic() + 90
        while time.monotonic() < deadline:
            try:
                adb("shell", "rm", "-f", "/sdcard/xia-window.xml")
                adb("shell", "uiautomator", "dump", "/sdcard/xia-window.xml", timeout=12)
                xml = adb("exec-out", "cat", "/sdcard/xia-window.xml")
                (OUTPUT / "window.xml").write_bytes(xml)
                nodes = list(ET.fromstring(xml).iter("node"))
                labels = " ".join(n.get("text", "") + " " + n.get("content-desc", "")
                                  for n in nodes if n.get("package") == PKG)
                if "邮箱" in labels and "密码" in labels and "登录" in labels:
                    print("Actual APK login screen verified.", flush=True)
                    return
            except (subprocess.SubprocessError, ET.ParseError):
                pass
            time.sleep(2)
        raise RuntimeError("App login screen not visible")
    finally:
        for name, args in [("login.png", ("exec-out", "screencap", "-p")),
                           ("logcat.txt", ("logcat", "-d", "-t", "400"))]:
            try:
                (OUTPUT / name).write_bytes(adb(*args))
            except subprocess.SubprocessError:
                pass

if __name__ == "__main__":
    main()
