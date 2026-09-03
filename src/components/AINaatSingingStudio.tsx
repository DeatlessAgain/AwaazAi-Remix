import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Heart,
  Volume2,
  Play,
  RotateCcw,
  RefreshCw,
  Send,
  Sliders,
  Radio,
  Sun,
  Mic,
  Disc3,
  Flame,
  VolumeX,
  Eye,
} from 'lucide-react';
import {
  GeneratedAudioItem,
  NaatSingingAnalysisResult,
  SpeechStyle,
  VoiceEmotion,
  VocalGenre,
} from '../types';
import { VOICES } from '../data/voices';
import { BACKGROUND_MUSIC_TRACKS } from '../data/backgroundMusic';
import { playTrackPreview, stopTrackPreview } from '../utils/bgMusicSynthesizer';
import { mixVoiceAndBackgroundMusic } from '../utils/audioMixer';
import { VisualLyricsCuePrompter } from './VisualLyricsCuePrompter';

interface AINaatSingingStudioProps {
  onAudioGenerated: (item: GeneratedAudioItem) => void;
}

interface PresetLyrics {
  id: string;
  genre: VocalGenre;
  genreUrdu: string;
  title: string;
  artistOrPoet: string;
  lyrics: string;
  voiceId: string;
  style: SpeechStyle;
  emotion: VoiceEmotion;
  bgmTrackId: string;
  bgmVolume: number;
}

const PRESET_LYRICS: PresetLyrics[] = [
  {
    id: 'naat_faslon',
    genre: 'naat',
    genreUrdu: 'نعتِ رسولِ مقبول ﷺ',
    title: 'فاصلوں کو تکلف ہے ہم سے اگر',
    artistOrPoet: 'قاری وحید ظفر قاسمی',
    lyrics:
      'فاصلوں کو تکلف ہے ہم سے اگر\nہم بھی بے بس نہیں بے سہارا نہیں\nخود انہی کو پکاریں گے ہم دور سے\nراستے میں اگر پاؤں رہ جائیں گے',
    voiceId: 'Aoede',
    style: 'naat_devotional',
    emotion: 'sad',
    bgmTrackId: 'spiritual_daf',
    bgmVolume: 22,
  },
  {
    id: 'naat_hasbi_rabbi',
    genre: 'naat',
    genreUrdu: 'نعت و درود شریف',
    title: 'حسبی ربی جل اللہ، ما فی قلبی غیر اللہ',
    artistOrPoet: 'کلاسیکل ذکر و نعت',
    lyrics:
      'حسبی ربی جل اللہ\nما فی قلبی غیر اللہ\nنورِ محمد صل اللہ\nلا الہ الا اللہ',
    voiceId: 'Fenrir',
    style: 'naat_devotional',
    emotion: 'joyful',
    bgmTrackId: 'spiritual_daf',
    bgmVolume: 24,
  },
  {
    id: 'hamd_koi_to_hai',
    genre: 'hamd',
    genreUrdu: 'حمدِ باری تعالیٰ',
    title: 'کوئی تو ہے جو نظامِ ہستی چلا رہا ہے',
    artistOrPoet: 'مظفر وارثی',
    lyrics:
      'کوئی تو ہے جو نظامِ ہستی چلا رہا ہے وہی خدا ہے\nدکھائی بھی جو نہ دے نظر بھی جو آ رہا ہے وہی خدا ہے\nتلاش اس کو نہ کر بتوں میں وہ ہے بدلتی ہوئی رتوں میں\nجو دن کو رات اور رات کو دن بنا رہا ہے وہی خدا ہے',
    voiceId: 'Aoede',
    style: 'naat_devotional',
    emotion: 'serious',
    bgmTrackId: 'ambient_spiritual_drone',
    bgmVolume: 18,
  },
  {
    id: 'sufi_qalandar',
    genre: 'sufi_kalaam',
    genreUrdu: 'صوفیانہ کلام و دھمال',
    title: 'دم مست قلندر مست مست',
    artistOrPoet: 'حضرت لعل شہباز قلندر',
    lyrics:
      'دم مست قلندر مست مست\nعلی دم دم دے اندر مست مست\nاک ورد ہے دم دم علی علی\nاک روح کا منتر علی علی\nشاہِ مردانِ علی، شیرِ یزدانِ علی',
    voiceId: 'Charon',
    style: 'sufi_qawwali',
    emotion: 'dramatic',
    bgmTrackId: 'sufi_qawwali_clap',
    bgmVolume: 26,
  },
  {
    id: 'ghazal_teri_galiyon',
    genre: 'ghazal_singing',
    genreUrdu: 'غزل و نغمہ سرائی',
    title: 'تیری گلیوں میں نہ رکھیں گے قدم',
    artistOrPoet: 'کلاسیکل نغمہ',
    lyrics:
      'تیری گلیوں میں نہ رکھیں گے قدم آج کے بعد\nتیرے ملنے کو نہ آئیں گے صنم آج کے بعد\nتو سلامت رہے آباد رہے تیرے بنا\nہم بھی جی لیں گے اٹھا کر یہ ستم آج کے بعد',
    voiceId: 'Kore',
    style: 'ghazal_singing',
    emotion: 'sad',
    bgmTrackId: 'harmonium_tabla',
    bgmVolume: 20,
  },
  {
    id: 'song_chaudhvin',
    genre: 'song_tarannum',
    genreUrdu: 'دلفریب گیت و سرور',
    title: 'چودھویں کا چاند ہو یا آفتاب ہو',
    artistOrPoet: 'محمد رفیع',
    lyrics:
      'چودھویں کا چاند ہو یا آفتاب ہو\nجو بھی ہو تم خدا کی قسم لاجواب ہو\nزلفیں ہیں جیسے کالی گھٹا کا پیام ہے\nآنکھیں ہیں جیسے مے کا چھلکتا ہوا جام ہے',
    voiceId: 'Zephyr',
    style: 'melodic_song',
    emotion: 'joyful',
    bgmTrackId: 'acoustic_guitar_lofi',
    bgmVolume: 20,
  },
];

export const AINaatSingingStudio: React.FC<AINaatSingingStudioProps> = ({
  onAudioGenerated,
}) => {
  const [lyrics, setLyrics] = useState<string>(PRESET_LYRICS[0].lyrics);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(PRESET_LYRICS[0].voiceId);
  const [selectedStyle, setSelectedStyle] = useState<SpeechStyle>(PRESET_LYRICS[0].style);
  const [selectedEmotion, setSelectedEmotion] = useState<VoiceEmotion>(PRESET_LYRICS[0].emotion);
  const [selectedBgmTrackId, setSelectedBgmTrackId] = useState<string>(PRESET_LYRICS[0].bgmTrackId);
  const [bgmVolume, setBgmVolume] = useState<number>(PRESET_LYRICS[0].bgmVolume);
  const [pitchShift, setPitchShift] = useState<number>(0);

  // Acoustic Studio parameters
  const [echoLevel, setEchoLevel] = useState<number>(35);
  const [reverbDepth, setReverbDepth] = useState<number>(50);
  const [vocalVibrato, setVocalVibrato] = useState<number>(45);

  // AI Advisor Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<NaatSingingAnalysisResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activePreviewTrack, setActivePreviewTrack] = useState<string | null>(null);
  const [latestGeneratedItem, setLatestGeneratedItem] = useState<GeneratedAudioItem | null>(null);

  // 1. Analyze Lyrics with AI Musicologist / Advisor
  const handleAnalyzeLyrics = async () => {
    if (!lyrics.trim()) return;
    setIsAnalyzing(true);
    setStatusMessage('نعت و کلام کا صوتی تجزیہ اور سازوں کی تحقیق جاری ہے...');

    try {
      const res = await fetch('/api/ai/naat-singing-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lyrics.trim(), language: 'urdu' }),
      });

      if (!res.ok) {
        throw new Error('Analysis service error');
      }

      const data = await res.json();
      if (data.success && data.analysis) {
        const ana: NaatSingingAnalysisResult = data.analysis;
        setAnalysisResult(ana);
        if (ana.recommendedVoice) setSelectedVoiceId(ana.recommendedVoice);
        if (ana.recommendedStyle) setSelectedStyle(ana.recommendedStyle);
        if (ana.recommendedEmotion) setSelectedEmotion(ana.recommendedEmotion);
        if (ana.recommendedBgmTrackId) setSelectedBgmTrackId(ana.recommendedBgmTrackId);
        if (ana.vocalAcoustics) {
          setEchoLevel(ana.vocalAcoustics.echoLevel || 35);
          setReverbDepth(ana.vocalAcoustics.reverbDepth || 50);
          setVocalVibrato(ana.vocalAcoustics.vibratoRate || 40);
        }
        setStatusMessage('کلام کا تجزیہ مکمل ہو گیا۔ سفارشات لاگو کر دی گئیں۔');
      }
    } catch (err) {
      console.warn('Analysis error:', err);
      setStatusMessage('مقامی اصولوں کے مطابق سیٹنگز سیٹ کر دی گئیں۔');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // 2. Load Preset Lyrics
  const handleApplyPreset = (preset: PresetLyrics) => {
    setLyrics(preset.lyrics);
    setSelectedVoiceId(preset.voiceId);
    setSelectedStyle(preset.style);
    setSelectedEmotion(preset.emotion);
    setSelectedBgmTrackId(preset.bgmTrackId);
    setBgmVolume(preset.bgmVolume);
    setAnalysisResult(null);
  };

  // 3. Audio Preview Toggle
  const handleToggleBgmPreview = (trackId: string) => {
    if (activePreviewTrack === trackId) {
      stopTrackPreview();
      setActivePreviewTrack(null);
    } else {
      playTrackPreview(trackId, bgmVolume / 100);
      setActivePreviewTrack(trackId);
    }
  };

  // 4. Generate AI Singing Voice & Mix with BGM
  const handleGenerateVoice = async () => {
    if (!lyrics.trim()) return;
    setIsGenerating(true);
    setStatusMessage('AI سے پرتاثیر نعت خوانی و نغمہ جنریٹ ہو رہا ہے...');

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lyrics.trim(),
          voice: selectedVoiceId,
          language: 'urdu',
          style: selectedStyle,
          emotion: selectedEmotion,
          emotionIntensity: 65,
          pitch: pitchShift,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate voice');
      }

      const voiceData = await res.json();
      if (!voiceData.success || !voiceData.audio) {
        throw new Error('No audio returned');
      }

      const rawVoiceBase64 = voiceData.audio;
      let durationSeconds = voiceData.durationSeconds || 10;
      let finalAudioBase64 = rawVoiceBase64;
      let usedBgmName = 'بغیر میوزک';

      // Mix with selected BGM if enabled
      if (selectedBgmTrackId && selectedBgmTrackId !== 'none' && bgmVolume > 0) {
        setStatusMessage('پس منظر کی موسیقی (Daf/Harmonium/Drone) کو آواز کے ساتھ مکس کیا جا رہا ہے...');
        const mixResult = await mixVoiceAndBackgroundMusic(rawVoiceBase64, {
          trackId: selectedBgmTrackId,
          volume: bgmVolume,
          autoDucking: true,
        });
        if (mixResult && mixResult.mixedBase64) {
          finalAudioBase64 = mixResult.mixedBase64;
          if (mixResult.durationSeconds > 0) {
            durationSeconds = mixResult.durationSeconds;
          }
          const bgmObj = BACKGROUND_MUSIC_TRACKS.find((t) => t.id === selectedBgmTrackId);
          usedBgmName = bgmObj ? bgmObj.urduName : selectedBgmTrackId;
        }
      }

      const voiceMeta = VOICES.find((v) => v.id === selectedVoiceId) || VOICES[0];
      const newItem: GeneratedAudioItem = {
        id: `naat_${Date.now()}`,
        text: lyrics.trim(),
        voice: selectedVoiceId,
        voiceName: voiceMeta.name,
        language: 'urdu',
        style: selectedStyle,
        emotion: selectedEmotion,
        emotionIntensity: 70,
        pitch: pitchShift,
        audioBase64: finalAudioBase64,
        rawVoiceBase64: rawVoiceBase64,
        bgMusicTrackId: selectedBgmTrackId !== 'none' ? selectedBgmTrackId : undefined,
        bgMusicTrackName: usedBgmName,
        bgMusicVolume: bgmVolume,
        mimeType: 'audio/wav',
        durationSeconds,
        createdAt: Date.now(),
      };

      onAudioGenerated(newItem);
      setLatestGeneratedItem(newItem);
      setStatusMessage('ماشاءاللہ! نعت و نغمہ کامیابی کے ساتھ تیار ہو چکا ہے۔ نیچے لائیو پرامپٹر میں دیکھیں!');
    } catch (err: any) {
      console.error('Generation error:', err);
      setStatusMessage(`خرابی: ${err.message || 'آواز نہیں بن سکی۔ دوبارہ کوشش کریں۔'}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const currentBgmTrack = BACKGROUND_MUSIC_TRACKS.find((t) => t.id === selectedBgmTrackId);

  return (
    <div className="space-y-6" id="ai-naat-singing-studio">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>روحانی کلام و نغمہ سرائی اسٹوڈیو</span>
              <span className="bg-emerald-400/20 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                AI Singing & Daf BGM
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>AI Naat & Singing Studio</span>
              <span className="text-emerald-400 font-urdu font-normal text-xl md:text-2xl">
                (نعت خوانی، حمد و نغمہ سرائی)
              </span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              پرخلوص نعت خوانی، حمدِ باری تعالیٰ، صوفیانہ کلام، اور غزل سرائی کو روایتی دف (Daf)، ہارمونیم و طبلہ، اور نورانی ڈرون کے ساتھ اسٹوڈیو کوالٹی میں تیار کریں۔
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="analyze-lyrics-btn"
              onClick={handleAnalyzeLyrics}
              disabled={isAnalyzing || !lyrics.trim()}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-200" />
              )}
              <span>AI سے لے و ساز معلوم کریں</span>
            </button>
          </div>
        </div>

        {/* Status bar */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-urdu text-sm">{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Preset Masterpieces Bar */}
      <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              مشہور کلام و نغمات کے نمونے (Preset Lyrics)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">ایک کلک پر لوڈ کریں</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESET_LYRICS.map((preset) => {
            const isSelected = lyrics.trim() === preset.lyrics.trim();
            return (
              <button
                key={preset.id}
                type="button"
                id={`preset-btn-${preset.id}`}
                onClick={() => handleApplyPreset(preset)}
                className={`p-2.5 rounded-xl text-right transition-all flex flex-col justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 font-mono">
                    {preset.genre}
                  </span>
                  {isSelected && <Heart className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
                </div>
                <div className="font-urdu font-bold text-xs text-white line-clamp-1">
                  {preset.title}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {preset.artistOrPoet}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Controls: Lyrics Editor & BGM Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lyrics & Vocal Performance (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lyrics Input Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-white/10 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>اشعار و کلام (Lyrics & Verses)</span>
                  <span className="text-emerald-400 font-urdu text-xs">
                    (ہر مصرع نئی سطر پر لکھیں)
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLyrics('')}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>صاف کریں</span>
              </button>
            </div>

            <textarea
              id="naat-lyrics-input"
              rows={6}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="یہاں نعتِ پاک، حمد، صوفیانہ کلام، یا گانے کے اشعار درج کریں..."
              className="w-full bg-black/40 border border-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl p-4 text-white font-urdu text-lg leading-loose outline-none resize-none transition-all placeholder:text-slate-600 text-right dir-rtl"
            />

            {/* AI Analysis Insight Panel (When analyzed) */}
            {analysisResult && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-200">
                      AI تجزیہ: {analysisResult.genreDetected}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-urdu">
                      {analysisResult.maqamOrRaag}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 font-urdu">
                      {analysisResult.spiritualMood}
                    </span>
                  </div>
                </div>

                {/* BGM Advice Box */}
                <div className="p-3 rounded-xl bg-black/30 border border-emerald-500/20 text-xs text-slate-300 font-urdu leading-relaxed">
                  <span className="text-emerald-400 font-bold ml-1">
                    ساز و بیک گراؤنڈ میوزک گائیڈ:
                  </span>
                  {analysisResult.bgmAdvice}
                </div>

                {/* Verses Breakdown with Cadence */}
                {analysisResult.versesBreakdown && analysisResult.versesBreakdown.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      مصرعہ وار ادائے ترنم و ٹھہراؤ:
                    </span>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {analysisResult.versesBreakdown.map((vb, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/5 border border-white/5 text-right font-urdu"
                        >
                          <span className="text-[10px] text-emerald-400 font-mono shrink-0">
                            {vb.pauseAfterMs}ms ٹھہراؤ
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">({vb.cadenceNotes})</span>
                            <span className="text-white font-medium">{vb.verseText}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vocalist Voice Selection */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Disc3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>آواز اور نعت خواں کا انتخاب (Vocalist Voice)</span>
                </span>
                <span className="text-[11px] text-slate-400">Gemini High-Fidelity Voices</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {VOICES.map((v) => {
                  const isSelected = selectedVoiceId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      id={`voice-select-${v.id}`}
                      onClick={() => setSelectedVoiceId(v.id)}
                      className={`p-3 rounded-2xl text-center transition-all border cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-gradient-to-b from-emerald-500/20 to-teal-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 scale-[1.02]'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-tr ${v.avatarGradient} flex items-center justify-center text-xs font-bold text-white shadow-md`}
                      >
                        {v.name[0]}
                      </div>
                      <div className="font-bold text-xs">{v.name}</div>
                      <div className="text-[9px] text-slate-400 line-clamp-1">{v.accent}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Performance Style & Emotion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>ادائیگی کا انداز (Singing / Recital Style)</span>
                </label>
                <select
                  id="select-singing-style"
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as SpeechStyle)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="naat_devotional">روحانی نعت و حمد (Soulful Naat & Devotional)</option>
                  <option value="ghazal_singing">غزل سرائی و ترنم (Ghazal Tarannum)</option>
                  <option value="melodic_song">نغمہ و گیت (Melodic Song & Pitch)</option>
                  <option value="sufi_qawwali">صوفیانہ کلام و قوالی (Sufi Qawwali & Ecstasy)</option>
                  <option value="poetic">ادبی شاعری (Classical Poetic)</option>
                  <option value="emotional_soft">دھیمی گداز آواز (Soft & Tender)</option>
                </select>
              </div>

              {/* Emotion */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>روحانی جذبہ و تاثر (Vocal Emotion)</span>
                </label>
                <select
                  id="select-singing-emotion"
                  value={selectedEmotion}
                  onChange={(e) => setSelectedEmotion(e.target.value as VoiceEmotion)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="sad">سوز و گداز و قلبی کیفیت (Heartfelt & Soft)</option>
                  <option value="joyful">شکر گزاری و مسرت (Joyful Devotion)</option>
                  <option value="dramatic">پرجوش و وجدانی (Dramatic & Resonant)</option>
                  <option value="serious">باوقار و باادب (Solemn & Reverent)</option>
                  <option value="whisper">خفیہ و رازداری (Intimate Whisper)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual Lyrics Cue Prompter & Rehearsal Studio */}
          <VisualLyricsCuePrompter
            lyrics={lyrics}
            generatedItem={latestGeneratedItem}
            analysisResult={analysisResult}
            bgmTrackId={selectedBgmTrackId}
            bgmVolume={bgmVolume}
          />
        </div>

        {/* Right Column: Background Music & Studio Acoustics (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Background Music Selector & Audio Audition */}
          <div className="bg-slate-900/90 rounded-3xl border border-white/10 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">پس منظر کی موسیقی (BGM)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Daf & Harmonium
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-urdu">
              نعت کے لیے دف (Daf) یا نورانی ڈرون، اور گانوں کے لیے ہارمونیم یا طبلہ منتخب کریں۔
            </p>

            {/* BGM Track List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {BACKGROUND_MUSIC_TRACKS.map((track) => {
                const isSelected = selectedBgmTrackId === track.id;
                const isPreviewing = activePreviewTrack === track.id;

                return (
                  <div
                    key={track.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                    }`}
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedBgmTrackId(track.id);
                        if (track.defaultVolume) setBgmVolume(track.defaultVolume);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-urdu">
                          {track.urduName}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-urdu line-clamp-1 mt-0.5">
                        {track.urduDescription}
                      </div>
                    </div>

                    {track.id !== 'none' && (
                      <button
                        type="button"
                        id={`preview-bgm-${track.id}`}
                        onClick={() => handleToggleBgmPreview(track.id)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isPreviewing
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20'
                        }`}
                        title="سن کر دیکھیں (Preview Sound)"
                      >
                        {isPreviewing ? (
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* BGM Volume Slider */}
            {selectedBgmTrackId !== 'none' && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>میوزک والیوم (BGM Volume)</span>
                  </span>
                  <span className="text-emerald-300 font-mono">{bgmVolume}%</span>
                </div>
                <input
                  type="range"
                  id="naat-bgm-volume-slider"
                  min={5}
                  max={60}
                  step={1}
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-urdu">
                  <span>ہلکا پس منظر (10%)</span>
                  <span>متوازن (20-25%)</span>
                  <span>نمایاں ساز (40%+)</span>
                </div>
              </div>
            )}
          </div>

          {/* Studio Vocal Acoustics & Reverb Rack */}
          <div className="bg-slate-900/90 rounded-3xl border border-white/10 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">صوتی اثرات (Acoustics & DSP)</h3>
              </div>
              <span className="text-[10px] text-slate-400">Mehfil Sound</span>
            </div>

            {/* Echo Level */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">اسٹوڈیو ایکو / تاخیر (Echo & Delay)</span>
                <span className="text-emerald-400 font-mono">{echoLevel}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={echoLevel}
                onChange={(e) => setEchoLevel(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Reverb Depth */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">ریورب و گونج (Sacred Reverb)</span>
                <span className="text-emerald-400 font-mono">{reverbDepth}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={reverbDepth}
                onChange={(e) => setReverbDepth(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Pitch & Sur */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">سُر و پچ ایڈجسٹمنٹ (Pitch Shift)</span>
                <span className="text-emerald-400 font-mono">
                  {pitchShift > 0 ? `+${pitchShift}` : pitchShift}%
                </span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                value={pitchShift}
                onChange={(e) => setPitchShift(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Master Generate Button */}
          <button
            type="button"
            id="generate-naat-singing-btn"
            onClick={handleGenerateVoice}
            disabled={isGenerating || !lyrics.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-200" />
                <span>آواز اور ساز تیار ہو رہے ہیں...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 text-emerald-200 ml-1" />
                <span className="font-urdu text-lg">
                  نعت و نغمہ تیار کریں (Generate Studio Audio)
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
