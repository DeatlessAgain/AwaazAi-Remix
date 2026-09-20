import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Feather,
  Wand2,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Volume2,
  ChevronDown,
  ChevronUp,
  Languages,
} from 'lucide-react';
import {
  PoeticGenerationResult,
  PoeticIslaahResult,
  PoeticTashreehResult,
} from '../types';

interface AIPoetrySuiteProps {
  currentText: string;
  onApplyPoetryText: (newText: string, mode: 'replace' | 'append') => void;
}

const POET_STYLES = [
  { id: 'علامہ اقبال', name: 'علامہ اقبال (Allama Iqbal)', desc: 'فکری، انقلابی، خودی اور بلند ہمتی' },
  { id: 'مرزا غالب', name: 'مرزا اسد اللہ خاں غالب', desc: 'نازک خیالی، شوخیِ تحریر، فلسفیانہ رنگ' },
  { id: 'فیض احمد فیض', name: 'فیض احمد فیض (Faiz)', desc: 'رومان و انقلاب، رچاؤ، گدازدار نغمگی' },
  { id: 'جون ایلیا', name: 'جون ایلیا (Jaun Elia)', desc: 'یاسیت، بے ساختہ خود کلامی، درد و سوز' },
  { id: 'میر تقی میر', name: 'میر تقی میر (خدائے سخن)', desc: 'سوز و گداز، دل کا نوحہ، سہلِ ممتنع' },
  { id: 'پروین شاکر', name: 'پروین شاکر (Parveen Shakir)', desc: 'نازک احساسات، بارش، خوشبو، دھیما درد' },
  { id: 'جدید رومانوی', name: 'جدید نغماتی و رومانوی', desc: 'آسان فہم، جدید ترنم، پرکشش مصرعے' },
];

const THEME_CHIPS = [
  'بارش اور بچھڑے ہوئے لمحے',
  'خودی، عزم اور بلند پروازی',
  'خاموش رات اور چراغِ تمنا',
  'عشقِ حقیقی اور روحانی سکون',
  'امید کا نیا اجالا',
  'وطن کی مٹی اور محبت',
];

export const AIPoetrySuite: React.FC<AIPoetrySuiteProps> = ({
  currentText,
  onApplyPoetryText,
}) => {
  const [activeTab, setActiveTab] = useState<'creator' | 'islaah' | 'tashreeh'>('creator');
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // 1. Creator States
  const [theme, setTheme] = useState<string>('بارش اور بچھڑے ہوئے لمحے');
  const [poetStyle, setPoetStyle] = useState<string>('علامہ اقبال');
  const [form, setForm] = useState<'ghazal' | 'nazm' | 'rubai'>('ghazal');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<PoeticGenerationResult | null>(null);

  // 2. Islaah States
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [islaahResult, setIslaahResult] = useState<PoeticIslaahResult | null>(null);

  // 3. Tashreeh States
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [tashreehResult, setTashreehResult] = useState<PoeticTashreehResult | null>(null);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  // Generate Poetry Handler
  const handleGeneratePoetry = async () => {
    if (!theme.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/generate-poetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: theme.trim(),
          poetStyle,
          form,
          mood: 'deep',
          language: 'urdu',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'کلام تخلیق کرنے میں ناکامی ہوئی۔');
      }
      setGeneratedResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating poetry.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Islaah Handler
  const handlePerformIslaah = async () => {
    if (!currentText.trim()) {
      setErrorMsg('اصلاح کے لیے ایڈیٹر میں کلام موجود ہونا ضروری ہے۔');
      return;
    }
    setIsAuditing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/poetic-islaah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verses: currentText.trim(),
          poetContext: poetStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'اصلاح حاصل کرنے میں دشواری ہوئی۔');
      }
      setIslaahResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error during poetic islaah.');
    } finally {
      setIsAuditing(false);
    }
  };

  // Tashreeh Handler
  const handleGetTashreeh = async () => {
    if (!currentText.trim()) {
      setErrorMsg('تشریح کے لیے ایڈیٹر میں اشعار موجود ہونا ضروری ہے۔');
      return;
    }
    setIsTranslating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/poetry-tashreeh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verses: currentText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'تشریح تیار کرنے میں دشواری ہوئی۔');
      }
      setTashreehResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating poetic tashreeh.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Replace single line from critique
  const handleApplyAlternative = (originalLine: string, alternative: string) => {
    if (!currentText.includes(originalLine)) return;
    const updated = currentText.replace(originalLine, alternative);
    onApplyPoetryText(updated, 'replace');
  };

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-black/60 p-4 backdrop-blur-md transition-all shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>AI شعری و ادبی اسٹوڈیو (AI Poetic Suite)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-xs text-emerald-200/70">
              اصلاحِ سخن، عروض اسکینر، کلام ساز اور ادبی تشریح و منظوم انگریزی ترجمہ
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
              onClick={() => setActiveTab('creator')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'creator'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Feather className="w-3.5 h-3.5" />
              <span>AI کلام ساز (Verse Generator)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('islaah');
                if (!islaahResult && currentText.trim()) {
                  handlePerformIslaah();
                }
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'islaah'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>استادِ سخن: اصلاحِ عروض (Poetic Islaah)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('tashreeh');
                if (!tashreehResult && currentText.trim()) {
                  handleGetTashreeh();
                }
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tashreeh'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>تشریح و منظوم ترجمہ (Tashreeh & Lexicon)</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: AI کلام ساز (CREATOR) */}
          {activeTab === 'creator' && (
            <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-white/5">
              {/* Theme Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">
                  شاعری کا موضوع یا خیال (Poetry Theme / Emotion)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="مثال: بارش کی بوندیں اور یادوں کا سفر..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePoetry}
                    disabled={isGenerating || !theme.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>تخلیق ہو رہا ہے...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>کلام تخلیق کریں</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Theme Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {THEME_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTheme(chip)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        theme === chip
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Poet Style & Poetic Form Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Poet Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80">
                    شاعر کا اسلوب و لہجہ (Master Poet Style)
                  </label>
                  <select
                    value={poetStyle}
                    onChange={(e) => setPoetStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {POET_STYLES.map((p) => (
                      <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                        {p.name} — {p.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Poetic Form */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80">
                    صنفِ سخن (Poetic Form)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'ghazal', label: 'غزل (Ghazal)' },
                      { id: 'nazm', label: 'نظم (Nazm)' },
                      { id: 'rubai', label: 'رباعی (Rubai)' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setForm(f.id as any)}
                        className={`py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                          form === f.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generated Result Display */}
              {generatedResult && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Feather className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{generatedResult.title}</span>
                      </h4>
                      <div className="text-[11px] text-emerald-300/80 mt-0.5">
                        <span className="font-semibold">بحر:</span> {generatedResult.bahr} |{' '}
                        <span className="font-semibold">ردیف:</span> {generatedResult.radif || '—'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(generatedResult.verses, 'gen_verses')}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs flex items-center gap-1 cursor-pointer"
                        title="کاپی کریں"
                      >
                        {copyStatus === 'gen_verses' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>کاپی</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onApplyPoetryText(generatedResult.verses, 'replace')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ایڈیٹر میں لوڈ کریں</span>
                      </button>
                    </div>
                  </div>

                  {/* Verses */}
                  <div
                    className="p-3 rounded-lg bg-black/40 text-emerald-100 font-serif text-sm leading-relaxed text-center whitespace-pre-line border border-emerald-500/20"
                    dir="rtl"
                  >
                    {generatedResult.verses}
                  </div>

                  {/* Meaning summary */}
                  <div className="text-xs text-white/70 bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-emerald-300 font-semibold">خلاصۂ فکر: </span>
                    {generatedResult.meaningSummary}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: استادِ سخن (ISLAAH & METER AUDIT) */}
          {activeTab === 'islaah' && (
            <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    علمِ عروض اور اوزان کی چھان بین (Metrical Scansion & Islaah)
                  </h4>
                  <p className="text-[11px] text-white/60">
                    موجودہ کلام کے ہر مصرعے کی بحر، افاعیل اور سکتہ کی تفصیلی جانچ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePerformIslaah}
                  disabled={isAuditing || !currentText.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>اصلاح جاری ہے...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>دوبارہ اصلاح لیں</span>
                    </>
                  )}
                </button>
              </div>

              {islaahResult ? (
                <div className="space-y-3 animate-fadeIn">
                  {/* Overall Feedback Banner */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          بحر: {islaahResult.bahrName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            islaahResult.meterStatus === 'perfect'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {islaahResult.meterStatus === 'perfect'
                            ? 'موزوں و کامل'
                            : 'قابلِ اصلاح نشست'}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/80 leading-relaxed">
                        {islaahResult.overallFeedback}
                      </p>
                    </div>
                  </div>

                  {/* Line by line critiques */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/80">
                      مصرعہ وار اصلاح اور متبادل تجاویز (Line-by-Line Refinement):
                    </label>
                    <div className="space-y-2">
                      {islaahResult.coupletCritiques.map((critique, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:border-emerald-500/30 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs text-white/90 font-serif leading-relaxed" dir="rtl">
                              <span className="text-[10px] text-emerald-400 font-sans ml-2">
                                [مصرع {idx + 1}]
                              </span>
                              "{critique.original}"
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                                critique.issueType === 'flawless'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {critique.issueType === 'flawless' ? 'بہترین بحر' : 'اصلاح درکار'}
                            </span>
                          </div>

                          <div className="text-[11px] text-white/60 bg-black/30 p-2 rounded-lg">
                            <span className="text-amber-300 font-semibold">تشخیصِ استاد: </span>
                            {critique.diagnosis}
                          </div>

                          {critique.suggestedAlternative && critique.suggestedAlternative !== critique.original && (
                            <div className="flex items-center justify-between bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                              <div className="text-xs text-emerald-200 font-serif" dir="rtl">
                                <span className="text-[10px] text-emerald-400 font-sans ml-2 font-bold">
                                  تجویز کردہ مصرع:
                                </span>
                                "{critique.suggestedAlternative}"
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleApplyAlternative(
                                    critique.original,
                                    critique.suggestedAlternative
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shadow"
                              >
                                <Check className="w-3 h-3" />
                                <span>اصلاح لاگو کریں</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General Tips */}
                  {islaahResult.generalTips && islaahResult.generalTips.length > 0 && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                      <span className="text-xs font-bold text-emerald-300">
                        استاد کی عمومی ہدایات برائے ریاض و ترنم:
                      </span>
                      <ul className="text-xs text-white/70 space-y-1 list-disc list-inside">
                        {islaahResult.generalTips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-white/50 bg-white/5 rounded-xl border border-dashed border-white/10">
                  {isAuditing ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>کلام کا عروضی تجزیہ تیار ہو رہا ہے...</span>
                    </div>
                  ) : (
                    <span>
                      کلام کی تقطیع اور عروضی سقم دور کرنے کے لیے اوپر دیے گئے بٹن پر کلک کریں۔
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: تشریح و منظوم ترجمہ (TASHREEH & TRANSLATION) */}
          {activeTab === 'tashreeh' && (
            <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    ادبی تشریح، انگریزی منظوم ترجمہ و فرہنگ (Tashreeh & Lexicon)
                  </h4>
                  <p className="text-[11px] text-white/60">
                    کلام کے فلسفیانہ مفاہیم اور مشکل الفاظ کے معانی کی تفصیل
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGetTashreeh}
                  disabled={isTranslating || !currentText.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>تشریح تیار ہو رہی ہے...</span>
                    </>
                  ) : (
                    <>
                      <Languages className="w-3.5 h-3.5" />
                      <span>تشریح و ترجمہ حاصل کریں</span>
                    </>
                  )}
                </button>
              </div>

              {tashreehResult ? (
                <div className="space-y-3 animate-fadeIn">
                  {/* Urdu Tashreeh */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>ادبی مفہوم و تشریح (Urdu Tashreeh)</span>
                      </span>
                      <span className="text-[11px] text-white/50">
                        مرکزی احساس: {tashreehResult.emotionalCore}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/90 leading-relaxed" dir="rtl">
                      {tashreehResult.urduTashreeh}
                    </p>
                  </div>

                  {/* English Poetic Translation */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-amber-400" />
                        <span>Rhyming English Poetic Translation</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(tashreehResult.englishPoeticTranslation, 'eng_trans')
                        }
                        className="text-xs text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copyStatus === 'eng_trans' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>کاپی</span>
                      </button>
                    </div>
                    <div className="text-xs text-white/90 font-serif italic whitespace-pre-line leading-relaxed">
                      {tashreehResult.englishPoeticTranslation}
                    </div>
                  </div>

                  {/* Difficult Words / Farhang */}
                  {tashreehResult.difficultWords && tashreehResult.difficultWords.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80">
                        فرہنگ و تلفظ (Vocabulary & Pronunciation Guide):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tashreehResult.difficultWords.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-300 font-serif" dir="rtl">
                                {item.word}
                              </span>
                              <span className="text-[10px] text-white/50 font-mono">
                                [{item.pronunciation}]
                              </span>
                            </div>
                            <div className="text-[11px] text-white/70">{item.meaning}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-white/50 bg-white/5 rounded-xl border border-dashed border-white/10">
                  {isTranslating ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>تشریح اور منظوم انگریزی ترجمہ تیار ہو رہا ہے...</span>
                    </div>
                  ) : (
                    <span>
                      کلام کا مفہوم، انگریزی ترجمہ اور مشکل الفاظ کی فرہنگ حاصل کرنے کے لیے اوپر دیے گئے بٹن پر کلک کریں۔
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
