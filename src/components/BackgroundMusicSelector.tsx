import React, { useState, useRef } from 'react';
import { BACKGROUND_MUSIC_TRACKS } from '../data/backgroundMusic';
import { BackgroundMusicConfig, SupportedLanguage } from '../types';
import {
  VolumeX,
  Sparkles,
  Music2,
  Coffee,
  Film,
  HeartCrack,
  Radio,
  Smile,
  CloudRain,
  Play,
  Square,
  Sliders,
  Volume2,
  Upload,
  Layers,
  Sparkle,
  Music,
  CheckCircle2,
} from 'lucide-react';
import { playTrackPreview, stopTrackPreview } from '../utils/bgMusicSynthesizer';

interface BackgroundMusicSelectorProps {
  config: BackgroundMusicConfig;
  onChangeConfig: (config: BackgroundMusicConfig) => void;
  language?: SupportedLanguage;
}

const iconMap: Record<string, React.ReactNode> = {
  VolumeX: <VolumeX className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Music2: <Music2 className="w-4 h-4" />,
  Coffee: <Coffee className="w-4 h-4" />,
  Film: <Film className="w-4 h-4" />,
  HeartCrack: <HeartCrack className="w-4 h-4" />,
  Radio: <Radio className="w-4 h-4" />,
  Smile: <Smile className="w-4 h-4" />,
  CloudRain: <CloudRain className="w-4 h-4" />,
};

const categoryColorStyles: Record<
  string,
  {
    activeBorder: string;
    activeBg: string;
    activeRing: string;
    iconBg: string;
    glowColor: string;
  }
> = {
  slate: {
    activeBorder: 'border-slate-500/60',
    activeBg: 'bg-slate-900/40',
    activeRing: 'ring-slate-500/40',
    iconBg: 'bg-slate-700 text-white',
    glowColor: '#64748b',
  },
  emerald: {
    activeBorder: 'border-emerald-500/60',
    activeBg: 'bg-emerald-950/30',
    activeRing: 'ring-emerald-500/40',
    iconBg: 'bg-emerald-600 text-white',
    glowColor: '#10b981',
  },
  amber: {
    activeBorder: 'border-amber-500/60',
    activeBg: 'bg-amber-950/30',
    activeRing: 'ring-amber-500/40',
    iconBg: 'bg-amber-600 text-white',
    glowColor: '#f59e0b',
  },
  indigo: {
    activeBorder: 'border-indigo-500/60',
    activeBg: 'bg-indigo-950/30',
    activeRing: 'ring-indigo-500/40',
    iconBg: 'bg-indigo-600 text-white',
    glowColor: '#6366f1',
  },
  purple: {
    activeBorder: 'border-purple-500/60',
    activeBg: 'bg-purple-950/30',
    activeRing: 'ring-purple-500/40',
    iconBg: 'bg-purple-600 text-white',
    glowColor: '#a855f7',
  },
  rose: {
    activeBorder: 'border-rose-500/60',
    activeBg: 'bg-rose-950/30',
    activeRing: 'ring-rose-500/40',
    iconBg: 'bg-rose-600 text-white',
    glowColor: '#f43f5e',
  },
  blue: {
    activeBorder: 'border-blue-500/60',
    activeBg: 'bg-blue-950/30',
    activeRing: 'ring-blue-500/40',
    iconBg: 'bg-blue-600 text-white',
    glowColor: '#3b82f6',
  },
  orange: {
    activeBorder: 'border-orange-500/60',
    activeBg: 'bg-orange-950/30',
    activeRing: 'ring-orange-500/40',
    iconBg: 'bg-orange-600 text-white',
    glowColor: '#f97316',
  },
  teal: {
    activeBorder: 'border-teal-500/60',
    activeBg: 'bg-teal-950/30',
    activeRing: 'ring-teal-500/40',
    iconBg: 'bg-teal-600 text-white',
    glowColor: '#14b8a6',
  },
};

export const BackgroundMusicSelector: React.FC<BackgroundMusicSelectorProps> = ({
  config,
  onChangeConfig,
  language = 'urdu',
}) => {
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedTrack =
    BACKGROUND_MUSIC_TRACKS.find((t) => t.id === config.trackId) ||
    BACKGROUND_MUSIC_TRACKS[0];
  const isEnabled = config.trackId !== 'none';
  const colorTheme =
    categoryColorStyles[selectedTrack.color] || categoryColorStyles.indigo;

  // Handle Track Selection
  const handleSelectTrack = (trackId: string) => {
    stopTrackPreview();
    setPlayingPreviewId(null);

    const track = BACKGROUND_MUSIC_TRACKS.find((t) => t.id === trackId);
    onChangeConfig({
      ...config,
      trackId,
      volume: track && track.defaultVolume > 0 ? track.defaultVolume : config.volume || 18,
    });
  };

  // Handle Preview Track Audition
  const handleTogglePreview = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (playingPreviewId === trackId) {
      stopTrackPreview();
      setPlayingPreviewId(null);
    } else {
      setPlayingPreviewId(trackId);
      playTrackPreview(trackId, (config.volume || 20) / 100);
      setTimeout(() => {
        setPlayingPreviewId((current) => (current === trackId ? null : current));
      }, 6200);
    }
  };

  // Handle Custom Audio File Upload (MP3 / WAV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1] || result;
        onChangeConfig({
          ...config,
          trackId: 'custom',
          customAudioBase64: base64,
          customAudioName: file.name,
          volume: config.volume || 18,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/m4a,audio/ogg"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-bold flex items-center gap-1.5">
            <span>4. Background Music & Soundscapes (بیک گراؤنڈ میوزک)</span>
          </h2>
          <span className="text-[10px] text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-medium flex items-center gap-1">
            <Music className="w-3 h-3" />
            Studio Mix & Auto-Ducking
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/40">Status:</span>
          <span className="font-semibold text-white flex items-center gap-1 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isEnabled ? colorTheme.glowColor : '#64748b',
              }}
            />
            {isEnabled ? (
              <span>
                {config.trackId === 'custom'
                  ? `Custom: ${config.customAudioName || 'Audio'}`
                  : selectedTrack.name}{' '}
                ({config.volume}%)
              </span>
            ) : (
              <span className="text-white/60">Voice Only (No Music)</span>
            )}
          </span>
        </div>
      </div>

      {/* Track Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {BACKGROUND_MUSIC_TRACKS.map((track) => {
          const isSelected = config.trackId === track.id;
          const isPlaying = playingPreviewId === track.id;
          const styles =
            categoryColorStyles[track.color] || categoryColorStyles.indigo;

          return (
            <div
              key={track.id}
              id={`bgm-track-${track.id}`}
              onClick={() => handleSelectTrack(track.id)}
              role="button"
              tabIndex={0}
              className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                isSelected
                  ? `${styles.activeBg} ${styles.activeBorder} ring-1 ${styles.activeRing} shadow-lg shadow-black/40`
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span
                  className={`p-1.5 rounded-xl transition-all ${
                    isSelected
                      ? styles.iconBg
                      : 'bg-white/10 text-white/60 group-hover:text-white'
                  }`}
                >
                  {iconMap[track.icon] || <Music className="w-4 h-4" />}
                </span>

                {/* Audition / Preview Button (except for 'none') */}
                {track.id !== 'none' ? (
                  <button
                    type="button"
                    onClick={(e) => handleTogglePreview(e, track.id)}
                    title={isPlaying ? 'Stop Preview' : 'Audition Music (سُنیں)'}
                    className={`text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all border cursor-pointer ${
                      isPlaying
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse font-bold'
                        : 'bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border-white/10'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                ) : (
                  isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  )
                )}
              </div>

              <div>
                <h3
                  className={`text-xs font-bold transition-colors ${
                    isSelected
                      ? 'text-white'
                      : 'text-white/90 group-hover:text-white'
                  }`}
                >
                  {track.name}
                </h3>
                <p
                  className="text-[11px] font-medium text-amber-300/80 mt-0.5"
                  dir="rtl"
                >
                  {language === 'hindi' ? track.hindiName : track.urduName}
                </p>
                <p className="text-[10px] text-white/40 mt-1 line-clamp-2 leading-relaxed">
                  {track.description}
                </p>
              </div>

              {/* Active subtle bar */}
              {isSelected && track.id !== 'none' && (
                <div className="w-full bg-white/10 h-1 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${config.volume}%`,
                      backgroundColor: styles.glowColor,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Music Upload Option */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60">
            <Upload className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Upload Custom Background Music</span>
              {config.trackId === 'custom' && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/40">
              {config.trackId === 'custom' && config.customAudioName
                ? `Loaded: ${config.customAudioName}`
                : 'Upload your own MP3 or WAV audio track (اپنی میوزک فائل اپلوڈ کریں)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {config.trackId === 'custom' && (
            <button
              type="button"
              onClick={() => handleSelectTrack('none')}
              className="text-xs text-white/50 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              Clear Custom
            </button>
          )}
          <button
            type="button"
            id="upload-custom-bgm-btn"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{config.trackId === 'custom' ? 'Change File' : 'Browse Audio'}</span>
          </button>
        </div>
      </div>

      {/* Background Music Volume & Auto-Ducking Mix Controller */}
      {isEnabled && (
        <div className="p-4 rounded-2xl border border-white/10 bg-gradient-to-r from-amber-950/20 via-black/40 to-indigo-950/20 backdrop-blur-md space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Music Mix Volume (میوزک کا والیوم)
              </span>
              <span
                className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border text-white shadow-sm"
                style={{
                  backgroundColor: `${colorTheme.glowColor}25`,
                  borderColor: `${colorTheme.glowColor}60`,
                }}
              >
                {config.volume}%
              </span>
            </div>

            {/* Auto Ducking Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/80">
              <input
                type="checkbox"
                id="auto-ducking-toggle"
                checked={config.autoDucking}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    autoDucking: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-amber-500 bg-white/10 border-white/20 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-500"
              />
              <span className="font-semibold text-amber-200">
                Voice Ducking (خودکار آواز بیلنس)
              </span>
              <span className="text-[10px] text-white/40 hidden md:inline">
                - Lowers music while speaking
              </span>
            </label>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2 pt-1">
            <input
              type="range"
              id="bgm-volume-slider"
              min={5}
              max={60}
              step={1}
              value={config.volume}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  volume: Number(e.target.value),
                })
              }
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-amber-400 focus:outline-none transition-all"
              style={{
                background: `linear-gradient(to right, ${colorTheme.glowColor} 0%, ${colorTheme.glowColor} ${(config.volume / 60) * 100}%, rgba(255,255,255,0.1) ${(config.volume / 60) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />

            <div className="flex items-center justify-between text-[10px] font-medium text-white/40 px-0.5">
              <span>5% Subtle Whisper</span>
              <span className="text-amber-300 font-semibold">18% Recommended Studio Mix</span>
              <span>60% Loud Soundtrack</span>
            </div>
          </div>

          {/* Mixing Note */}
          <div className="flex items-start gap-2 pt-1 text-[11px] text-white/50 leading-relaxed border-t border-white/5">
            <Sparkle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white/80 font-medium">Studio Blending: </span>
              {config.autoDucking
                ? 'Dynamic voice-ducking actively dips background soundtrack levels during dialogue for 100% speech clarity.'
                : 'Constant background music level maintained throughout the audio clip.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
