package com.awaaz.studio

import android.annotation.SuppressLint
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.awaaz.studio.audio.NativeAudioEngine
import com.awaaz.studio.databinding.ActivityMainBinding
import com.awaaz.studio.network.ApiClient
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var audioEngine: NativeAudioEngine
    private lateinit var prefs: SharedPreferences

    private var currentAudioBytes: ByteArray? = null
    private var currentSpeechText: String = ""
    private var isUserTrackingSeekBar = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences("awaaz_prefs", Context.MODE_PRIVATE)
        audioEngine = NativeAudioEngine(this)

        setupNavigation()
        setupTtsStudio()
        setupPoetryStudio()
        setupSettings()
        setupAudioCallbacks()
        setupBackNavigation()
        updateNetworkStatus()
    }

    private fun updateNetworkStatus() {
        val isOnline = isNetworkAvailable() && !prefs.getBoolean("offline_only", false)
        if (isOnline) {
            binding.chipConnectionStatus.text = getString(R.string.status_connected)
            binding.chipConnectionStatus.setTextColor(getColor(R.color.accent_secondary))
        } else {
            binding.chipConnectionStatus.text = getString(R.string.status_offline)
            binding.chipConnectionStatus.setTextColor(getColor(R.color.text_secondary))
        }
    }

    private fun setupNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_tts -> showTab(1)
                R.id.nav_poetry -> showTab(2)
                R.id.nav_library -> {
                    showTab(3)
                    loadSavedLibrary()
                }
                R.id.nav_settings -> showTab(4)
                else -> false
            }
            true
        }
    }

    private fun showTab(tabIndex: Int) {
        binding.viewTtsStudio.visibility = if (tabIndex == 1) View.VISIBLE else View.GONE
        binding.viewPoetryStudio.visibility = if (tabIndex == 2) View.VISIBLE else View.GONE
        binding.viewLibraryStudio.visibility = if (tabIndex == 3) View.VISIBLE else View.GONE
        binding.viewSettingsStudio.visibility = if (tabIndex == 4) View.VISIBLE else View.GONE
        binding.layoutWebStudioOverlay.visibility = View.GONE
    }

    private fun setupTtsStudio() {
        // Preset Chips
        binding.chipIqbal.setOnClickListener {
            binding.etInputText.setText(getString(R.string.sample_iqbal_text))
            binding.chipVoiceFenrir.isChecked = true
            binding.chipStylePoetic.isChecked = true
        }

        binding.chipGhalib.setOnClickListener {
            binding.etInputText.setText(getString(R.string.sample_ghalib_text))
            binding.chipVoiceCharon.isChecked = true
            binding.chipStylePoetic.isChecked = true
        }

        binding.chipFaiz.setOnClickListener {
            binding.etInputText.setText(getString(R.string.sample_faiz_text))
            binding.chipVoiceAoede.isChecked = true
            binding.chipStyleEmotional.isChecked = true
        }

        // Speed Slider
        binding.sliderSpeed.addOnChangeListener { _, value, _ ->
            binding.tvSpeedLabel.text = getString(R.string.label_speed, value)
        }

        // Generate Voice Button
        binding.btnGenerateVoice.setOnClickListener {
            generateVoiceAction()
        }

        // Audio Player Controls
        binding.btnPlayPause.setOnClickListener {
            if (audioEngine.isPlaying()) {
                audioEngine.pause()
                binding.btnPlayPause.setIconResource(R.drawable.ic_play)
                binding.btnPlayPause.text = getString(R.string.btn_play)
            } else {
                currentAudioBytes?.let { bytes ->
                    val speed = binding.sliderSpeed.value
                    audioEngine.playAudioBytes(bytes, speed)
                    binding.btnPlayPause.setIconResource(R.drawable.ic_pause)
                    binding.btnPlayPause.text = getString(R.string.btn_pause)
                }
            }
        }

        binding.seekBarAudio.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    audioEngine.seekTo(progress)
                }
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) { isUserTrackingSeekBar = true }
            override fun onStopTrackingTouch(seekBar: SeekBar?) { isUserTrackingSeekBar = false }
        })

        // Save Audio Button
        binding.btnSaveAudio.setOnClickListener {
            currentAudioBytes?.let { bytes ->
                saveAudioToDevice(bytes, "AwaazAI_${System.currentTimeMillis()}.wav")
            }
        }

        // Share Audio Button
        binding.btnShareAudio.setOnClickListener {
            currentAudioBytes?.let { bytes ->
                shareAudioBytes(bytes)
            }
        }
    }

    private fun generateVoiceAction() {
        val text = binding.etInputText.text?.toString()?.trim() ?: ""
        if (text.isEmpty()) {
            Toast.makeText(this, getString(R.string.error_empty_text), Toast.LENGTH_SHORT).show()
            return
        }

        currentSpeechText = text
        val speed = binding.sliderSpeed.value
        val isOfflineOnly = prefs.getBoolean("offline_only", false) || !isNetworkAvailable()

        // Get Voice Artist
        val voiceId = when {
            binding.chipVoiceAoede.isChecked -> "Aoede"
            binding.chipVoiceKore.isChecked -> "Kore"
            binding.chipVoiceFenrir.isChecked -> "Fenrir"
            binding.chipVoiceCharon.isChecked -> "Charon"
            binding.chipVoicePuck.isChecked -> "Puck"
            binding.chipVoicePari.isChecked -> "Kid-Pari"
            else -> "Aoede"
        }

        // Get Style
        val style = when {
            binding.chipStylePoetic.isChecked -> "poetic"
            binding.chipStyleDramatic.isChecked -> "dramatic"
            binding.chipStyleEmotional.isChecked -> "emotional_soft"
            binding.chipStyleFormal.isChecked -> "formal"
            binding.chipStyleConversational.isChecked -> "conversational"
            else -> "poetic"
        }

        if (isOfflineOnly) {
            Toast.makeText(this, "آف لائن انجن سے کلام پیش کیا جا رہا ہے...", Toast.LENGTH_SHORT).show()
            audioEngine.speakOffline(text, "ur", speed)
            return
        }

        // Online Generation via AI Studio Cloud Backend
        binding.globalProgressBar.visibility = View.VISIBLE
        binding.btnGenerateVoice.isEnabled = false
        binding.btnGenerateVoice.text = getString(R.string.generating_voice)

        lifecycleScope.launch {
            val result = ApiClient.generateSpeech(
                text = text,
                voiceId = voiceId,
                language = "urdu",
                style = style,
                emotion = style,
                pitch = 0,
                speed = speed
            )

            binding.globalProgressBar.visibility = View.GONE
            binding.btnGenerateVoice.isEnabled = true
            binding.btnGenerateVoice.text = getString(R.string.btn_generate_voice)

            result.onSuccess { audioBytes ->
                currentAudioBytes = audioBytes
                binding.cardPlayer.visibility = View.VISIBLE
                binding.tvPlayerTitle.text = "کلام ($voiceId - $style)"
                audioEngine.playAudioBytes(audioBytes, speed)
                binding.btnPlayPause.setIconResource(R.drawable.ic_pause)
                binding.btnPlayPause.text = getString(R.string.btn_pause)
                Toast.makeText(this@MainActivity, "آواز کامیابی سے تیار ہو گئی!", Toast.LENGTH_SHORT).show()
            }.onFailure { err ->
                Snackbar.make(binding.root, "کلاؤڈ جنریشن میں تاخیر: ${err.message}", Snackbar.LENGTH_LONG)
                    .setAction("آف لائن سنیں") {
                        audioEngine.speakOffline(text, "ur", speed)
                    }
                    .show()
            }
        }
    }

    private fun setupPoetryStudio() {
        binding.btnAnalyzePoetry.setOnClickListener {
            val poetry = binding.etPoetryInput.text?.toString()?.trim() ?: ""
            if (poetry.isEmpty()) {
                Toast.makeText(this, "برائے کرم شعر یا مصرع درج کریں", Toast.LENGTH_SHORT).show()
                return
            }

            binding.globalProgressBar.visibility = View.VISIBLE
            lifecycleScope.launch {
                val res = ApiClient.analyzePoetryMeter(poetry)
                binding.globalProgressBar.visibility = View.GONE

                res.onSuccess { result ->
                    binding.cardPoetryResult.visibility = View.VISIBLE
                    binding.tvBahrName.text = "شاعر/بحر: ${result.poetDetected}\n${result.bahrName}"
                    binding.tvTaqtee.text = "تقطیع و اوزان:\n${result.bahrPattern}\nمزاج: ${result.mood}"

                    binding.btnReciteFromPoetry.setOnClickListener {
                        binding.bottomNavigation.selectedItemId = R.id.nav_tts
                        binding.etInputText.setText(poetry)
                        binding.chipVoiceAoede.isChecked = true
                        binding.chipStylePoetic.isChecked = true
                        generateVoiceAction()
                    }
                }
            }
        }
    }

    private fun setupSettings() {
        binding.switchOfflineOnly.isChecked = prefs.getBoolean("offline_only", false)
        binding.switchOfflineOnly.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("offline_only", isChecked).apply()
            updateNetworkStatus()
            val msg = if (isChecked) "صرف آف لائن موڈ فعال کر دیا گیا ہے" else "کلاؤڈ موڈ بحال کر دیا گیا ہے"
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
        }

        binding.btnOpenWebStudio.setOnClickListener {
            openWebStudio()
        }

        binding.fabCloseWebStudio.setOnClickListener {
            binding.layoutWebStudioOverlay.visibility = View.GONE
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun openWebStudio() {
        binding.layoutWebStudioOverlay.visibility = View.VISIBLE
        val settings = binding.webViewStudio.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        binding.webViewStudio.webViewClient = WebViewClient()
        binding.webViewStudio.loadUrl(ApiClient.serverBaseUrl)
    }

    private fun setupAudioCallbacks() {
        audioEngine.onPlaybackStarted = {
            runOnUiThread {
                binding.btnPlayPause.setIconResource(R.drawable.ic_pause)
                binding.btnPlayPause.text = getString(R.string.btn_pause)
            }
        }

        audioEngine.onPlaybackCompleted = {
            runOnUiThread {
                binding.btnPlayPause.setIconResource(R.drawable.ic_play)
                binding.btnPlayPause.text = getString(R.string.btn_play)
                binding.seekBarAudio.progress = 0
            }
        }

        audioEngine.onProgressUpdate = { currentMs, totalMs ->
            runOnUiThread {
                if (!isUserTrackingSeekBar && totalMs > 0) {
                    binding.seekBarAudio.max = totalMs
                    binding.seekBarAudio.progress = currentMs
                }
            }
        }

        audioEngine.onError = { error ->
            runOnUiThread {
                Toast.makeText(this, error, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun saveAudioToDevice(audioBytes: ByteArray, fileName: String) {
        try {
            val name = if (fileName.isNotBlank()) fileName else "AwaazAI_${System.currentTimeMillis()}.wav"
            val resolver = contentResolver
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, name)
                put(MediaStore.MediaColumns.MIME_TYPE, "audio/wav")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_MUSIC + "/AwaazAI")
                }
            }

            val uri = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                val outputStream: OutputStream? = resolver.openOutputStream(uri)
                outputStream?.use { it.write(audioBytes) }
                Toast.makeText(this, getString(R.string.saved_to_music), Toast.LENGTH_LONG).show()

                // Also save a reference in local app internal storage for instant library display
                saveToInternalLibrary(audioBytes, name)
            }
        } catch (e: Exception) {
            Toast.makeText(this, "محفوظ کرنے میں خرابی: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun saveToInternalLibrary(audioBytes: ByteArray, fileName: String) {
        try {
            val dir = File(filesDir, "saved_audios")
            if (!dir.exists()) dir.mkdirs()
            val file = File(dir, fileName)
            FileOutputStream(file).use { it.write(audioBytes) }
        } catch (e: Exception) {
            // ignore
        }
    }

    private fun loadSavedLibrary() {
        val container = binding.layoutSavedItemsContainer
        container.removeAllViews()

        val dir = File(filesDir, "saved_audios")
        val files = dir.listFiles { f -> f.extension == "wav" || f.extension == "mp3" }?.sortedByDescending { it.lastModified() }

        if (files.isNullOrEmpty()) {
            container.addView(binding.tvEmptyLibrary)
            return
        }

        val dateFormat = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault())

        for (file in files) {
            val card = MaterialCardView(this).apply {
                setCardBackgroundColor(getColor(R.color.card_dark))
                strokeColor = getColor(R.color.border_color)
                strokeWidth = 2
                radius = 24f
                val params = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                params.setMargins(0, 0, 0, 24)
                layoutParams = params
            }

            val cardLayout = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(36, 28, 36, 28)
            }

            val titleView = TextView(this).apply {
                text = file.name
                setTextColor(getColor(R.color.text_primary))
                textSize = 15f
                paint.isFakeBoldText = true
            }

            val dateView = TextView(this).apply {
                val sizeKb = file.length() / 1024
                text = "${dateFormat.format(Date(file.lastModified()))} • ${sizeKb} KB"
                setTextColor(getColor(R.color.text_secondary))
                textSize = 12f
            }

            val actionsRow = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                val rowParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                rowParams.setMargins(0, 16, 0, 0)
                layoutParams = rowParams
            }

            val btnPlayItem = MaterialButton(this, null, com.google.android.material.R.attr.materialButtonOutlinedStyle).apply {
                text = "سنیں"
                setIconResource(R.drawable.ic_play)
                cornerRadius = 20
                setTextColor(getColor(R.color.accent_primary))
                strokeColor = android.content.res.ColorStateList.valueOf(getColor(R.color.accent_primary))
                setOnClickListener {
                    val bytes = file.readBytes()
                    audioEngine.playAudioBytes(bytes, 1.0f)
                }
            }

            val btnShareItem = MaterialButton(this, null, com.google.android.material.R.attr.materialButtonOutlinedStyle).apply {
                text = "شیئر"
                setIconResource(R.drawable.ic_share)
                cornerRadius = 20
                setTextColor(getColor(R.color.text_primary))
                strokeColor = android.content.res.ColorStateList.valueOf(getColor(R.color.border_color))
                val p = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)
                p.setMargins(16, 0, 0, 0)
                layoutParams = p
                setOnClickListener {
                    shareAudioFile(file)
                }
            }

            val btnDeleteItem = MaterialButton(this, null, com.google.android.material.R.attr.materialButtonOutlinedStyle).apply {
                text = "حذف"
                setIconResource(R.drawable.ic_delete)
                cornerRadius = 20
                setTextColor(getColor(R.color.accent_secondary))
                strokeColor = android.content.res.ColorStateList.valueOf(getColor(R.color.accent_secondary))
                val p = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)
                p.setMargins(16, 0, 0, 0)
                layoutParams = p
                setOnClickListener {
                    file.delete()
                    loadSavedLibrary()
                }
            }

            actionsRow.addView(btnPlayItem)
            actionsRow.addView(btnShareItem)
            actionsRow.addView(btnDeleteItem)

            cardLayout.addView(titleView)
            cardLayout.addView(dateView)
            cardLayout.addView(actionsRow)
            card.addView(cardLayout)
            container.addView(card)
        }
    }

    private fun shareAudioBytes(bytes: ByteArray) {
        try {
            val cacheFile = File(cacheDir, "awaaz_share.wav")
            FileOutputStream(cacheFile).use { it.write(bytes) }
            shareAudioFile(cacheFile)
        } catch (e: Exception) {
            Toast.makeText(this, "شیئر کرنے میں خرابی: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun shareAudioFile(file: File) {
        try {
            val uri = FileProvider.getUriForFile(this, "${packageName}.provider", file)
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "audio/*"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(Intent.createChooser(intent, "آڈیو شیئر کریں بذریعہ:"))
        } catch (e: Exception) {
            Toast.makeText(this, "شیئر کرنے میں خرابی: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.layoutWebStudioOverlay.visibility == View.VISIBLE) {
                    binding.layoutWebStudioOverlay.visibility = View.GONE
                } else if (binding.bottomNavigation.selectedItemId != R.id.nav_tts) {
                    binding.bottomNavigation.selectedItemId = R.id.nav_tts
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    override fun onDestroy() {
        super.onDestroy()
        audioEngine.release()
        binding.webViewStudio.destroy()
    }
}
