import React, { useState, useRef, useEffect } from 'react';
import { VOICES } from '../data/voices';
import { VoiceOption, SupportedLanguage } from '../types';
import {
  Sparkles,
  Check,
  Baby,
  Play,
  Square,
  Loader2,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { base64ToBlobUrl } from '../utils/audioHelper';

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  language: SupportedLanguage;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelectVoice,
  language,
}) => {
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male' | 'Kid'>('All');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [sampleError, setSampleError] = useState<{ voiceId: string; message: string } | null>(null);
  
  // Cache generated sample audio URLs by voiceId to avoid redundant API calls
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop playback when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const filteredVoices = VOICES.filter((v) => {
    if (genderFilter === 'All') return true;
    return v.gender === genderFilter;
  });

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setPlayingVoiceId(null);
  };

  const handlePlaySample = async (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation(); // Do not trigger card selection if user only wants to listen to the preview
    setSampleError(null);

    // If this voice is currently playing, clicking again stops it
    if (playingVoiceId === voice.id) {
      stopCurrentAudio();
      return;
    }

    // Stop any other currently playing sample
    stopCurrentAudio();

    // Check if we already have the sample cached
    if (audioCache[voice.id]) {
      playAudioBlobUrl(audioCache[voice.id], voice.id);
      return;
    }

    // Otherwise fetch the 5-second persona sample from the TTS API
    setLoadingVoiceId(voice.id);

    try {
      const sampleTextToUse =
        language === 'hindi'
          ? voice.sampleTextHindi || voice.sampleTextUrdu || voice.sampleText || 'नमस्ते! यह मेरी आवाज़ का नमूना है।'
          : language === 'english'
          ? voice.sampleText || voice.sampleTextUrdu || 'Hello! This is a sample preview of my voice.'
          : voice.sampleTextUrdu || voice.sampleText || 'السلام علیکم! یہ میری قدرتی آواز کا نمونہ ہے۔';

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sampleTextToUse,
          voice: voice.id,
          language: language === 'auto' ? 'urdu' : language,
          style: voice.isKidVoice ? 'child_playful' : 'conversational',
          emotion: 'neutral',
          emotionIntensity: 50,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textErr = await response.text();
        throw new Error(
          response.ok
            ? 'Invalid response received from server.'
            : `Server error (${response.status}): ${textErr.slice(0, 120)}`
        );
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate voice preview sample');
      }

      const audioBase64 = data.audioBase64 || data.audio;
      if (!audioBase64) {
        throw new Error('No audio data returned from voice service');
      }

      const blobUrl = base64ToBlobUrl(audioBase64, data.mimeType || 'audio/wav');
      
      // Store in cache
      setAudioCache((prev) => ({ ...prev, [voice.id]: blobUrl }));
      setLoadingVoiceId(null);

      // Play audio
      playAudioBlobUrl(blobUrl, voice.id);
    } catch (err: any) {
      console.error('Error playing voice sample preview:', err);
      setLoadingVoiceId(null);
      setPlayingVoiceId(null);
      setSampleError({ voiceId: voice.id, message: err.message || 'Sample preview unavailable' });
    }
  };

  const playAudioBlobUrl = (url: string, voiceId: string) => {
    try {
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setPlayingVoiceId(voiceId);
      };

      audio.onended = () => {
        setPlayingVoiceId(null);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingVoiceId(null);
        currentAudioRef.current = null;
        setSampleError({ voiceId, message: 'Audio playback failed' });
      };

      audio.play().catch((playErr) => {
        console.warn('Audio play request interrupted or blocked:', playErr);
        setPlayingVoiceId(null);
        currentAudioRef.current = null;
      });
    } catch (e: any) {
      console.error('Failed to initialize sample audio:', e);
      setPlayingVoiceId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-bold flex items-center gap-1.5">
            <span>1. Voice Profile (آواز کا انتخاب)</span>
          </h2>
          <span className="text-[10px] text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium">
            10 Natural Personas • 5s Sample Previews
          </span>
        </div>

        {/* Gender / Age Filter */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
          <button
            type="button"
            id="filter-gender-all"
            onClick={() => setGenderFilter('All')}
            className={`px-3 py-1 rounded-xl transition-all text-xs font-medium cursor-pointer ${
              genderFilter === 'All'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            All (تمام)
          </button>

          <button
            type="button"
            id="filter-gender-kid"
            onClick={() => setGenderFilter('Kid')}
            className={`px-3 py-1 rounded-xl transition-all text-xs font-medium flex items-center gap-1 cursor-pointer ${
              genderFilter === 'Kid'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-pink-300/80 hover:text-white hover:bg-pink-500/10'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>Kids (بچے 👶)</span>
          </button>

          <button
            type="button"
            id="filter-gender-female"
            onClick={() => setGenderFilter('Female')}
            className={`px-3 py-1 rounded-xl transition-all text-xs font-medium cursor-pointer ${
              genderFilter === 'Female'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Female (خواتین)
          </button>

          <button
            type="button"
            id="filter-gender-male"
            onClick={() => setGenderFilter('Male')}
            className={`px-3 py-1 rounded-xl transition-all text-xs font-medium cursor-pointer ${
              genderFilter === 'Male'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Male (مردانہ)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredVoices.map((voice: VoiceOption) => {
          const isSelected = selectedVoiceId === voice.id;
          const isKid = voice.gender === 'Kid';
          const isPlaying = playingVoiceId === voice.id;
          const isLoadingSample = loadingVoiceId === voice.id;
          const hasError = sampleError?.voiceId === voice.id;

          return (
            <div
              key={voice.id}
              id={`voice-card-${voice.id}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectVoice(voice.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectVoice(voice.id);
                }
              }}
              className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer select-none ${
                isSelected
                  ? isKid
                    ? 'bg-pink-950/20 border-pink-500/60 shadow-lg shadow-pink-500/10 ring-1 ring-pink-400/50'
                    : 'bg-white/10 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400/40'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
              } ${isPlaying ? 'ring-2 ring-emerald-400/60 border-emerald-500/60' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${voice.avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 relative`}
                    >
                      {isKid ? (
                        <Baby className="w-5 h-5 drop-shadow-sm text-white" />
                      ) : (
                        voice.name[0]
                      )}

                      {/* Playing sound indicator badge on avatar */}
                      {isPlaying && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-md animate-pulse">
                          <Volume2 className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors flex items-center gap-1.5">
                        <span>{voice.name}</span>
                        {isKid && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            Kid
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] font-medium text-indigo-300/90">
                        {voice.accent}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <div
                      className={`w-5 h-5 rounded-full ${
                        isKid ? 'bg-pink-600 shadow-pink-500/50' : 'bg-indigo-600 shadow-indigo-500/50'
                      } flex items-center justify-center shadow-sm shrink-0`}
                    >
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  ) : (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                        isKid
                          ? 'text-pink-300 bg-pink-500/10 border-pink-500/20'
                          : 'text-white/40 bg-white/5 border-white/10'
                      }`}
                    >
                      {voice.ageGroup ? `👶 ${voice.ageGroup}` : voice.gender}
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                  {language === 'urdu'
                    ? voice.urduDescription
                    : language === 'hindi'
                    ? voice.hindiDescription
                    : voice.description}
                </p>

                {/* Error message indicator if sample failed */}
                {hasError && (
                  <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span className="truncate">{sampleError.message}</span>
                  </div>
                )}
              </div>

              {/* Bottom bar with Play Sample button and metadata */}
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2 text-[11px]">
                {/* Dedicated Play Sample Button */}
                <button
                  type="button"
                  id={`play-sample-btn-${voice.id}`}
                  onClick={(e) => handlePlaySample(e, voice)}
                  disabled={isLoadingSample}
                  title={
                    isPlaying
                      ? 'Stop preview'
                      : `Play 5-second sample of ${voice.name}`
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                    isPlaying
                      ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-1 ring-emerald-300 hover:bg-emerald-600'
                      : isLoadingSample
                      ? 'bg-indigo-600/50 text-white/80 cursor-wait'
                      : isKid
                      ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/40 hover:border-pink-400'
                      : 'bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-200 border border-indigo-500/30 hover:border-indigo-400'
                  }`}
                >
                  {isLoadingSample ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[11px]">Loading...</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-white" />
                      <span className="text-[11px]">Stop Sample</span>
                      <span className="flex items-center gap-0.5 ml-1">
                        <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-0.5 h-3.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-0.5 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span className="text-[11px]">Play Sample</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 text-white/40">
                  <span className="flex items-center gap-1 text-white/50 text-[10px]">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                    <span className="truncate max-w-[85px]">{voice.samplePitch}</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400/80 hidden xs:inline">
                    {isKid ? '👶 Child' : 'Neural'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
