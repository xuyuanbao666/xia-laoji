"""Verify a standalone, test-signed APK launches the real login screen."""
from pathlib import Path
import subprocess
import re
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
        recoveries = 0
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            try:
                adb("shell", "rm", "-f", "/sdcard/xia-window.xml")
                adb("shell", "uiautomator", "dump", "/sdcard/xia-window.xml", timeout=12)
                xml = adb("exec-out", "cat", "/sdcard/xia-window.xml")
                (OUTPUT / "window.xml").write_bytes(xml)
                nodes = list(ET.fromstring(xml).iter("node"))
                failures = [n.get("text", "") for n in nodes if "isn\'t responding" in n.get("text", "") or "keeps stopping" in n.get("text", "")]
                if failures:
                    if failures != ["Pixel Launcher isn\'t responding"] or recoveries >= 2:
                        raise RuntimeError(f"Unexpected or repeated system failure: {failures}")
                    for n in nodes:
                        if n.get("package") == "android" and n.get("text") == "Close app":
                            x1, y1, x2, y2 = map(int, re.findall(r"\d+", n.get("bounds", "")))
                            recoveries += 1
                            (OUTPUT / f"launcher-anr-{recoveries}.png").write_bytes(adb("exec-out", "screencap", "-p"))
                            adb("shell", "input", "tap", str((x1+x2)//2), str((y1+y2)//2))
                            print("Dismissed verified external Pixel Launcher ANR", flush=True)
                            break
                    time.sleep(1)
                    continue
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
