import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  Clock,
  Sparkles,
  RefreshCw,
  Video,
  Layers,
  ArrowRight,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import { GeneratedAudioItem, SubtitleCue, SubtitlesResult } from '../types';

interface AISubtitlesGeneratorProps {
  activeAudioItem: GeneratedAudioItem | null;
  onSendToVideoCreator?: (audioItem: GeneratedAudioItem, cues: SubtitleCue[]) => void;
}

export const AISubtitlesGenerator: React.FC<AISubtitlesGeneratorProps> = ({
  activeAudioItem,
  onSendToVideoCreator,
}) => {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [srtText, setSrtText] = useState<string>('');
  const [vttText, setVttText] = useState<string>('');
  const [plainText, setPlainText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Audio Playback & Karaoke Sync
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeCueId, setActiveCueId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Custom text input if no audio selected
  const [customText, setCustomText] = useState<string>(
    activeAudioItem?.text ||
      'ستاروں سے آگے جہاں اور بھی ہیں\nابھی عشق کے امتحاں اور بھی ہیں\nقناعت نہ کر عالمِ رنگ و بو پر\nچمن اور بھی آشیاں اور بھی ہیں'
  );
  const [customDuration, setCustomDuration] = useState<number>(
    activeAudioItem?.durationSeconds || 6.5
  );

  // Generate subtitles automatically when active audio item changes
  useEffect(() => {
    if (activeAudioItem) {
      setCustomText(activeAudioItem.text);
      setCustomDuration(activeAudioItem.durationSeconds || 5.0);
      handleGenerateSubtitles(activeAudioItem.text, activeAudioItem.durationSeconds);
    }
  }, [activeAudioItem?.id]);

  // Sync karaoke highlight with playback time
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);
      const match = cues.find((c) => cur >= c.start && cur <= c.end);
      setActiveCueId(match ? match.id : null);
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const seekToCue = (startSec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startSec;
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  const handleGenerateSubtitles = async (textToUse?: string, durToUse?: number) => {
    const text = textToUse || customText;
    const duration = durToUse || customDuration;
    if (!text.trim()) {
      setError('Please provide text to generate subtitles.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          durationSeconds: duration,
          language: 'auto',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate subtitles.');
      }

      if (data.result) {
        setCues(data.result.cues || []);
        setSrtText(data.result.srt || '');
        setVttText(data.result.vtt || '');
        setPlainText(data.result.plainText || '');
      }
    } catch (err: any) {
      console.error('Subtitle error:', err);
      setError(err.message || 'Error generating subtitles.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdateCueText = (index: number, newText: string) => {
    const updated = [...cues];
    updated[index].text = newText;
    setCues(updated);
    rebuildFormats(updated);
  };

  const handleUpdateCueTiming = (index: number, field: 'start' | 'end', val: number) => {
    const updated = [...cues];
    updated[index][field] = Math.max(0, Number(val));
    setCues(updated);
    rebuildFormats(updated);
  };

  const rebuildFormats = (updatedCues: SubtitleCue[]) => {
    const formatSRTTime = (sec: number) => {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    const formatVTTTime = (sec: number) => {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    };

    let srt = '';
    let vtt = 'WEBVTT\n\n';
    let plain = '';

    updatedCues.forEach((cue, index) => {
      const cueId = index + 1;
      const srtStart = formatSRTTime(cue.start);
      const srtEnd = formatSRTTime(cue.end);
      const vttStart = formatVTTTime(cue.start);
      const vttEnd = formatVTTTime(cue.end);

      srt += `${cueId}\n${srtStart} --> ${srtEnd}\n${cue.text}\n\n`;
      vtt += `${cueId}\n${vttStart} --> ${vttEnd}\n${cue.text}\n\n`;
      plain += `[${cue.start.toFixed(2)}s - ${cue.end.toFixed(2)}s] ${cue.text}\n`;
    });

    setSrtText(srt.trim());
    setVttText(vtt.trim());
    setPlainText(plain.trim());
  };

  const audioSrc = activeAudioItem
    ? `data:${activeAudioItem.mimeType};base64,${activeAudioItem.audioBase64}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  AI Subtitle & Captions Studio
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  .SRT / .VTT / Karaoke
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Generate word & sentence-accurate synchronized captions in Urdu Nastaliq, Hindi & English.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {activeAudioItem && onSendToVideoCreator && cues.length > 0 && (
              <button
                type="button"
                id="btn-send-to-video-creator"
                onClick={() => onSendToVideoCreator(activeAudioItem, cues)}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Create Video with Captions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              id="btn-refresh-subtitles"
              onClick={() => handleGenerateSubtitles()}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Analyzing...' : 'Regenerate'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2.5">
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Live Karaoke Visualizer & Subtitle Cues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Live Karaoke Preview & Player (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Live Karaoke Preview</span>
              </h3>
              {audioSrc && (
                <span className="text-[11px] font-mono text-white/50">
                  {currentTime.toFixed(2)}s / {(activeAudioItem?.durationSeconds || customDuration).toFixed(2)}s
                </span>
              )}
            </div>

            {/* Simulated Video Display Box with Real-Time Glowing Captions */}
            <div className="aspect-[9/10] rounded-2xl bg-gradient-to-b from-[#0e101c] via-[#080910] to-[#040408] border border-white/15 p-6 flex flex-col justify-between relative overflow-hidden group shadow-2xl">
              {/* Top watermark / branding */}
              <div className="flex items-center justify-between text-xs text-white/40 z-10">
                <span className="font-semibold tracking-wider text-[11px] text-indigo-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> AWAAZ AI
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px]">
                  KARAOKE SYNC
                </span>
              </div>

              {/* Dynamic Animated Ambient Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-blue-600/10 transition-opacity duration-700 pointer-events-none ${
                  isPlaying ? 'opacity-100' : 'opacity-40'
                }`}
              />

              {/* Center Real-Time Subtitle Highlight */}
              <div className="my-auto text-center px-3 z-10 space-y-3">
                {activeCueId ? (
                  <div className="transition-all duration-300 transform scale-105">
                    <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)] font-urdu leading-relaxed">
                      {cues.find((c) => c.id === activeCueId)?.text}
                    </p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-mono">
                      Cue #{activeCueId} • {cues.find((c) => c.id === activeCueId)?.start.toFixed(2)}s - {cues.find((c) => c.id === activeCueId)?.end.toFixed(2)}s
                    </span>
                  </div>
                ) : (
                  <div className="text-white/40 space-y-1">
                    <p className="text-sm font-urdu">
                      {cues.length > 0
                        ? cues[0].text
                        : 'Play audio to preview synchronized karaoke captions'}
                    </p>
                    <p className="text-[11px] text-white/30">
                      {isPlaying ? 'Listening to speech...' : 'Press Play below to sync'}
                    </p>
                  </div>
                )}
              </div>

              {/* Playback Controls */}
              <div className="z-10 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                {audioSrc ? (
                  <>
                    <audio
                      ref={audioRef}
                      src={audioSrc}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="btn-play-subtitles-audio"
                      onClick={togglePlayAudio}
                      className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 cursor-pointer shrink-0 transition-transform active:scale-95"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[10px] text-white/50 font-mono">
                        <span>{currentTime.toFixed(1)}s</span>
                        <span>{(activeAudioItem?.durationSeconds || customDuration).toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={activeAudioItem?.durationSeconds || customDuration || 1}
                        step={0.05}
                        value={currentTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (audioRef.current) {
                            audioRef.current.currentTime = val;
                            setCurrentTime(val);
                          }
                        }}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-white/50 w-full text-center py-1">
                    Generate or select an audio clip to preview live playback
                  </div>
                )}
              </div>
            </div>

            {/* Quick Export Formats */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-download-srt"
                onClick={() => handleDownloadFile(srtText, `captions_${Date.now()}.srt`, 'text/plain')}
                disabled={!srtText}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Download .SRT</span>
              </button>
              <button
                type="button"
                id="btn-download-vtt"
                onClick={() => handleDownloadFile(vttText, `captions_${Date.now()}.vtt`, 'text/vtt')}
                disabled={!vttText}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Download .VTT</span>
              </button>
              <button
                type="button"
                id="btn-copy-srt"
                onClick={() => handleCopy(srtText, 'srt')}
                disabled={!srtText}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
              >
                {copiedType === 'srt' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-indigo-400" />
                )}
                <span>{copiedType === 'srt' ? 'Copied!' : 'Copy SRT'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Cue Timeline & Precision Timings (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Interactive Cue Timeline</span>
                </h3>
                <p className="text-xs text-white/50">
                  Click any cue to seek audio directly. Edit timestamps or text inline.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 font-mono">
                {cues.length} Cues
              </span>
            </div>

            {/* Subtitle Cue List */}
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {cues.map((cue, idx) => {
                const isActive = activeCueId === cue.id;
                return (
                  <div
                    key={cue.id || idx}
                    id={`cue-item-${cue.id}`}
                    onClick={() => seekToCue(cue.start)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-indigo-950/60 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : 'bg-white/5 hover:bg-white/8 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-mono font-bold text-white/70">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/60">
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={cue.start}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleUpdateCueTiming(idx, 'start', parseFloat(e.target.value))
                          }
                          className="w-14 px-1.5 py-1 bg-black/40 border border-white/15 rounded-lg text-center text-white focus:outline-none focus:border-indigo-500"
                        />
                        <span>→</span>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={cue.end}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleUpdateCueTiming(idx, 'end', parseFloat(e.target.value))
                          }
                          className="w-14 px-1.5 py-1 bg-black/40 border border-white/15 rounded-lg text-center text-white focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-white/40">s</span>
                      </div>
                    </div>

                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="text"
                        value={cue.text}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateCueText(idx, e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-xl bg-black/30 border text-sm font-medium focus:outline-none transition-colors ${
                          isActive
                            ? 'border-indigo-500 text-yellow-200'
                            : 'border-white/10 text-white focus:border-white/30'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        seekToCue(cue.start);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>Play</span>
                    </button>
                  </div>
                );
              })}

              {cues.length === 0 && !isGenerating && (
                <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-2">
                  <FileText className="w-8 h-8 text-white/30 mx-auto" />
                  <p className="text-sm font-medium text-white/60">No Subtitle Cues Generated Yet</p>
                  <p className="text-xs text-white/40">
                    Click "Regenerate" or select an audio clip to build timestamped captions automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Raw SRT / VTT Code Viewer */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/70">Raw SRT Export Preview:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(srtText, 'raw_srt')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {copiedType === 'raw_srt' ? 'Copied to Clipboard!' : 'Copy Raw SRT'}
                </button>
              </div>
              <textarea
                readOnly
                value={srtText}
                rows={4}
                className="w-full p-3 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono text-white/70 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
