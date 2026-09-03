#!/usr/bin/env bash
set -e

echo "=== Android Debug APK Build Pipeline for Awaaz AI Studio ==="

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
BUILD_DIR="$ANDROID_DIR/build"
SDK_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"

if [ ! -f "$SDK_JAR" ]; then
    echo "Error: android.jar not found at $SDK_JAR"
    exit 1
fi

echo "1. Checking/building web assets..."
if [ ! -d "$ROOT_DIR/dist" ] || [ ! -f "$ROOT_DIR/dist/index.html" ]; then
    (cd "$ROOT_DIR" && npm run build)
fi

echo "2. Cleaning and preparing build directories..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/gen"
mkdir -p "$BUILD_DIR/classes"
mkdir -p "$BUILD_DIR/dex"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$BUILD_DIR/assets/fonts"
mkdir -p "$ROOT_DIR/.build-outputs"
mkdir -p "$ROOT_DIR/APK_DOWNLOAD"

echo "3. Copying web assets and fonts into APK assets directory..."
cp -r "$ROOT_DIR/dist"/* "$BUILD_DIR/assets/"
rm -f "$BUILD_DIR/assets"/server.cjs*

# Include standard TrueType fonts for rich Urdu/English typography and offline display
for font in \
    /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf \
    /usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf \
    /usr/share/fonts/truetype/freefont/FreeSans.ttf \
    /usr/share/fonts/truetype/kacst/KacstNaskh.ttf; do
    if [ -f "$font" ]; then
        cp "$font" "$BUILD_DIR/assets/fonts/"
    fi
done

echo "4. Generating R.java with aapt..."
aapt package -m \
    -J "$BUILD_DIR/gen" \
    -M "$ANDROID_DIR/AndroidManifest.xml" \
    -S "$ANDROID_DIR/res" \
    -I "$SDK_JAR"

echo "5. Compiling Java sources with javac..."
javac -source 1.8 -target 1.8 \
    -bootclasspath "$SDK_JAR" \
    -cp "$SDK_JAR" \
    -d "$BUILD_DIR/classes" \
    "$BUILD_DIR/gen/com/awaaz/studio/R.java" \
    "$ANDROID_DIR/src/com/awaaz/studio/MainActivity.java"

echo "6. Converting bytecode to Dalvik classes.dex..."
dalvik-exchange --dex --output="$BUILD_DIR/dex/classes.dex" "$BUILD_DIR/classes"

echo "7. Packaging unaligned APK with aapt..."
aapt package -f \
    -M "$ANDROID_DIR/AndroidManifest.xml" \
    -S "$ANDROID_DIR/res" \
    -A "$BUILD_DIR/assets" \
    -I "$SDK_JAR" \
    -F "$BUILD_DIR/app-unaligned.apk" \
    "$BUILD_DIR/dex"

echo "8. Page-aligning APK (4-byte boundary) with zipalign..."
zipalign -f -v -p 4 "$BUILD_DIR/app-unaligned.apk" "$BUILD_DIR/app-aligned.apk"

echo "9. Generating debug keystore if needed..."
KEYSTORE="$ANDROID_DIR/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkeypair -validity 10000 \
        -dname "CN=Android Debug,O=Android,C=US" \
        -keystore "$KEYSTORE" \
        -storepass android \
        -keypass android \
        -alias androiddebugkey \
        -keyalg RSA -keysize 2048
fi

echo "10. Signing APK with apksigner (v1, v2, v3 schemes)..."
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:android \
    --key-pass pass:android \
    --ks-key-alias androiddebugkey \
    --out "$BUILD_DIR/app-debug.apk" \
    "$BUILD_DIR/app-aligned.apk"

echo "11. Verifying APK signature..."
apksigner verify --verbose "$BUILD_DIR/app-debug.apk"

echo "12. Validating APK package with aapt badging..."
aapt dump badging "$BUILD_DIR/app-debug.apk" | head -n 10

echo "13. Copying APK to required output destinations..."
cp -f "$BUILD_DIR/app-debug.apk" "$ROOT_DIR/.build-outputs/app-debug.apk"
cp -f "$BUILD_DIR/app-debug.apk" "$ROOT_DIR/APK_DOWNLOAD/app-debug.apk"

FILE_SIZE=$(wc -c < "$ROOT_DIR/APK_DOWNLOAD/app-debug.apk" | tr -d ' ')
FILE_SIZE_MB=$(awk "BEGIN {printf \"%.2f\", $FILE_SIZE/1048576}")

echo "=== Build Complete ==="
echo "Output 1: $ROOT_DIR/.build-outputs/app-debug.apk"
echo "Output 2: $ROOT_DIR/APK_DOWNLOAD/app-debug.apk"
echo "File size: $FILE_SIZE bytes ($FILE_SIZE_MB MB)"

if [ "$FILE_SIZE" -le 1048576 ]; then
    echo "ERROR: APK file size ($FILE_SIZE bytes) is not greater than 1 MB!"
    exit 1
else
    echo "SUCCESS: APK file size is greater than 1 MB ($FILE_SIZE_MB MB) and valid."
fi
