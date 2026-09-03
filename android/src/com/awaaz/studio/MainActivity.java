package com.awaaz.studio;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.MediaPlayer;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Vibrator;
import android.util.Base64;
import android.util.Log;
import android.view.KeyEvent;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainActivity extends Activity {
    private static final String TAG = "AwaazMainActivity";
    private static final int FILECHOOSER_RESULTCODE = 1001;
    private static final int PERMISSIONS_REQUEST_CODE = 2002;

    private WebView mWebView;
    private ValueCallback<Uri[]> mFilePathCallback;
    private MediaPlayer mMediaPlayer;

    // Permissions needed for Audio Studio, Voice Recording, and File Saving
    private static final String[] APP_PERMISSIONS = new String[]{
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        mWebView = new WebView(this);
        mWebView.setBackgroundColor(Color.parseColor("#050507"));
        setContentView(mWebView);

        setupWebSettings();
        setupWebViewClient();
        setupWebChromeClient();
        setupNativeBridge();
        checkAndRequestPermissions();

        // Load the local packaged web app bundle
        mWebView.loadUrl("file:///android_asset/index.html");
    }

    /**
     * Requirement 2: Enable Native File Access & Local Storage
     */
    private void setupWebSettings() {
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // Native file access flags
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    }

    /**
     * Requirement 3: Fix Resources Loading & Asset Interception
     */
    private void setupWebViewClient() {
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    if (url.contains("run.app") || url.contains("localhost") || url.contains("ai.studio")) {
                        view.loadUrl(url);
                        return true;
                    }
                    try {
                        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(browserIntent);
                        return true;
                    } catch (Exception ignored) {}
                }
                view.loadUrl(url);
                return true;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return handleResourceRequest(Uri.parse(url));
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    return handleResourceRequest(request.getUrl());
                }
                return super.shouldInterceptRequest(view, request);
            }
        });
    }

    /**
     * Intercept and properly serve assets with correct MIME types and CORS headers
     */
    private WebResourceResponse handleResourceRequest(Uri uri) {
        if (uri == null) return null;

        String path = uri.getPath();
        if (path == null) return null;

        // Clean leading slash for asset lookup
        if (path.startsWith("/")) {
            path = path.substring(1);
        }

        // If path is empty, default to index.html
        if (path.isEmpty() || path.equals("android_asset")) {
            path = "index.html";
        }

        // If path begins with android_asset/, strip it
        if (path.startsWith("android_asset/")) {
            path = path.substring("android_asset/".length());
        }

        try {
            InputStream is = getAssets().open(path);
            String mimeType = getMimeType(path);
            Map<String, String> headers = new HashMap<String, String>();
            headers.put("Access-Control-Allow-Origin", "*");
            headers.put("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            headers.put("Access-Control-Allow-Headers", "*");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                return new WebResourceResponse(mimeType, "utf-8", 200, "OK", headers, is);
            } else {
                return new WebResourceResponse(mimeType, "utf-8", is);
            }
        } catch (Exception e) {
            // Asset not found directly; check if it's in assets/ subdirectory
            if (!path.startsWith("assets/")) {
                try {
                    InputStream is = getAssets().open("assets/" + path);
                    String mimeType = getMimeType(path);
                    return new WebResourceResponse(mimeType, "utf-8", is);
                } catch (Exception ignored) {}
            }
        }

        return null;
    }

    private String getMimeType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ttf")) return "font/ttf";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        return "application/octet-stream";
    }

    /**
     * Requirement 2 & 4: File Chooser and HTML5 Microphone Permission
     */
    private void setupWebChromeClient() {
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            request.grant(request.getResources());
                        }
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                }
                mFilePathCallback = filePathCallback;

                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentSelectionIntent.setType("*/*");

                Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "Select Audio or File");
                startActivityForResult(chooserIntent, FILECHOOSER_RESULTCODE);
                return true;
            }
        });
    }

    /**
     * Requirement 1: Native WebView Bridge Interface
     */
    private void setupNativeBridge() {
        NativeBridge bridge = new NativeBridge(this);
        mWebView.addJavascriptInterface(bridge, "AndroidBridge");
        mWebView.addJavascriptInterface(bridge, "Android");
    }

    /**
     * Requirement 4: Android Runtime Permissions Logic
     */
    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> missingPermissions = new ArrayList<String>();
            for (String permission : APP_PERMISSIONS) {
                if (checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED) {
                    missingPermissions.add(permission);
                }
            }

            if (!missingPermissions.isEmpty()) {
                requestPermissions(missingPermissions.toArray(new String[0]), PERMISSIONS_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSIONS_REQUEST_CODE) {
            boolean allGranted = true;
            for (int res : grantResults) {
                if (res != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            final boolean grantedFinal = allGranted;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    String msg = grantedFinal
                        ? "مائیکروفون اور اسٹوریج اجازت نامہ منظور ہو گیا (Permissions Granted)"
                        : "کچھ اجازتیں نہیں مل سکیں، سیٹنگز میں چیک کریں (Permissions Denied)";
                    Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();

                    // Notify JavaScript
                    String js = "if (window.onNativePermissionsResult) window.onNativePermissionsResult(" + grantedFinal + ");";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                        mWebView.evaluateJavascript(js, null);
                    } else {
                        mWebView.loadUrl("javascript:" + js);
                    }
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (mFilePathCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                mFilePathCallback.onReceiveValue(results);
                mFilePathCallback = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mMediaPlayer != null) {
            mMediaPlayer.release();
            mMediaPlayer = null;
        }
        if (mWebView != null) {
            mWebView.destroy();
        }
    }

    /**
     * Native JavaScript Bridge Implementation
     */
    public class NativeBridge {
        private final Context mContext;

        public NativeBridge(Context context) {
            this.mContext = context;
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "2.0.0-native";
        }

        @JavascriptInterface
        public void showToast(final String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(mContext, message, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void vibrate(long milliseconds) {
            try {
                Vibrator v = (Vibrator) mContext.getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) {
                    v.vibrate(milliseconds > 0 ? milliseconds : 50);
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void shareText(String text, String title) {
            try {
                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.setType("text/plain");
                sendIntent.putExtra(Intent.EXTRA_TEXT, text);
                Intent chooser = Intent.createChooser(sendIntent, title != null ? title : "Awaaz AI Studio");
                startActivity(chooser);
            } catch (Exception e) {
                Log.e(TAG, "Share failed", e);
            }
        }

        @JavascriptInterface
        public boolean saveAudioFile(String base64Data, String filename) {
            try {
                String cleanBase64 = base64Data
                    .replace("data:audio/wav;base64,", "")
                    .replace("data:audio/mp3;base64,", "")
                    .replace("data:audio/mpeg;base64,", "");
                byte[] audioBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

                String name = (filename != null && !filename.trim().isEmpty())
                    ? filename
                    : "AwaazAI_" + System.currentTimeMillis() + ".wav";

                File musicDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC);
                File appDir = new File(musicDir, "AwaazAI");
                if (!appDir.exists()) {
                    appDir.mkdirs();
                }

                File audioFile = new File(appDir, name);
                FileOutputStream fos = new FileOutputStream(audioFile);
                fos.write(audioBytes);
                fos.flush();
                fos.close();

                // Notify Android Media Scanner
                MediaScannerConnection.scanFile(
                    mContext,
                    new String[]{audioFile.getAbsolutePath()},
                    new String[]{"audio/wav"},
                    null
                );

                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(mContext, "آڈیو فون کی میموری (Music/AwaazAI) میں محفوظ ہو گئی", Toast.LENGTH_LONG).show();
                    }
                });

                return true;
            } catch (Exception e) {
                Log.e(TAG, "Failed to save audio file", e);
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(mContext, "محفوظ کرنے میں خرابی: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                });
                return false;
            }
        }

        @JavascriptInterface
        public void shareAudio(String base64Data, String filename, String title) {
            try {
                String cleanBase64 = base64Data
                    .replace("data:audio/wav;base64,", "")
                    .replace("data:audio/mp3;base64,", "")
                    .replace("data:audio/mpeg;base64,", "");
                byte[] audioBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

                File cacheFile = new File(mContext.getCacheDir(), filename != null ? filename : "awaaz_share.wav");
                FileOutputStream fos = new FileOutputStream(cacheFile);
                fos.write(audioBytes);
                fos.flush();
                fos.close();

                Uri audioUri = Uri.fromFile(cacheFile);
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("audio/*");
                shareIntent.putExtra(Intent.EXTRA_STREAM, audioUri);
                startActivity(Intent.createChooser(shareIntent, title != null ? title : "شیئر آڈیو"));
            } catch (Exception e) {
                Log.e(TAG, "Audio share failed", e);
            }
        }

        @JavascriptInterface
        public boolean hasMicrophonePermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                return checkSelfPermission("android.permission.RECORD_AUDIO") == PackageManager.PERMISSION_GRANTED;
            }
            return true;
        }

        @JavascriptInterface
        public void requestMicrophonePermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                requestPermissions(new String[]{"android.permission.RECORD_AUDIO"}, PERMISSIONS_REQUEST_CODE);
            }
        }

        @JavascriptInterface
        public void playNativeAudio(String base64OrPath) {
            try {
                if (mMediaPlayer != null) {
                    mMediaPlayer.release();
                    mMediaPlayer = null;
                }
                mMediaPlayer = new MediaPlayer();
                if (base64OrPath.startsWith("http://") || base64OrPath.startsWith("https://")) {
                    mMediaPlayer.setDataSource(base64OrPath);
                } else {
                    String clean = base64OrPath
                        .replace("data:audio/wav;base64,", "")
                        .replace("data:audio/mp3;base64,", "")
                        .replace("data:audio/mpeg;base64,", "");
                    byte[] bytes = Base64.decode(clean, Base64.DEFAULT);
                    File temp = File.createTempFile("native_audio_", ".wav", mContext.getCacheDir());
                    FileOutputStream fos = new FileOutputStream(temp);
                    fos.write(bytes);
                    fos.close();
                    mMediaPlayer.setDataSource(temp.getAbsolutePath());
                }
                mMediaPlayer.prepareAsync();
                mMediaPlayer.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
                    @Override
                    public void onPrepared(MediaPlayer mp) {
                        mp.start();
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "Native play error", e);
            }
        }

        @JavascriptInterface
        public void stopNativeAudio() {
            if (mMediaPlayer != null) {
                try {
                    mMediaPlayer.stop();
                    mMediaPlayer.release();
                } catch (Exception ignored) {}
                mMediaPlayer = null;
            }
        }

        @JavascriptInterface
        public void openExternalBrowser(String url) {
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(browserIntent);
            } catch (Exception ignored) {}
        }
    }
}
