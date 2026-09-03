package com.awaaz.studio

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
