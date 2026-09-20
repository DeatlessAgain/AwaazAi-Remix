#!/usr/bin/env python3
"""
Awaaz AI Studio - Native Android Project & APK Synchronizer
Packages the native Android Studio project and ensures all resources,
compiled assets, and dependencies are synchronized into both the project zip and the APK.
"""

import os
import sys
import shutil
import zipfile
import subprocess
import xml.etree.ElementTree as ET

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(ROOT_DIR, "android-native-project")
APP_DIR = os.path.join(PROJECT_DIR, "app")
RES_DIR = os.path.join(APP_DIR, "src", "main", "res")
ASSETS_DIR = os.path.join(APP_DIR, "src", "main", "assets")
DIST_DIR = os.path.join(ROOT_DIR, "dist")

def validate_project():
    print("1. Validating native Android project structure...")
    required_files = [
        "settings.gradle.kts",
        "build.gradle.kts",
        "gradle.properties",
        "app/build.gradle.kts",
        "app/src/main/AndroidManifest.xml",
        "app/src/main/java/com/awaaz/studio/MainActivity.kt",
        "app/src/main/java/com/awaaz/studio/AwaazApplication.kt",
        "app/src/main/java/com/awaaz/studio/audio/NativeAudioEngine.kt",
        "app/src/main/java/com/awaaz/studio/network/ApiClient.kt",
        "app/src/main/res/layout/activity_main.xml",
        "app/src/main/res/values/strings.xml",
        "app/src/main/res/values/colors.xml",
        "app/src/main/res/values/themes.xml",
        "app/src/main/res/menu/bottom_nav_menu.xml",
        "app/src/main/res/xml/file_paths.xml"
    ]
    for rel_path in required_files:
        full_path = os.path.join(PROJECT_DIR, rel_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Missing required Android file: {rel_path}")

    # Validate XML files syntax
    for root, _, files in os.walk(RES_DIR):
        for f in files:
            if f.endswith(".xml"):
                path = os.path.join(root, f)
                try:
                    ET.parse(path)
                except Exception as e:
                    raise ValueError(f"XML parse error in {path}: {e}")
    print("   All XML layouts, drawables, and configurations are valid.")

def sync_web_assets():
    print("2. Synchronizing compiled web assets into Android assets...")
    if not os.path.exists(DIST_DIR):
        print("   Running npm run build...")
        subprocess.run(["npm", "run", "build"], cwd=ROOT_DIR, check=True)

    os.makedirs(ASSETS_DIR, exist_ok=True)
    if os.path.exists(os.path.join(ASSETS_DIR, "assets")):
        shutil.rmtree(os.path.join(ASSETS_DIR, "assets"))

    for item in os.listdir(DIST_DIR):
        s = os.path.join(DIST_DIR, item)
        d = os.path.join(ASSETS_DIR, item)
        if item.endswith(".apk") or item.endswith(".zip") or item.startswith("server.cjs"):
            continue
        if os.path.isdir(s):
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)
    print("   Assets synchronized successfully.")

def package_zip():
    print("3. Packaging Android Studio project zip archive...")
    zip_public = os.path.join(ROOT_DIR, "public", "AwaazAI-Android-Studio-Project.zip")
    zip_download = os.path.join(ROOT_DIR, "APK_DOWNLOAD", "AwaazAI-Android-Studio-Project.zip")
    os.makedirs(os.path.dirname(zip_public), exist_ok=True)
    os.makedirs(os.path.dirname(zip_download), exist_ok=True)

    with zipfile.ZipFile(zip_public, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PROJECT_DIR):
            # Skip build caches if present
            dirs[:] = [d for d in dirs if d not in [".gradle", "build", ".idea"]]
            for file in files:
                abs_p = os.path.join(root, file)
                rel_p = os.path.relpath(abs_p, PROJECT_DIR)
                zipf.write(abs_p, os.path.join("AwaazAIStudio", rel_p))

    shutil.copyfile(zip_public, zip_download)
    size_kb = os.path.getsize(zip_public) / 1024
    print(f"   Created {zip_public} ({size_kb:.1f} KB)")

def update_apk():
    print("4. Updating and signing debug APK...")
    update_script = os.path.join(ROOT_DIR, "android", "update_apk.py")
    if os.path.exists(update_script):
        subprocess.run([sys.executable, update_script], cwd=ROOT_DIR, check=True)
    else:
        print("   Warning: update_apk.py not found.")

def main():
    validate_project()
    sync_web_assets()
    package_zip()
    update_apk()
    print("=== Android native project and APK build pipeline complete ===")

if __name__ == "__main__":
    main()
