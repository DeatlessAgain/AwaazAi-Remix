import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Repeat,
  Gauge,
  Mic,
  MicOff,
  Activity,
  Music,
  Radio,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { GeneratedAudioItem, NaatSingingAnalysisResult } from '../types';
import { base64ToBlobUrl, formatSeconds } from '../utils/audioHelper';

interface VisualLyricsCuePrompterProps {
  lyrics: string;
  generatedItem: GeneratedAudioItem | null;
  analysisResult: NaatSingingAnalysisResult | null;
  bgmTrackId?: string;
  bgmVolume?: number;
  onSeekToVerse?: (verseIndex: number, startTime: number) => void;
}

interface VerseTiming {
  index: number;
  text: string;
  words: string[];
  startTime: number;
  endTime: number;
  duration: number;
  cadenceNote?: string;
  pauseAfterMs?: number;
}

export const VisualLyricsCuePrompter: React.FC<VisualLyricsCuePrompterProps> = ({
  lyrics,
  generatedItem,
  analysisResult,
  bgmTrackId,
  bgmVolume = 20,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLoopingVerse, setIsLoopingVerse] = useState<boolean>(false);
  const [loopVerseIndex, setLoopVerseIndex] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Practice source: 'master' (voice+bgm) or 'rawVoice' (voice only)
  const [audioSource, setAudioSource] = useState<'master' | 'rawVoice'>('master');

  // Count-in state for vocal timing rehearsal
  const [countInValue, setCountInValue] = useState<number | null>(null);
  const [isCountInEnabled, setIsCountInEnabled] = useState<boolean>(true);

  // Live Mic Monitor State for user singing practice
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const micAudioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);

  // Prepare Audio Blob URL when generated item changes or audioSource changes
  useEffect(() => {
    if (!generatedItem) {
      setAudioUrl(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const audioBase64 =
      audioSource === 'rawVoice' && generatedItem.rawVoiceBase64
        ? generatedItem.rawVoiceBase64
        : generatedItem.audioBase64;

    const url = base64ToBlobUrl(audioBase64, generatedItem.mimeType || 'audio/wav');
    setAudioUrl(url);
    setCurrentTime(0);
    setDuration(generatedItem.durationSeconds || 10);
    setIsPlaying(false);

    return () => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [generatedItem, audioSource]);

  // Audio Duration & Timeupdate
  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    setCurrentTime(curr);

    // If loop verse mode is enabled, check boundaries
    if (isLoopingVerse && loopVerseIndex !== null && verseTimings[loopVerseIndex]) {
      const activeVerse = verseTimings[loopVerseIndex];
      if (curr >= activeVerse.endTime) {
        audioRef.current.currentTime = activeVerse.startTime;
        setCurrentTime(activeVerse.startTime);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Calculate verse timings distributed across the duration
  const verseTimings: VerseTiming[] = useMemo(() => {
    const lines = lyrics
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    const totalDur = duration > 0 ? duration : (generatedItem?.durationSeconds || 12);
    const charCounts = lines.map((l) => Math.max(l.length, 5));
    const totalChars = charCounts.reduce((acc, c) => acc + c, 0);

    // Check if AI analysis provided specific verse cadence breakdowns
    const analysisBreakdown = analysisResult?.versesBreakdown || [];

    let currentStart = 0.3; // Initial small intro breath gap
    const effectiveDuration = Math.max(totalDur - 0.6, 2);

    return lines.map((lineText, idx) => {
      const lineChars = charCounts[idx];
      const lineRatio = totalChars > 0 ? lineChars / totalChars : 1 / lines.length;
      const lineDur = lineRatio * effectiveDuration;
      const startTime = currentStart;
      const endTime = Math.min(startTime + lineDur, totalDur);
      currentStart = endTime;

      const cadence = analysisBreakdown[idx]?.cadenceNotes || (
        idx % 2 === 0 ? 'اٹھان اور کشش (Ascending)' : 'ٹھہراؤ اور سُر (Resolving)'
      );
      const pauseMs = analysisBreakdown[idx]?.pauseAfterMs || (idx % 2 === 0 ? 800 : 1200);

      // Split into words for karaoke highlighting
      const words = lineText.split(/\s+/).filter(Boolean);

      return {
        index: idx,
        text: lineText,
        words,
        startTime,
        endTime,
        duration: lineDur,
        cadenceNote: cadence,
        pauseAfterMs: pauseMs,
      };
    });
  }, [lyrics, duration, generatedItem?.durationSeconds, analysisResult]);

  // Identify currently active verse index
  const activeVerseIndex = useMemo(() => {
    if (verseTimings.length === 0) return -1;
    for (let i = 0; i < verseTimings.length; i++) {
      if (currentTime >= verseTimings[i].startTime && currentTime <= verseTimings[i].endTime) {
        return i;
      }
    }
    // If before first verse
    if (currentTime < verseTimings[0].startTime) return 0;
    // If after last verse
    return verseTimings.length - 1;
  }, [verseTimings, currentTime]);

  // Active Word within active verse
  const activeWordIndex = useMemo(() => {
    if (activeVerseIndex < 0 || !verseTimings[activeVerseIndex]) return -1;
    const v = verseTimings[activeVerseIndex];
    if (currentTime < v.startTime || currentTime > v.endTime) return -1;
    const elapsedInVerse = currentTime - v.startTime;
    const verseProgress = Math.min(Math.max(elapsedInVerse / (v.duration || 1), 0), 1);
    const wordCount = v.words.length;
    if (wordCount === 0) return -1;
    const wordIdx = Math.min(Math.floor(verseProgress * wordCount), wordCount - 1);
    return wordIdx;
  }, [activeVerseIndex, verseTimings, currentTime]);

  // Auto-scroll active line into view smoothly
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeVerseIndex]);

  // Play / Pause with optional 3-2-1 Count-In for rehearsal
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCountInValue(null);
    } else {
      if (isCountInEnabled && currentTime < 0.2) {
        // Start count in 3, 2, 1
        setCountInValue(3);
        const timer1 = setTimeout(() => setCountInValue(2), 700);
        const timer2 = setTimeout(() => setCountInValue(1), 1400);
        const timer3 = setTimeout(() => {
          setCountInValue(null);
          audioRef.current?.play().then(() => setIsPlaying(true)).catch(console.error);
        }, 2100);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  // Jump to specific verse
  const handleSeekVerse = (verseIdx: number) => {
    if (!audioRef.current || !verseTimings[verseIdx]) return;
    const targetTime = verseTimings[verseIdx].startTime;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    if (isLoopingVerse) {
      setLoopVerseIndex(verseIdx);
    }
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  // Toggle Loop on current verse
  const handleToggleLoopVerse = (idx?: number) => {
    const targetIdx = idx !== undefined ? idx : (activeVerseIndex >= 0 ? activeVerseIndex : 0);
    if (isLoopingVerse && loopVerseIndex === targetIdx) {
      setIsLoopingVerse(false);
      setLoopVerseIndex(null);
    } else {
      setIsLoopingVerse(true);
      setLoopVerseIndex(targetIdx);
      if (audioRef.current && verseTimings[targetIdx]) {
        audioRef.current.currentTime = verseTimings[targetIdx].startTime;
        setCurrentTime(verseTimings[targetIdx].startTime);
        if (!isPlaying) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
        }
      }
    }
  };

  // Change Playback Speed
  const handleChangeSpeed = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Live Mic Monitor Handler
  const toggleLiveMic = async () => {
    if (isMicActive) {
      // Stop Mic
      if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (micAudioContextRef.current) {
        micAudioContextRef.current.close().catch(console.error);
        micAudioContextRef.current = null;
      }
      setIsMicActive(false);
      setMicVolumeLevel(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        micAudioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        micAnalyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!micAnalyserRef.current) return;
          micAnalyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolumeLevel(Math.min(Math.round((avg / 128) * 100), 100));
          micAnimFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
        setIsMicActive(true);
      } catch (err) {
        console.warn('Microphone permission denied or not available:', err);
      }
    }
  };

  // Cleanup mic on unmount
  useEffect(() => {
    return () => {
      if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
      if (micAudioContextRef.current) micAudioContextRef.current.close().catch(console.error);
    };
  }, []);

  // Metronome / Rhythm beat simulation (cycles every 0.88s ~ 68 BPM Daf tempo)
  const beatNumber = Math.floor((currentTime % 3.52) / 0.88) + 1;

  // Active verse object
  const currentVerseObj = verseTimings[activeVerseIndex];
  const nextVerseObj = verseTimings[activeVerseIndex + 1];
  const timeRemainingInVerse = currentVerseObj ? currentVerseObj.endTime - currentTime : 0;
  const isIncomingAlert = timeRemainingInVerse > 0 && timeRemainingInVerse <= 1.5 && nextVerseObj;

  return (
    <div
      className={`rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 shadow-2xl backdrop-blur-2xl transition-all overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50 p-6 overflow-y-auto max-w-5xl mx-auto' : 'p-5'
      }`}
      id="visual-lyrics-cue-prompter"
    >
      {/* Hidden Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          muted={isMuted}
        />
      )}

      {/* Prompter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Visual Lyrics Cue & Rhythm Prompter
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                LIVECUE™
              </span>
            </div>
            <p className="text-xs text-slate-400 font-urdu">
              آواز کی ادائے ترنم، ٹھہراؤ (Cadence) اور سُروں کی ہم آہنگی کے لیے ریئل ٹائم لائیو اسکرین
            </p>
          </div>
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex items-center gap-2">
          {/* Audio Track Source Toggle */}
          {generatedItem && generatedItem.rawVoiceBase64 && generatedItem.bgMusicTrackId && (
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setAudioSource('master')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  audioSource === 'master'
                    ? 'bg-emerald-500 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="مکمل مکس ٹریک (آواز + پس منظر میوزک)"
              >
                آواز + ساز (Master)
              </button>
              <button
                type="button"
                onClick={() => setAudioSource('rawVoice')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  audioSource === 'rawVoice'
                    ? 'bg-teal-500 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="صرف خالص آواز بغیر ساز کے"
              >
                خالص آواز (Acapella)
              </button>
            </div>
          )}

          {/* Live Mic Rehearsal Button */}
          <button
            type="button"
            id="toggle-prompter-mic"
            onClick={toggleLiveMic}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isMicActive
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10 animate-pulse'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
            }`}
            title="مائیکروفون ریاض موڈ: اپنی آواز سن کر ساتھ ساتھ نعت پڑھیں"
          >
            {isMicActive ? (
              <>
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>مائیک لائیو آن ہے</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-slate-400" />
                <span>مائیک ریاض (Practice Mic)</span>
              </>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isFullscreen ? 'عام موڈ' : 'مکمل اسکرین پرامپٹر (Fullscreen Prompter)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Real-time Rhythm & Beat Metronome Bar */}
      <div className="my-4 p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        {/* Rhythm Visualizer Pulse */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              تال و لَے (Rhythm Pulse):
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((beat) => {
              const isActive = isPlaying && beatNumber === beat;
              return (
                <div
                  key={beat}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all duration-100 ${
                    isActive
                      ? 'bg-gradient-to-tr from-emerald-400 to-teal-300 text-slate-950 scale-110 shadow-lg shadow-emerald-400/30'
                      : 'bg-white/5 text-slate-500 border border-white/5'
                  }`}
                >
                  {beat}
                </div>
              );
            })}
          </div>

          <span className="text-[11px] text-emerald-300 font-urdu hidden sm:inline">
            (دَف و طبلے کی تھاپ کے ساتھ ہم آہنگ)
          </span>
        </div>

        {/* Live Mic Monitor Amplitude Bar */}
        {isMicActive && (
          <div className="flex items-center gap-2 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/30">
            <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="text-[11px] font-bold text-rose-200">آپ کی آواز:</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 via-amber-400 to-rose-500 transition-all duration-75"
                style={{ width: `${micVolumeLevel}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-rose-300">{micVolumeLevel}%</span>
          </div>
        )}

        {/* Inter-verse Pause Countdown Alert */}
        {isIncomingAlert && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs animate-bounce font-urdu">
            <Clock className="w-3.5 h-3.5" />
            <span>اگلا مصرعہ شروع ہونے والا ہے (Get Ready)</span>
          </div>
        )}
      </div>

      {/* Main Lyrics Prompter Display Canvas */}
      <div
        ref={containerRef}
        className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar p-2 rounded-2xl bg-black/50 border border-white/5 relative"
      >
        {/* Animated Count-In Overlay (3... 2... 1... SING!) */}
        {countInValue !== null && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-5xl font-black text-slate-950 shadow-2xl shadow-emerald-400/50 animate-ping">
              {countInValue}
            </div>
            <div className="mt-4 font-urdu text-xl font-bold text-emerald-300">
              تیار ہو جائیں! دم لیں اور ساتھ شروع کریں...
            </div>
          </div>
        )}

        {verseTimings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <Music className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <p className="text-sm font-urdu">کوئی اشعار درج نہیں ہیں۔ اوپر ٹیکسٹ باکس میں کلام لکھیں۔</p>
          </div>
        ) : (
          verseTimings.map((v, idx) => {
            const isActive = isPlaying && activeVerseIndex === idx;
            const isPassed = isPlaying && activeVerseIndex > idx;
            const isLoopingThis = isLoopingVerse && loopVerseIndex === idx;

            // Verse progress ratio
            let verseProgress = 0;
            if (isActive) {
              const elapsed = currentTime - v.startTime;
              verseProgress = Math.min(Math.max(elapsed / (v.duration || 1), 0), 1);
            }

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => handleSeekVerse(idx)}
                className={`relative group rounded-2xl p-4 transition-all duration-300 cursor-pointer border overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900/90 border-emerald-400/80 shadow-xl shadow-emerald-500/15 scale-[1.01]'
                    : isPassed
                    ? 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-90'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {/* Visual Cue Progress Fill Bar along line base */}
                {isActive && (
                  <div
                    className="absolute bottom-0 right-0 h-1 bg-gradient-to-l from-emerald-400 via-teal-300 to-cyan-400 transition-all duration-100 ease-linear shadow-lg"
                    style={{ width: `${verseProgress * 100}%` }}
                  />
                )}

                <div className="flex items-start justify-between gap-4">
                  {/* Left: Timing & Loop Control Badge */}
                  <div className="flex flex-col items-start gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                          isActive
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {formatSeconds(v.startTime)}
                      </span>

                      {/* Loop verse button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLoopVerse(idx);
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isLoopingThis
                            ? 'bg-emerald-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-emerald-300 hover:bg-white/10'
                        }`}
                        title="اس مصرعے کو بار بار دہرائیں (Loop this verse)"
                      >
                        <Repeat className={`w-3 h-3 ${isLoopingThis ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Cadence / Pause advice */}
                    <span className="text-[10px] text-slate-400 font-urdu max-w-[160px] line-clamp-1">
                      {v.cadenceNote}
                    </span>
                  </div>

                  {/* Center & Right: High-Contrast Synchronized Verse Text */}
                  <div className="flex-1 text-right dir-rtl">
                    <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 font-urdu text-xl sm:text-2xl leading-relaxed">
                      {v.words.map((word, wIdx) => {
                        const isCurrentWord = isActive && activeWordIndex === wIdx;
                        const isPassedWord = isActive && activeWordIndex > wIdx;

                        return (
                          <span
                            key={wIdx}
                            className={`transition-all duration-150 inline-block px-1.5 py-0.5 rounded-lg ${
                              isCurrentWord
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black scale-110 shadow-lg shadow-emerald-400/40'
                                : isPassedWord
                                ? 'text-emerald-200 font-bold'
                                : isActive
                                ? 'text-white'
                                : 'text-slate-300'
                            }`}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>

                    {/* Breath / Pause Marker Cue */}
                    {isActive && v.pauseAfterMs && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-urdu">
                        <span>ٹھہراؤ: {v.pauseAfterMs}ms</span>
                        <span className="text-slate-400 font-sans">|</span>
                        <span>سانس لیں اور اگلے سُر کی تیاری کریں</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Prompter Transport Controls Bar */}
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
        {/* Play / Pause / Seek / Reset */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="prompter-play-toggle"
            onClick={togglePlay}
            disabled={!audioUrl && verseTimings.length === 0}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            title={isPlaying ? 'روکیں (Pause)' : 'چلائیں اور ریاض کریں (Play & Rehearse)'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="شروع سے ری سیٹ کریں"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Time Display */}
          <div className="font-mono text-xs text-slate-300 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-emerald-400 font-bold">{formatSeconds(currentTime)}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Global Progress Timeline Slider */}
        <div className="flex-1 min-w-[200px] px-2">
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.05}
            value={currentTime}
            onChange={(e) => {
              const t = Number(e.target.value);
              setCurrentTime(t);
              if (audioRef.current) audioRef.current.currentTime = t;
            }}
            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Practice Speed & Count-in Toggles */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-xl border border-white/10 text-xs">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            {[0.75, 1, 1.25].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => handleChangeSpeed(spd)}
                className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] cursor-pointer transition-colors ${
                  playbackRate === spd
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Count-In Toggle */}
          <button
            type="button"
            onClick={() => setIsCountInEnabled(!isCountInEnabled)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
              isCountInEnabled
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
            title="نعت شروع کرنے سے پہلے 3 سیکنڈ کا کاؤنٹ ڈاؤن"
          >
            3-2-1 لیڈ اِن
          </button>
        </div>
      </div>
    </div>
  );
};
