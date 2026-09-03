import React, { useState } from 'react';
import {
  Sparkles,
  Clapperboard,
  Play,
  Pause,
  RefreshCw,
  Send,
  Volume2,
  CheckCircle2,
  Mic,
  Sliders,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { GeneratedAudioItem, VoiceDirectorResult } from '../types';
import { VOICES } from '../data/voices';
import { BACKGROUND_MUSIC_TRACKS } from '../data/backgroundMusic';
import { mixVoiceAndBackgroundMusic } from '../utils/audioMixer';

interface AIVoiceDirectorProps {
  onAudioGenerated: (item: GeneratedAudioItem) => void;
}

const DIRECTOR_PRESET_PROMPTS = [
  {
    title: '🎬 Hollywood Thriller Trailer',
    prompt: 'Deliver like a legendary Hollywood trailer narrator: deep baritone, slow dramatic pauses between sentences, ominous buildup with suspenseful cinematic tension.',
    sampleScript: 'In a world where silence is the only rule, one secret will change everything.',
  },
  {
    title: '🌙 Soft Whispering Bedtime Story',
    prompt: 'Soothing ASMR-style bedtime story narration, gentle whisper cadence, warm breathing rhythm, very calm and sleepy tone.',
    sampleScript: 'رات کا اندھیرا چھا چکا ہے، ستارے چمک رہے ہیں، اور پوری دنیا سکون کی گہری نیند میں سو رہی ہے۔',
  },
  {
    title: '🔥 High-Energy Tech Ad',
    prompt: 'Fast-paced, vibrant, modern tech product launch voice. Confident, charismatic, cheerful, with punchy pauses.',
    sampleScript: 'Experience the future of artificial intelligence with real-time speech generation. Smarter, faster, and built for you.',
  },
  {
    title: '💔 Tearful Heartfelt Farewell',
    prompt: 'Speak with deep emotional sorrow, trembling voice, heavy sighs before key words, poignant and melancholic delivery.',
    sampleScript: 'کاش کہ وقت کو کچھ لمحوں کے لیے روکا جا سکتا... مگر شاید تقدیر کا یہی فیصلہ تھا۔',
  },
  {
    title: '🎙️ Sarcastic Podcast Host',
    prompt: 'Casual, conversational, dry comedic sarcasm with slight chuckle nuances and informal pacing.',
    sampleScript: 'Oh sure, because waking up at 5 AM on a Sunday was always my lifelong dream.',
  },
];

export const AIVoiceDirector: React.FC<AIVoiceDirectorProps> = ({ onAudioGenerated }) => {
  const [scriptText, setScriptText] = useState<string>(
    'ستاروں سے آگے جہاں اور بھی ہیں، ابھی عشق کے امتحاں اور بھی ہیں۔'
  );
  const [directorPrompt, setDirectorPrompt] = useState<string>(
    'ایک عظیم الشان ڈرامائی انداز میں پڑھیں، پہلے دھیمی پراسرار آواز سے شروع کریں پھر عروج پر پہنچائیں۔'
  );

  const [isDirecting, setIsDirecting] = useState<boolean>(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [directorResult, setDirectorResult] = useState<VoiceDirectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle Preset selection
  const handleSelectPreset = (preset: typeof DIRECTOR_PRESET_PROMPTS[0]) => {
    setScriptText(preset.sampleScript);
    setDirectorPrompt(preset.prompt);
    setDirectorResult(null);
  };

  // Run AI Voice Director Analysis
  const handleAnalyzeDirectorPrompt = async () => {
    if (!scriptText.trim() || !directorPrompt.trim()) return;
    setIsDirecting(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/direct-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText.trim(),
          prompt: directorPrompt.trim(),
          language: 'auto',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze director prompt.');
      }

      if (data.result) {
        setDirectorResult(data.result);
      }
    } catch (err: any) {
      console.error('Director error:', err);
      setError(err.message || 'Error running voice director.');
    } finally {
      setIsDirecting(false);
    }
  };

  // Synthesize the AI Directed Performance
  const handleSynthesizeDirectedVoice = async () => {
    if (!directorResult) return;
    setIsGeneratingAudio(true);
    setError(null);
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: directorResult.optimizedScript,
          voice: directorResult.voiceId,
          language: 'auto',
          style: directorResult.style,
          emotion: directorResult.emotion,
          emotionIntensity: directorResult.emotionIntensity,
          pitch: directorResult.pitch,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to synthesize directed performance.');
      }

      let finalAudioBase64 = data.audioBase64;
      const rawVoiceBase64 = data.audioBase64;

      if (directorResult.bgMusicTrackId && directorResult.bgMusicTrackId !== 'none') {
        try {
          const mixRes = await mixVoiceAndBackgroundMusic(rawVoiceBase64, {
            trackId: directorResult.bgMusicTrackId,
            volume: 16,
            autoDucking: true,
          });
          if (mixRes && mixRes.mixedBase64) {
            finalAudioBase64 = mixRes.mixedBase64;
          }
        } catch (e) {
          console.warn('Director BGM mix note:', e);
        }
      }

      const voiceObj = VOICES.find((v) => v.id === directorResult.voiceId);
      const bgmObj = BACKGROUND_MUSIC_TRACKS.find((b) => b.id === directorResult.bgMusicTrackId);

      const newItem: GeneratedAudioItem = {
        id: `directed_${Date.now()}`,
        text: directorResult.optimizedScript,
        voice: directorResult.voiceId,
        voiceName: `${voiceObj?.name || directorResult.voiceId} (Directed)`,
        language: 'auto',
        style: directorResult.style,
        emotion: directorResult.emotion,
        emotionIntensity: directorResult.emotionIntensity,
        pitch: directorResult.pitch,
        bgMusicTrackId: directorResult.bgMusicTrackId,
        bgMusicTrackName: bgmObj?.name,
        audioBase64: finalAudioBase64,
        rawVoiceBase64,
        mimeType: 'audio/wav',
        durationSeconds: data.durationSeconds || 6.0,
        createdAt: Date.now(),
      };

      onAudioGenerated(newItem);
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setError(err.message || 'Error generating directed voice audio.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-amber-950/40 border border-rose-500/20 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 shrink-0">
              <Clapperboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  AI Voice Prompt Director (قدرتی زبان میں صداکاری کی ہدایت)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                  Natural Language Directing
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Describe the exact artistic delivery, tone, pacing, drama, or whispers in plain Urdu, Hindi, or English. AI fine-tunes vocal timbre, breathing, pauses & acoustic parameters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              id="btn-analyze-director-prompt"
              onClick={handleAnalyzeDirectorPrompt}
              disabled={isDirecting || !directorPrompt.trim() || !scriptText.trim()}
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isDirecting ? 'animate-spin' : ''}`} />
              <span>{isDirecting ? 'Directing Actor...' : 'Analyze & Direct Voice'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Preset Prompts Grid */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-white/70">
          Quick Director Style Prompts
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {DIRECTOR_PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer space-y-1 group"
            >
              <div className="text-xs font-bold text-white group-hover:text-rose-300 line-clamp-1">
                {p.title}
              </div>
              <p className="text-[11px] text-white/40 line-clamp-2">{p.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script & Natural Language Prompt (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">
                1. Voiceover Script (عبارت یا اسکرپٹ)
              </label>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={4}
                placeholder="Enter script text..."
                className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-rose-500 resize-none font-urdu leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
                <span>2. Director Instructions Prompt (ہدایات برائے صداکار)</span>
                <span className="text-[10px] text-rose-400 font-mono">Urdu / English / Hindi</span>
              </label>
              <textarea
                value={directorPrompt}
                onChange={(e) => setDirectorPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. Speak like a mysterious storyteller around a campfire, start low and whisper, then build up tension with dramatic pauses..."
                className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/15 text-xs text-rose-200 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column: AI Director Interpretation & Synthesis (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>AI Director Analysis & Acoustic Parameters</span>
            </h3>

            {directorResult ? (
              <div className="space-y-4 animate-in fade-in">
                {/* Intent & Directives */}
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 font-mono">
                      DIRECTOR INTENT
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Tuned Delivery
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium">
                    {directorResult.interpretedIntent}
                  </p>

                  {directorResult.audioDirectives?.length > 0 && (
                    <ul className="space-y-1 text-[11px] text-rose-200/80 pt-1 border-t border-rose-500/20">
                      {directorResult.audioDirectives.map((d, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Auto-Assigned Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <span className="text-[10px] text-white/40 block">Voice Actor</span>
                    <span className="text-xs font-bold text-white">{directorResult.voiceId}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <span className="text-[10px] text-white/40 block">Style</span>
                    <span className="text-xs font-bold text-white capitalize">{directorResult.style.replace('_', ' ')}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <span className="text-[10px] text-white/40 block">Emotion</span>
                    <span className="text-xs font-bold text-rose-300 capitalize">{directorResult.emotion} ({directorResult.emotionIntensity}%)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <span className="text-[10px] text-white/40 block">Ambience</span>
                    <span className="text-xs font-bold text-amber-300 capitalize">{directorResult.bgMusicTrackId.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Optimized Script with Pauses */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">
                    Optimized Script with Strategic Breathing Pauses:
                  </label>
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs font-urdu text-yellow-200 leading-loose">
                    {directorResult.optimizedScript}
                  </div>
                </div>

                {/* Big Action Button */}
                <button
                  type="button"
                  id="btn-synthesize-directed-performance"
                  onClick={handleSynthesizeDirectedVoice}
                  disabled={isGeneratingAudio}
                  className="w-full py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAudio ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Directed Voiceover...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Synthesize Directed Performance</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-3">
                <Clapperboard className="w-10 h-10 text-white/30 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Director Desk Ready</h4>
                  <p className="text-xs text-white/40 max-w-xs mx-auto">
                    Type your script and describe the artistic voice performance in the instructions box, then click "Analyze & Direct Voice".
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
