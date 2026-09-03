import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  BookOpen,
  Volume2,
  Play,
  RotateCcw,
  Feather,
  Check,
  RefreshCw,
  Send,
  Layers,
} from 'lucide-react';
import {
  GeneratedAudioItem,
  PoetryAnalysisResult,
  SpeechStyle,
  VoiceEmotion,
} from '../types';
import { VOICES } from '../data/voices';
import { BACKGROUND_MUSIC_TRACKS } from '../data/backgroundMusic';
import { mixVoiceAndBackgroundMusic } from '../utils/audioMixer';

interface AIPoetryStudioProps {
  onGenerated: (item: GeneratedAudioItem) => void;
}

const POETRY_PRESETS = [
  {
    poet: 'علامہ اقبال (Allama Iqbal)',
    title: 'ستاروں سے آگے جہاں اور بھی ہیں',
    verses:
      'ستاروں سے آگے جہاں اور بھی ہیں\nابھی عشق کے امتحاں اور بھی ہیں\nقناعت نہ کر عالمِ رنگ و بو پر\nچمن اور بھی آشیاں اور بھی ہیں',
    recommendedVoice: 'Aoede',
    recommendedStyle: 'poetic' as SpeechStyle,
    recommendedEmotion: 'dramatic' as VoiceEmotion,
    bgmTrackId: 'sufi_flute',
  },
  {
    poet: 'مرزا اسد اللہ خان غالب (Mirza Ghalib)',
    title: 'دلِ ناداں تجھے ہوا کیا ہے',
    verses:
      'دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے\nہم ہیں مشتاق اور وہ بیزار\nیا الٰہی یہ ماجرا کیا ہے',
    recommendedVoice: 'Charon',
    recommendedStyle: 'poetic' as SpeechStyle,
    recommendedEmotion: 'sad' as VoiceEmotion,
    bgmTrackId: 'poetic_sitar',
  },
  {
    poet: 'فیض احمد فیض (Faiz Ahmad Faiz)',
    title: 'گلوں میں رنگ بھرے بادِ نو بہار چلے',
    verses:
      'گلوں میں رنگ بھرے بادِ نو بہار چلے\nچلے بھی آؤ کہ گلشن کا کاروبار چلے\nقفس اداس ہے یارو صبا سے کچھ تو کہو\nکہیں تو بہرِ خدا آج ذکرِ یار چلے',
    recommendedVoice: 'Fenrir',
    recommendedStyle: 'poetic' as SpeechStyle,
    recommendedEmotion: 'emotional_soft' as VoiceEmotion,
    bgmTrackId: 'poetic_sitar',
  },
  {
    poet: 'جون ایلیا (Jaun Elia)',
    title: 'شاید کہ میں نے خود کو کہیں چھوڑ دیا ہے',
    verses:
      'شاید کہ میں نے خود کو کہیں چھوڑ دیا ہے\nیا شاید کسی نے مجھ کو توڑ دیا ہے\nاب کے ہم بچھڑے تو شاید کبھی خوابوں میں ملیں\nجس طرح سوکھے ہوئے پھول کتابوں میں ملیں',
    recommendedVoice: 'Charon',
    recommendedStyle: 'emotional_soft' as SpeechStyle,
    recommendedEmotion: 'sad' as VoiceEmotion,
    bgmTrackId: 'sad_violin',
  },
  {
    poet: 'پروین شاکر (Parveen Shakir)',
    title: 'کو بہ کو پھیل گئی بات شناسائی کی',
    verses:
      'کو بہ کو پھیل گئی بات شناسائی کی\nاس نے خوشبو کی طرح میری پذیرائی کی\nکیسے کہہ دوں کہ مجھے چھوڑ دیا ہے اس نے\nبات تو سچ ہے مگر بات ہے رسوائی کی',
    recommendedVoice: 'Aoede',
    recommendedStyle: 'poetic' as SpeechStyle,
    recommendedEmotion: 'emotional_soft' as VoiceEmotion,
    bgmTrackId: 'sufi_flute',
  },
];

export const AIPoetryStudio: React.FC<AIPoetryStudioProps> = ({ onGenerated }) => {
  const [poetryText, setPoetryText] = useState<string>(POETRY_PRESETS[0].verses);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(POETRY_PRESETS[0].recommendedVoice);
  const [selectedBgmId, setSelectedBgmId] = useState<string>(POETRY_PRESETS[0].bgmTrackId);
  const [bgmVolume, setBgmVolume] = useState<number>(18);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<PoetryAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle Preset selection
  const handleSelectPreset = (preset: typeof POETRY_PRESETS[0]) => {
    setPoetryText(preset.verses);
    setSelectedVoiceId(preset.recommendedVoice);
    setSelectedBgmId(preset.bgmTrackId);
    setAnalysis(null);
    setError(null);
  };

  // Run AI Bahr & Prosody Meter Analyzer
  const handleAnalyzeMeter = async () => {
    if (!poetryText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/poetry-meter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poetryText: poetryText.trim(),
          language: 'urdu',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze poetry meter.');
      }
      if (data.analysis) {
        setAnalysis(data.analysis);
        if (data.analysis.recommendedVoice) {
          setSelectedVoiceId(data.analysis.recommendedVoice);
        }
        if (data.analysis.recommendedBgmTrackId) {
          setSelectedBgmId(data.analysis.recommendedBgmTrackId);
        }
      }
    } catch (err: any) {
      console.error('Poetry analysis error:', err);
      setError(err.message || 'Error analyzing meter and bahr.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate Melodic Tarannum Audio
  const handleGenerateTarannum = async () => {
    if (!poetryText.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      // 1. Generate Voice via TTS
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: poetryText.trim(),
          voice: selectedVoiceId,
          language: 'urdu',
          style: 'poetic',
          emotion: analysis?.recommendedEmotion || 'dramatic',
          emotionIntensity: 70,
          pitch: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate poetic tarannum recitation.');
      }

      let finalAudioBase64 = data.audioBase64;
      const rawVoiceBase64 = data.audioBase64;

      // 2. Mix with traditional instrument background music if selected
      if (selectedBgmId && selectedBgmId !== 'none') {
        try {
          const mixRes = await mixVoiceAndBackgroundMusic(rawVoiceBase64, {
            trackId: selectedBgmId,
            volume: bgmVolume,
            autoDucking: true,
          });
          if (mixRes && mixRes.mixedBase64) {
            finalAudioBase64 = mixRes.mixedBase64;
          }
        } catch (mixErr) {
          console.warn('BGM mixing error in poetry studio:', mixErr);
        }
      }

      const selectedVoiceObj = VOICES.find((v) => v.id === selectedVoiceId);
      const bgmObj = BACKGROUND_MUSIC_TRACKS.find((b) => b.id === selectedBgmId);

      const newItem: GeneratedAudioItem = {
        id: `poetry_${Date.now()}`,
        text: poetryText.trim(),
        voice: selectedVoiceId,
        voiceName: selectedVoiceObj?.name || selectedVoiceId,
        language: 'urdu',
        style: 'poetic',
        emotion: analysis?.recommendedEmotion || 'dramatic',
        emotionIntensity: 70,
        pitch: 0,
        bgMusicTrackId: selectedBgmId,
        bgMusicTrackName: bgmObj?.name,
        bgMusicVolume: bgmVolume,
        audioBase64: finalAudioBase64,
        rawVoiceBase64,
        mimeType: 'audio/wav',
        durationSeconds: data.durationSeconds || 6.0,
        createdAt: Date.now(),
      };

      onGenerated(newItem);
    } catch (err: any) {
      console.error('Poetry generation error:', err);
      setError(err.message || 'Failed to recite poetry.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-amber-950/40 border border-emerald-500/20 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Feather className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  AI Poetry Tarannum & Melodic Recitation (ترنم اور غزل کمپوزر)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Bahr • Tarannum • Sur
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Urdu Shayari recitation with meter analysis (بحر و وزن), prosodic breathing pauses & Eastern instrument accompaniment (رباب، ستار، بانسری).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              id="btn-analyze-bahr"
              onClick={handleAnalyzeMeter}
              disabled={isAnalyzing}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Meter...' : 'Analyze Bahr & Rhythm'}</span>
            </button>
            <button
              type="button"
              id="btn-generate-tarannum"
              onClick={handleGenerateTarannum}
              disabled={isGenerating || !poetryText.trim()}
              className="flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reciting in Tarannum...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Recite with Melody</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Preset Masterpieces Grid */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Classic Masterpieces Presets (شاہکار کلام)</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {POETRY_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer space-y-1 group"
            >
              <div className="text-xs font-bold text-white group-hover:text-emerald-300 line-clamp-1">
                {p.title}
              </div>
              <div className="text-[11px] text-white/50 line-clamp-1">{p.poet}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Poetry Editor & Meter Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/80">
                Ghazal / Couplet Input (اشعار و کلام درج کریں)
              </label>
              <span className="text-[11px] text-white/40 font-mono">
                {poetryText.split('\n').filter(Boolean).length} Verses
              </span>
            </div>

            <textarea
              value={poetryText}
              onChange={(e) => setPoetryText(e.target.value)}
              rows={6}
              dir="rtl"
              placeholder="یہاں اپنی غزل، نظم یا اشعار درج فرمائیں..."
              className="w-full p-4 rounded-2xl bg-black/40 border border-white/15 text-lg text-emerald-200 font-urdu leading-loose focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />

            {/* AI Bahr & Meter Analysis Card */}
            {analysis && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-mono">
                      POETIC METER (بحر و وزن)
                    </span>
                    <h4 className="text-sm font-bold text-white">{analysis.bahrName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold font-mono">
                      PATTERN (افاعیل)
                    </span>
                    <div className="text-xs text-amber-200 font-urdu">{analysis.bahrPattern}</div>
                  </div>
                </div>

                {analysis.tarannumAdvice && (
                  <p className="text-xs text-emerald-200/90 font-urdu leading-relaxed">
                    💡 <strong>طرزِ ترنم کا مشورہ:</strong> {analysis.tarannumAdvice}
                  </p>
                )}

                {/* Couplet timing alignment */}
                {analysis.couplets.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                      Paired Couplets (تقطیع و اشعار)
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {analysis.couplets.map((c, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl bg-black/40 border border-white/10 text-xs font-urdu text-right text-white/90 space-y-0.5"
                        >
                          <div>{c.misra1}</div>
                          <div className="text-emerald-300">{c.misra2}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Voice Persona & Eastern Instruments (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-400" />
              <span>Recitation Voice & Eastern Instruments</span>
            </h3>

            {/* Voice Persona Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">
                Poetic Reciter Voice (صداکار کا انتخاب)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Aoede', name: 'Aoede (Gentle & Lyrical)', desc: 'Soft melodious female' },
                  { id: 'Charon', name: 'Charon (Deep Classical)', desc: 'Resonant baritone male' },
                  { id: 'Fenrir', name: 'Fenrir (Dramatic Mushaira)', desc: 'Grand storytelling male' },
                  { id: 'Kore', name: 'Kore (Warm Literature)', desc: 'Natural clear female' },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVoiceId(v.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedVoiceId === v.id
                        ? 'bg-emerald-950/60 border-emerald-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{v.name}</div>
                    <div className="text-[10px] text-white/40">{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Instruments */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">
                Eastern Classical Instrument (ساز و سر)
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'sufi_flute', name: 'Sufi Flute & Rabab (بانسری و رباب)', color: 'emerald' },
                  { id: 'poetic_sitar', name: 'Poetic Sitar & Tanpura (ستار و تانپورہ)', color: 'amber' },
                  { id: 'sad_violin', name: 'Sad Melancholic Violin (غمگین وائلن)', color: 'rose' },
                  { id: 'cinematic_drama', name: 'Cinematic Strings (ڈرامائی ساز)', color: 'purple' },
                  { id: 'none', name: 'Acapella (بغیر ساز، صرف ترنم)', color: 'slate' },
                ].map((bgm) => (
                  <button
                    key={bgm.id}
                    type="button"
                    onClick={() => setSelectedBgmId(bgm.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedBgmId === bgm.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span>{bgm.name}</span>
                    {selectedBgmId === bgm.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Instrument Volume Slider */}
            {selectedBgmId !== 'none' && (
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs text-white/70">
                  <span>Instrument Volume Balance</span>
                  <span className="font-mono">{bgmVolume}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
