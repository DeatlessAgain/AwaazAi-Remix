import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Modality, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// PORT is hardcoded to 3000 per the container nginx reverse proxy configuration.
// The nginx reverse proxy listens on external ports (e.g. 8080 in Cloud Run) and forwards to 3000.
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Enable CORS for external manifest parsers like PWABuilder
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Explicit manifest routes with correct headers for PWA parsers
app.get(["/manifest.json", "/manifest.webmanifest"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  const candidates = [
    path.join(process.cwd(), "public", "manifest.json"),
    path.join(process.cwd(), "dist", "manifest.json"),
  ];
  const manifestPath = candidates.find((p) => fs.existsSync(p));
  if (manifestPath) {
    res.sendFile(manifestPath);
  } else {
    res.status(404).json({ error: "manifest.json not found" });
  }
});

app.get("/sw.js", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const candidates = [
    path.join(process.cwd(), "public", "sw.js"),
    path.join(process.cwd(), "dist", "sw.js"),
  ];
  const swPath = candidates.find((p) => fs.existsSync(p));
  if (swPath) {
    res.sendFile(swPath);
  } else {
    res.status(404).send("// Service worker not found");
  }
});

// Serve compiled real Android debug APK
app.get(["/app-debug.apk", "/APK_DOWNLOAD/app-debug.apk", "/.build-outputs/app-debug.apk", "/api/download-apk"], (_req: Request, res: Response) => {
  const apkPath = path.join(process.cwd(), "APK_DOWNLOAD", "app-debug.apk");
  if (fs.existsSync(apkPath)) {
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="AwaazAI-debug.apk"');
    res.sendFile(apkPath);
  } else {
    res.status(404).json({ error: "APK build output not found" });
  }
});

// Serve full Native Android Studio Source Code Project (.ZIP)
app.get(["/AwaazAI-Android-Studio-Project.zip", "/api/download-android-project"], (_req: Request, res: Response) => {
  const zipCandidates = [
    path.join(process.cwd(), "public", "AwaazAI-Android-Studio-Project.zip"),
    path.join(process.cwd(), "APK_DOWNLOAD", "AwaazAI-Android-Studio-Project.zip")
  ];
  const foundZip = zipCandidates.find(p => fs.existsSync(p));
  if (foundZip) {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="AwaazAI-Android-Studio-Project.zip"');
    res.sendFile(foundZip);
  } else {
    res.status(404).json({ error: "Android Studio source project zip not found" });
  }
});

// Lazy initialize GenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

/**
 * Helper to call Gemini models with automatic retries and fallback models for high demand / 503 / 429
 */
async function generateContentWithRetry(params: {
  primaryModel?: string;
  fallbackModel?: string;
  contents: any;
  config?: any;
  maxRetries?: number;
}): Promise<any> {
  const ai = getGenAI();
  const primaryModel = params.primaryModel || "gemini-3.7-flash";
  const fallbackModel = params.fallbackModel || "gemini-3.1-flash-lite";
  const maxRetries = params.maxRetries ?? 2;

  let lastError: any = null;

  // Try primary model first with exponential backoff retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: primaryModel,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err);
      const isTransient =
        errMsg.includes("503") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("high demand") ||
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("overloaded");

      if (isTransient && attempt < maxRetries) {
        const delayMs = (attempt + 1) * 700;
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      break;
    }
  }

  // If primary model failed with transient error and fallback model differs, try fallback model
  if (fallbackModel && fallbackModel !== primaryModel) {
    try {
      const response = await ai.models.generateContent({
        model: fallbackModel,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (fallbackErr: any) {
      lastError = fallbackErr;
    }
  }

  throw lastError;
}

/**
 * Helper to call Gemini TTS with automatic retries for transient 503 / 429 errors
 */
async function generateTTSWithRetry(params: {
  contents: any;
  config: any;
  maxRetries?: number;
}): Promise<any> {
  const ai = getGenAI();
  const maxRetries = params.maxRetries ?? 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err);
      const isTransient =
        errMsg.includes("503") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("high demand") ||
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED");

      if (isTransient && attempt < maxRetries) {
        const delayMs = (attempt + 1) * 800;
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

/**
 * Fallback poetry analysis parser when network/model is experiencing high demand
 */
function analyzePoetryFallback(poetryText: string, language = "urdu") {
  const lines = poetryText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const couplets: Array<{ misra1: string; misra2: string; taqtee: string; pauseAfterMs: number }> = [];
  for (let i = 0; i < lines.length; i += 2) {
    couplets.push({
      misra1: lines[i] || "",
      misra2: lines[i + 1] || "",
      taqtee: "فاعلاتن فاعلاتن فاعلاتن فاعلن (موزوں بحر)",
      pauseAfterMs: 800,
    });
  }

  let poetDetected = "Classical Urdu/Eastern Poetry";
  let bahrName = "بحرِ رمل مثمن محذوف";
  let bahrPattern = "فاعلاتن فاعلاتن فاعلاتن فاعلن";
  let mood = "ادبی، نغماتی و پُراثر (Lyrical & Soulful)";
  let recommendedVoice = "Aoede";
  let recommendedStyle = "poetic";
  let recommendedEmotion = "dramatic";
  let recommendedBgmTrackId = "sufi_flute";

  if (
    poetryText.includes("غالب") ||
    poetryText.includes("دلِ ناداں") ||
    poetryText.includes("ہزاروں خواہشیں") ||
    poetryText.includes("دیوان") ||
    poetryText.includes("عشق")
  ) {
    poetDetected = "Mirza Asadullah Khan Ghalib (مرزا غالب)";
    bahrName = "بحرِ ہزج مثمن سالم";
    bahrPattern = "مفاعیلن مفاعیلن مفاعیلن مفاعیلن";
    mood = "فلسفیانہ و نکتہ داں (Philosophical & Reflective)";
    recommendedVoice = "Charon";
    recommendedBgmTrackId = "poetic_sitar";
  } else if (
    poetryText.includes("اقبال") ||
    poetryText.includes("خودی") ||
    poetryText.includes("شاہیں") ||
    poetryText.includes("شمع") ||
    poetryText.includes("سجدہ") ||
    poetryText.includes("ستاروں")
  ) {
    poetDetected = "Allama Muhammad Iqbal (علامہ اقبال)";
    bahrName = "بحرِ متقارب مثمن سالم";
    bahrPattern = "فعولن فعولن فعولن فعولن";
    mood = "روحانی و ولولہ انگیز (Elevating & Inspiring)";
    recommendedVoice = "Fenrir";
    recommendedBgmTrackId = "sufi_flute";
  } else if (
    poetryText.includes("فیض") ||
    poetryText.includes("مجھ سے پہلی سی محبت") ||
    poetryText.includes("گلوں میں رنگ") ||
    poetryText.includes("چند روز")
  ) {
    poetDetected = "Faiz Ahmad Faiz (فیض احمد فیض)";
    bahrName = "بحرِ رمل مثمن مخبون محذوف";
    bahrPattern = "فاعلاتن فعلاتن فعلاتن فعلن";
    mood = "رومانوی و انقلابی (Romantic & Melodic)";
    recommendedVoice = "Aoede";
    recommendedBgmTrackId = "sad_violin";
  } else if (
    poetryText.includes("جون") ||
    poetryText.includes("ایلیا") ||
    poetryText.includes("بے دلی") ||
    poetryText.includes("شاید")
  ) {
    poetDetected = "Jaun Elia (جون ایلیا)";
    bahrName = "بحرِ مضارع مثمن اخرب";
    bahrPattern = "مفعول فاعلات مفاعیل فاعلن";
    mood = "حزنیہ و جدیدیت پسند (Melancholic & Nihilistic)";
    recommendedVoice = "Puck";
    recommendedBgmTrackId = "sad_violin";
  }

  return {
    poetDetected,
    bahrName,
    bahrPattern,
    mood,
    recommendedVoice,
    recommendedStyle,
    recommendedEmotion,
    recommendedBgmTrackId,
    couplets:
      couplets.length > 0
        ? couplets
        : [
            {
              misra1: lines[0] || poetryText,
              misra2: lines[1] || "",
              taqtee: "فاعلاتن فاعلاتن فاعلاتن فاعلن",
              pauseAfterMs: 800,
            },
          ],
    tarannumAdvice:
      "اشعار کے بحر و قافیہ کی رعایت رکھتے ہوئے ہر مصرعے کے اختتام پر موزوں وقفہ لیں اور ترنم کے ساتھ ادا کریں۔",
  };
}

/**
 * Intelligent rule-based fallback analyzer for Naat, Hamd, Sufi Kalaam and Singing
 */
function analyzeNaatSingingFallback(
  text: string,
  _language = "urdu"
): {
  genreDetected: string;
  title: string;
  maqamOrRaag: string;
  spiritualMood: string;
  recommendedVoice: string;
  recommendedStyle: string;
  recommendedEmotion: string;
  recommendedBgmTrackId: string;
  bgmAdvice: string;
  vocalAcoustics: {
    echoLevel: number;
    reverbDepth: number;
    vibratoRate: number;
  };
  versesBreakdown: Array<{
    verseText: string;
    cadenceNotes: string;
    pauseAfterMs: number;
  }>;
} {
  const lower = (text || "").toLowerCase();
  const rawLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let genreDetected = "Naat Sharif & Devotional (نعت شریف و کلام)";
  let title = rawLines[0] ? rawLines[0].substring(0, 40) : "کلامِ پاک";
  let maqamOrRaag = "مقامِ حجاز و بیات (Maqam Hijaz & Bayati)";
  let spiritualMood = "عقیدت و قلبی گداز (Devotional & Soulful)";
  let recommendedVoice = "Aoede";
  let recommendedStyle = "naat_devotional";
  let recommendedEmotion = "emotional_soft";
  let recommendedBgmTrackId = "spiritual_daf";
  let bgmAdvice =
    "نعت خوانی اور حمد کے لیے روایتی دَف (Spiritual Daf) کی دھیمی تھاپ اور گہرا ریورب سب سے موزوں ہے تاکہ کلام کا تقدس اور آواز کا سوز برقرار رہے۔";
  let vocalAcoustics = {
    echoLevel: 35,
    reverbDepth: 55,
    vibratoRate: 40,
  };

  // 1. Hamd detection
  if (
    lower.includes("اللہ") ||
    lower.includes("خدا") ||
    lower.includes("حمد") ||
    lower.includes("مالک") ||
    lower.includes("رحمان") ||
    lower.includes("کبریا")
  ) {
    genreDetected = "Hamd-e-Bari Ta'ala (حمدِ باری تعالیٰ)";
    maqamOrRaag = "مقامِ راست و نہاوند (Maqam Rast)";
    spiritualMood = "عظمتِ الٰہی و شکر گزاری (Sacred Reverence & Awe)";
    recommendedVoice = "Fenrir";
    recommendedStyle = "naat_devotional";
    recommendedEmotion = "emotional_soft";
    recommendedBgmTrackId = "ambient_spiritual_drone";
    bgmAdvice =
      "حمدِ باری تعالیٰ کے لیے بغیر سازوں کا نورانی ڈرون (Noorani Ambient Drone) یا پرسکون صوفی بانسری سب سے زیادہ موزوں ہے تاکہ خالص عقیدت نمایاں ہو۔";
    vocalAcoustics = { echoLevel: 30, reverbDepth: 60, vibratoRate: 35 };
  }
  // 2. Sufi Kalaam / Qawwali detection
  else if (
    lower.includes("قلندر") ||
    lower.includes("مست") ||
    lower.includes("دھمال") ||
    lower.includes("صوفی") ||
    lower.includes("وجد") ||
    lower.includes("بلھے") ||
    lower.includes("وارث") ||
    lower.includes("علی دم دم")
  ) {
    genreDetected = "Sufi Kalaam & Qawwali (صوفیانہ کلام و دھمال)";
    maqamOrRaag = "راگ بھیروی و درباری (Raag Bhairavi)";
    spiritualMood = "وجدانی و پرجوش عشقِ حقیقی (Ecstatic & Passionate)";
    recommendedVoice = "Charon";
    recommendedStyle = "sufi_qawwali";
    recommendedEmotion = "dramatic";
    recommendedBgmTrackId = "sufi_qawwali_clap";
    bgmAdvice =
      "صوفیانہ کلام اور قوالی کے لیے صوفیانہ تالیاں، تیز ڈھولک اور ہارمونیم کا امتزاج ایک والہانہ وجدانی ماحول بناتا ہے۔";
    vocalAcoustics = { echoLevel: 45, reverbDepth: 40, vibratoRate: 65 };
  }
  // 3. Ghazal & Melodic Singing detection
  else if (
    lower.includes("محبت") ||
    lower.includes("عشق") ||
    lower.includes("صنم") ||
    lower.includes("جدائی") ||
    lower.includes("گیت") ||
    lower.includes("نغمہ") ||
    lower.includes("چاند") ||
    lower.includes("ترنم")
  ) {
    genreDetected = "Melodic Song & Ghazal Tarannum (نغمہ و غزل)";
    maqamOrRaag = "راگ یمن و کھماج (Raag Yaman & Khamaj)";
    spiritualMood = "دلفریب، نغماتی و مدھر (Melodic & Romantic)";
    recommendedVoice = "Kore";
    recommendedStyle = "melodic_song";
    recommendedEmotion = "emotional_soft";
    recommendedBgmTrackId = "harmonium_tabla";
    bgmAdvice =
      "نغموں اور غزل سرائی کے لیے ہارمونیم کی مدھر تانوں اور طبلے کی دھیمی سنگت (Taal) آواز کے اتار چڑھاؤ کو شاندار بنا دیتی ہے۔";
    vocalAcoustics = { echoLevel: 25, reverbDepth: 35, vibratoRate: 50 };
  }

  const versesBreakdown = rawLines.map((line, idx) => ({
    verseText: line,
    cadenceNotes: idx % 2 === 0 ? "اٹھان اور کشش (Ascending Cadence)" : "ٹھہراؤ اور سوز (Resolving Cadence)",
    pauseAfterMs: idx % 2 === 0 ? 800 : 1200,
  }));

  return {
    genreDetected,
    title,
    maqamOrRaag,
    spiritualMood,
    recommendedVoice,
    recommendedStyle,
    recommendedEmotion,
    recommendedBgmTrackId,
    bgmAdvice,
    vocalAcoustics,
    versesBreakdown:
      versesBreakdown.length > 0
        ? versesBreakdown
        : [
            {
              verseText: text,
              cadenceNotes: "سوز و گداز کے ساتھ ادائیگی",
              pauseAfterMs: 1000,
            },
          ],
  };
}

/**
 * Shifts PCM 16-bit LE audio pitch by resampling sample stream
 */
function applyPcmPitchShift(pcmBuffer: Buffer, pitch: number): Buffer {
  if (!pitch || Math.abs(pitch) < 1) return pcmBuffer;

  // pitch ranges from -50 (deep) to +50 (high).
  // factor: 2^(pitch / 36) -> 0.56x to 1.78x
  const factor = Math.pow(2, pitch / 36);
  const numSamples = Math.floor(pcmBuffer.length / 2);
  const newNumSamples = Math.floor(numSamples / factor);

  if (newNumSamples <= 0) return pcmBuffer;

  const outBuffer = Buffer.alloc(newNumSamples * 2);
  for (let i = 0; i < newNumSamples; i++) {
    const srcIndex = i * factor;
    const index0 = Math.floor(srcIndex);
    const index1 = Math.min(index0 + 1, numSamples - 1);
    const frac = srcIndex - index0;

    const sample0 = pcmBuffer.readInt16LE(index0 * 2);
    const sample1 = pcmBuffer.readInt16LE(index1 * 2);
    const interpolated = Math.round(sample0 + frac * (sample1 - sample0));
    const clamped = Math.max(-32768, Math.min(32767, interpolated));
    outBuffer.writeInt16LE(clamped, i * 2);
  }
  return outBuffer;
}

/**
 * Converts raw 16-bit linear PCM little-endian audio to a standard RIFF WAV buffer
 */
function pcmToWavBase64(
  pcmBase64: string,
  sampleRate = 24000,
  numChannels = 1,
  bitDepth = 16,
  pitch = 0
): { wavBase64: string; durationSeconds: number } {
  let pcmBuffer = Buffer.from(pcmBase64, "base64");

  // If buffer is already WAV, return directly
  if (
    pcmBuffer.length > 12 &&
    pcmBuffer.subarray(0, 4).toString() === "RIFF" &&
    pcmBuffer.subarray(8, 12).toString() === "WAVE"
  ) {
    const durationSeconds = Number(
      (pcmBuffer.length / (sampleRate * numChannels * (bitDepth / 8))).toFixed(2)
    );
    return { wavBase64: pcmBase64, durationSeconds };
  }

  // Apply pitch frequency resampling if pitch is non-zero
  if (pitch && Math.abs(pitch) >= 1) {
    pcmBuffer = applyPcmPitchShift(pcmBuffer, pitch);
  }

  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const wavBuffer = Buffer.alloc(totalSize);

  // RIFF chunk descriptor
  wavBuffer.write("RIFF", 0);
  wavBuffer.writeUInt32LE(totalSize - 8, 4);
  wavBuffer.write("WAVE", 8);

  // fmt sub-chunk
  wavBuffer.write("fmt ", 12);
  wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  wavBuffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  wavBuffer.writeUInt16LE(numChannels, 22); // NumChannels
  wavBuffer.writeUInt32LE(sampleRate, 24); // SampleRate
  wavBuffer.writeUInt32LE(byteRate, 28); // ByteRate
  wavBuffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  wavBuffer.writeUInt16LE(bitDepth, 34); // BitsPerSample

  // data sub-chunk
  wavBuffer.write("data", 36);
  wavBuffer.writeUInt32LE(dataSize, 40);

  // Copy raw PCM audio samples
  pcmBuffer.copy(wavBuffer, 44);

  const durationSeconds = Number((dataSize / byteRate).toFixed(2));
  return { wavBase64: wavBuffer.toString("base64"), durationSeconds };
}

// Voice Persona Mapping: Maps frontend voice IDs to Gemini prebuilt voices & director guidelines
const VOICE_DIRECTIVE_MAP: Record<string, { prebuilt: string; prompt: string }> = {
  "Kid-Pari": {
    prebuilt: "Aoede",
    prompt: "You are an adorable, sweet, and innocent 6-to-8 year old little girl. Speak with a natural, cute, high-pitched child timbre, soft innocence, and sweet childlike pronunciation.",
  },
  "Kid-Ali": {
    prebuilt: "Puck",
    prompt: "You are a cheerful, energetic, and curious 7-to-9 year old young boy. Speak with a bright, bouncy young boy voice, authentic enthusiasm, and lively child cadence.",
  },
  "Kid-Bablu": {
    prebuilt: "Zephyr",
    prompt: "You are a cute, playful 5-to-7 year old toddler. Speak with adorable innocence, joyful giggles, playful inflections, and clear child pronunciation.",
  },
  "Kid-Milo": {
    prebuilt: "Kore",
    prompt: "You are a fun, bubbly, and animated cartoon kid character. Speak with playful animation, comical expressions, and vibrant high-energy charm.",
  },
  "Kore": {
    prebuilt: "Kore",
    prompt: "You are a warm, calm, and natural adult female speaker with soothing human tone and crystal clear articulation.",
  },
  "Zephyr": {
    prebuilt: "Zephyr",
    prompt: "You are a bright, expressive, and friendly adult female speaker with lively energy and engaging inflection.",
  },
  "Aoede": {
    prebuilt: "Aoede",
    prompt: "You are a gentle, lyrical, and delicate female speaker with sweet melodious cadence and soft breathing.",
  },
  "Charon": {
    prebuilt: "Charon",
    prompt: "You are a deep, resonant, and mature male speaker with authoritative presence and rich baritone cadence.",
  },
  "Puck": {
    prebuilt: "Puck",
    prompt: "You are a young, energetic, and conversational male speaker with dynamic inflection and friendly tone.",
  },
  "Fenrir": {
    prebuilt: "Fenrir",
    prompt: "You are a commanding, bold male storyteller with dramatic storytelling presence and rich timbre.",
  },
};

// Map style, emotion and pitch selection to human voice guidance prompt
function getStyleGuidance(
  style: string,
  language: string,
  voiceId: string,
  emotion: string = "neutral",
  emotionIntensity: number = 50,
  pitch: number = 0
): string {
  const langName =
    language === "urdu"
      ? "Urdu (اردو)"
      : language === "hindi"
      ? "Hindi (हिन्दी)"
      : language === "english"
      ? "English"
      : "the given language";

  const voiceMeta = VOICE_DIRECTIVE_MAP[voiceId] || VOICE_DIRECTIVE_MAP["Kore"];
  const personaDirective = voiceMeta.prompt;

  let styleDesc = "";
  switch (style) {
    case "child_cute":
      styleDesc = `Speak in an ultra-cute, innocent, and sweet childlike voice with genuine childish charm, delicate high pitch, and playful pauses in ${langName}.`;
      break;
    case "child_playful":
      styleDesc = `Speak with high-energy child excitement, playful curiosity, joyful tempo, and animated kid expressions in ${langName}.`;
      break;
    case "kids_story":
      styleDesc = `Speak in a gentle, soothing bedtime storytelling and lullaby tone designed for children in ${langName}, with warm pacing and calming emotional depth.`;
      break;
    case "cartoon_fun":
      styleDesc = `Speak in a comedic, animated cartoon character style with humorous modulation, joyful energy, and lively inflections in ${langName}.`;
      break;
    case "warm_story":
      styleDesc = `Speak in a warm, captivating storytelling tone with gentle human pauses, emotional depth, and realistic cadence in ${langName}. Do not sound robotic; sound like a real person telling an engaging story.`;
      break;
    case "news_anchor":
      styleDesc = `Speak like a professional, articulate news broadcaster with confident, clear pronunciation, natural rhythm, and authoritative yet pleasant human tone in ${langName}.`;
      break;
    case "cheerful":
      styleDesc = `Speak with an upbeat, warm, smiling, and lively human voice, full of positive energy and expressive intonation in ${langName}.`;
      break;
    case "emotional_soft":
      styleDesc = `Speak softly, with deep tenderness, heartfelt emotion, and gentle breath control, sounding completely natural and authentic in ${langName}.`;
      break;
    case "poetic":
      styleDesc = `Recite with poetic grace, romantic rhythm, expressive Tarannum/cadence, and thoughtful pauses suitable for literature and poetry in ${langName}.`;
      break;
    case "naat_devotional":
      styleDesc = `Sing and recite with deep soulful devotion (سوز و گداز), sacred reverence, elongated spiritual cadences, soulful pitch inflections, and breathy devotion suitable for Hamd, Naat, and Sufiana Kalaam in ${langName}. Accentuate heartfelt spiritual love and sacred pauses.`;
      break;
    case "melodic_song":
      styleDesc = `Sing with rich lyrical melody, musical pitch modulation, melodious vocal vibrato, rhythmic cadence, and expressive song phrasing in ${langName}. Sing with natural vocal musicality.`;
      break;
    case "sufi_qawwali":
      styleDesc = `Chant and recite with intense Sufi passion, resonant spiritual ecstasy, crescendo volume leaps, and rhythmic vocal emphasis in ${langName}.`;
      break;
    case "ghazal_singing":
      styleDesc = `Sing with delicate semi-classical Ghazal tarannum, gentle microtonal glides (meend), heartfelt emotional nuances, and romantic poise in ${langName}.`;
      break;
    case "conversational":
    default:
      styleDesc = `Speak in an authentic, natural conversational voice with effortless pronunciation, organic micro-pauses, and realistic pitch variation in ${langName}. Never sound synthetic or robotic.`;
      break;
  }

  // Emotional intensity scaling
  let intensityAdjective = "subtle and gentle";
  if (emotionIntensity > 75) {
    intensityAdjective = "deeply intense, dramatic, and powerful";
  } else if (emotionIntensity > 50) {
    intensityAdjective = "pronounced, clear, and expressive";
  } else if (emotionIntensity > 25) {
    intensityAdjective = "moderate, natural, and balanced";
  }

  let emotionDesc = "";
  switch (emotion) {
    case "joyful":
      emotionDesc = `Infuse the delivery with ${intensityAdjective} feelings of joyful happiness, radiant smiling warmth, cheerful laughter in the eyes, and uplifting resonance.`;
      break;
    case "sad":
      emotionDesc = `Infuse the delivery with ${intensityAdjective} feelings of poignant sorrow, heartfelt sadness, heavy melancholic sighs, tender emotional vulnerability, and solemn cadence.`;
      break;
    case "serious":
      emotionDesc = `Infuse the delivery with ${intensityAdjective} feelings of deep gravitas, authoritative seriousness, formal composure, and resolute steadfast weight.`;
      break;
    case "excited":
      emotionDesc = `Infuse the delivery with ${intensityAdjective} feelings of high excitement, animated enthusiasm, quickened energetic cadence, and breathless inspiration.`;
      break;
    case "dramatic":
      emotionDesc = `Infuse the delivery with ${intensityAdjective} theatrical drama, suspenseful pauses, heightened cinematic tension, and gripping dynamic contrast.`;
      break;
    case "whisper":
      emotionDesc = `Infuse the delivery with ${intensityAdjective} whispered intimacy, soft close-mic airy breathiness, confidential warmth, and gentle delicacy.`;
      break;
    case "angry":
      emotionDesc = `Infuse the delivery with ${intensityAdjective} fiery passion, sharp cutting articulation, righteous intensity, and forceful emotional energy.`;
      break;
    case "neutral":
    default:
      emotionDesc = `Maintain an authentic, well-balanced emotional equilibrium without exaggerated extremes.`;
      break;
  }

  // Pitch directive
  let pitchDesc = "";
  if (pitch <= -25) {
    pitchDesc = "Vocal Pitch & Frequency: Speak in a noticeably deep, low-frequency baritone/bass register with rich chest resonance and gravitas.";
  } else if (pitch < -5) {
    pitchDesc = "Vocal Pitch & Frequency: Speak with a slightly deeper, warm low-end vocal register.";
  } else if (pitch >= 25) {
    pitchDesc = "Vocal Pitch & Frequency: Speak in a noticeably higher, bright, youthful, and elevated vocal register.";
  } else if (pitch > 5) {
    pitchDesc = "Vocal Pitch & Frequency: Speak with a slightly higher, crisp, and elevated pitch frequency.";
  }

  return `${personaDirective} ${styleDesc} ${emotionDesc} ${pitchDesc}`.trim();
}

// API: Generate Realistic TTS Voice (and alias /api/generate-voice)
const handleTTSGenerate = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      text,
      voice = "Kore",
      language = "auto",
      style = "conversational",
      emotion = "neutral",
      emotionIntensity = 50,
      pitch = 0,
    } = req.body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text is required to generate voice." });
      return;
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 3000) {
      res.status(400).json({ error: "Text exceeds maximum limit of 3,000 characters per clip." });
      return;
    }

    const ai = getGenAI();

    // Look up voice profile mapping
    const voiceProfile = VOICE_DIRECTIVE_MAP[voice] || { prebuilt: "Kore", prompt: "" };
    const prebuiltVoiceName = voiceProfile.prebuilt;
    const numericPitch = Number(pitch) || 0;

    const stylePrompt = getStyleGuidance(
      style,
      language,
      voice,
      emotion,
      Number(emotionIntensity) || 50,
      numericPitch
    );
    const speechInstruction = `${stylePrompt} Read the following text aloud with flawless native pronunciation, natural breathing, and realistic human feeling: "${trimmedText}"`;

    const response = await generateTTSWithRetry({
      contents: [{ parts: [{ text: speechInstruction }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: prebuiltVoiceName },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({
        error: "Audio generation could not be completed. Please try a different text or voice option.",
      });
      return;
    }

    // Convert raw PCM to standard RIFF WAV base64 with pitch shifting if requested
    const { wavBase64, durationSeconds } = pcmToWavBase64(
      base64Audio,
      24000,
      1,
      16,
      numericPitch
    );

    res.json({
      success: true,
      audio: wavBase64,
      audioBase64: wavBase64,
      mimeType: "audio/wav",
      text: trimmedText,
      voice,
      language,
      style,
      emotion,
      emotionIntensity: Number(emotionIntensity) || 50,
      pitch: numericPitch,
      durationSeconds,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error generating voice:", error);
    res.status(500).json({
      error: error.message || "Failed to generate speech audio.",
    });
  }
};

app.post("/api/tts/generate", handleTTSGenerate);
app.post("/api/generate-voice", handleTTSGenerate);

// API: Polish/Punctuate text for natural speech rhythm (and alias /api/enhance-text)
const handleTTSEnhance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, language } = req.body || {};
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text is required." });
      return;
    }

    const prompt = `You are an expert voice actor audio director.
Please format and punctuate the following ${language || "Urdu/Hindi/English"} text so that when read by Text-to-Speech (TTS), it sounds completely natural, smooth, and authentic with realistic human breathing pauses and emotional cadence.
Only return the polished, enhanced text itself without any commentary, markdown code blocks, or explanations.

Text:
${text.trim()}`;

    const response = await generateContentWithRetry({
      primaryModel: "gemini-3.7-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    const enhanced = response.text ? response.text.trim() : text;
    res.json({ success: true, enhancedText: enhanced });
  } catch (error: any) {
    console.error("Error enhancing text:", error);
    res.status(500).json({ error: error.message || "Failed to enhance text" });
  }
};

app.post("/api/tts/enhance", handleTTSEnhance);
app.post("/api/enhance-text", handleTTSEnhance);

// API: AI Script Generator Studio
const handleAIGenerateScript = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      topic,
      genre = "story",
      language = "urdu",
      length = "medium",
      tone = "natural",
      targetAudience = "general",
    } = req.body || {};

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      res.status(400).json({ error: "A topic or prompt is required to generate script." });
      return;
    }

    const ai = getGenAI();

    const lengthGuide =
      length === "short"
        ? "around 40-70 words (approx 20-30 seconds speech)"
        : length === "long"
        ? "around 250-400 words (approx 2-3 minutes speech)"
        : "around 120-180 words (approx 1 minute speech)";

    const prompt = `You are a world-class professional scriptwriter and voice director specializing in Urdu, Hindi, and English spoken content.
Create an engaging, authentic voice script for:
- Topic/Prompt: "${topic.trim()}"
- Genre: ${genre} (story, poetry, youtube, podcast, news, meditation, ad, kids, educational)
- Target Language: ${language} (Write in proper Urdu script / Hindi Devanagari / English as requested)
- Target Length: ${lengthGuide}
- Tone: ${tone}
- Audience: ${targetAudience}

Return your response strictly as valid JSON matching this structure without Markdown fences:
{
  "title": "Short catchy title in script language",
  "script": "The complete spoken script text ready to be read aloud. If Urdu, use correct Urdu orthography. If poetry, format verses clearly with commas/periods for breathing rhythm.",
  "suggestedVoice": "One of: Kid-Pari, Kid-Ali, Kid-Bablu, Kid-Milo, Kore, Zephyr, Aoede, Charon, Puck, Fenrir",
  "suggestedStyle": "One of: conversational, warm_story, news_anchor, cheerful, emotional_soft, poetic, child_cute, child_playful, kids_story, cartoon_fun",
  "suggestedEmotion": "One of: neutral, joyful, sad, serious, excited, dramatic, whisper, angry",
  "suggestedPitch": 0,
  "suggestedBgmTrackId": "One of: ambient-calm, traditional-sitar, traditional-rubab, cinematic-warm, cinematic-drama, kids-playful, none",
  "explanation": "Brief 1-sentence note explaining why this voice/style suits the script"
}`;

    const response = await generateContentWithRetry({
      primaryModel: "gemini-3.7-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : { script: responseText, title: topic };
    }

    res.json({
      success: true,
      result: {
        title: data.title || topic,
        script: data.script || "",
        suggestedVoice: data.suggestedVoice || (genre === "kids" ? "Kid-Pari" : "Kore"),
        suggestedStyle: data.suggestedStyle || (genre === "poetry" ? "poetic" : genre === "news" ? "news_anchor" : "conversational"),
        suggestedEmotion: data.suggestedEmotion || "neutral",
        suggestedPitch: Number(data.suggestedPitch) || 0,
        suggestedBgmTrackId: data.suggestedBgmTrackId || (genre === "poetry" ? "traditional-rubab" : "ambient-calm"),
        explanation: data.explanation || "",
      },
    });
  } catch (error: any) {
    console.error("Error generating AI script:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI script" });
  }
};

app.post("/api/ai/generate-script", handleAIGenerateScript);

// API: AI Text Transformation & Linguist Tool (Roman to Urdu, Aerab, Translation, Tones)
const handleAITransformText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, operation } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text is required for transformation." });
      return;
    }

    const ai = getGenAI();
    let instruction = "";

    switch (operation) {
      case "roman_to_urdu":
        instruction =
          "Convert this Roman Urdu text (Urdu written in English alphabet) into standard, grammatically correct Nastaliq Urdu script (اردو رسم الخط). Ensure authentic spelling and natural phrasing.";
        break;
      case "add_aerab":
        instruction =
          "Add accurate Urdu diacritics / Aerab (اعراب: زبر، زیر، پیش، تشدید، جزم) to the following Urdu text to guarantee 100% flawless pronunciation and vowel clarity for text-to-speech engines. Keep original meaning intact.";
        break;
      case "translate_urdu":
        instruction =
          "Translate this text into beautiful, natural, idiomatic Urdu (اردو) suitable for voiceover and spoken narration.";
        break;
      case "translate_hindi":
        instruction =
          "Translate this text into natural, conversational, and expressive Hindi (हिन्दी) in Devanagari script for voiceover.";
        break;
      case "translate_english":
        instruction =
          "Translate this text into fluent, polished, natural spoken English.";
        break;
      case "tone_dramatic":
        instruction =
          "Rewrite this script in a highly dramatic, suspenseful, and cinematic tone with evocative phrasing and natural emotional pauses for narration. Keep the same language as input.";
        break;
      case "tone_poetic":
        instruction =
          "Rewrite this text into eloquent, lyrical, and poetic style (شعر و نغمگی) with rhythmic cadence and romantic or reflective metaphors. Keep the same language as input.";
      case "tone_kids":
        instruction =
          "Rewrite this text in an adorable, playful, sweet, and simplified kid-friendly storytelling tone suitable for children. Keep the same language as input.";
        break;
      case "tone_formal":
        instruction =
          "Rewrite this text into professional, authoritative, and formal broadcasting tone suitable for news, corporate, or documentary delivery. Keep the same language as input.";
        break;
      case "enhance_pacing":
        instruction =
          "Reformat and punctuate this speech script with thoughtful commas, ellipses (...), and pauses so an audio synthesizer reads it with breathtaking human realism and zero rush. Keep the same language as input.";
        break;
      case "bullet_to_script":
        instruction =
          "Transform these raw bullet points or rough notes into a seamless, engaging spoken audio script with smooth transitions and conversational flow. Keep the same language as input.";
        break;
      default:
        instruction =
          "Polish and enhance this text for natural voice acting and realistic text-to-speech reading.";
        break;
    }

    const prompt = `You are an expert linguist and voiceover director.
Task: ${instruction}

Input Text:
"""
${text.trim()}
"""

Strict Rule: Return ONLY the transformed text output. Do NOT include markdown code fences (\`\`\`), introduction, or explanations.`;

    const response = await generateContentWithRetry({
      primaryModel: "gemini-3.7-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    const transformedText = response.text ? response.text.trim() : text;
    res.json({
      success: true,
      operation,
      transformedText,
    });
  } catch (error: any) {
    console.error("Error in AI text transformation:", error);
    res.status(500).json({ error: error.message || "Failed to transform text" });
  }
};

app.post("/api/ai/transform-text", handleAITransformText);

// API: AI Auto-Director (Script sentiment, voice recommendation, emotion and audio cues)
const handleAIAnalyzeDirector = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, language } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text is required to analyze." });
      return;
    }

    const prompt = `You are a master audio director and speech scientist.
Analyze the following ${language || "Urdu/Hindi/English"} script and determine the optimal voiceover performance parameters:

Script:
"""
${text.trim()}
"""

Available Voices:
- Female: "Kore" (Calm & Soothing), "Zephyr" (Lively & Friendly), "Aoede" (Gentle & Lyrical)
- Male: "Charon" (Deep Baritone & Authoritative), "Puck" (Young & Conversational), "Fenrir" (Dramatic Storyteller)
- Kids: "Kid-Pari" (Cute Little Girl), "Kid-Ali" (Energetic Boy), "Kid-Bablu" (Playful Toddler), "Kid-Milo" (Cartoon Character)

Available Styles:
- "conversational", "warm_story", "news_anchor", "cheerful", "emotional_soft", "poetic", "child_cute", "child_playful", "kids_story", "cartoon_fun"

Available Emotions:
- "neutral", "joyful", "sad", "serious", "excited", "dramatic", "whisper", "angry"

Available Background Music:
- "ambient-calm", "traditional-sitar", "traditional-rubab", "cinematic-warm", "cinematic-drama", "kids-playful", "none"

Return strictly valid JSON without Markdown fences matching:
{
  "sentiment": "e.g. Uplifting & Inspiring, Melancholic Poetry, Playful Children Fun, Authoritative News",
  "recommendedVoice": "Kid-Pari | Kid-Ali | Kid-Bablu | Kid-Milo | Kore | Zephyr | Aoede | Charon | Puck | Fenrir",
  "recommendedVoiceName": "Display name of voice",
  "recommendedStyle": "Style identifier from list",
  "recommendedEmotion": "Emotion identifier from list",
  "recommendedEmotionIntensity": 65,
  "recommendedPitch": 0,
  "recommendedBgmTrackId": "BGM id from list",
  "pacingAdvice": "1-2 sentences on how the voice actor should pace themselves (e.g. slow down on reflective words)",
  "pronunciationNotes": ["Note 1 on difficult words or emphasis", "Note 2"],
  "keyHighlights": ["Core emotion or theme", "Audience impression"]
}`;

    const response = await generateContentWithRetry({
      primaryModel: "gemini-3.7-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    }

    res.json({
      success: true,
      analysis: {
        sentiment: data.sentiment || "Natural Expression",
        recommendedVoice: data.recommendedVoice || "Kore",
        recommendedVoiceName: data.recommendedVoiceName || "Kore (Natural & Warm)",
        recommendedStyle: data.recommendedStyle || "conversational",
        recommendedEmotion: data.recommendedEmotion || "neutral",
        recommendedEmotionIntensity: Number(data.recommendedEmotionIntensity) || 50,
        recommendedPitch: Number(data.recommendedPitch) || 0,
        recommendedBgmTrackId: data.recommendedBgmTrackId || "ambient-calm",
        pacingAdvice: data.pacingAdvice || "Speak with balanced cadence and natural pauses.",
        pronunciationNotes: Array.isArray(data.pronunciationNotes) ? data.pronunciationNotes : [],
        keyHighlights: Array.isArray(data.keyHighlights) ? data.keyHighlights : [],
      },
    });
  } catch (error: any) {
    console.error("Error in AI Auto-Director analysis:", error);
    res.status(500).json({ error: error.message || "Failed to analyze script with AI" });
  }
};

app.post("/api/ai/analyze-director", handleAIAnalyzeDirector);

// API: AI Speech-to-Script Transcriber (Gemini 3.5 Transcribe)
const handleAITranscribeAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== "string") {
      res.status(400).json({ error: "Audio base64 data is required for transcription." });
      return;
    }

    const ai = getGenAI();
    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(";")[0], // e.g. "audio/webm", "audio/wav", "audio/mp3"
        data: audioBase64,
      },
    };

    const prompt = `Transcribe the spoken speech in this audio clip with 100% accuracy.
Rules:
- If the speech is in Urdu, write in standard Nastaliq Urdu script (اردو).
- If the speech is in Hindi, write in Devanagari Hindi (हिन्दी).
- If the speech is in English, write in proper English.
- Return ONLY the exact transcribed text, without any timestamps, headers, metadata, or markdown tags.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [audioPart, { text: prompt }],
      },
    });

    const transcription = response.text ? response.text.trim() : "";
    res.json({
      success: true,
      transcription,
    });
  } catch (error: any) {
    console.error("Error transcribing audio:", error);
    res.status(500).json({ error: error.message || "Failed to transcribe audio clip" });
  }
};

app.post("/api/ai/transcribe-audio", handleAITranscribeAudio);

// API: AI Voice Prompt Director (Natural Language Prompt-based Audio Direction)
const handleAIDirectVoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, prompt, language = "auto" } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text is required." });
      return;
    }
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "Director instructions/prompt is required." });
      return;
    }

    const ai = getGenAI();
    const systemPrompt = `You are a legendary voiceover director and audio engineer.
A voice actor is reading this text:
"""
${text.trim()}
"""

User Director Instructions:
"""
${prompt.trim()}
"""

Task:
1. Interpret the user's artistic direction (emotional shifts, pacing, whisper vs loud, cadence, sarcasm, drama, sadness, etc.).
2. Optimize the script with strategic punctuation (commas, ellipses, line breaks) to force the neural TTS model to match the exact breathing, pacing, and emotional pauses.
3. Select the best voice ID from:
   - Female: "Kore" (Calm & Natural), "Zephyr" (Lively & Friendly), "Aoede" (Gentle & Lyrical)
   - Male: "Charon" (Deep Baritone & Authoritative), "Puck" (Young & Dynamic), "Fenrir" (Dramatic Storyteller)
   - Kids: "Kid-Pari" (Cute Girl), "Kid-Ali" (Energetic Boy), "Kid-Bablu" (Playful Toddler), "Kid-Milo" (Cartoon)
4. Select the best speechStyle: 'conversational' | 'warm_story' | 'news_anchor' | 'cheerful' | 'emotional_soft' | 'poetic' | 'child_cute' | 'child_playful' | 'kids_story' | 'cartoon_fun'
5. Select the best emotion: 'neutral' | 'joyful' | 'sad' | 'serious' | 'excited' | 'dramatic' | 'whisper' | 'angry'
6. Set emotionIntensity: 0 to 100
7. Set vocal pitch: -50 (deep) to +50 (high)
8. Select bgMusicTrackId: 'sufi_flute' | 'poetic_sitar' | 'calm_lofi' | 'cinematic_drama' | 'sad_violin' | 'news_broadcast' | 'kids_playful' | 'none'
9. List 2-3 specific acoustic direction notes explaining how the voice was directed.

Return strictly valid JSON matching this schema without Markdown fences:
{
  "interpretedIntent": "Summary of what user asked for",
  "optimizedScript": "Text with punctuation and pauses tuned for the performance",
  "voiceId": "voice ID",
  "style": "speechStyle",
  "emotion": "emotion",
  "emotionIntensity": 65,
  "pitch": 0,
  "bgMusicTrackId": "bgMusicTrackId",
  "audioDirectives": ["Point 1", "Point 2", "Point 3"]
}`;

    const response = await generateContentWithRetry({
      primaryModel: "gemini-3.7-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    }

    res.json({
      success: true,
      result: {
        interpretedIntent: data.interpretedIntent || "Custom Directed Delivery",
        optimizedScript: data.optimizedScript || text,
        voiceId: data.voiceId || "Kore",
        style: data.style || "conversational",
        emotion: data.emotion || "neutral",
        emotionIntensity: Number(data.emotionIntensity) || 50,
        pitch: Number(data.pitch) || 0,
        bgMusicTrackId: data.bgMusicTrackId || "none",
        audioDirectives: Array.isArray(data.audioDirectives) ? data.audioDirectives : [],
      },
    });
  } catch (error: any) {
    console.error("Error in AI Voice Prompt Director:", error);
    res.status(500).json({ error: error.message || "Failed to analyze director prompt." });
  }
};

app.post("/api/ai/direct-voice", handleAIDirectVoice);

// API: AI Poetry & Tarannum Meter Analyzer (Urdu / Hindi Shayari & Bahr)
const handleAIPoetryMeter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { poetryText, language = "urdu" } = req.body || {};
    if (!poetryText || typeof poetryText !== "string" || !poetryText.trim()) {
      res.status(400).json({ error: "Poetry text is required." });
      return;
    }

    const ai = getGenAI();
    const prompt = `You are a grand master of Urdu and Eastern classical poetry (استادِ سخن، ماہرِ عروض و ترنم).
Analyze the following poetry:
"""
${poetryText.trim()}
"""

Task:
1. Identify if it matches any famous Urdu/Hindi poet's style (e.g. Mirza Ghalib, Allama Iqbal, Faiz Ahmad Faiz, Jaun Elia, Mir Taqi Mir, Parveen Shakir, etc.) or classical Ghazal style.
2. Identify the Bahr (بحر / meter) and rhythm pattern (وزن / افاعیل).
3. Split the text into paired couplets (اشعار: مصرع اولیٰ اور مصرع ثانیہ) with prosodic pauses.
4. Recommend the most melodious Voice, Style ('poetic' or 'emotional_soft'), Emotion ('dramatic' or 'sad' or 'joyful'), and traditional Eastern musical accompaniment ('sufi_flute', 'poetic_sitar', 'sad_violin', or 'cinematic_drama').
5. Provide 2 sentences of Tarannum & Recitation advice (لہجہ، کھینچاو، اور توقف کا مشورہ).

Return strictly valid JSON without Markdown fences:
{
  "poetDetected": "e.g. Allama Iqbal or Classical Ghazal",
  "bahrName": "e.g. بحرِ رمل مثمن محذوف",
  "bahrPattern": "e.g. فاعلاتن فاعلاتن فاعلاتن فاعلن",
  "mood": "e.g. فلسفیانہ، پرجوش، روحانی (Philosophical & Elevating)",
  "recommendedVoice": "Charon | Aoede | Fenrir | Kore | Zephyr",
  "recommendedStyle": "poetic",
  "recommendedEmotion": "dramatic",
  "recommendedBgmTrackId": "sufi_flute",
  "couplets": [
    {
      "misra1": "پہلا مصرعہ",
      "misra2": "دوسرا مصرعہ",
      "taqtee": "افاعیل وزنی رہنمائی",
      "pauseAfterMs": 700
    }
  ],
  "tarannumAdvice": "طرزِ ترنم اور نغمگی کی گائیڈ"
}`;

    let data: any = {};
    try {
      const response = await generateContentWithRetry({
        primaryModel: "gemini-3.7-flash",
        fallbackModel: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      try {
        data = JSON.parse(responseText);
      } catch {
        const match = responseText.match(/\{[\s\S]*\}/);
        data = match ? JSON.parse(match[0]) : {};
      }
    } catch (apiErr: any) {
      console.warn("Poetry API error, using intelligent prosodic fallback:", apiErr);
      data = analyzePoetryFallback(poetryText, language);
    }

    const fallbackData = analyzePoetryFallback(poetryText, language);

    res.json({
      success: true,
      analysis: {
        poetDetected: data.poetDetected || fallbackData.poetDetected,
        bahrName: data.bahrName || fallbackData.bahrName,
        bahrPattern: data.bahrPattern || fallbackData.bahrPattern,
        mood: data.mood || fallbackData.mood,
        recommendedVoice: data.recommendedVoice || fallbackData.recommendedVoice,
        recommendedStyle: data.recommendedStyle || fallbackData.recommendedStyle,
        recommendedEmotion: data.recommendedEmotion || fallbackData.recommendedEmotion,
        recommendedBgmTrackId: data.recommendedBgmTrackId || fallbackData.recommendedBgmTrackId,
        couplets: Array.isArray(data.couplets) && data.couplets.length > 0 ? data.couplets : fallbackData.couplets,
        tarannumAdvice: data.tarannumAdvice || fallbackData.tarannumAdvice,
      },
    });
  } catch (error: any) {
    console.error("Error analyzing poetry meter:", error);
    const { poetryText, language = "urdu" } = req.body || {};
    const fallbackData = analyzePoetryFallback(poetryText || "", language);
    res.json({
      success: true,
      analysis: fallbackData,
    });
  }
};

app.post("/api/ai/poetry-meter", handleAIPoetryMeter);

// API: AI Naat, Hamd & Singing Vocal/BGM Director
const handleAINaatSingingAdvisor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, language = "urdu" } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text or lyrics are required for analysis." });
      return;
    }

    const fallbackData = analyzeNaatSingingFallback(text, language);

    const prompt = `You are a master vocal director, Qari, and Eastern musicologist specializing in Naat Khawani, Hamd-e-Bari Ta'ala, Sufiana Kalaam, Ghazal singing, and Melodic Songs.
Analyze the following lyrics in ${language || "Urdu/Hindi/English"} and determine the perfect singing performance parameters and background soundscape:

Lyrics:
${text.trim()}

Available Voices: Aoede (Soulful Female), Charon (Deep Resonant Male), Fenrir (Warm Devotional Male), Kore (Crisp Melodic Female), Zephyr (Gentle Ethereal Male), Puck (Expressive Male).
Available BGM Tracks: "spiritual_daf" (Spiritual Daf & Frame Drum), "harmonium_tabla" (Harmonium & Classic Tabla), "sufi_qawwali_clap" (Sufi Qawwali Claps & Dholak), "ambient_spiritual_drone" (Noorani Ambient Drone - Pure Vocal), "sufi_flute" (Sufi Flute & Rabab), "acoustic_guitar_lofi" (Acoustic Guitar & Gentle Melody).

Return a strictly valid JSON object with the following schema:
{
  "genreDetected": "Naat Sharif (نعت شریف) / Hamd (حمد) / Sufi Kalaam (صوفیانہ کلام) / Ghazal Tarannum (غزل) / Melodic Song (نغمہ)",
  "title": "Short title or opening phrase",
  "maqamOrRaag": "e.g. مقامِ حجاز / راگ بھیروی / راگ یمن",
  "spiritualMood": "e.g. عقیدت و قلبی سوز (Devotional & Soulful) / نغماتی و مدھر",
  "recommendedVoice": "Aoede / Fenrir / Charon / Kore / Zephyr",
  "recommendedStyle": "naat_devotional / melodic_song / sufi_qawwali / ghazal_singing",
  "recommendedEmotion": "emotional_soft / dramatic / joyful",
  "recommendedBgmTrackId": "spiritual_daf / harmonium_tabla / sufi_qawwali_clap / ambient_spiritual_drone / sufi_flute / acoustic_guitar_lofi",
  "bgmAdvice": "Detailed explanation in Urdu or English of why this background music track fits best and how the vocal balance should be maintained",
  "vocalAcoustics": {
    "echoLevel": 35,
    "reverbDepth": 55,
    "vibratoRate": 40
  },
  "versesBreakdown": [
    {
      "verseText": "Line of text",
      "cadenceNotes": "Advisory note for emotional delivery, breath control, and inflection",
      "pauseAfterMs": 1000
    }
  ]
}`;

    let data: any = {};
    try {
      const response = await generateContentWithRetry({
        primaryModel: "gemini-3.7-flash",
        fallbackModel: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      try {
        data = JSON.parse(responseText);
      } catch {
        const match = responseText.match(/\{[\s\S]*\}/);
        data = match ? JSON.parse(match[0]) : {};
      }
    } catch (apiErr: any) {
      console.warn("Naat/Singing Advisor API error, falling back to rule engine:", apiErr);
      data = fallbackData;
    }

    res.json({
      success: true,
      analysis: {
        genreDetected: data.genreDetected || fallbackData.genreDetected,
        title: data.title || fallbackData.title,
        maqamOrRaag: data.maqamOrRaag || fallbackData.maqamOrRaag,
        spiritualMood: data.spiritualMood || fallbackData.spiritualMood,
        recommendedVoice: data.recommendedVoice || fallbackData.recommendedVoice,
        recommendedStyle: data.recommendedStyle || fallbackData.recommendedStyle,
        recommendedEmotion: data.recommendedEmotion || fallbackData.recommendedEmotion,
        recommendedBgmTrackId: data.recommendedBgmTrackId || fallbackData.recommendedBgmTrackId,
        bgmAdvice: data.bgmAdvice || fallbackData.bgmAdvice,
        vocalAcoustics: data.vocalAcoustics || fallbackData.vocalAcoustics,
        versesBreakdown:
          Array.isArray(data.versesBreakdown) && data.versesBreakdown.length > 0
            ? data.versesBreakdown
            : fallbackData.versesBreakdown,
      },
    });
  } catch (error: any) {
    console.error("Error analyzing Naat / Singing lyrics:", error);
    const { text, language = "urdu" } = req.body || {};
    const fallbackData = analyzeNaatSingingFallback(text || "", language);
    res.json({
      success: true,
      analysis: fallbackData,
    });
  }
};

app.post("/api/ai/naat-singing-advisor", handleAINaatSingingAdvisor);

// API: AI Long Document & Book Chapter Parser (PDF / TXT / Long Scripts)
const handleAIParseDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, documentTitle = "Untitled Document" } = req.body || {};
    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Document content is required." });
      return;
    }

    const ai = getGenAI();
    const prompt = `You are a professional audiobook producer and document parser.
Parse the following text into organized, sequential chapters or audio episodes for narration:

Document Title: "${documentTitle}"
Content:
"""
${content.slice(0, 25000)}
"""

Task:
1. Divide this long text into 3 to 12 logical, cohesive chapters (e.g. Chapter 1: Introduction, Chapter 2: The Journey, etc.).
2. Each chapter's content should be clean, natural text without markdown junk or page numbers, ready for human-like narration (around 100-500 words each).
3. Suggest the best narrator voice, style, and background music for this entire audiobook/document.

Return strictly valid JSON without Markdown fences matching:
{
  "title": "Clean book/document title",
  "author": "Detected author or 'Unknown'",
  "recommendedVoiceId": "Charon | Kore | Zephyr | Fenrir | Aoede",
  "recommendedStyle": "warm_story | conversational | news_anchor",
  "recommendedEmotion": "neutral | serious | dramatic",
  "recommendedBgmTrackId": "calm_lofi | cinematic_drama | sufi_flute | none",
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Chapter 1 Title",
      "content": "Full chapter narration text ready for TTS."
    }
  ]
}`;

    let data: any = {};
    try {
      const response = await generateContentWithRetry({
        primaryModel: "gemini-3.7-flash",
        fallbackModel: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      try {
        data = JSON.parse(responseText);
      } catch {
        const match = responseText.match(/\{[\s\S]*\}/);
        data = match ? JSON.parse(match[0]) : {};
      }
    } catch (apiErr: any) {
      console.warn("Document parser API warning, falling back to local segmentation:", apiErr);
      data = {};
    }

    let rawChapters = Array.isArray(data.chapters) && data.chapters.length > 0 ? data.chapters : null;
    if (!rawChapters) {
      // Split into paragraphs for fallback
      const paragraphs = content.split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
      const chunkSize = Math.max(1, Math.ceil(paragraphs.length / 4));
      rawChapters = [];
      for (let i = 0; i < paragraphs.length; i += chunkSize) {
        const chSlice = paragraphs.slice(i, i + chunkSize).join("\n\n");
        const chNum = rawChapters.length + 1;
        rawChapters.push({
          chapterNumber: chNum,
          title: `Chapter ${chNum}`,
          content: chSlice,
        });
      }
    }

    const chapters = rawChapters.map(
      (ch: any, idx: number) => ({
        id: `ch_${Date.now()}_${idx + 1}`,
        chapterNumber: ch.chapterNumber || idx + 1,
        title: ch.title || `Chapter ${idx + 1}`,
        content: ch.content || "",
        wordCount: (ch.content || "").trim().split(/\s+/).filter(Boolean).length,
        status: "pending",
      })
    );

    res.json({
      success: true,
      project: {
        id: `doc_${Date.now()}`,
        title: data.title || documentTitle,
        author: data.author || "Unknown",
        totalWords: chapters.reduce((acc: number, c: any) => acc + c.wordCount, 0),
        chapters,
        selectedVoiceId: data.recommendedVoiceId || "Kore",
        selectedStyle: data.recommendedStyle || "warm_story",
        selectedEmotion: data.recommendedEmotion || "neutral",
        bgMusicTrackId: data.recommendedBgmTrackId || "calm_lofi",
        bgMusicVolume: 14,
      },
    });
  } catch (error: any) {
    console.error("Error parsing document chapters:", error);
    res.status(500).json({ error: error.message || "Failed to parse document." });
  }
};

app.post("/api/ai/parse-document", handleAIParseDocument);

// API: AI Subtitle Cues & Karaoke Timestamp Generator (.SRT / .VTT)
const handleAIGenerateSubtitles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, durationSeconds = 5.0, language = "auto" } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text is required to generate subtitles." });
      return;
    }

    const duration = Math.max(1, Number(durationSeconds) || 5);

    const prompt = `You are an expert subtitling audio sync specialist.
Given the following spoken text and total audio duration (${duration} seconds), break the text into timed subtitle cues that match natural speech cadence:

Spoken Text:
"""
${text.trim()}
"""

Total Audio Duration: ${duration} seconds.
Language: ${language}

Rules:
1. Divide the text into 3 to 10 natural, short subtitle chunks (each 3 to 7 words).
2. Assign accurate start and end timestamps in seconds (e.g. 0.00 to 2.30, 2.30 to 4.80) totaling exactly ${duration} seconds.
3. Keep the timestamps continuous and in proper chronological order.

Return strictly valid JSON without Markdown fences matching:
{
  "cues": [
    {
      "id": 1,
      "start": 0.0,
      "end": 2.2,
      "text": "First phrase in original script"
    }
  ]
}`;

    const response = await generateContentWithRetry({
      primaryModel: "gemini-3.7-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    }

    let cues = Array.isArray(data.cues) ? data.cues : [];
    if (cues.length === 0) {
      // Fallback: divide into sentences proportionally
      const sentences = text.trim().split(/(?<=[.?!،۔\n])/).filter((s) => s.trim().length > 0);
      const chunkCount = Math.max(1, sentences.length);
      const chunkDuration = duration / chunkCount;
      cues = sentences.map((s, idx) => ({
        id: idx + 1,
        start: Number((idx * chunkDuration).toFixed(2)),
        end: Number(((idx + 1) * chunkDuration).toFixed(2)),
        text: s.trim(),
      }));
    }

    // Helper formatters
    const formatSRTTime = (sec: number) => {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
    };

    const formatVTTTime = (sec: number) => {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
    };

    let srt = "";
    let vtt = "WEBVTT\n\n";
    let plainText = "";

    cues.forEach((cue: any, index: number) => {
      const cueId = index + 1;
      const srtStart = formatSRTTime(cue.start);
      const srtEnd = formatSRTTime(cue.end);
      const vttStart = formatVTTTime(cue.start);
      const vttEnd = formatVTTTime(cue.end);

      srt += `${cueId}\n${srtStart} --> ${srtEnd}\n${cue.text}\n\n`;
      vtt += `${cueId}\n${vttStart} --> ${vttEnd}\n${cue.text}\n\n`;
      plainText += `[${cue.start.toFixed(2)}s - ${cue.end.toFixed(2)}s] ${cue.text}\n`;
    });

    res.json({
      success: true,
      result: {
        cues,
        srt: srt.trim(),
        vtt: vtt.trim(),
        plainText: plainText.trim(),
      },
    });
  } catch (error: any) {
    console.error("Error generating subtitles:", error);
    res.status(500).json({ error: error.message || "Failed to generate subtitles." });
  }
};

app.post("/api/ai/generate-subtitles", handleAIGenerateSubtitles);

// API: AI Video Generation (Text to Video & Image to Video via Veo)
const handleAIGenerateVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      prompt,
      imageBytes,
      mimeType = "image/png",
      aspectRatio = "16:9",
      resolution = "720p",
      model = "veo-3.1-lite-generate-preview",
    } = req.body || {};

    if (!prompt && !imageBytes) {
      res.status(400).json({ error: "Either a text prompt or an image is required to generate video." });
      return;
    }

    const ai = getGenAI();
    const validAspectRatio = aspectRatio === "9:16" ? "9:16" : "16:9";
    const validResolution = resolution === "1080p" ? "1080p" : "720p";
    const selectedModel = model === "veo-3.1-generate-preview" ? "veo-3.1-generate-preview" : "veo-3.1-lite-generate-preview";

    const payload: any = {
      model: selectedModel,
      config: {
        numberOfVideos: 1,
        resolution: validResolution,
        aspectRatio: validAspectRatio,
      },
    };

    if (prompt && typeof prompt === "string" && prompt.trim()) {
      payload.prompt = prompt.trim();
    }

    if (imageBytes && typeof imageBytes === "string") {
      // Clean base64 header if present
      const cleanBase64 = imageBytes.includes(",") ? imageBytes.split(",")[1] : imageBytes;
      payload.image = {
        imageBytes: cleanBase64,
        mimeType: mimeType.split(";")[0],
      };
    }

    const operation = await ai.models.generateVideos(payload);

    res.json({
      success: true,
      operationName: operation.name,
      model: selectedModel,
      aspectRatio: validAspectRatio,
      resolution: validResolution,
    });
  } catch (error: any) {
    console.error("Error starting AI video generation:", error);
    const errMsg = error.message || "";
    const isQuota =
      errMsg.includes("429") ||
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.includes("quota") ||
      errMsg.includes("Rate limit");

    res.status(isQuota ? 429 : 500).json({
      error: isQuota
        ? "Google Veo API Quota Exceeded (Error 429). Google Veo requires a paid Gemini billing tier. You can switch to the 100% Free Unlimited Pollinations FLUX or 4K Scenic Model."
        : errMsg || "Failed to start AI video generation.",
      isQuotaExceeded: isQuota,
      recommendedModel: "pollinations_flux",
    });
  }
};

app.post("/api/ai/generate-video", handleAIGenerateVideo);

// API: Poll AI Video Generation Status
const handleAIVideoStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { operationName } = req.body || {};
    if (!operationName || typeof operationName !== "string") {
      res.status(400).json({ error: "operationName is required to check video status." });
      return;
    }

    const ai = getGenAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      success: true,
      done: Boolean(updated.done),
      error: updated.error || null,
      hasVideo: Boolean(updated.response?.generatedVideos?.[0]?.video?.uri),
    });
  } catch (error: any) {
    console.error("Error checking video status:", error);
    res.status(500).json({ error: error.message || "Failed to poll video generation status." });
  }
};

app.post("/api/ai/video-status", handleAIVideoStatus);

// API: Download and Stream Completed AI Video
const handleAIVideoDownload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { operationName } = req.body || {};
    if (!operationName || typeof operationName !== "string") {
      res.status(400).json({ error: "operationName is required." });
      return;
    }

    const ai = getGenAI();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "API key is missing." });
      return;
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!videoUri) {
      res.status(404).json({ error: "Video is not yet available or failed to generate." });
      return;
    }

    const videoRes = await fetch(videoUri, {
      headers: { "x-goog-api-key": apiKey },
    });

    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video stream from Google Veo: ${videoRes.statusText}`);
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `inline; filename="awaaz-ai-video-${Date.now()}.mp4"`);

    const arrayBuf = await videoRes.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuf);
    res.send(videoBuffer);
  } catch (error: any) {
    console.error("Error downloading AI video:", error);
    res.status(500).json({ error: error.message || "Failed to stream generated video." });
  }
};

app.post("/api/ai/video-download", handleAIVideoDownload);

// API: AI Image Generation (for Image-to-Video & Audio-to-Video Visual Artworks)
const handleAIGenerateImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      prompt,
      aspectRatio = "16:9",
      style = "cinematic",
    } = req.body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "Prompt is required to generate image." });
      return;
    }

    const ai = getGenAI();
    const validAspect = ["1:1", "16:9", "9:16", "3:4", "4:3"].includes(aspectRatio)
      ? aspectRatio
      : "16:9";

    const enhancedPrompt = `Masterpiece high-detail 8K ${style} artwork: ${prompt.trim()}. Atmospheric volumetric lighting, award-winning cinematography, ultra-photorealistic textures, rich color grading.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [{ text: enhancedPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: validAspect as any,
        },
      },
    });

    let base64Image = "";
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      res.status(500).json({ error: "Could not generate image from prompt." });
      return;
    }

    res.json({
      success: true,
      imageUrl: `data:image/png;base64,${base64Image}`,
      prompt: prompt.trim(),
      aspectRatio: validAspect,
    });
  } catch (error: any) {
    console.warn("Primary Gemini image generation failed, falling back to Pollinations FLUX:", error.message);
    const { prompt, aspectRatio = "16:9" } = req.body || {};
    const validAspect = ["1:1", "16:9", "9:16", "3:4", "4:3"].includes(aspectRatio)
      ? aspectRatio
      : "16:9";
    const width = validAspect === "9:16" ? 720 : validAspect === "1:1" ? 800 : 1280;
    const height = validAspect === "9:16" ? 1280 : validAspect === "1:1" ? 800 : 720;
    const seed = Math.floor(Math.random() * 999999);
    const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(String(prompt || "beautiful cinematic scenery").trim())}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;

    res.json({
      success: true,
      imageUrl: fluxUrl,
      prompt: prompt || "cinematic scene",
      aspectRatio: validAspect,
      provider: "pollinations_flux",
    });
  }
};

app.post("/api/ai/generate-image", handleAIGenerateImage);

// API: AI Video Prompt Director & Scene Storyboard Expander
const handleAIExpandVideoPrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, mode = "text_to_video", style = "cinematic", language = "auto" } = req.body || {};
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }

    const ai = getGenAI();
    const directorPrompt = `You are a world-renowned AI Cinematographer and Video Director.
Transform the following simple idea or script into a hyper-detailed cinematic video generation prompt optimized for Google Veo and modern AI video models:

Input Idea/Script:
"""
${prompt.trim()}
"""
Target Mode: ${mode} (text_to_video, image_to_video, audio_to_video)
Cinematic Style: ${style} (e.g. Cinematic Realism, Islamic Heritage, Anime, Cyberpunk, Nature Documentary, Urdu Drama)

Task:
1. "enhancedPrompt": Write a detailed, visual English prompt describing camera motion (e.g. slow drone push-in, low-angle sweep), lighting (e.g. golden hour volumetric rays), scene environment, subject action, atmosphere, depth of field, and 4K photorealistic textures.
2. "cameraMovement": One of 'Cinematic Push In' | 'Aerial Drone Sweep' | 'Dynamic Pan Right' | 'Slow Motion 60fps' | 'Orbit 360' | 'Living Breathing Portrait'
3. "recommendedAspectRatio": '16:9' | '9:16' | '1:1'
4. "storyboardScenes": Break into 3 sequential cinematic shot descriptions if building a multi-scene video.

Return strictly valid JSON without Markdown fences matching:
{
  "enhancedPrompt": "Detailed visual prompt for Veo",
  "cameraMovement": "Camera motion type",
  "recommendedAspectRatio": "16:9",
  "storyboardScenes": [
    { "shotNumber": 1, "description": "Shot 1 visual", "imagePrompt": "Image generation prompt for shot 1" },
    { "shotNumber": 2, "description": "Shot 2 visual", "imagePrompt": "Image generation prompt for shot 2" },
    { "shotNumber": 3, "description": "Shot 3 visual", "imagePrompt": "Image generation prompt for shot 3" }
  ]
}`;

    const response = await generateContentWithRetry({
      primaryModel: "gemini-3.7-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: directorPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    }

    res.json({
      success: true,
      result: {
        enhancedPrompt: data.enhancedPrompt || prompt,
        cameraMovement: data.cameraMovement || "Cinematic Push In",
        recommendedAspectRatio: data.recommendedAspectRatio || "16:9",
        storyboardScenes: Array.isArray(data.storyboardScenes) ? data.storyboardScenes : [],
      },
    });
  } catch (error: any) {
    console.error("Error expanding video prompt:", error);
    res.status(500).json({ error: error.message || "Failed to expand video prompt." });
  }
};

app.post("/api/ai/expand-video-prompt", handleAIExpandVideoPrompt);

// ==========================================
// Cloud Synchronization API (Cross-Device)
// ==========================================
const SYNC_STORAGE_DIR = path.join(process.cwd(), ".sync_storage");
if (!fs.existsSync(SYNC_STORAGE_DIR)) {
  try {
    fs.mkdirSync(SYNC_STORAGE_DIR, { recursive: true });
  } catch (e) {
    console.warn("Could not create .sync_storage directory:", e);
  }
}

// In-memory hot cache for sync keys
const syncMemoryCache = new Map<string, { items: any[]; updatedAt: string }>();

function sanitizeSyncKey(key: string): string {
  return (key || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

function loadCloudSyncData(safeKey: string): { items: any[]; updatedAt: string } {
  if (syncMemoryCache.has(safeKey)) {
    return syncMemoryCache.get(safeKey)!;
  }
  const filePath = path.join(SYNC_STORAGE_DIR, `${safeKey}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      syncMemoryCache.set(safeKey, parsed);
      return parsed;
    } catch (e) {
      console.warn(`Failed reading sync file for key ${safeKey}:`, e);
    }
  }
  return { items: [], updatedAt: new Date().toISOString() };
}

function saveCloudSyncData(safeKey: string, data: { items: any[]; updatedAt: string }): void {
  syncMemoryCache.set(safeKey, data);
  try {
    const filePath = path.join(SYNC_STORAGE_DIR, `${safeKey}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
  } catch (e) {
    console.warn(`Failed writing sync file for key ${safeKey}:`, e);
  }
}

// POST /api/sync/merge - Bidirectional merge and synchronization
app.post("/api/sync/merge", (req: Request, res: Response): void => {
  try {
    const { syncKey, items } = req.body || {};
    const safeKey = sanitizeSyncKey(syncKey);
    if (!safeKey || safeKey.length < 3) {
      res.status(400).json({ error: "A valid sync key (at least 3 characters) is required." });
      return;
    }

    const localItems = Array.isArray(items) ? items : [];
    const cloudData = loadCloudSyncData(safeKey);
    const existingCloudItems = cloudData.items || [];

    // Map by id for merging
    const mergedMap = new Map<string, any>();

    // Cloud items first
    existingCloudItems.forEach((it: any) => {
      if (it && it.id) {
        mergedMap.set(it.id, it);
      }
    });

    // Merge incoming local items (overwriting if identical id, or adding if new)
    localItems.forEach((it: any) => {
      if (it && it.id) {
        mergedMap.set(it.id, it);
      }
    });

    // Sort by createdAt descending
    const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const now = new Date().toISOString();
    saveCloudSyncData(safeKey, { items: mergedList, updatedAt: now });

    res.json({
      success: true,
      syncKey: safeKey,
      items: mergedList,
      totalCount: mergedList.length,
      lastSyncedAt: now,
    });
  } catch (error: any) {
    console.error("Cloud Sync merge error:", error);
    res.status(500).json({ error: error.message || "Failed to synchronize library." });
  }
});

// GET /api/sync/pull/:syncKey - Pull cloud library without pushing
app.get("/api/sync/pull/:syncKey", (req: Request, res: Response): void => {
  try {
    const safeKey = sanitizeSyncKey(req.params.syncKey);
    if (!safeKey) {
      res.status(400).json({ error: "Invalid sync key." });
      return;
    }

    const cloudData = loadCloudSyncData(safeKey);
    res.json({
      success: true,
      syncKey: safeKey,
      items: cloudData.items || [],
      totalCount: (cloudData.items || []).length,
      lastSyncedAt: cloudData.updatedAt,
    });
  } catch (error: any) {
    console.error("Cloud Sync pull error:", error);
    res.status(500).json({ error: error.message || "Failed to pull cloud library." });
  }
});

// API Health Check (supports Cloud Run default probes and standard ping)
app.get(["/api/health", "/health", "/_health"], (_req: Request, res: Response) => {
  res.json({ status: "ok", app: "Remix Awaaz AI - Realistic Voice Generator" });
});

// JSON fallback for any unhandled /api/* routes so they never return HTML
app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// JSON Error Handler for API middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("Server API error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// Server startup and Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const fallbackDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();
    const distPath = fs.existsSync(path.join(process.cwd(), "dist"))
      ? path.join(process.cwd(), "dist")
      : fallbackDir;
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application bundle index.html not found. Please build the app.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Awaaz AI server running on http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
  });
}

startServer();
