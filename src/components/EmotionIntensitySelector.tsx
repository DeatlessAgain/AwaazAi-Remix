import React from 'react';
import { EMOTIONS, INTENSITY_PRESETS } from '../data/emotions';
import { VoiceEmotion, SupportedLanguage } from '../types';
import {
  Sparkles,
  Smile,
  HeartCrack,
  Shield,
  Flame,
  Zap,
  VolumeX,
  AlertTriangle,
  Sliders,
  Activity,
  Volume2,
  RotateCcw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface EmotionIntensitySelectorProps {
  selectedEmotion: VoiceEmotion;
  onSelectEmotion: (emotion: VoiceEmotion) => void;
  intensity: number; // 0 to 100
  onChangeIntensity: (intensity: number) => void;
  pitch?: number; // -50 to +50 (default 0: natural baseline)
  onChangePitch?: (pitch: number) => void;
  language?: SupportedLanguage;
}

const emotionIconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  Smile: <Smile className="w-4 h-4" />,
  HeartCrack: <HeartCrack className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  VolumeX: <VolumeX className="w-4 h-4" />,
  AlertTriangle: <AlertTriangle className="w-4 h-4" />,
};

const emotionColorStyles: Record<
  string,
  {
    activeBorder: string;
    activeBg: string;
    activeRing: string;
    activeText: string;
    iconBg: string;
    badgeBg: string;
    badgeText: string;
    glowColor: string;
  }
> = {
  indigo: {
    activeBorder: 'border-indigo-500/60',
    activeBg: 'bg-indigo-950/30',
    activeRing: 'ring-indigo-500/40',
    activeText: 'text-indigo-200',
    iconBg: 'bg-indigo-600 text-white',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    glowColor: '#6366f1',
  },
  emerald: {
    activeBorder: 'border-emerald-500/60',
    activeBg: 'bg-emerald-950/30',
    activeRing: 'ring-emerald-500/40',
    activeText: 'text-emerald-200',
    iconBg: 'bg-emerald-600 text-white',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    glowColor: '#10b981',
  },
  blue: {
    activeBorder: 'border-sky-500/60',
    activeBg: 'bg-sky-950/30',
    activeRing: 'ring-sky-500/40',
    activeText: 'text-sky-200',
    iconBg: 'bg-sky-600 text-white',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    glowColor: '#0ea5e9',
  },
  amber: {
    activeBorder: 'border-amber-500/60',
    activeBg: 'bg-amber-950/30',
    activeRing: 'ring-amber-500/40',
    activeText: 'text-amber-200',
    iconBg: 'bg-amber-600 text-white',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    glowColor: '#f59e0b',
  },
  orange: {
    activeBorder: 'border-orange-500/60',
    activeBg: 'bg-orange-950/30',
    activeRing: 'ring-orange-500/40',
    activeText: 'text-orange-200',
    iconBg: 'bg-orange-600 text-white',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    glowColor: '#f97316',
  },
  purple: {
    activeBorder: 'border-purple-500/60',
    activeBg: 'bg-purple-950/30',
    activeRing: 'ring-purple-500/40',
    activeText: 'text-purple-200',
    iconBg: 'bg-purple-600 text-white',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    glowColor: '#a855f7',
  },
  teal: {
    activeBorder: 'border-teal-500/60',
    activeBg: 'bg-teal-950/30',
    activeRing: 'ring-teal-500/40',
    activeText: 'text-teal-200',
    iconBg: 'bg-teal-600 text-white',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    glowColor: '#14b8a6',
  },
  rose: {
    activeBorder: 'border-rose-500/60',
    activeBg: 'bg-rose-950/30',
    activeRing: 'ring-rose-500/40',
    activeText: 'text-rose-200',
    iconBg: 'bg-rose-600 text-white',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    glowColor: '#f43f5e',
  },
};

const PITCH_PRESETS: { value: number; label: string; urduLabel: string; hindiLabel: string }[] = [
  { value: -35, label: 'Deep Bass', urduLabel: 'بہت بھاری آواز', hindiLabel: 'गहरा बेस' },
  { value: -15, label: 'Warm Low', urduLabel: 'دھیمی گہری', hindiLabel: 'धीमा स्वर' },
  { value: 0, label: 'Natural Pitch', urduLabel: 'قدرتی پچ', hindiLabel: 'प्राकृतिक पिच' },
  { value: 20, label: 'Bright High', urduLabel: 'روشن و تیز', hindiLabel: 'उज्ज्वल उच्च' },
  { value: 40, label: 'High Child', urduLabel: 'بلند باریک آواز', hindiLabel: 'उच्च बाल स्वर' },
];

export const EmotionIntensitySelector: React.FC<EmotionIntensitySelectorProps> = ({
  selectedEmotion,
  onSelectEmotion,
  intensity,
  onChangeIntensity,
  pitch = 0,
  onChangePitch,
  language = 'urdu',
}) => {
  const currentEmotion = EMOTIONS.find((e) => e.id === selectedEmotion) || EMOTIONS[0];
  const colorTheme = emotionColorStyles[currentEmotion.color] || emotionColorStyles.indigo;

  // Determine intensity verbal descriptor
  const getIntensityDescriptor = (val: number) => {
    if (val <= 30) return { title: 'Subtle & Nuanced (ہلکا احساس)', desc: 'Soft and natural undercurrent' };
    if (val <= 65) return { title: 'Balanced & Expressive (درمیانہ و واضح)', desc: 'Organic, clear emotional delivery' };
    if (val <= 85) return { title: 'Strong & Evocative (گہرا و پرتاثیر)', desc: 'Pronounced feeling with vocal weight' };
    return { title: 'Peak Theatrical Intensity (شدید و اثر انگیز)', desc: 'Maximum dramatic emotional expression' };
  };

  // Determine pitch verbal descriptor
  const getPitchDescriptor = (val: number) => {
    if (val <= -30) {
      return {
        title: 'Deep Baritone / Bass (انتہائی گہری و بھاری آواز)',
        desc: 'Deep, heavy resonance for authoritative, dramatic, or mature characters',
        color: '#3b82f6',
      };
    }
    if (val < 0) {
      return {
        title: 'Warm Low-Frequency (دھیمی اور باوقار پچ)',
        desc: 'Slightly deeper, warm low-end timbre with richer chest tone',
        color: '#6366f1',
      };
    }
    if (val === 0) {
      return {
        title: 'Natural Baseline Pitch (طبیعی و قدرتی فریکوئنسی)',
        desc: 'Standard native vocal frequency calibrated for this persona',
        color: '#10b981',
      };
    }
    if (val <= 25) {
      return {
        title: 'Bright & Elevated (روشن اور صاف زیر و بم)',
        desc: 'Clean, slightly higher register with enhanced clarity and treble',
        color: '#ec4899',
      };
    }
    return {
      title: 'High-Pitch Child / Animated (بلند، باریک اور پرجوش)',
      desc: 'High-frequency tone ideal for children, lively animations, and energetic moods',
      color: '#f43f5e',
    };
  };

  const descriptor = getIntensityDescriptor(intensity);
  const pitchDescriptor = getPitchDescriptor(pitch);

  // Calculate percentage position for slider background (maps -50..+50 to 0%..100%)
  const pitchPercent = ((pitch + 50) / 100) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-bold flex items-center gap-1.5">
            <span>3. Emotional Mood, Intensity & Vocal Pitch (جذبات و پچ)</span>
          </h2>
          <span className="text-[10px] text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium">
            Dynamic Modulation & Pitch
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/40">Emotion:</span>
          <span className="font-semibold text-white flex items-center gap-1 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colorTheme.glowColor }}
            />
            {currentEmotion.label.split('&')[0].trim()} ({intensity}%)
          </span>
        </div>
      </div>

      {/* Emotion Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {EMOTIONS.map((emotion) => {
          const isSelected = selectedEmotion === emotion.id;
          const styles = emotionColorStyles[emotion.color] || emotionColorStyles.indigo;

          return (
            <button
              key={emotion.id}
              type="button"
              id={`emotion-btn-${emotion.id}`}
              onClick={() => onSelectEmotion(emotion.id)}
              className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                isSelected
                  ? `${styles.activeBg} ${styles.activeBorder} ring-1 ${styles.activeRing} shadow-lg shadow-black/40`
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span
                  className={`p-1.5 rounded-xl transition-all ${
                    isSelected ? styles.iconBg : 'bg-white/10 text-white/60 group-hover:text-white'
                  }`}
                >
                  {emotionIconMap[emotion.icon] || <Sparkles className="w-4 h-4" />}
                </span>

                {isSelected ? (
                  <span
                    className="w-2 h-2 rounded-full animate-pulse shadow-sm"
                    style={{ backgroundColor: styles.glowColor }}
                  />
                ) : (
                  <span className="text-[10px] text-white/30 font-mono">
                    {emotion.id}
                  </span>
                )}
              </div>

              <div>
                <h3
                  className={`text-xs font-bold transition-colors ${
                    isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'
                  }`}
                >
                  {emotion.label}
                </h3>
                <p className="text-[11px] font-medium text-indigo-300/80 mt-0.5" dir="rtl">
                  {language === 'hindi' ? emotion.hindiLabel : emotion.urduLabel}
                </p>
              </div>

              {/* Intensity visual bar under active card */}
              {isSelected && (
                <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${intensity}%`,
                      backgroundColor: styles.glowColor,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Controllers Container: 1) Emotion Intensity & 2) Vocal Pitch Frequency */}
      <div className="space-y-3.5">
        {/* 1. Intensity Controller Section */}
        <div className="p-4 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Emotion Intensity (جذبات کی شدت)
              </span>
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded-md border text-white shadow-sm"
                style={{
                  backgroundColor: `${colorTheme.glowColor}25`,
                  borderColor: `${colorTheme.glowColor}60`,
                }}
              >
                {intensity}%
              </span>
            </div>

            <div className="text-[11px] text-white/60">
              <span className="text-white font-medium">{descriptor.title}</span> — {descriptor.desc}
            </div>
          </div>

          {/* Range Slider for Intensity */}
          <div className="space-y-1.5 pt-1">
            <div className="relative flex items-center">
              <input
                type="range"
                id="emotion-intensity-slider"
                min={10}
                max={100}
                step={5}
                value={intensity}
                onChange={(e) => onChangeIntensity(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-indigo-500 focus:outline-none transition-all"
                style={{
                  background: `linear-gradient(to right, ${colorTheme.glowColor} 0%, ${colorTheme.glowColor} ${intensity}%, rgba(255,255,255,0.1) ${intensity}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {INTENSITY_PRESETS.map((preset) => {
                const isActive = Math.abs(intensity - preset.level) <= 5;
                return (
                  <button
                    key={preset.level}
                    type="button"
                    id={`intensity-preset-${preset.level}`}
                    onClick={() => onChangeIntensity(preset.level)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all text-xs font-medium cursor-pointer border ${
                      isActive
                        ? 'bg-white/15 border-white/30 text-white shadow-sm font-semibold'
                        : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{preset.label}</span>
                      <span className="text-[10px] opacity-60">({preset.level}%)</span>
                    </div>
                    <div className="text-[10px] text-indigo-300/80 mt-0.5" dir="rtl">
                      {preset.urduLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emotion Guidance Hint */}
          <div className="flex items-start gap-2 pt-1 text-[11px] text-white/50 leading-relaxed border-t border-white/5">
            <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white/80 font-medium">Live Emotion Effect: </span>
              {currentEmotion.description}{' '}
              <span className="text-indigo-300 font-medium" dir="rtl">
                {currentEmotion.urduDescription}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Vocal Pitch (Frequency) Controller Section */}
        {onChangePitch && (
          <div className="p-4 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-950/20 via-black/40 to-pink-950/20 backdrop-blur-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Vocal Pitch / Frequency (آواز کا زیر و بم / پچ)
                </span>
                <span
                  className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border text-white shadow-sm flex items-center gap-1"
                  style={{
                    backgroundColor: `${pitchDescriptor.color}25`,
                    borderColor: `${pitchDescriptor.color}60`,
                  }}
                >
                  {pitch > 0 ? `+${pitch}%` : `${pitch}%`}
                  {pitch === 0 && <span className="text-[10px] font-sans opacity-80">(Natural)</span>}
                </span>

                {pitch !== 0 && (
                  <button
                    type="button"
                    id="reset-pitch-btn"
                    onClick={() => onChangePitch(0)}
                    title="Reset pitch to natural default (0%)"
                    className="text-[11px] flex items-center gap-1 text-white/60 hover:text-white bg-white/5 hover:bg-white/15 px-2 py-0.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-white/70">
                <span className="font-semibold text-white" style={{ color: pitchDescriptor.color }}>
                  {pitchDescriptor.title}
                </span>
              </div>
            </div>

            {/* Vocal Pitch Range Slider */}
            <div className="space-y-2 pt-1">
              <div className="relative flex items-center">
                <input
                  type="range"
                  id="vocal-pitch-slider"
                  min={-50}
                  max={50}
                  step={5}
                  value={pitch}
                  onChange={(e) => onChangePitch(Number(e.target.value))}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-white/10 accent-sky-400 focus:outline-none transition-all"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #6366f1 35%, #10b981 50%, #ec4899 75%, #f43f5e 100%)`,
                  }}
                />
              </div>

              {/* Slider Scale Endpoints & Center Zero */}
              <div className="flex items-center justify-between text-[10px] font-medium text-white/40 px-0.5">
                <div className="flex items-center gap-1 text-blue-300/80">
                  <TrendingDown className="w-3 h-3 text-blue-400" />
                  <span>-50% Deeper (گہرا و بھاری)</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onChangePitch(0)}
                  className={`cursor-pointer px-1.5 py-0.5 rounded transition-all ${
                    pitch === 0
                      ? 'text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/30'
                      : 'hover:text-white'
                  }`}
                >
                  0% Natural Pitch
                </div>
                <div className="flex items-center gap-1 text-pink-300/80">
                  <span>+50% Higher (اونچا و باریک)</span>
                  <TrendingUp className="w-3 h-3 text-pink-400" />
                </div>
              </div>

              {/* Quick Pitch Presets */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                {PITCH_PRESETS.map((preset) => {
                  const isActive = Math.abs(pitch - preset.value) <= 2;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      id={`pitch-preset-${preset.value}`}
                      onClick={() => onChangePitch(preset.value)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all text-xs font-medium cursor-pointer border ${
                        isActive
                          ? 'bg-sky-500/25 border-sky-400/60 text-white shadow-sm font-semibold ring-1 ring-sky-400/30'
                          : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{preset.label}</span>
                        <span className="text-[10px] opacity-60">
                          ({preset.value > 0 ? `+${preset.value}%` : `${preset.value}%`})
                        </span>
                      </div>
                      <div className="text-[10px] text-sky-300/80 mt-0.5" dir="rtl">
                        {language === 'hindi' ? preset.hindiLabel : preset.urduLabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pitch Guidance Description */}
            <div className="flex items-start gap-2 pt-1 text-[11px] text-white/50 leading-relaxed border-t border-white/5">
              <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-white/80 font-medium">Frequency Dynamics: </span>
                {pitchDescriptor.desc}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
