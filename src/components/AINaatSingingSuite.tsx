import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Music,
  Mic,
  Volume2,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Compass,
  Radio,
} from 'lucide-react';
import { NaatGenerationResult, VocalPerformanceGuideResult } from '../types';

interface AINaatSingingSuiteProps {
  currentLyrics: string;
  selectedGenre: string;
  onApplyLyrics: (newLyrics: string, mode: 'replace' | 'append') => void;
}

const DEVOTIONAL_TOPIC_CHIPS = [
  'دربارِ رسالت ﷺ میں حاضری اور درود و سلام',
  'سفرِ مدینہ، روضۂ اقدس اور اشکِ ندامت',
  'رحمتِ دوعالم ﷺ اور شفاعت کی امید',
  'مناجات، استغفار اور توحیدِ باری تعالیٰ',
  'صوفیانہ عشقِ حقیقی اور خود سپردگی',
  'سرکارِ غوثِ اعظم اور اولیاء کا فیضان',
];

export const AINaatSingingSuite: React.FC<AINaatSingingSuiteProps> = ({
  currentLyrics,
  selectedGenre,
  onApplyLyrics,
}) => {
  const [activeTab, setActiveTab] = useState<'lyricist' | 'performance' | 'tajweed'>('lyricist');
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // 1. Lyricist States
  const [genreType, setGenreType] = useState<'naat' | 'hamd' | 'sufi' | 'ghazal'>('naat');
  const [topic, setTopic] = useState<string>('دربارِ رسالت ﷺ میں حاضری اور درود و سلام');
  const [mood, setMood] = useState<string>('عقیدت و رقت آمیز');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<NaatGenerationResult | null>(null);

  // 2. Performance Guide States
  const [isGuiding, setIsGuiding] = useState<boolean>(false);
  const [performanceGuide, setPerformanceGuide] = useState<VocalPerformanceGuideResult | null>(null);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  // Generate Naat/Kalaam
  const handleGenerateKalaam = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/generate-naat-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: genreType,
          topic: topic.trim(),
          mood,
          targetLanguage: 'urdu',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'کلام تخلیق کرنے میں ناکامی ہوئی۔');
      }
      setGeneratedResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating devotional lyrics.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Performance Guide
  const handleFetchPerformanceGuide = async () => {
    if (!currentLyrics.trim()) {
      setErrorMsg('پرفارمنس گائیڈ کے لیے ایڈیٹر میں کلام موجود ہونا چاہیے۔');
      return;
    }
    setIsGuiding(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/vocal-performance-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: currentLyrics.trim(),
          genre: selectedGenre || genreType,
          maqam: 'hijaz',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'پرفارمنس گائیڈ حاصل کرنے میں دشواری ہوئی۔');
      }
      setPerformanceGuide(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating vocal performance guide.');
    } finally {
      setIsGuiding(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-emerald-950/20 to-black/60 p-4 backdrop-blur-md transition-all shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>AI روحانی و صوتی ڈائریکٹر (AI Devotional Suite)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-xs text-amber-200/70">
              نعت و کلام نگار، آلاپ و سرگم ڈائریکٹر اور تجوید و مخارج آڈٹ
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
              onClick={() => setActiveTab('lyricist')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'lyricist'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>AI کلام و نعت نگار (Kalaam Creator)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('performance');
                if (!performanceGuide && currentLyrics.trim()) {
                  handleFetchPerformanceGuide();
                }
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'performance'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>AI آلاپ و پرفارمنس گائیڈ (Alaap & Cues)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('tajweed');
                if (!performanceGuide && currentLyrics.trim()) {
                  handleFetchPerformanceGuide();
                }
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tajweed'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>تجوید و تلفظ آڈٹ (Tajweed Pointers)</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: AI کلام و نعت نگار */}
          {activeTab === 'lyricist' && (
            <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-white/5">
              {/* Sacred Genre Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">
                  مقدس صنف (Sacred Devotional Genre)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'naat', label: 'نعتِ رسول ﷺ', desc: 'مدحِ خیر الانام' },
                    { id: 'hamd', label: 'حمدِ باری تعالیٰ', desc: 'ذکر و ثنائے الٰہی' },
                    { id: 'sufi', label: 'صوفیانہ کلام', desc: 'منقبت و وجد' },
                    { id: 'ghazal', label: 'کلاسیکل نغمہ', desc: 'سوز و راگ' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGenreType(g.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        genreType === g.id
                          ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold font-serif">{g.label}</div>
                      <div className="text-[10px] text-white/40">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">
                  کلام کا مرکزی موضوع یا خیال (Sacred Theme / Supplication)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثال: روضۂ رسول ﷺ کی حاضری اور درود و سلام..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-amber-500"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateKalaam}
                    disabled={isGenerating || !topic.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-900/30"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>تخلیق جاری ہے...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>کلام لکھیں</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Topic Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DEVOTIONAL_TOPIC_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTopic(chip)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        topic === chip
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated Result */}
              {generatedResult && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-amber-400" />
                        <span>{generatedResult.title}</span>
                      </h4>
                      <div className="text-[11px] text-amber-300/80 mt-0.5">
                        <span className="font-semibold">صنف:</span> {generatedResult.genre} |{' '}
                        <span className="font-semibold">تجویز کردہ مقام:</span>{' '}
                        {generatedResult.maqamSuggested}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(generatedResult.verses, 'dev_verses')}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs flex items-center gap-1 cursor-pointer"
                        title="کاپی کریں"
                      >
                        {copyStatus === 'dev_verses' ? (
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>کاپی</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onApplyLyrics(generatedResult.verses, 'replace')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>اسٹوڈیو میں لوڈ کریں</span>
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-lg bg-black/40 text-amber-100 font-serif text-sm leading-loose text-center whitespace-pre-line border border-amber-500/20"
                    dir="rtl"
                  >
                    {generatedResult.verses}
                  </div>

                  <div className="text-xs text-white/70 bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-amber-300 font-semibold">روحانی خلاصہ: </span>
                    {generatedResult.spiritualSummary}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI آلاپ و پرفارمنس گائیڈ */}
          {activeTab === 'performance' && (
            <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    آلاپ، سروں کے اتار چڑھاؤ اور سانس کی ہدایات (Performance Directives)
                  </h4>
                  <p className="text-[11px] text-white/60">
                    نعت خوانی یا نغمہ سرائی کے دوران صوتی تاثیر اور سامعین کے ربط کی ہدایات
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFetchPerformanceGuide}
                  disabled={isGuiding || !currentLyrics.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isGuiding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ہدایات تیار ہو رہی ہیں...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>پرفارمنس گائیڈ اپ ڈیٹ کریں</span>
                    </>
                  )}
                </button>
              </div>

              {performanceGuide ? (
                <div className="space-y-3 animate-fadeIn">
                  {/* Alaap Opening */}
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5" />
                      <span>آلاپ اور افتتاحی سر (Alaap Opening Entrance)</span>
                    </span>
                    <p className="text-xs text-amber-100/90 leading-relaxed" dir="rtl">
                      {performanceGuide.alaapOpening}
                    </p>
                  </div>

                  {/* Pitch Transitions & Breath Markers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-xs font-bold text-emerald-300">
                        سروں کا اتار چڑھاؤ (Octave Pitch Flow)
                      </span>
                      <p className="text-xs text-white/80 leading-relaxed" dir="rtl">
                        {performanceGuide.pitchTransitions}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-xs font-bold text-cyan-300">
                        سانس کا ٹھہراؤ و حبسِ دم (Breath Points)
                      </span>
                      <p className="text-xs text-white/80 leading-relaxed" dir="rtl">
                        {performanceGuide.breathMarkers}
                      </p>
                    </div>
                  </div>

                  {/* High Pitch Highlights */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-xs font-bold text-amber-300">
                      تار سپتک اور تان کے کلمات (Crescendo & Stretch Words):
                    </span>
                    <p className="text-xs text-white/80" dir="rtl">
                      {performanceGuide.highPitchNotes}
                    </p>
                  </div>

                  {/* Audience Engagement */}
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                    <span className="text-xs font-bold text-emerald-300">
                      سامعین پر قلبی اثر اور خشوع کی نصیحت:
                    </span>
                    <p className="text-xs text-emerald-200/80 leading-relaxed" dir="rtl">
                      {performanceGuide.audienceEngagementTip}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-white/50 bg-white/5 rounded-xl border border-dashed border-white/10">
                  {isGuiding ? (
                    <div className="flex items-center justify-center gap-2 text-amber-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>صوتی گائیڈ تیار ہو رہی ہے...</span>
                    </div>
                  ) : (
                    <span>
                      کلام کے مطابق آلاپ اور سروں کی ہدایات حاصل کرنے کے لیے اوپر دیے گئے بٹن پر کلک کریں۔
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: تجوید و تلفظ آڈٹ */}
          {activeTab === 'tajweed' && (
            <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    حروفِ مقدّسہ اور تجوید کے نازک مخارج (Sacred Tajweed & Phonetics)
                  </h4>
                  <p className="text-[11px] text-white/60">
                    عربی و اردو کلماتِ نعت کی صحیح ادائیگی تاکہ معنوی لغزش نہ آئے
                  </p>
                </div>
              </div>

              {performanceGuide?.tajweedChecklist && performanceGuide.tajweedChecklist.length > 0 ? (
                <div className="space-y-2">
                  {performanceGuide.tajweedChecklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5"
                    >
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-white/90 leading-relaxed" dir="rtl">
                        {item}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    'حرف "ح" کو وسطِ حلق سے نرمی کے ساتھ ادا کریں، "ھ" کے ساتھ خلط ملط نہ کریں۔',
                    'لفظ "صلّی اللہ" میں لام کو پُر اور جلال کے ساتھ ادا کریں۔',
                    'اسمِ گرامی "محمد ﷺ" میں میم کی تشدید پر غنہ کا پورا وقت دیں۔',
                    'حرف "ض" کو زبان کی کروٹ سے داڑھوں کی جڑ میں دبا کر وقار کے ساتھ ادا کریں۔',
                  ].map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5"
                    >
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-white/90 leading-relaxed" dir="rtl">
                        {tip}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
