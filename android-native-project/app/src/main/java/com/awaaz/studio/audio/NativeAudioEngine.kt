package com.awaaz.studio.audio

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
