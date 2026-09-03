import React, { useState } from 'react';
import { SupportedLanguage, AITransformOp } from '../types';
import { SAMPLE_TEXTS } from '../data/sampleTexts';
import {
  Sparkles,
  RotateCcw,
  Wand2,
  Volume2,
  FileText,
  Check,
  ChevronDown,
  Loader2,
  Mic,
  ArrowRightLeft,
  Sliders,
} from 'lucide-react';

interface TextInputAreaProps {
  text: string;
  onChangeText: (val: string) => void;
  detectedLang: SupportedLanguage;
  selectedLang: SupportedLanguage;
  onGenerate: () => void;
  isLoading: boolean;
  onApplySample: (sampleId: string) => void;
  onEnhanceText: () => void;
  isEnhancing: boolean;
  onQuickTransform?: (op: AITransformOp) => void;
  isTransforming?: boolean;
  onOpenScriptStudio?: () => void;
  onToggleTranscriber?: () => void;
  isTranscriberOpen?: boolean;
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  onChangeText,
  detectedLang,
  selectedLang,
  onGenerate,
  isLoading,
  onApplySample,
  onEnhanceText,
  isEnhancing,
  onQuickTransform,
  isTransforming = false,
  onOpenScriptStudio,
  onToggleTranscriber,
  isTranscriberOpen = false,
}) => {
  const [showSamplesDropdown, setShowSamplesDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectiveLang = selectedLang !== 'auto' ? selectedLang : detectedLang;
  const isRTL = effectiveLang === 'urdu';
  const fontClass =
    effectiveLang === 'urdu'
      ? 'font-urdu text-lg'
      : effectiveLang === 'hindi'
      ? 'font-hindi text-base'
      : 'font-sans text-base';

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const relevantSamples = SAMPLE_TEXTS.filter((s) => {
    if (selectedLang === 'auto') return true;
    return s.language === selectedLang;
  });

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-bold flex items-center gap-1.5">
            <span>5. Neural Script Input (متن درج کریں)</span>
          </h2>

          {/* Detected Language Badge */}
          {detectedLang !== 'auto' && (
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/5 text-indigo-300 border border-white/10 flex items-center gap-1">
              <span className="text-white/40">Detected:</span>
              <strong className="capitalize text-indigo-200">
                {detectedLang === 'urdu'
                  ? 'اردو Urdu'
                  : detectedLang === 'hindi'
                  ? 'हिन्दी Hindi'
                  : 'English'}
              </strong>
            </span>
          )}
        </div>

        {/* Quick Sample Presets & AI Launchers */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenScriptStudio && (
            <button
              type="button"
              id="quick-ai-studio-btn"
              onClick={onOpenScriptStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:brightness-110 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Script Studio</span>
            </button>
          )}

          {onToggleTranscriber && (
            <button
              type="button"
              id="quick-mic-transcribe-btn"
              onClick={onToggleTranscriber}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                isTranscriberOpen
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-indigo-300'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span>{isTranscriberOpen ? 'Close Voice Transcriber' : 'Voice-to-Script'}</span>
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              id="open-samples-menu"
              onClick={() => setShowSamplesDropdown(!showSamplesDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Samples (نمونہ جات)</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
            </button>

            {showSamplesDropdown && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#0c0c14] border border-white/15 rounded-2xl shadow-2xl z-30 p-2 space-y-1 backdrop-blur-xl">
                <p className="text-[10px] font-bold text-white/40 px-2 py-1 uppercase tracking-widest">
                  Select a script sample:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {relevantSamples.map((sample) => (
                    <button
                      key={sample.id}
                      id={`sample-item-${sample.id}`}
                      type="button"
                      onClick={() => {
                        onApplySample(sample.id);
                        setShowSamplesDropdown(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-start justify-between gap-2 text-xs cursor-pointer group"
                    >
                      <div>
                        <div className="font-semibold text-white group-hover:text-indigo-200">
                          {sample.title}
                        </div>
                        <div className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                          {sample.text}
                        </div>
                      </div>
                      <span className="shrink-0 uppercase text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-300 border border-white/10">
                        {sample.language}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Textarea Container */}
      <div className="relative rounded-3xl border border-white/10 bg-white/5 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 backdrop-blur-xl transition-all overflow-hidden">
        <textarea
          id="tts-text-input"
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          dir={isRTL ? 'rtl' : 'ltr'}
          rows={5}
          placeholder={
            isRTL
              ? 'یہاں اردو میں کچھ بھی لکھیں یا پیسٹ کریں (مثلاً: شاعری، کہانی، خبریں، یا گفتگو)...'
              : effectiveLang === 'hindi'
              ? 'यहाँ हिंदी में लिखें या पेस्ट करें (उदा: कहानी, कविता, समाचार, या दैनिक बातचीत)...'
              : 'Type or paste Urdu, English, or Hindi script here to generate ultra-realistic human voice speech...'
          }
          className={`w-full bg-transparent p-5 text-white placeholder:text-white/20 focus:outline-none resize-y min-h-[150px] max-h-[420px] ${fontClass}`}
        />

        {/* Textarea Bottom Toolbar with AI Assist buttons */}
        <div className="bg-black/40 border-t border-white/5 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-white/40">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {charCount}/3000 chars
            </span>
            <span className="hidden sm:inline-block text-white/20">•</span>
            <span className="hidden sm:inline-block font-mono text-[11px]">
              {wordCount} words
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Quick Roman-to-Urdu */}
            {onQuickTransform && text.trim() && (
              <button
                type="button"
                id="quick-roman-urdu-btn"
                onClick={() => onQuickTransform('roman_to_urdu')}
                disabled={isTransforming}
                title="Convert Roman Urdu typing to standard Urdu script"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-indigo-300 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-all border border-white/10 cursor-pointer"
              >
                {isTransforming ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>🔤</span>}
                <span>Roman ➔ Urdu</span>
              </button>
            )}

            {/* Quick Add Aerab */}
            {onQuickTransform && text.trim() && (
              <button
                type="button"
                id="quick-add-aerab-btn"
                onClick={() => onQuickTransform('add_aerab')}
                disabled={isTransforming}
                title="Add Zer, Zabar, Pesh (اعراب) for 100% accurate Urdu pronunciation"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 transition-all border border-emerald-500/30 cursor-pointer"
              >
                <span>✨</span>
                <span>Add Aerab (اعراب)</span>
              </button>
            )}

            {/* Enhance Button */}
            <button
              type="button"
              id="enhance-text-btn"
              onClick={onEnhanceText}
              disabled={isEnhancing || !text.trim()}
              title="Add natural pauses and punctuation for realistic cadence"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-indigo-500/30 cursor-pointer"
            >
              {isEnhancing ? (
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              ) : (
                <Wand2 className="w-3 h-3 text-indigo-400" />
              )}
              <span>{isEnhancing ? 'Refining Cadence...' : 'Natural Cadence'}</span>
            </button>

            {/* Clear Button */}
            {text && (
              <button
                type="button"
                id="clear-text-btn"
                onClick={() => onChangeText('')}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Clear text"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Copy Button */}
            {text && (
              <button
                type="button"
                id="copy-text-btn"
                onClick={handleCopy}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Big Action CTA */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        <button
          type="button"
          id="generate-voice-btn"
          onClick={onGenerate}
          disabled={isLoading || !text.trim()}
          className="w-full py-4 px-8 rounded-full font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5 text-base cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Synthesizing Voiceover... (آواز بن رہی ہے)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 stroke-[2.5]" />
              <span>Generate Natural Human Audio (آواز تیار کریں)</span>
              <Sparkles className="w-4 h-4 ml-1 text-indigo-200" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

