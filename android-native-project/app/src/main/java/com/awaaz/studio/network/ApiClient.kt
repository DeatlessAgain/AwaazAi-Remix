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
