package com.awaaz.studio.audio

import android.content.Context
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.util.Locale

class NativeAudioEngine(private val context: Context) : TextToSpeech.OnInitListener {

    private var mediaPlayer: MediaPlayer? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false
    private val progressHandler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null

    var onPlaybackStarted: (() -> Unit)? = null
    var onPlaybackCompleted: (() -> Unit)? = null
    var onError: ((String) -> Unit)? = null
    var onProgressUpdate: ((currentMs: Int, totalMs: Int) -> Unit)? = null

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
            val tempFile = File.createTempFile("awaaz_temp_", ".wav", context.cacheDir)
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
                    startProgressTracking()
                    onPlaybackStarted?.invoke()
                }
                setOnCompletionListener {
                    stopProgressTracking()
                    onPlaybackCompleted?.invoke()
                    tempFile.delete()
                }
                setOnErrorListener { _, what, extra ->
                    stopProgressTracking()
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

    private fun startProgressTracking() {
        stopProgressTracking()
        progressRunnable = object : Runnable {
            override fun run() {
                mediaPlayer?.let { mp ->
                    try {
                        if (mp.isPlaying) {
                            onProgressUpdate?.invoke(mp.currentPosition, mp.duration)
                            progressHandler.postDelayed(this, 200)
                        }
                    } catch (e: Exception) {
                        // ignore
                    }
                }
            }
        }
        progressRunnable?.let { progressHandler.post(it) }
    }

    private fun stopProgressTracking() {
        progressRunnable?.let { progressHandler.removeCallbacks(it) }
        progressRunnable = null
    }

    fun pause() {
        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.pause()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error pausing audio", e)
        }
    }

    fun resume() {
        try {
            mediaPlayer?.start()
            startProgressTracking()
        } catch (e: Exception) {
            Log.e(TAG, "Error resuming audio", e)
        }
    }

    fun seekTo(positionMs: Int) {
        try {
            mediaPlayer?.seekTo(positionMs)
        } catch (e: Exception) {
            Log.e(TAG, "Error seeking audio", e)
        }
    }

    /**
     * Fallback to native Android TTS when offline or no connection
     */
    fun speakOffline(text: String, languageCode: String = "ur", rate: Float = 1.0f) {
        if (!isTtsReady || textToSpeech == null) {
            onError?.invoke("آف لائن انجن تیار ہو رہا ہے، برائے کرم انتظار کریں...")
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
            stopProgressTracking()
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
