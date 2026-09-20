import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Radio,
  Sliders,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Flame,
  Layers,
  Wand2,
  Disc3,
} from 'lucide-react';
import {
  SunoHookResult,
  SunoRemixVariation,
  SunoEnhancedPromptResult,
  SunoUdioCompositionResult,
} from '../types';

interface AISunoUdioProducerSuiteProps {
  currentLyrics: string;
  currentGenre: string;
  topic: string;
  onApplyLyricsSnippet: (snippet: string, position: 'top' | 'bottom' | 'replace') => void;
  onApplyVariation: (variation: SunoRemixVariation) => void;
  onApplyEnhancedPrompt: (enhancedPrompt: string, negativePrompt?: string) => void;
}

export const AISunoUdioProducerSuite: React.FC<AISunoUdioProducerSuiteProps> = ({
  currentLyrics,
  currentGenre,
  topic,
  onApplyLyricsSnippet,
  onApplyVariation,
  onApplyEnhancedPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'hook_builder' | 'remix_variations' | 'prompt_optimizer'>(
    'hook_builder'
  );
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // 1. Hook Builder States
  const [sectionType, setSectionType] = useState<'chorus' | 'bridge' | 'hook' | 'outro'>('chorus');
  const [sectionTopic, setSectionTopic] = useState<string>(topic || 'بارش اور یادوں کا سفر');
  const [isGeneratingSection, setIsGeneratingSection] = useState<boolean>(false);
  const [generatedSection, setGeneratedSection] = useState<SunoHookResult | null>(null);

  // 2. Remix Variations States
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<boolean>(false);
  const [variationsList, setVariationsList] = useState<SunoRemixVariation[]>([]);

  // 3. Prompt Optimizer States
  const [rawPromptInput, setRawPromptInput] = useState<string>(
    'Urdu acoustic lo-fi, soulful female vocals, rain sound, nylon guitar'
  );
  const [targetEngine, setTargetEngine] = useState<'suno' | 'udio'>('suno');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizedResult, setOptimizedResult] = useState<SunoEnhancedPromptResult | null>(null);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  // 1. Generate Section
  const handleGenerateSection = async () => {
    setIsGeneratingSection(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/suno-udio-lyricist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sectionTopic.trim() || topic,
          genre: currentGenre,
          existingLyrics: currentLyrics,
          partToGenerate: sectionType,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'سیکشن بنانے میں دشواری ہوئی۔');
      }
      setGeneratedSection(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate song section.');
    } finally {
      setIsGeneratingSection(false);
    }
  };

  // 2. Generate 3-Way Remix Variations
  const handleFetchVariations = async () => {
    setIsGeneratingVariations(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/suno-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLyrics,
          currentGenre,
          topic,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'ریمکس اسٹائلز حاصل کرنے میں دشواری ہوئی۔');
      }
      setVariationsList(data.result.variations || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate remix variations.');
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  // 3. Optimize Prompt
  const handleOptimizePrompt = async () => {
    if (!rawPromptInput.trim()) return;
    setIsOptimizing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simplePrompt: rawPromptInput.trim(),
          engine: targetEngine,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'پرامپٹ آپٹیمائز کرنے میں دشواری ہوئی۔');
      }
      setOptimizedResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to enhance music prompt.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-purple-950/20 to-black/60 p-4 backdrop-blur-md transition-all shadow-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>AI سونو و اوڈیو پروڈیوسر ٹول کٹ (AI Producer Suite)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-xs text-indigo-200/70">
              ہک و کورس بلڈر، ۳-اسٹائلز ریمکس انجن اور سونو/اوڈیو پرامپٹ آپٹیمائزر
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
          title={isOpen ? 'کم کریں' : 'پھیلائیں'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('hook_builder')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'hook_builder'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>AI ہک و کورس ساز (Hook & Chorus)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('remix_variations');
                if (variationsList.length === 0) {
                  handleFetchVariations();
                }
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'remix_variations'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>۳-اسٹائلز ریمکس (3-Way Remix Engine)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prompt_optimizer')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'prompt_optimizer'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>پرامپٹ آپٹیمائزر (Meta-Prompt & Negatives)</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: AI ہک و کورس بلڈر */}
          {activeTab === 'hook_builder' && (
            <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Section Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80">
                    تخلیق کرنے کا سیکشن (Song Section Type)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'chorus', label: '[Chorus]' },
                      { id: 'bridge', label: '[Bridge]' },
                      { id: 'hook', label: '[Hook]' },
                      { id: 'outro', label: '[Outro]' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSectionType(s.id as any)}
                        className={`py-2 px-2 rounded-xl border text-xs font-mono font-bold text-center transition-all cursor-pointer ${
                          sectionType === s.id
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Context/Mood */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80">
                    خیال یا موڈ (Context / Lyric Idea)
                  </label>
                  <input
                    type="text"
                    value={sectionTopic}
                    onChange={(e) => setSectionTopic(e.target.value)}
                    placeholder="مثال: بارش کی رات، چائے کی خوشبو اور دل کی بات..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-indigo-500"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateSection}
                  disabled={isGeneratingSection}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-900/30"
                >
                  {isGeneratingSection ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>سیکشن لکھا جا رہا ہے...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>سیکشن تیار کریں ({sectionType.toUpperCase()})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Section Card */}
              {generatedSection && (
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">
                        {generatedSection.catchyHookTag}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                        [{generatedSection.sectionType.toUpperCase()}]
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(generatedSection.generatedSection, 'gen_sec')
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copyStatus === 'gen_sec' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>کاپی</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onApplyLyricsSnippet(generatedSection.generatedSection, 'bottom')
                        }
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>بول کے آخر میں جوڑیں</span>
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-lg bg-black/40 text-indigo-100 font-mono text-xs leading-relaxed whitespace-pre-line border border-indigo-500/20"
                    dir="rtl"
                  >
                    {generatedSection.generatedSection}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ۳-اسٹائلز ریمکس انجن */}
          {activeTab === 'remix_variations' && (
            <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    ایک ہی گانے کے ۳ مختلف اسٹوڈیو ورژنز (3 Stylistic Song Variations)
                  </h4>
                  <p className="text-[11px] text-white/60">
                    Suno v4 اور Udio کے لیے الگ الگ ریمکس دھنیں (لو فائی، کوک اسٹوڈیو، سنتھ ویو)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFetchVariations}
                  disabled={isGeneratingVariations}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isGeneratingVariations ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>تیار ہو رہا ہے...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>دوبارہ ریمکس بنائیں</span>
                    </>
                  )}
                </button>
              </div>

              {variationsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                  {variationsList.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-all space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white line-clamp-1">{v.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                            {v.tempo}
                          </span>
                        </div>
                        <div className="text-[11px] text-indigo-300 font-semibold">{v.styleName}</div>

                        <div className="space-y-1 pt-1">
                          <div className="text-[10px] text-white/50 font-mono uppercase">Suno Prompt:</div>
                          <div className="text-[11px] text-white/80 bg-black/30 p-2 rounded-lg font-mono line-clamp-3">
                            {v.sunoPrompt}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] text-white/50 font-mono uppercase">Instruments:</div>
                          <div className="flex flex-wrap gap-1">
                            {v.recommendedInstruments?.slice(0, 3).map((inst, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/70"
                              >
                                {inst}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => handleCopy(v.sunoPrompt, `copy_${v.id}`)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {copyStatus === `copy_${v.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>کاپی</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onApplyVariation(v)}
                          className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shadow"
                        >
                          <Check className="w-3 h-3" />
                          <span>لاگو کریں</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-white/50 bg-white/5 rounded-xl border border-dashed border-white/10">
                  {isGeneratingVariations ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>۳ منفرد ورژنز تیار کیے جا رہے ہیں...</span>
                    </div>
                  ) : (
                    <span>۳ منفرد ریمکس ورژنز تیار کرنے کے لیے اوپر دیے گئے بٹن پر کلک کریں۔</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: پرامپٹ آپٹیمائزر و نیگیٹو ٹیگز */}
          {activeTab === 'prompt_optimizer' && (
            <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/80">
                    آسان پرامپٹ خیال (Basic Music Idea)
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTargetEngine('suno')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        targetEngine === 'suno'
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/5 text-white/50'
                      }`}
                    >
                      Suno v4
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetEngine('udio')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        targetEngine === 'udio'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-white/50'
                      }`}
                    >
                      Udio v1.5
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rawPromptInput}
                    onChange={(e) => setRawPromptInput(e.target.value)}
                    placeholder="e.g. Urdu soulful acoustic guitar rain song with gentle tabla"
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleOptimizePrompt}
                    disabled={isOptimizing || !rawPromptInput.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-900/30"
                  >
                    {isOptimizing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>آپٹیمائز ہو رہا ہے...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>بہترین بنائیں</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {optimizedResult && (
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-fadeIn">
                  {/* Enhanced prompt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 font-mono">
                        PRO METADATA PROMPT ({targetEngine.toUpperCase()}):
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(optimizedResult.enhancedPrompt, 'opt_prompt')
                        }
                        className="text-xs text-white/70 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copyStatus === 'opt_prompt' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>کاپی</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-indigo-500/20 text-xs text-white font-mono leading-relaxed">
                      {optimizedResult.enhancedPrompt}
                    </div>
                  </div>

                  {/* Negative tags */}
                  {optimizedResult.negativeTags && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-rose-300 font-mono">
                        NEGATIVE AVOIDANCE TAGS (خراب آواز سے بچاؤ):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {optimizedResult.negativeTags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-rose-950/50 border border-rose-500/30 text-rose-200 font-mono"
                          >
                            -{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Production tip */}
                  {optimizedResult.productionTip && (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70">
                      <span className="text-amber-300 font-semibold">اسٹوڈیو ٹپ: </span>
                      {optimizedResult.productionTip}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onApplyEnhancedPrompt(
                          optimizedResult.enhancedPrompt,
                          optimizedResult.negativeTags?.join(', ')
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>اسٹوڈیو پرامپٹ میں لاگو کریں</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
