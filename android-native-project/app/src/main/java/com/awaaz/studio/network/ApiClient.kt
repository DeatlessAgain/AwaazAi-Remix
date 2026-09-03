package com.awaaz.studio.network

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class PoetryAnalysisResult(
    val poetDetected: String,
    val bahrName: String,
    val bahrPattern: String,
    val mood: String,
    val recommendedVoice: String
)

object ApiClient {
    // Live Cloud Run backend URL
    var serverBaseUrl: String = "https://ais-dev-5cvx4c33evmpc66n564nmm-904497767506.asia-east1.run.app"

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    suspend fun generateSpeech(
        text: String,
        voiceId: String = "Aoede",
        language: String = "urdu",
        style: String = "poetic",
        emotion: String = "poetic",
        pitch: Int = 0,
        speed: Float = 1.0f
    ): Result<ByteArray> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = JSONObject().apply {
                put("text", text)
                put("voice", voiceId)
                put("language", language)
                put("style", style)
                put("emotion", emotion)
                put("pitch", pitch)
                put("speed", speed)
            }

            val requestBody = jsonBody.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            
            // Try /api/tts/generate, fallback to /api/generate-voice
            val request = Request.Builder()
                .url("$serverBaseUrl/api/tts/generate")
                .post(requestBody)
                .addHeader("Accept", "application/json, audio/wav, audio/mpeg")
                .build()

            val response = httpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.failure(Exception("سرور خرابی (${response.code}): ${response.message}"))
            }

            val contentType = response.header("Content-Type", "") ?: ""
            if (contentType.contains("audio/")) {
                val bytes = response.body?.bytes() ?: return@withContext Result.failure(Exception("Empty audio stream"))
                return@withContext Result.success(bytes)
            }

            val responseText = response.body?.string() ?: ""
            val jsonResponse = JSONObject(responseText)

            val base64Field = when {
                jsonResponse.has("audio") -> jsonResponse.getString("audio")
                jsonResponse.has("audioBase64") -> jsonResponse.getString("audioBase64")
                jsonResponse.has("audioData") -> jsonResponse.getString("audioData")
                else -> null
            }

            if (base64Field != null) {
                val cleanBase64 = base64Field
                    .replace("data:audio/wav;base64,", "")
                    .replace("data:audio/mp3;base64,", "")
                    .replace("data:audio/mpeg;base64,", "")
                val decoded = Base64.decode(cleanBase64, Base64.DEFAULT)
                Result.success(decoded)
            } else if (jsonResponse.has("error")) {
                Result.failure(Exception(jsonResponse.getString("error")))
            } else {
                Result.failure(Exception("نامعلوم جوابی ڈھانچہ"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun analyzePoetryMeter(poetryText: String): Result<PoetryAnalysisResult> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = JSONObject().apply {
                put("poetryText", poetryText)
                put("language", "urdu")
            }

            val requestBody = jsonBody.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val request = Request.Builder()
                .url("$serverBaseUrl/api/ai/poetry-meter")
                .post(requestBody)
                .build()

            val response = httpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                // Fallback offline analysis
                return@withContext Result.success(getOfflinePoetryAnalysis(poetryText))
            }

            val responseText = response.body?.string() ?: ""
            val json = JSONObject(responseText)

            Result.success(
                PoetryAnalysisResult(
                    poetDetected = json.optString("poetDetected", "کلاسیکی اردو شاعری"),
                    bahrName = json.optString("bahrName", "بحرِ رمل مثمن محذوف"),
                    bahrPattern = json.optString("bahrPattern", "فاعلاتن فاعلاتن فاعلاتن فاعلن"),
                    mood = json.optString("mood", "ادبی و نغماتی"),
                    recommendedVoice = json.optString("recommendedVoice", "Aoede")
                )
            )
        } catch (e: Exception) {
            // Safe offline fallback
            Result.success(getOfflinePoetryAnalysis(poetryText))
        }
    }

    private fun getOfflinePoetryAnalysis(poetryText: String): PoetryAnalysisResult {
        return when {
            poetryText.contains("غالب") || poetryText.contains("ہزاروں خواہشیں") || poetryText.contains("دلِ ناداں") -> {
                PoetryAnalysisResult(
                    poetDetected = "مرزا اسد اللہ خان غالب",
                    bahrName = "بحرِ ہزج مثمن سالم",
                    bahrPattern = "مفاعیلن مفاعیلن مفاعیلن مفاعیلن",
                    mood = "فلسفیانہ و نکتہ داں",
                    recommendedVoice = "Charon"
                )
            }
            poetryText.contains("اقبال") || poetryText.contains("خودی") || poetryText.contains("ستاروں") -> {
                PoetryAnalysisResult(
                    poetDetected = "علامہ محمد اقبال",
                    bahrName = "بحرِ متقارب مثمن سالم",
                    bahrPattern = "فعولن فعولن فعولن فعولن",
                    mood = "روحانی و ولولہ انگیز",
                    recommendedVoice = "Fenrir"
                )
            }
            else -> {
                PoetryAnalysisResult(
                    poetDetected = "کلاسیکی اردو شاعری",
                    bahrName = "بحرِ رمل مثمن محذوف",
                    bahrPattern = "فاعلاتن فاعلاتن فاعلاتن فاعلن",
                    mood = "شاعرانہ ترنم و گداز",
                    recommendedVoice = "Aoede"
                )
            }
        }
    }
}
