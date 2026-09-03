import React, { useState, useEffect, useRef } from 'react';
import { GeneratedAudioItem } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Sparkles,
  Share2,
  Check,
  Music,
  FileAudio,
  ChevronDown,
  Loader2,
  Info,
} from 'lucide-react';
import {
  base64ToBlobUrl,
  formatSeconds,
  AudioOutputFormat,
  AUDIO_FORMAT_OPTIONS,
  convertAudioToFormat,
  triggerBlobDownload,
} from '../utils/audioHelper';

interface AudioPlayerProps {
  item: GeneratedAudioItem | null;
  onDownload?: (item: GeneratedAudioItem) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ item }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Audio output format state
  const [selectedFormat, setSelectedFormat] = useState<AudioOutputFormat>('mp3');
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertingTarget, setConvertingTarget] = useState<string | null>(null);

  // When active item changes, prepare audio URL
  useEffect(() => {
    if (!item) {
      setAudioUrl(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const url = base64ToBlobUrl(item.audioBase64, item.mimeType || 'audio/wav');
    setAudioUrl(url);
    setCurrentTime(0);
    setDuration(item.durationSeconds || 0);
    setIsPlaying(true);

    return () => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [item]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  // Handle Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  // Handle Playback rate
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Handle Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const restartAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
  };

  const handleDownload = async (useRawVoice = false, formatOverride?: AudioOutputFormat) => {
    if (!item) return;
    const formatToUse = formatOverride || selectedFormat;
    const formatConfig = AUDIO_FORMAT_OPTIONS.find((f) => f.id === formatToUse) || AUDIO_FORMAT_OPTIONS[0];

    const safeSnippet = item.text
      .slice(0, 24)
      .replace(/[^\w\s\u0600-\u06FF\u0900-\u097F-]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    const sourceBase64 = useRawVoice && item.rawVoiceBase64 ? item.rawVoiceBase64 : item.audioBase64;
    const isMixed = !useRawVoice && item.bgMusicTrackId && item.bgMusicTrackId !== 'none';
    const trackSuffix = useRawVoice ? '_voice_only' : isMixed ? '_studio_mix' : '';
    const baseFileName = `Awaaz_${item.voice}_${safeSnippet || 'audio'}${trackSuffix}`;

    try {
      setIsConverting(true);
      setConvertingTarget(`${formatToUse.toUpperCase()}`);
      
      const { blob, extension } = await convertAudioToFormat(sourceBase64, formatToUse);
      const finalFileName = `${baseFileName}${extension}`;
      triggerBlobDownload(blob, finalFileName);
    } catch (err) {
      console.error('Audio conversion / download failed:', err);
      // Fallback: download original WAV
      const { blob, extension } = await convertAudioToFormat(sourceBase64, 'wav');
      triggerBlobDownload(blob, `${baseFileName}${extension}`);
    } finally {
      setIsConverting(false);
      setConvertingTarget(null);
      setIsFormatDropdownOpen(false);
    }
  };

  const handleCopyText = () => {
    if (!item) return;
    navigator.clipboard.writeText(item.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!item || !audioUrl) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/50 backdrop-blur-xl">
        <div className="mx-auto w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 mb-3">
          <Music className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">
          No Voice Audio Generated Yet
        </h3>
        <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
          Type or select your Urdu, Hindi, or English script above and click &quot;Generate Natural Audio&quot; to synthesize realistic speech.
        </p>
      </div>
    );
  }

  // Generate simulated dynamic waveform bars based on item id and duration
  const totalBars = 36;
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const currentFormatObj = AUDIO_FORMAT_OPTIONS.find((f) => f.id === selectedFormat) || AUDIO_FORMAT_OPTIONS[0];

  return (
    <div className="rounded-3xl border border-indigo-500/30 bg-white/5 p-6 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10 space-y-4 relative overflow-visible">
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        autoPlay
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || item.durationSeconds || 0);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      {/* Top Details Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm font-bold text-white">
                Voice: {item.voiceName || item.voice}
              </h3>
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {item.style.replace('_', ' ')}
              </span>
              {item.emotion && item.emotion !== 'neutral' && (
                <span className="text-[10px] capitalize font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {item.emotion} ({item.emotionIntensity || 50}%)
                </span>
              )}
              {item.pitch !== undefined && item.pitch !== 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Pitch {item.pitch > 0 ? `+${item.pitch}%` : `${item.pitch}%`}
                </span>
              )}
              {item.bgMusicTrackId && item.bgMusicTrackId !== 'none' && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Music className="w-2.5 h-2.5" />
                  BGM: {item.bgMusicTrackName || item.bgMusicTrackId} ({item.bgMusicVolume || 18}%)
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5">
              <span>Studio 24kHz PCM</span>
              <span>•</span>
              <span className="text-indigo-300/80 font-medium">{item.bgMusicTrackId && item.bgMusicTrackId !== 'none' ? 'Master Studio Mix' : 'Clean Voice'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Copy text */}
          <button
            type="button"
            onClick={handleCopyText}
            id="player-copy-text-btn"
            className="px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer"
            title="Copy transcribed text"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>
      </div>

      {/* Audio Format Selector & Download Hub */}
      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium">
            <FileAudio className="w-4 h-4 text-amber-400" />
            <span>Output Format:</span>
          </div>

          {/* Quick Format Pill Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            {AUDIO_FORMAT_OPTIONS.map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  id={`format-tab-${fmt.id}`}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  title={`${fmt.label} - ${fmt.description}`}
                >
                  <span>{fmt.extension.toUpperCase().replace('.', '')}</span>
                  {fmt.id === 'mp3' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                      Popular
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-white/40 hidden lg:inline-block">
            ({currentFormatObj.badge})
          </span>
        </div>

        {/* Action Download Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative">
          {/* Secondary Voice Only Download if audio has BGM */}
          {item.rawVoiceBase64 && item.bgMusicTrackId && item.bgMusicTrackId !== 'none' && (
            <button
              type="button"
              id="player-download-voice-only-btn"
              disabled={isConverting}
              onClick={() => handleDownload(true)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={`Download voice only in ${currentFormatObj.extension.toUpperCase()}`}
            >
              {isConverting && convertingTarget?.includes('VOICE') ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white/60" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white/60" />
              )}
              <span>Voice Only ({currentFormatObj.extension.toUpperCase()})</span>
            </button>
          )}

          {/* Primary Download Button with format label */}
          <div className="flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 border border-indigo-400/40 shadow-lg shadow-indigo-500/20">
            <button
              type="button"
              id="player-download-btn"
              disabled={isConverting}
              onClick={() => handleDownload(false)}
              className="px-4 py-2 text-white font-bold text-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer hover:opacity-90 disabled:opacity-50"
              title={`Download audio file in ${currentFormatObj.label}`}
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Encoding {convertingTarget}...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5] text-white" />
                  <span>
                    {item.bgMusicTrackId && item.bgMusicTrackId !== 'none'
                      ? `Download Mix (${currentFormatObj.extension.toUpperCase()})`
                      : `Download ${currentFormatObj.extension.toUpperCase()}`}
                  </span>
                </>
              )}
            </button>

            {/* Dropdown toggle for alternative format quick downloads */}
            <button
              type="button"
              id="player-format-dropdown-toggle"
              onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
              className="px-2 py-2 border-l border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-r-xl cursor-pointer"
              title="Select format & download options"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFormatDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Format Dropdown Menu */}
          {isFormatDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 p-2 rounded-2xl bg-stone-900 border border-white/15 shadow-2xl backdrop-blur-2xl z-50 space-y-1">
              <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                  Select Format to Export
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  {duration > 0 ? `${duration.toFixed(1)}s` : ''}
                </span>
              </div>

              {AUDIO_FORMAT_OPTIONS.map((opt) => {
                const isCurrent = selectedFormat === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    id={`dropdown-format-option-${opt.id}`}
                    onClick={() => {
                      setSelectedFormat(opt.id);
                      handleDownload(false, opt.id);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600/30 border border-indigo-500/40 text-white'
                        : 'hover:bg-white/5 text-white/80 hover:text-white'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg text-xs font-mono font-bold mt-0.5 ${
                      isCurrent ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/60'
                    }`}>
                      {opt.extension.replace('.', '').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{opt.label}</p>
                        {opt.bitrate && (
                          <span className="text-[10px] text-indigo-300 font-mono">{opt.bitrate}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">
                        {opt.recommendedFor}
                      </p>
                    </div>
                  </button>
                );
              })}

              <div className="pt-1.5 border-t border-white/10 px-2.5 py-1 text-[10px] text-white/40 flex items-center gap-1">
                <Info className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>Instant client-side encoding & export</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spoken Text Preview */}
      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-white/90 text-xs max-h-24 overflow-y-auto leading-relaxed">
        <span className="text-[10px] text-indigo-300/80 uppercase tracking-widest font-bold block mb-1">
          Script Preview:
        </span>
        <p className={item.language === 'urdu' ? 'font-urdu text-sm' : ''}>
          &ldquo;{item.text}&rdquo;
        </p>
      </div>

      {/* Visualizer Waveform */}
      <div className="py-2">
        <div className="flex items-center justify-between gap-1 h-14 px-3 bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
          {Array.from({ length: totalBars }).map((_, idx) => {
            const barProgress = idx / totalBars;
            const isPassed = barProgress <= progressRatio;
            // Generate varied heights based on index
            const heightMultiplier = Math.sin((idx / totalBars) * Math.PI) * 0.7 + 0.3;
            const randomVariation = ((idx * 17) % 10) / 10 * 0.4 + 0.6;
            const barHeight = Math.max(15, Math.min(100, heightMultiplier * randomVariation * 100));

            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full cursor-pointer group"
                onClick={() => {
                  const targetTime = (idx / totalBars) * duration;
                  setCurrentTime(targetTime);
                  if (audioRef.current) audioRef.current.currentTime = targetTime;
                }}
              >
                <div
                  style={{ height: `${barHeight}%` }}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    isPassed
                      ? isPlaying
                        ? 'bg-gradient-to-t from-indigo-500 to-blue-400 scale-y-105 shadow-sm shadow-indigo-500/50'
                        : 'bg-indigo-500'
                      : 'bg-white/10 group-hover:bg-white/20'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrubber and Time */}
      <div className="space-y-1.5">
        <input
          type="range"
          id="audio-progress-slider"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
        />
        <div className="flex justify-between text-[11px] font-mono text-white/40">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Play / Restart Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="audio-play-pause-btn"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            id="audio-restart-btn"
            onClick={restartAudio}
            className="p-2.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Playback speed buttons */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/5 text-xs">
          <span className="text-[10px] text-white/40 uppercase px-2 font-bold tracking-wider">
            Speed:
          </span>
          {[0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              id={`speed-btn-${rate}x`}
              onClick={() => changePlaybackRate(rate)}
              className={`px-2.5 py-0.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                playbackRate === rate
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={toggleMute}
            className="text-white/40 hover:text-white cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-white/40" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
            title="Volume"
          />
        </div>
      </div>
    </div>
  );
};
