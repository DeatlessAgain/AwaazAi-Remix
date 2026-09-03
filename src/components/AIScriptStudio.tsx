import React, { useState } from 'react';
import {
  ScriptGenre,
  ScriptLength,
  AIScriptGenResult,
  AITransformOp,
  AIAnalysisResult,
  SpeechStyle,
  VoiceEmotion,
} from '../types';
import {
  Sparkles,
  Wand2,
  BookOpen,
  Languages,
  Mic2,
  FileText,
  Sliders,
  ChevronRight,
  Check,
  Loader2,
  Layers,
  ArrowRightLeft,
  Volume2,
  Music,
  Smile,
  Zap,
  RefreshCw,
  Copy,
} from 'lucide-react';

interface AIScriptStudioProps {
  currentText: string;
  onApplyScript: (script: string, config?: {
    voice?: string;
    style?: SpeechStyle;
    emotion?: VoiceEmotion;
    emotionIntensity?: number;
    pitch?: number;
    bgMusicId?: string;
  }) => void;
  selectedLanguage: 'auto' | 'urdu' | 'hindi' | 'english';
  onClose?: () => void;
}

const SCRIPT_GENRES: {
  id: ScriptGenre;
  title: string;
  urduTitle: string;
  icon: string;
  exampleTopic: string;
  defaultLength: ScriptLength;
}[] = [
  {
    id: 'story',
    title: 'Warm Story / Fiction',
    urduTitle: 'کہانی و داستان',
    icon: '📖',
    exampleTopic: 'A heartwarming story about old Lahore and childhood memories in the monsoon rain',
    defaultLength: 'medium',
  },
  {
    id: 'poetry',
    title: 'Poetry & Ghazal (شاعری)',
    urduTitle: 'شاعری و غزل',
    icon: '🌸',
    exampleTopic: 'A reflective Ghazal about hope, destiny, and the beauty of distant stars',
    defaultLength: 'short',
  },
  {
    id: 'kids',
    title: 'Kids Moral Story & Rhyme',
    urduTitle: 'بچوں کی کہانی و لوری',
    icon: '🧸',
    exampleTopic: 'A playful bedtime story about a curious little rabbit who wanted to touch the moon',
    defaultLength: 'medium',
  },
  {
    id: 'youtube',
    title: 'YouTube / Reel Voiceover',
    urduTitle: 'یوٹیوب و ریلز وائس اوور',
    icon: '🎬',
    exampleTopic: 'Top 5 mind-blowing facts about ancient civilizations that science cannot explain',
    defaultLength: 'short',
  },
  {
    id: 'podcast',
    title: 'Podcast Intro & Monologue',
    urduTitle: 'پوڈکاسٹ گفتگو',
    icon: '🎙️',
    exampleTopic: 'How morning habits and mindfulness can transform your focus and emotional peace',
    defaultLength: 'medium',
  },
  {
    id: 'news',
    title: 'News Bulletin & Broadcast',
    urduTitle: 'خبرنامہ و نیوز بلیٹن',
    icon: '📰',
    exampleTopic: 'Global tech updates: breakthrough in renewable energy and smart transport',
    defaultLength: 'short',
  },
  {
    id: 'meditation',
    title: 'Mindfulness & Meditation',
    urduTitle: 'پرسکون مراقبہ و بریتھنگ',
    icon: '🧘',
    exampleTopic: 'Deep evening relaxation guide to release stress, breathe deeply, and sleep peacefully',
    defaultLength: 'medium',
  },
  {
    id: 'ad',
    title: 'Commercial / Promo Ad',
    urduTitle: 'اشتہار و پروموشن',
    icon: '📢',
    exampleTopic: 'Exciting announcement for an artisanal organic chai and cafe grand opening',
    defaultLength: 'short',
  },
  {
    id: 'educational',
    title: 'Educational Explainer',
    urduTitle: 'معلوماتی و تعلیمی گفتگو',
    icon: '💡',
    exampleTopic: 'Why does the sky turn orange at sunset? A simple scientific and poetic explanation',
    defaultLength: 'medium',
  },
];

export const AIScriptStudio: React.FC<AIScriptStudioProps> = ({
  currentText,
  onApplyScript,
  selectedLanguage,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'transform' | 'director'>('generate');

  // Generator State
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState<ScriptGenre>('story');
  const [targetLang, setTargetLang] = useState<'urdu' | 'hindi' | 'english'>(
    selectedLanguage !== 'auto' ? selectedLanguage : 'urdu'
  );
  const [scriptLength, setScriptLength] = useState<ScriptLength>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genResult, setGenResult] = useState<AIScriptGenResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Transform State
  const [transformInput, setTransformInput] = useState(currentText || '');
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedOutput, setTransformedOutput] = useState<string | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [copiedTransformed, setCopiedTransformed] = useState(false);

  // AI Director State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [directorError, setDirectorError] = useState<string | null>(null);

  // Handle Script Generation
  const handleGenerateScript = async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          genre,
          language: targetLang,
          length: scriptLength,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate script.');
      }
      setGenResult(data.result);
    } catch (err: any) {
      console.error('Script generation error:', err);
      setGenError(err.message || 'Could not generate script at this moment.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Text Transformation
  const handleTransform = async (op: AITransformOp) => {
    const textToTransform = transformInput.trim() || currentText.trim();
    if (!textToTransform || isTransforming) return;

    setIsTransforming(true);
    setTransformError(null);
    try {
      const res = await fetch('/api/ai/transform-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTransform,
          operation: op,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to transform script.');
      }
      setTransformedOutput(data.transformedText);
    } catch (err: any) {
      console.error('Transform error:', err);
      setTransformError(err.message || 'Could not process text.');
    } finally {
      setIsTransforming(false);
    }
  };

  // Handle AI Director Analysis
  const handleRunDirector = async () => {
    const textToAnalyze = currentText.trim() || transformInput.trim();
    if (!textToAnalyze || isAnalyzing) return;

    setIsAnalyzing(true);
    setDirectorError(null);
    try {
      const res = await fetch('/api/ai/analyze-director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          language: selectedLanguage !== 'auto' ? selectedLanguage : 'auto',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze script.');
      }
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error('Director analysis error:', err);
      setDirectorError(err.message || 'Could not complete AI Director analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyGenResult = () => {
    if (!genResult) return;
    onApplyScript(genResult.script, {
      voice: genResult.suggestedVoice,
      style: genResult.suggestedStyle,
      emotion: genResult.suggestedEmotion,
      pitch: genResult.suggestedPitch,
      bgMusicId: genResult.suggestedBgmTrackId,
    });
  };

  const handleApplyTransformedResult = () => {
    if (!transformedOutput) return;
    onApplyScript(transformedOutput);
  };

  const handleApplyDirectorRecommendations = () => {
    if (!analysisResult) return;
    onApplyScript(currentText, {
      voice: analysisResult.recommendedVoice,
      style: analysisResult.recommendedStyle,
      emotion: analysisResult.recommendedEmotion,
      emotionIntensity: analysisResult.recommendedEmotionIntensity,
      pitch: analysisResult.recommendedPitch,
      bgMusicId: analysisResult.recommendedBgmTrackId,
    });
  };

  return (
    <div className="bg-[#0b0c16] rounded-3xl border border-indigo-500/20 p-5 sm:p-6 space-y-6 shadow-2xl backdrop-blur-xl">
      {/* Studio Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Script & Voice Director Studio</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gemini 3.7 Intelligence
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Generate authentic Urdu & Hindi scripts, add Aerab/diacritics, Romanize, or get AI voice direction.
              </p>
            </div>
          </div>
        </div>

        {/* Sub tabs navigation */}
        <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10 text-xs w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('generate')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'generate'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>1. AI Script Generator</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('transform');
              if (currentText) setTransformInput(currentText);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'transform'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>2. Linguistic Morph & Aerab</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('director');
              if (!analysisResult && currentText.trim()) {
                handleRunDirector();
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'director'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. AI Auto-Director</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI SCRIPT GENERATOR */}
      {activeSubTab === 'generate' && (
        <div className="space-y-5">
          {/* Genre selector grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <span>Select Content Genre / اندازِ تحریر:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
              {SCRIPT_GENRES.map((g) => {
                const isSelected = genre === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGenre(g.id);
                      setScriptLength(g.defaultLength);
                      if (!topic) setTopic(g.exampleTopic);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{g.icon}</span>
                      <span className="text-[10px] font-urdu text-white/60">{g.urduTitle}</span>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white">{g.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic prompt input & Length / Language Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-white/70 flex items-center justify-between">
                <span>Prompt / Topic Idea (موضوع درج کریں):</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentGenreObj = SCRIPT_GENRES.find((g) => g.id === genre);
                    if (currentGenreObj) setTopic(currentGenreObj.exampleTopic);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Fill Example Idea 💡
                </button>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., An emotional story about rain in Lahore, or a Ghazal on destiny, or a fun moral story for kids..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              />
            </div>

            <div className="space-y-3">
              {/* Target Language */}
              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">Target Language:</label>
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                  {[
                    { id: 'urdu', label: 'اردو' },
                    { id: 'hindi', label: 'हिन्दी' },
                    { id: 'english', label: 'English' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setTargetLang(l.id as any)}
                      className={`py-1 rounded-lg font-semibold transition-colors cursor-pointer text-center ${
                        targetLang === l.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Length */}
              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">Duration & Length:</label>
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[11px]">
                  {[
                    { id: 'short', label: 'Short (~30s)' },
                    { id: 'medium', label: 'Medium (~1m)' },
                    { id: 'long', label: 'Long (~3m)' },
                  ].map((len) => (
                    <button
                      key={len.id}
                      type="button"
                      onClick={() => setScriptLength(len.id as any)}
                      className={`py-1 rounded-lg font-semibold transition-colors cursor-pointer text-center ${
                        scriptLength === len.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {len.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div>
            <button
              type="button"
              id="ai-generate-script-btn"
              disabled={!topic.trim() || isGenerating}
              onClick={handleGenerateScript}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini 3.7 AI is composing your voice script...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Generate Complete Spoken Script (اسکرپٹ تیار کریں)</span>
                </>
              )}
            </button>
          </div>

          {genError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {genError}
            </div>
          )}

          {/* Generated Result Preview & Auto Director Card */}
          {genResult && (
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-indigo-500/30 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                    Generated Script Title:
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white">{genResult.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                    Voice: <strong className="text-indigo-300">{genResult.suggestedVoice}</strong>
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                    Style: <strong className="text-indigo-300">{genResult.suggestedStyle}</strong>
                  </span>
                </div>
              </div>

              {/* Script Body */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 max-h-56 overflow-y-auto custom-scrollbar">
                <p
                  className={`text-white/95 leading-relaxed ${
                    targetLang === 'urdu'
                      ? 'font-urdu text-base text-right'
                      : targetLang === 'hindi'
                      ? 'font-hindi text-sm'
                      : 'text-sm'
                  }`}
                >
                  {genResult.script}
                </p>
              </div>

              {genResult.explanation && (
                <div className="text-xs text-white/50 italic flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>AI Director Note: {genResult.explanation}</span>
                </div>
              )}

              {/* Apply Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleApplyGenResult}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Load Script & Apply AI Voice Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LINGUISTIC MORPH & AERAB TOOL */}
      {activeSubTab === 'transform' && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/70 flex items-center justify-between">
              <span>Text to Transform / زبان و لہجے کی تبدیلی:</span>
              <button
                type="button"
                onClick={() => setTransformInput(currentText)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                Sync with Current Main Text 🔄
              </button>
            </label>
            <textarea
              value={transformInput}
              onChange={(e) => setTransformInput(e.target.value)}
              placeholder="Paste Roman Urdu (e.g. 'Aap kaise hain'), raw text, or bullet points here to transform..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>

          {/* Linguistic Transformation Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/60">
              Select AI Linguistic Transformation:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {/* Roman to Urdu */}
              <button
                type="button"
                onClick={() => handleTransform('roman_to_urdu')}
                disabled={isTransforming || !transformInput.trim()}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-start gap-3 group disabled:opacity-50"
              >
                <span className="text-xl p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                  🔤
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Roman Urdu ➔ Nastaliq Urdu</div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    رومن اردو کو معیاری اردو رسم الخط میں بدلیں
                  </div>
                </div>
              </button>

              {/* Add Aerab / Diacritics */}
              <button
                type="button"
                onClick={() => handleTransform('add_aerab')}
                disabled={isTransforming || !transformInput.trim()}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-start gap-3 group disabled:opacity-50"
              >
                <span className="text-xl p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                  ✨
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Add Urdu Aerab (اعراب)</div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    زبر، زیر، پیش لگائیں تاکہ تلفظ 100% درست ہو
                  </div>
                </div>
              </button>

              {/* Enhance Pacing & Pauses */}
              <button
                type="button"
                onClick={() => handleTransform('enhance_pacing')}
                disabled={isTransforming || !transformInput.trim()}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-start gap-3 group disabled:opacity-50"
              >
                <span className="text-xl p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
                  ⏳
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Human Breath & Pauses</div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    وقفے اور علامات لگا کر سانس کا فطری تاثر دیں
                  </div>
                </div>
              </button>

              {/* Dramatic Tone */}
              <button
                type="button"
                onClick={() => handleTransform('tone_dramatic')}
                disabled={isTransforming || !transformInput.trim()}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-start gap-3 group disabled:opacity-50"
              >
                <span className="text-xl p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20">
                  🎭
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Make Dramatic & Epic</div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    ڈرامائی اور سسپنس سے بھرپور انداز میں لکھیں
                  </div>
                </div>
              </button>

              {/* Poetic Tone */}
              <button
                type="button"
                onClick={() => handleTransform('tone_poetic')}
                disabled={isTransforming || !transformInput.trim()}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-start gap-3 group disabled:opacity-50"
              >
                <span className="text-xl p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                  🌸
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Make Lyrical & Poetic</div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    شعر و ادب اور نغمگی والے انداز میں ڈھالیں
                  </div>
                </div>
              </button>

              {/* Bullet Points to Spoken Script */}
              <button
                type="button"
                onClick={() => handleTransform('bullet_to_script')}
                disabled={isTransforming || !transformInput.trim()}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-start gap-3 group disabled:opacity-50"
              >
                <span className="text-xl p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                  📝
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Bullets ➔ Spoken Story</div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    نوٹس یا نکات کو مکمل کہانی اور اسکرپٹ بنائیں
                  </div>
                </div>
              </button>
            </div>
          </div>

          {isTransforming && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center gap-2 text-xs text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>AI is morphing language and linguistics...</span>
            </div>
          )}

          {transformError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {transformError}
            </div>
          )}

          {/* Transformed Output */}
          {transformedOutput && (
            <div className="p-4 rounded-2xl bg-black/40 border border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Transformed Output / تبدیل شدہ متن:</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(transformedOutput);
                    setCopiedTransformed(true);
                    setTimeout(() => setCopiedTransformed(false), 1500);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedTransformed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTransformed ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar">
                <p className="text-sm text-white/95 leading-relaxed font-urdu text-right">
                  {transformedOutput}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyTransformedResult}
                  className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to Main Input Area</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI AUTO-DIRECTOR */}
      {activeSubTab === 'director' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
                Speech Direction & Audio Persona Analysis
              </h3>
              <p className="text-xs text-white/40">
                AI analyzes your script&apos;s emotion, narrative pacing, and recommends the best voice and music match.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunDirector}
              disabled={isAnalyzing || !currentText.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{isAnalyzing ? 'Analyzing...' : 'Re-analyze Script'}</span>
            </button>
          </div>

          {directorError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {directorError}
            </div>
          )}

          {isAnalyzing && (
            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <div className="text-xs font-semibold text-white">AI Director is listening to your script rhythm...</div>
              <div className="text-[11px] text-white/40">Evaluating sentiment, pitch resonance, and background harmony</div>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Director Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300">Sentiment & Mood:</span>
                  <div className="text-sm font-bold text-white">{analysisResult.sentiment}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300">Optimal Voice Match:</span>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Mic2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{analysisResult.recommendedVoice}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300">Emotion & Delivery:</span>
                  <div className="text-sm font-bold text-white capitalize">
                    {analysisResult.recommendedEmotion} ({analysisResult.recommendedEmotionIntensity}%)
                  </div>
                </div>
              </div>

              {/* Pacing Advice */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Director Pacing & Performance Advice:</span>
                </span>
                <p className="text-xs text-white/80 leading-relaxed">{analysisResult.pacingAdvice}</p>
              </div>

              {/* Pronunciation Notes */}
              {analysisResult.pronunciationNotes && analysisResult.pronunciationNotes.length > 0 && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-white/60">Pronunciation & Articulation Cues:</span>
                  <ul className="space-y-1 text-xs text-white/70 list-disc list-inside">
                    {analysisResult.pronunciationNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* One-click apply recommendation */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  id="apply-ai-director-btn"
                  onClick={handleApplyDirectorRecommendations}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply All AI Director Settings (Voice, Emotion & BGM)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
