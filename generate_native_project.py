import os
import zipfile
import shutil

BASE_DIR = "/android-native-project"
os.makedirs(BASE_DIR, exist_ok=True)

# 1. Root settings.gradle
settings_gradle = """pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "AwaazAIStudio"
include(":app")
"""

# 2. Root build.gradle
root_build_gradle = """plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}

tasks.register("clean", Delete) {
    delete(rootProject.buildDir)
}
"""

# 3. gradle.properties
gradle_properties = """org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
android.nonTransitiveRClass=true
"""

# 4. app/build.gradle
app_build_gradle = """plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.awaaz.studio"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.awaaz.studio"
        minSdk = 24
        targetSdk = 34
        versionCode = 2
        versionName = "2.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-ktx:1.8.2")

    // Networking & JSON
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.google.code.gson:gson:2.10.1")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Media & Audio
    implementation("androidx.media3:media3-exoplayer:1.2.1")
    implementation("androidx.media3:media3-ui:1.2.1")
}
"""

# 5. app/src/main/AndroidManifest.xml
android_manifest = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Network & Internet for AI Cloud Voice Generation -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Audio & Storage Permissions -->
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />

    <application
        android:name=".AwaazApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.AwaazAI"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
"""

# 6. AwaazApplication.kt
app_class = """package com.awaaz.studio

import android.app.Application

class AwaazApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: AwaazApplication
            private set
    }
}
"""

# 7. NativeAudioEngine.kt
audio_engine = """package com.awaaz.studio.audio

import android.content.Context
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.os.Build
import android.speech.tts.TextToSpeech
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.util.Locale

class NativeAudioEngine(private val context: Context) : TextToSpeech.OnInitListener {

    private var mediaPlayer: MediaPlayer? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false

    var onPlaybackStarted: (() -> Unit)? = null
    var onPlaybackCompleted: (() -> Unit)? = null
    var onError: ((String) -> Unit)? = null

    init {
        textToSpeech = TextToSpeech(context.applicationContext, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsReady = true
            textToSpeech?.language = Locale("ur", "PK")
            Log.d(TAG, "Native Android TTS initialized successfully")
        } else {
            Log.w(TAG, "TTS Initialization failed with status: $status")
        }
    }

    /**
     * Play raw MP3 or WAV audio bytes received from Awaaz AI Server
     */
    fun playAudioBytes(audioBytes: ByteArray, speed: Float = 1.0f) {
        try {
            stop()
            val tempFile = File.createTempFile("awaaz_temp_", ".mp3", context.cacheDir)
            FileOutputStream(tempFile).use { it.write(audioBytes) }

            mediaPlayer = MediaPlayer().apply {
                setDataSource(tempFile.absolutePath)
                setOnPreparedListener { mp ->
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        try {
                            val params = PlaybackParams().apply { this.speed = speed }
                            mp.playbackParams = params
                        } catch (e: Exception) {
                            Log.w(TAG, "Could not set playback speed: ${e.message}")
                        }
                    }
                    mp.start()
                    onPlaybackStarted?.invoke()
                }
                setOnCompletionListener {
                    onPlaybackCompleted?.invoke()
                    tempFile.delete()
                }
                setOnErrorListener { _, what, extra ->
                    onError?.invoke("Playback error: what=$what extra=$extra")
                    tempFile.delete()
                    true
                }
                prepareAsync()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play audio bytes", e)
            onError?.invoke("Audio playback failed: ${e.localizedMessage}")
        }
    }

    /**
     * Fallback to native Android TTS when offline or no connection
     */
    fun speakOffline(text: String, languageCode: String = "ur", rate: Float = 1.0f) {
        if (!isTtsReady || textToSpeech == null) {
            onError?.invoke("Offline speech engine is preparing, please wait...")
            return
        }

        try {
            val locale = when (languageCode.lowercase()) {
                "ur", "urdu" -> Locale("ur", "PK")
                "hi", "hindi" -> Locale("hi", "IN")
                else -> Locale.ENGLISH
            }
            textToSpeech?.language = locale
            textToSpeech?.setSpeechRate(rate)

            onPlaybackStarted?.invoke()
            textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "awaaz_tts_${System.currentTimeMillis()}")
        } catch (e: Exception) {
            onError?.invoke("TTS speaking error: ${e.localizedMessage}")
        }
    }

    fun isPlaying(): Boolean = mediaPlayer?.isPlaying == true

    fun stop() {
        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.stop()
            }
            mediaPlayer?.release()
            mediaPlayer = null
            textToSpeech?.stop()
            onPlaybackCompleted?.invoke()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping audio", e)
        }
    }

    fun release() {
        stop()
        textToSpeech?.shutdown()
        textToSpeech = null
    }

    companion object {
        private const val TAG = "NativeAudioEngine"
    }
}
"""

# 8. ApiClient.kt
api_client = """package com.awaaz.studio.network

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object ApiClient {
    // Current live Cloud Run backend URL
    var serverBaseUrl: String = "https://ais-dev-5cvx4c33evmpc66n564nmm-904497767506.asia-east1.run.app"

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    suspend fun generateSpeech(
        text: String,
        voiceId: String = "Puck",
        language: String = "urdu",
        emotion: String = "poetic",
        speed: Float = 1.0f
    ): Result<ByteArray> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = JSONObject().apply {
                put("text", text)
                put("voice", voiceId)
                put("language", language)
                put("emotion", emotion)
                put("speed", speed)
            }

            val requestBody = jsonBody.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val request = Request.Builder()
                .url("$serverBaseUrl/api/generate-speech")
                .post(requestBody)
                .addHeader("Accept", "application/json, audio/mpeg, audio/wav")
                .build()

            val response = httpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.failure(Exception("Server returned HTTP ${response.code}: ${response.message}"))
            }

            val contentType = response.header("Content-Type", "") ?: ""
            if (contentType.contains("audio/")) {
                val bytes = response.body?.bytes() ?: return@withContext Result.failure(Exception("Empty audio stream"))
                return@withContext Result.success(bytes)
            }

            val responseText = response.body?.string() ?: ""
            val jsonResponse = JSONObject(responseText)

            if (jsonResponse.has("audioData")) {
                val base64Data = jsonResponse.getString("audioData")
                    .replace("data:audio/mp3;base64,", "")
                    .replace("data:audio/wav;base64,", "")
                val decoded = Base64.decode(base64Data, Base64.DEFAULT)
                Result.success(decoded)
            } else if (jsonResponse.has("error")) {
                Result.failure(Exception(jsonResponse.getString("error")))
            } else {
                Result.failure(Exception("Unknown server response structure"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
"""

# 9. MainActivity.kt
main_activity = """package com.awaaz.studio

import android.content.ContentValues
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.awaaz.studio.audio.NativeAudioEngine
import com.awaaz.studio.databinding.ActivityMainBinding
import com.awaaz.studio.network.ApiClient
import com.google.android.material.chip.Chip
import kotlinx.coroutines.launch
import java.io.OutputStream

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var audioEngine: NativeAudioEngine

    private var selectedVoiceId = "Puck"
    private var selectedLanguage = "urdu"
    private var lastGeneratedAudio: ByteArray? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        audioEngine = NativeAudioEngine(this)
        setupAudioListeners()
        setupUI()
    }

    private fun setupAudioListeners() {
        audioEngine.onPlaybackStarted = {
            runOnUiThread {
                binding.btnPlay.text = getString(R.string.btn_stop)
                binding.btnPlay.setIconResource(R.drawable.ic_stop)
                binding.playbackProgress.visibility = View.VISIBLE
            }
        }

        audioEngine.onPlaybackCompleted = {
            runOnUiThread {
                binding.btnPlay.text = getString(R.string.btn_play)
                binding.btnPlay.setIconResource(R.drawable.ic_play)
                binding.playbackProgress.visibility = View.INVISIBLE
            }
        }

        audioEngine.onError = { errorMsg ->
            runOnUiThread {
                Toast.makeText(this@MainActivity, errorMsg, Toast.LENGTH_LONG).show()
                binding.playbackProgress.visibility = View.INVISIBLE
            }
        }
    }

    private fun setupUI() {
        // Voice Chips selection
        binding.chipGroupVoices.setOnCheckedStateChangeListener { group, checkedIds ->
            if (checkedIds.isNotEmpty()) {
                val chip = group.findViewById<Chip>(checkedIds[0])
                selectedVoiceId = chip?.tag as? String ?: "Puck"
            }
        }

        // Language buttons
        binding.btnLangUrdu.setOnClickListener {
            selectedLanguage = "urdu"
            binding.etScript.setText(R.string.sample_poetry_urdu)
            binding.etScript.textDirection = View.TEXT_DIRECTION_RTL
        }

        binding.btnLangHindi.setOnClickListener {
            selectedLanguage = "hindi"
            binding.etScript.setText(R.string.sample_poetry_hindi)
            binding.etScript.textDirection = View.TEXT_DIRECTION_LTR
        }

        binding.btnLangEnglish.setOnClickListener {
            selectedLanguage = "english"
            binding.etScript.setText(R.string.sample_poetry_en)
            binding.etScript.textDirection = View.TEXT_DIRECTION_LTR
        }

        // Generate AI Voice Button
        binding.btnGenerate.setOnClickListener {
            val text = binding.etScript.text?.toString()?.trim()
            if (text.isNullOrEmpty()) {
                Toast.makeText(this, R.string.error_empty_text, Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            generateSpeech(text)
        }

        // Native Play / Stop Button
        binding.btnPlay.setOnClickListener {
            if (audioEngine.isPlaying()) {
                audioEngine.stop()
            } else if (lastGeneratedAudio != null) {
                audioEngine.playAudioBytes(lastGeneratedAudio!!, binding.sliderSpeed.value)
            } else {
                val text = binding.etScript.text?.toString()?.trim() ?: ""
                if (text.isNotEmpty()) {
                    audioEngine.speakOffline(text, selectedLanguage, binding.sliderSpeed.value)
                }
            }
        }

        // Native Save to Device
        binding.btnSaveAudio.setOnClickListener {
            val audio = lastGeneratedAudio
            if (audio == null) {
                Toast.makeText(this, "پہلے آواز تیار کریں (Generate audio first)", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            saveAudioToDevice(audio)
        }
    }

    private fun generateSpeech(text: String) {
        binding.loadingBar.visibility = View.VISIBLE
        binding.btnGenerate.isEnabled = false

        lifecycleScope.launch {
            val speed = binding.sliderSpeed.value
            val result = ApiClient.generateSpeech(
                text = text,
                voiceId = selectedVoiceId,
                language = selectedLanguage,
                emotion = "poetic",
                speed = speed
            )

            binding.loadingBar.visibility = View.GONE
            binding.btnGenerate.isEnabled = true

            result.onSuccess { audioBytes ->
                lastGeneratedAudio = audioBytes
                binding.btnSaveAudio.visibility = View.VISIBLE
                binding.btnPlay.visibility = View.VISIBLE
                Toast.makeText(this@MainActivity, "آواز تیار ہے! بجائی جا رہی ہے...", Toast.LENGTH_SHORT).show()
                audioEngine.playAudioBytes(audioBytes, speed)
            }.onFailure { error ->
                Toast.makeText(this@MainActivity, "آن لائن سرور فال بیک: آف لائن بولا جا رہا ہے (${error.localizedMessage})", Toast.LENGTH_LONG).show()
                audioEngine.speakOffline(text, selectedLanguage, speed)
            }
        }
    }

    private fun saveAudioToDevice(audioBytes: ByteArray) {
        try {
            val filename = "AwaazAI_${System.currentTimeMillis()}.mp3"
            val resolver = contentResolver
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                put(MediaStore.MediaColumns.MIME_TYPE, "audio/mpeg")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_MUSIC + "/AwaazAI")
                }
            }

            val uri = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                val outputStream: OutputStream? = resolver.openOutputStream(uri)
                outputStream?.use { it.write(audioBytes) }
                Toast.makeText(this, "فائل Music/AwaazAI میں محفوظ ہو گئی!", Toast.LENGTH_LONG).show()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "محفوظ کرنے میں خرابی: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        audioEngine.release()
    }
}
"""

# 10. res/layout/activity_main.xml
activity_main_xml = """<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/bg_dark">

    <com.google.android.material.appbar.AppBarLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@color/card_dark"
        app:elevation="4dp">

        <com.google.android.material.appbar.MaterialToolbar
            android:id="@+id/topAppBar"
            android:layout_width="match_parent"
            android:layout_height="?attr/actionBarSize"
            app:title="@string/app_name"
            app:titleTextColor="@color/text_primary"
            app:subtitle="@string/app_subtitle"
            app:subtitleTextColor="@color/text_secondary" />

    </com.google.android.material.appbar.AppBarLayout>

    <androidx.core.widget.NestedScrollView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:fillViewport="true"
        app:layout_behavior="@string/appbar_scrolling_view_behavior">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="16dp">

            <!-- Language Buttons -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:layout_marginBottom="12dp">

                <com.google.android.material.button.MaterialButton
                    android:id="@+id/btnLangUrdu"
                    style="@style/Widget.Material3.Button.TonalButton"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:layout_marginEnd="4dp"
                    android:text="اردو (Urdu)" />

                <com.google.android.material.button.MaterialButton
                    android:id="@+id/btnLangHindi"
                    style="@style/Widget.Material3.Button.TonalButton"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:layout_marginEnd="4dp"
                    android:text="हिंदी (Hindi)" />

                <com.google.android.material.button.MaterialButton
                    android:id="@+id/btnLangEnglish"
                    style="@style/Widget.Material3.Button.TonalButton"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:text="English" />

            </LinearLayout>

            <!-- Script Input Card -->
            <com.google.android.material.card.MaterialCardView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                app:cardBackgroundColor="@color/card_dark"
                app:cardCornerRadius="16dp"
                app:strokeColor="@color/border_color"
                app:strokeWidth="1dp"
                android:layout_marginBottom="16dp">

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="vertical"
                    android:padding="16dp">

                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="@string/label_input_text"
                        android:textColor="@color/text_primary"
                        android:textSize="14sp"
                        android:textStyle="bold"
                        android:layout_marginBottom="8dp" />

                    <com.google.android.material.textfield.TextInputLayout
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        app:hintEnabled="false"
                        app:boxBackgroundMode="none">

                        <com.google.android.material.textfield.TextInputEditText
                            android:id="@+id/etScript"
                            android:layout_width="match_parent"
                            android:layout_height="wrap_content"
                            android:minLines="4"
                            android:gravity="top|start"
                            android:text="@string/sample_poetry_urdu"
                            android:textColor="@color/text_primary"
                            android:textColorHint="@color/text_secondary"
                            android:textSize="16sp"
                            android:textDirection="rtl" />

                    </com.google.android.material.textfield.TextInputLayout>

                </LinearLayout>

            </com.google.android.material.card.MaterialCardView>

            <!-- Voice Selection Chips -->
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/label_select_voice"
                android:textColor="@color/text_primary"
                android:textSize="14sp"
                android:textStyle="bold"
                android:layout_marginBottom="8dp" />

            <HorizontalScrollView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:scrollbars="none"
                android:layout_marginBottom="16dp">

                <com.google.android.material.chip.ChipGroup
                    android:id="@+id/chipGroupVoices"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    app:singleSelection="true"
                    app:selectionRequired="true">

                    <com.google.android.material.chip.Chip
                        android:id="@+id/chipZoya"
                        style="@style/Widget.Material3.Chip.Filter"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:checked="true"
                        android:tag="Puck"
                        android:text="زویا (Zoya - Warm)" />

                    <com.google.android.material.chip.Chip
                        android:id="@+id/chipShahzad"
                        style="@style/Widget.Material3.Chip.Filter"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:tag="Charon"
                        android:text="شہزاد (Shahzad - Deep)" />

                    <com.google.android.material.chip.Chip
                        android:id="@+id/chipFarhan"
                        style="@style/Widget.Material3.Chip.Filter"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:tag="Fenrir"
                        android:text="فرحان (Farhan - Energetic)" />

                    <com.google.android.material.chip.Chip
                        android:id="@+id/chipAyesha"
                        style="@style/Widget.Material3.Chip.Filter"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:tag="Aoede"
                        android:text="عائشہ (Ayesha - Gentle)" />

                </com.google.android.material.chip.ChipGroup>

            </HorizontalScrollView>

            <!-- Speed Slider -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:layout_marginBottom="16dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="@string/label_speed"
                    android:textColor="@color/text_secondary"
                    android:textSize="13sp" />

                <com.google.android.material.slider.Slider
                    android:id="@+id/sliderSpeed"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:valueFrom="0.5"
                    android:valueTo="1.5"
                    android:stepSize="0.1"
                    android:value="1.0"
                    app:thumbColor="@color/accent_primary"
                    app:trackColorActive="@color/accent_primary" />

            </LinearLayout>

            <!-- Loading Indicator -->
            <com.google.android.material.progressindicator.LinearProgressIndicator
                android:id="@+id/loadingBar"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:indeterminate="true"
                android:visibility="gone"
                android:layout_marginBottom="12dp"
                app:indicatorColor="@color/accent_primary" />

            <!-- Primary Generate Button -->
            <com.google.android.material.button.MaterialButton
                android:id="@+id/btnGenerate"
                android:layout_width="match_parent"
                android:layout_height="56dp"
                android:text="@string/btn_generate_voice"
                android:textSize="16sp"
                android:textStyle="bold"
                app:cornerRadius="16dp"
                app:icon="@drawable/ic_sparkles"
                app:iconGravity="textStart"
                android:backgroundTint="@color/accent_primary"
                android:layout_marginBottom="12dp" />

            <!-- Play / Stop & Save Buttons -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal">

                <com.google.android.material.button.MaterialButton
                    android:id="@+id/btnPlay"
                    style="@style/Widget.Material3.Button.OutlinedButton"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:layout_marginEnd="8dp"
                    android:text="@string/btn_play"
                    app:icon="@drawable/ic_play"
                    android:textColor="@color/text_primary"
                    app:strokeColor="@color/border_color" />

                <com.google.android.material.button.MaterialButton
                    android:id="@+id/btnSaveAudio"
                    style="@style/Widget.Material3.Button.TonalButton"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:text="@string/btn_save"
                    app:icon="@drawable/ic_download" />

            </LinearLayout>

            <!-- Playback Visualizer -->
            <com.google.android.material.progressindicator.LinearProgressIndicator
                android:id="@+id/playbackProgress"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:indeterminate="true"
                android:visibility="invisible"
                android:layout_marginTop="12dp"
                app:indicatorColor="@color/accent_secondary" />

        </LinearLayout>

    </androidx.core.widget.NestedScrollView>

</androidx.coordinatorlayout.widget.CoordinatorLayout>
"""

# 11. res/values/strings.xml
strings_xml = """<resources>
    <string name="app_name">Awaaz AI Studio</string>
    <string name="app_subtitle">آواز اے آئی اسٹوڈیو • Native Android</string>
    <string name="label_input_text">متن درج کریں (Enter Text or Poetry)</string>
    <string name="label_select_voice">آواز منتخب کریں (Select Voice Artist)</string>
    <string name="label_speed">رفتار (Speed)</string>
    <string name="btn_generate_voice">آواز تیار کریں (Generate AI Voice)</string>
    <string name="btn_play">سنیں (Play)</string>
    <string name="btn_stop">روکیں (Stop)</string>
    <string name="btn_save">فون میں محفوظ کریں (Save MP3)</string>
    <string name="error_empty_text">برائے کرم کچھ متن یا شاعری لکھیں</string>
    <string name="sample_poetry_urdu">ستاروں سے آگے جہاں اور بھی ہیں&#10;ابھی عشق کے امتحاں اور بھی ہیں</string>
    <string name="sample_poetry_hindi">सितारों से आगे जहाँ और भी हैं&#10;अभी इश्क़ के इम्तिहाँ और भी हैं</string>
    <string name="sample_poetry_en">Beyond the stars are other worlds,&#10;And many more trials in love await.</string>
</resources>
"""

# 12. res/values/colors.xml
colors_xml = """<resources>
    <color name="bg_dark">#050507</color>
    <color name="card_dark">#121218</color>
    <color name="border_color">#262633</color>
    <color name="accent_primary">#4F46E5</color>
    <color name="accent_secondary">#EC4899</color>
    <color name="text_primary">#F8FAFC</color>
    <color name="text_secondary">#94A3B8</color>
</resources>
"""

# 13. res/values/themes.xml
themes_xml = """<resources>
    <style name="Theme.AwaazAI" parent="Theme.Material3.Dark.NoActionBar">
        <item name="colorPrimary">@color/accent_primary</item>
        <item name="colorSecondary">@color/accent_secondary</item>
        <item name="android:statusBarColor">@color/bg_dark</item>
        <item name="android:navigationBarColor">@color/bg_dark</item>
    </style>
</resources>
"""

# 14. Drawables
ic_sparkles_xml = """<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,2L9.5,8.5L3,11L9.5,13.5L12,20L14.5,13.5L21,11L14.5,8.5L12,2Z"/>
</vector>
"""

ic_play_xml = """<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M8,5.14V19.14L19,12.14L8,5.14Z"/>
</vector>
"""

ic_stop_xml = """<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M6,6H18V18H6V6Z"/>
</vector>
"""

ic_download_xml = """<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M19,9H15V3H9V9H5L12,16L19,9M5,18V20H19V18H5Z"/>
</vector>
"""

# 15. README.md
readme_md = """# Awaaz AI Studio - 100% Native Android Studio Project (Kotlin)

یہ پروجیکٹ بغیر کسی ویب ویو (No WebView) کے خالص **اینڈرائیڈ نیٹو کوٹلن (Pure Native Kotlin + Material 3)** میں تیار کیا گیا ہے۔

## خاص فیچرز (Native Features):
1. **Material 3 Dark Studio UI:** الٹرا فاسٹ، ہارڈ ویئر ایکسیلریٹڈ ڈارک انٹرفیس۔
2. **کلاؤڈ AI وائس انجن:** OkHttp + Coroutines کے ذریعے سرور سے 24kHz HD آڈیو حاصل کرتا ہے۔
3. **آف لائن TTS فال بیک:** اگر انٹرنیٹ بند ہو تو اینڈرائیڈ کا اپنا نیٹو `TextToSpeech` اردو اور ہندی میں بولتا ہے۔
4. **نیٹو میڈیا پلیئر (Android MediaPlayer):** آڈیو اسٹریمنگ، اسپیڈ کنٹرول اور پلے بیک مانیٹر۔
5. **ڈاؤن لوڈ / سیو فیچر:** آڈیو فائل کو خود بخود فون کے `Music/AwaazAI` فولڈر میں MP3 کے طور پر محفوظ کرتا ہے۔

## کیسے چلائیں (How to Run in Android Studio):
1. اس ZIP فائل کو اپنے کمپیوٹر پر Extract کریں۔
2. **Android Studio** کھولیں اور **"Open an Existing Project"** منتخب کر کے اس فولڈر کو منتخب کریں۔
3. گریڈل کی ہم آہنگی (Gradle Sync) مکمل ہونے دیں۔
4. اپنا اینڈرائیڈ فون USB کیبل سے کمپیوٹر سے جوڑیں (یا ایمولیٹر منتخب کریں)۔
5. **Run (Shift + F10)** کا بٹن دبائیں۔
6. چند سیکنڈز میں 100% اصل نیٹو ایپ آپ کے فون پر انسٹال ہو جائے گی!

## ریلیز APK کیسے بنائیں (Build Release APK for Play Store):
1. مینو بار میں جائیں: **Build** -> **Generate Signed Bundle / APK...**
2. **APK** منتخب کریں اور اپنی Keystore چُن کر **Release** پر کلک کریں۔
"""

files_to_write = {
    "settings.gradle.kts": settings_gradle,
    "build.gradle.kts": root_build_gradle,
    "gradle.properties": gradle_properties,
    "README.md": readme_md,
    "app/build.gradle.kts": app_build_gradle,
    "app/proguard-rules.pro": "# Proguard rules\n-keep class com.awaaz.studio.** { *; }\n",
    "app/src/main/AndroidManifest.xml": android_manifest,
    "app/src/main/java/com/awaaz/studio/AwaazApplication.kt": app_class,
    "app/src/main/java/com/awaaz/studio/MainActivity.kt": main_activity,
    "app/src/main/java/com/awaaz/studio/audio/NativeAudioEngine.kt": audio_engine,
    "app/src/main/java/com/awaaz/studio/network/ApiClient.kt": api_client,
    "app/src/main/res/layout/activity_main.xml": activity_main_xml,
    "app/src/main/res/values/strings.xml": strings_xml,
    "app/src/main/res/values/colors.xml": colors_xml,
    "app/src/main/res/values/themes.xml": themes_xml,
    "app/src/main/res/drawable/ic_sparkles.xml": ic_sparkles_xml,
    "app/src/main/res/drawable/ic_play.xml": ic_play_xml,
    "app/src/main/res/drawable/ic_stop.xml": ic_stop_xml,
    "app/src/main/res/drawable/ic_download.xml": ic_download_xml,
}

# Copy mipmap launcher icons if exist
mipmap_src = "/android/res"
mipmap_dest = os.path.join(BASE_DIR, "app/src/main/res")

for path_rel, content in files_to_write.items():
    full_path = os.path.join(BASE_DIR, path_rel)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

if os.path.exists(mipmap_src):
    for item in os.listdir(mipmap_src):
        if item.startswith("mipmap"):
            s = os.path.join(mipmap_src, item)
            d = os.path.join(mipmap_dest, item)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)

# Create zip bundle for download
zip_target = "public/AwaazAI-Android-Studio-Project.zip"
zip_target2 = "APK_DOWNLOAD/AwaazAI-Android-Studio-Project.zip"
os.makedirs("public", exist_ok=True)
os.makedirs("APK_DOWNLOAD", exist_ok=True)

with zipfile.ZipFile(zip_target, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, _, files in os.walk(BASE_DIR):
        for file in files:
            abs_p = os.path.join(root, file)
            rel_p = os.path.relpath(abs_p, BASE_DIR)
            zipf.write(abs_p, os.path.join("AwaazAIStudio", rel_p))

shutil.copyfile(zip_target, zip_target2)
print("Android Studio project generated and zipped successfully:", os.path.getsize(zip_target), "bytes")
