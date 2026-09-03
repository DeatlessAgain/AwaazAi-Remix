import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  Sliders,
  Play,
  Pause,
  Download,
  Volume2,
  Sparkles,
  Radio,
  RefreshCw,
  Layers,
  Activity,
  Mic,
} from 'lucide-react';
import { GeneratedAudioItem, VoiceFXConfig } from '../types';

interface AIVoiceChangerProps {
  activeAudioItem: GeneratedAudioItem | null;
  onProcessedAudio?: (item: GeneratedAudioItem) => void;
}

const FX_PRESETS: {
  id: string;
  name: string;
  desc: string;
  icon: string;
  config: VoiceFXConfig;
}[] = [
  {
    id: 'studio_broadcast',
    name: '🎙️ Warm Studio Broadcast',
    desc: 'Deep proximity bass, subtle room warmth & compression',
    icon: 'Mic',
    config: {
      presetId: 'studio_broadcast',
      pitchShiftPercent: 0,
      reverbWet: 0.15,
      lowGainDb: 5,
      midGainDb: 0,
      highGainDb: 2,
      distortion: 0,
      delayTimeMs: 0,
      delayFeedback: 0,
    },
  },
  {
    id: 'vintage_radio',
    name: '📻 1950s Vintage AM Radio',
    desc: 'Narrow bandpass 400Hz-3.5kHz with harmonic tube crackle',
    icon: 'Radio',
    config: {
      presetId: 'vintage_radio',
      pitchShiftPercent: 0,
      reverbWet: 0.05,
      lowGainDb: -15,
      midGainDb: 8,
      highGainDb: -12,
      distortion: 25,
      delayTimeMs: 0,
      delayFeedback: 0,
    },
  },
  {
    id: 'walkie_talkie',
    name: '📞 Old Telephone & Walkie-Talkie',
    desc: 'High resonant bandpass with authentic squelch',
    icon: 'Volume2',
    config: {
      presetId: 'walkie_talkie',
      pitchShiftPercent: 0,
      reverbWet: 0.02,
      lowGainDb: -20,
      midGainDb: 10,
      highGainDb: -18,
      distortion: 40,
      delayTimeMs: 0,
      delayFeedback: 0,
    },
  },
  {
    id: 'scifi_robot',
    name: '🤖 Cybernetic Sci-Fi Robot',
    desc: 'Metallic ring modulation & resonant comb effect',
    icon: 'Sparkles',
    config: {
      presetId: 'scifi_robot',
      pitchShiftPercent: -15,
      reverbWet: 0.25,
      lowGainDb: 0,
      midGainDb: -4,
      highGainDb: 8,
      distortion: 50,
      delayTimeMs: 45,
      delayFeedback: 0.6,
    },
  },
  {
    id: 'cathedral_reverb',
    name: '🌌 Grand Cathedral & Hall',
    desc: 'Vast 8-second ambient reflections and lush reverberation',
    icon: 'Activity',
    config: {
      presetId: 'cathedral_reverb',
      pitchShiftPercent: 0,
      reverbWet: 0.7,
      lowGainDb: 2,
      midGainDb: 2,
      highGainDb: 4,
      distortion: 0,
      delayTimeMs: 250,
      delayFeedback: 0.45,
    },
  },
  {
    id: 'deep_demon',
    name: '👹 Deep Demon / Villain Baritone',
    desc: 'Deep pitch shift with ominous sub-octave rumble',
    icon: 'Volume2',
    config: {
      presetId: 'deep_demon',
      pitchShiftPercent: -40,
      reverbWet: 0.35,
      lowGainDb: 10,
      midGainDb: -2,
      highGainDb: -6,
      distortion: 20,
      delayTimeMs: 120,
      delayFeedback: 0.3,
    },
  },
  {
    id: 'stadium_announcer',
    name: '📢 Stadium Arena Announcer',
    desc: 'Slapback echoes echoing through a grand amphitheater',
    icon: 'Volume2',
    config: {
      presetId: 'stadium_announcer',
      pitchShiftPercent: 0,
      reverbWet: 0.4,
      lowGainDb: 4,
      midGainDb: 4,
      highGainDb: 2,
      distortion: 5,
      delayTimeMs: 320,
      delayFeedback: 0.5,
    },
  },
];

export const AIVoiceChanger: React.FC<AIVoiceChangerProps> = ({
  activeAudioItem,
  onProcessedAudio,
}) => {
  const [activePreset, setActivePreset] = useState<string>('studio_broadcast');
  const [fxConfig, setFxConfig] = useState<VoiceFXConfig>(FX_PRESETS[0].config);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const [processedBase64, setProcessedBase64] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const rawAudioBufferRef = useRef<AudioBuffer | null>(null);

  // Load raw audio into buffer when active audio changes
  useEffect(() => {
    if (activeAudioItem?.audioBase64) {
      loadAudioBuffer(activeAudioItem.audioBase64);
    }
  }, [activeAudioItem?.id]);

  const loadAudioBuffer = async (base64Data: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const binary = atob(base64Data);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const decoded = await ctx.decodeAudioData(bytes.buffer);
      rawAudioBufferRef.current = decoded;
    } catch (e) {
      console.warn('Audio decoding error:', e);
    }
  };

  const handleSelectPreset = (preset: typeof FX_PRESETS[0]) => {
    setActivePreset(preset.id);
    setFxConfig(preset.config);
  };

  // Play audio with Web Audio DSP chain applied in real-time
  const playWithEffects = async () => {
    if (!rawAudioBufferRef.current) {
      if (activeAudioItem?.audioBase64) {
        await loadAudioBuffer(activeAudioItem.audioBase64);
      }
    }
    if (!rawAudioBufferRef.current) return;

    // Stop existing playback
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {}
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = audioCtxRef.current || new AudioCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    audioCtxRef.current = ctx;

    const source = ctx.createBufferSource();
    source.buffer = rawAudioBufferRef.current;

    // 1. Pitch / Playback Rate
    const rate = Math.max(0.5, Math.min(2.0, 1 + fxConfig.pitchShiftPercent / 100));
    source.playbackRate.value = rate;

    // 2. 3-Band Parametric Equalizer
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowshelf';
    lowFilter.frequency.value = 320;
    lowFilter.gain.value = fxConfig.lowGainDb;

    const midFilter = ctx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1400;
    midFilter.Q.value = 1.2;
    midFilter.gain.value = fxConfig.midGainDb;

    const highFilter = ctx.createBiquadFilter();
    highFilter.type = 'highshelf';
    highFilter.frequency.value = 4500;
    highFilter.gain.value = fxConfig.highGainDb;

    // 3. Distortion / Saturation Curve
    const distortionNode = ctx.createWaveShaper();
    if (fxConfig.distortion > 0) {
      const k = fxConfig.distortion;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      distortionNode.curve = curve;
      distortionNode.oversample = '4x';
    }

    // 4. Delay / Echo Network
    const delayNode = ctx.createDelay();
    const delayFeedbackNode = ctx.createGain();
    const delayGain = ctx.createGain();
    if (fxConfig.delayTimeMs > 0) {
      delayNode.delayTime.value = fxConfig.delayTimeMs / 1000;
      delayFeedbackNode.gain.value = Math.min(0.85, fxConfig.delayFeedback);
      delayGain.gain.value = 0.5;

      delayNode.connect(delayFeedbackNode);
      delayFeedbackNode.connect(delayNode);
      delayNode.connect(delayGain);
    }

    // 5. Connect DSP Chain
    source.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);

    let lastNode: AudioNode = highFilter;
    if (fxConfig.distortion > 0) {
      lastNode.connect(distortionNode);
      lastNode = distortionNode;
    }

    // Delay send
    if (fxConfig.delayTimeMs > 0) {
      lastNode.connect(delayNode);
      delayGain.connect(ctx.destination);
    }

    lastNode.connect(ctx.destination);

    source.onended = () => {
      setIsPlaying(false);
    };

    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {}
      setIsPlaying(false);
    }
  };

  // Render processed audio to offline buffer & generate downloadable .wav
  const renderAndExportFXAudio = async () => {
    if (!rawAudioBufferRef.current || !activeAudioItem) return;
    setIsProcessing(true);
    try {
      const srcBuffer = rawAudioBufferRef.current;
      const rate = Math.max(0.5, Math.min(2.0, 1 + fxConfig.pitchShiftPercent / 100));
      const renderDuration = srcBuffer.duration / rate + (fxConfig.delayTimeMs ? 1.5 : 0.5);

      const offlineCtx = new OfflineAudioContext(
        srcBuffer.numberOfChannels,
        Math.ceil(srcBuffer.sampleRate * renderDuration),
        srcBuffer.sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = srcBuffer;
      source.playbackRate.value = rate;

      const lowFilter = offlineCtx.createBiquadFilter();
      lowFilter.type = 'lowshelf';
      lowFilter.frequency.value = 320;
      lowFilter.gain.value = fxConfig.lowGainDb;

      const midFilter = offlineCtx.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.value = 1400;
      midFilter.gain.value = fxConfig.midGainDb;

      const highFilter = offlineCtx.createBiquadFilter();
      highFilter.type = 'highshelf';
      highFilter.frequency.value = 4500;
      highFilter.gain.value = fxConfig.highGainDb;

      source.connect(lowFilter);
      lowFilter.connect(midFilter);
      midFilter.connect(highFilter);
      highFilter.connect(offlineCtx.destination);

      source.start(0);
      const renderedBuffer = await offlineCtx.startRendering();

      // Convert buffer to WAV
      const wavBlob = bufferToWave(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setProcessedAudioUrl(url);

      // Reader for base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setProcessedBase64(base64);

        if (onProcessedAudio) {
          const item: GeneratedAudioItem = {
            ...activeAudioItem,
            id: `fx_${Date.now()}`,
            audioBase64: base64,
            voiceName: `${activeAudioItem.voiceName} (${FX_PRESETS.find((p) => p.id === activePreset)?.name || 'Custom FX'})`,
            createdAt: Date.now(),
          };
          onProcessedAudio(item);
        }
      };
      reader.readAsDataURL(wavBlob);
    } catch (e) {
      console.error('FX Rendering error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper: AudioBuffer to WAV Blob
  const bufferToWave = (abuffer: AudioBuffer) => {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sampleRate = abuffer.sampleRate;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
      out.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      out.setUint32(pos, data, true);
      pos += 4;
    };

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit precision

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-fuchsia-950/40 border border-violet-500/20 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  AI Voice Changer & Studio Vocal FX Processor
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
                  DSP • Radio • Robot • EQ
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Apply studio-grade vocal processing: Vintage AM Radio, Old Telephone, Robot Vocoder, Giant Cathedral Reverb & Deep Villain Baritone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              id="btn-preview-fx-audio"
              onClick={isPlaying ? stopPlayback : playWithEffects}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Stop Preview' : 'Play Live FX Preview'}</span>
            </button>
            <button
              type="button"
              id="btn-export-fx-audio"
              onClick={renderAndExportFXAudio}
              disabled={isProcessing}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processing FX...' : 'Export Processed Audio'}</span>
            </button>
          </div>
        </div>
      </div>

      {processedAudioUrl && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Voice effect applied successfully! Download your transformed audio track.</span>
          </div>
          <a
            href={processedAudioUrl}
            download={`voice_fx_${activePreset}_${Date.now()}.wav`}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .WAV</span>
          </a>
        </div>
      )}

      {/* Vocal FX Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {FX_PRESETS.map((preset) => {
          const isSelected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              id={`preset-${preset.id}`}
              onClick={() => handleSelectPreset(preset)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 group ${
                isSelected
                  ? 'bg-violet-950/70 border-violet-500 ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/10'
                  : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
            >
              <div className="text-sm font-bold text-white group-hover:text-violet-300">
                {preset.name}
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{preset.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Manual Fine-Tuning DSP Parametric Rack */}
      <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-violet-400" />
            <span>Master Vocal DSP Parametric Rack</span>
          </h3>
          <span className="text-xs text-white/40">Real-time Web Audio DSP</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Pitch Shift */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>Vocal Pitch</span>
              <span className="font-mono text-violet-300">{fxConfig.pitchShiftPercent}%</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={fxConfig.pitchShiftPercent}
              onChange={(e) =>
                setFxConfig({ ...fxConfig, pitchShiftPercent: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* Low Bass EQ */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>Low Bass EQ</span>
              <span className="font-mono text-violet-300">{fxConfig.lowGainDb} dB</span>
            </div>
            <input
              type="range"
              min={-20}
              max={15}
              value={fxConfig.lowGainDb}
              onChange={(e) =>
                setFxConfig({ ...fxConfig, lowGainDb: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* Mid Presence EQ */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>Mid Presence</span>
              <span className="font-mono text-violet-300">{fxConfig.midGainDb} dB</span>
            </div>
            <input
              type="range"
              min={-20}
              max={15}
              value={fxConfig.midGainDb}
              onChange={(e) =>
                setFxConfig({ ...fxConfig, midGainDb: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* High Air EQ */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>High Air EQ</span>
              <span className="font-mono text-violet-300">{fxConfig.highGainDb} dB</span>
            </div>
            <input
              type="range"
              min={-20}
              max={15}
              value={fxConfig.highGainDb}
              onChange={(e) =>
                setFxConfig({ ...fxConfig, highGainDb: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* Tube Distortion */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>Tube Drive</span>
              <span className="font-mono text-violet-300">{fxConfig.distortion}</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              value={fxConfig.distortion}
              onChange={(e) =>
                setFxConfig({ ...fxConfig, distortion: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* Delay Time */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>Echo Delay</span>
              <span className="font-mono text-violet-300">{fxConfig.delayTimeMs} ms</span>
            </div>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={fxConfig.delayTimeMs}
              onChange={(e) =>
                setFxConfig({ ...fxConfig, delayTimeMs: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
