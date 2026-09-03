# Proguard rules for Awaaz AI Studio
-keep class com.awaaz.studio.** { *; }

# Keep JavaScript Interface methods for WebView Native Bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepclassmembers class com.awaaz.studio.MainActivity$WebAppInterface {
    public *;
}
