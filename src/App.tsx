import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VoiceSelector } from './components/VoiceSelector';
import { StyleSelector } from './components/StyleSelector';
import { EmotionIntensitySelector } from './components/EmotionIntensitySelector';
import { BackgroundMusicSelector } from './components/BackgroundMusicSelector';
import { TextInputArea } from './components/TextInputArea';
import { AudioPlayer } from './components/AudioPlayer';
import { AudioLibrary } from './components/AudioLibrary';
import { BatchProcessing } from './components/BatchProcessing';
import { AIScriptStudio } from './components/AIScriptStudio';
import { AIVoiceTranscriber } from './components/AIVoiceTranscriber';
import { AISubtitlesGenerator } from './components/AISubtitlesGenerator';
import { AIVideoCreator } from './components/AIVideoCreator';
import { AIPoetryStudio } from './components/AIPoetryStudio';
import { AINaatSingingStudio } from './components/AINaatSingingStudio';
import { AIDocumentNarrator } from './components/AIDocumentNarrator';
import { AIVoiceChanger } from './components/AIVoiceChanger';
import { AIVoiceDirector } from './components/AIVoiceDirector';
import { AndroidApkModal } from './components/AndroidApkModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { synchronizeLibrary, isAutoSyncEnabled } from './services/cloudSyncService';
import {
  SupportedLanguage,
  UILanguage,
  SpeechStyle,
  VoiceEmotion,
  GeneratedAudioItem,
  BackgroundMusicConfig,
  StudioTab,
  AITransformOp,
  SubtitleCue,
} from './types';
import { VOICES } from './data/voices';
import { SAMPLE_TEXTS } from './data/sampleTexts';
import { BACKGROUND_MUSIC_TRACKS } from './data/backgroundMusic';
import {
  detectLanguageFromText,
  getLibraryFromDB,
  saveLibraryToDB,
  deleteItemFromDB,
  clearLibraryDB,
} from './utils/audioHelper';
import { mixVoiceAndBackgroundMusic } from './utils/audioMixer';
import { UI_TRANSLATIONS, getStoredUILanguage, setStoredUILanguage } from './utils/uiTranslations';
import {
  AlertCircle,
  Volume2,
  Sparkles,
  Info,
  Mic,
  Layers,
  Music,
  Wand2,
} from 'lucide-react';

export default function App() {
  const [activeStudioTab, setActiveStudioTab] = useState<StudioTab>('single');
  const [uiLanguage, setUiLanguage] = useState<UILanguage>(() => getStoredUILanguage());
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('auto');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('Kore');
  const [selectedStyle, setSelectedStyle] = useState<SpeechStyle>('conversational');
  const [selectedEmotion, setSelectedEmotion] = useState<VoiceEmotion>('neutral');
  const [emotionIntensity, setEmotionIntensity] = useState<number>(50);
  const [vocalPitch, setVocalPitch] = useState<number>(0);
  const [bgMusicConfig, setBgMusicConfig] = useState<BackgroundMusicConfig>({
    trackId: 'none',
    volume: 18,
    autoDucking: true,
  });
  const [text, setText] = useState<string>(
    'ستاروں سے آگے جہاں اور بھی ہیں\nابھی عشق کے امتحاں اور بھی ہیں'
  );
  const [detectedLang, setDetectedLang] = useState<SupportedLanguage>('urdu');

  const handleSelectUILanguage = (lang: UILanguage) => {
    setUiLanguage(lang);
    setStoredUILanguage(lang);
    try {
      document.documentElement.lang = lang === 'urdu' ? 'ur' : lang === 'hindi' ? 'hi' : 'en';
    } catch {}
  };

  useEffect(() => {
    try {
      document.documentElement.lang = uiLanguage === 'urdu' ? 'ur' : uiLanguage === 'hindi' ? 'hi' : 'en';
    } catch {}
  }, [uiLanguage]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [isTranscriberOpen, setIsTranscriberOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeItem, setActiveItem] = useState<GeneratedAudioItem | null>(null);
  const [library, setLibrary] = useState<GeneratedAudioItem[]>([]);
  const [transferredCues, setTransferredCues] = useState<SubtitleCue[]>([]);

  // Load stored clips on mount from IndexedDB and auto-sync with Cloud
  useEffect(() => {
    let isMounted = true;
    getLibraryFromDB()
      .then(async (stored) => {
        if (!isMounted) return;
        if (stored.length > 0) {
          setLibrary(stored);
          setActiveItem(stored[0]);
        }
        // If auto-sync is enabled, sync in background with Cloud/Firebase
        if (isAutoSyncEnabled()) {
          try {
            const syncResult = await synchronizeLibrary(stored);
            if (isMounted && syncResult.success && syncResult.items.length > 0) {
              setLibrary(syncResult.items);
              if (!activeItem && syncResult.items.length > 0) {
                setActiveItem(syncResult.items[0]);
              }
            }
          } catch (syncErr) {
            console.warn('Initial cloud sync silent warning:', syncErr);
          }
        }
      })
      .catch((e) => {
        console.warn('Failed to load library on mount:', e);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update detected language when text changes
  useEffect(() => {
    const lang = detectLanguageFromText(text);
    setDetectedLang(lang);
  }, [text]);

  const handleApplySample = (sampleId: string) => {
    const sample = SAMPLE_TEXTS.find((s) => s.id === sampleId);
    if (!sample) return;
    setText(sample.text);
    setSelectedLanguage(sample.language);
    setSelectedVoiceId(sample.recommendedVoice);
    setSelectedStyle(sample.recommendedStyle);
    // Tailor emotion according to category
    if (sample.category === 'poetry') {
      setSelectedEmotion('dramatic');
      setEmotionIntensity(65);
    } else if (sample.category === 'kids_rhyme') {
      setSelectedEmotion('joyful');
      setEmotionIntensity(75);
    } else if (sample.category === 'kids_story') {
      setSelectedEmotion('joyful');
      setEmotionIntensity(60);
    } else if (sample.category === 'inspiration') {
      setSelectedEmotion('excited');
      setEmotionIntensity(70);
    } else if (sample.category === 'news') {
      setSelectedEmotion('serious');
      setEmotionIntensity(60);
    } else {
      setSelectedEmotion('neutral');
      setEmotionIntensity(50);
    }
    setError(null);
  };

  const handleEnhanceText = async () => {
    if (!text.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/tts/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: selectedLanguage !== 'auto' ? selectedLanguage : detectedLang,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const textErr = await res.text();
        throw new Error(
          res.ok
            ? 'Invalid response received from server.'
            : `Server error (${res.status}): ${textErr.slice(0, 120)}`
        );
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to enhance text rhythm.');
      }
      if (data.enhancedText) {
        setText(data.enhancedText);
      }
    } catch (err: any) {
      console.error('Enhance error:', err);
      setError(err.message || 'Could not enhance text at this moment.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleQuickTransform = async (op: AITransformOp) => {
    if (!text.trim() || isTransforming) return;
    setIsTransforming(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/transform-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          operation: op,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to transform text.');
      }
      if (data.transformedText) {
        setText(data.transformedText);
      }
    } catch (err: any) {
      console.error('Transform error:', err);
      setError(err.message || 'Could not transform text.');
    } finally {
      setIsTransforming(false);
    }
  };

  const handleApplyAIScript = (
    newScript: string,
    config?: {
      voice?: string;
      style?: SpeechStyle;
      emotion?: VoiceEmotion;
      emotionIntensity?: number;
      pitch?: number;
      bgMusicId?: string;
    }
  ) => {
    setText(newScript);
    if (config?.voice) {
      setSelectedVoiceId(config.voice);
    }
    if (config?.style) {
      setSelectedStyle(config.style);
    }
    if (config?.emotion) {
      setSelectedEmotion(config.emotion);
    }
    if (config?.emotionIntensity !== undefined) {
      setEmotionIntensity(config.emotionIntensity);
    }
    if (config?.pitch !== undefined) {
      setVocalPitch(config.pitch);
    }
    if (config?.bgMusicId && config.bgMusicId !== 'none') {
      setBgMusicConfig((prev) => ({
        ...prev,
        trackId: config.bgMusicId!,
      }));
    }
    setActiveStudioTab('single');
    setError(null);
  };

  const handleGenerateVoice = async () => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    const voiceMeta = VOICES.find((v) => v.id === selectedVoiceId) || VOICES[0];

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoiceId,
          language: selectedLanguage !== 'auto' ? selectedLanguage : detectedLang,
          style: selectedStyle,
          emotion: selectedEmotion,
          emotionIntensity,
          pitch: vocalPitch,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const textErr = await res.text();
        throw new Error(
          res.ok
            ? 'Invalid response received from server.'
            : `Server error (${res.status}): ${textErr.slice(0, 120)}`
        );
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Voice generation failed. Please try again.');
      }

      let finalAudioBase64 = data.audioBase64;
      let rawVoiceBase64: string | undefined = undefined;
      let finalDuration = data.durationSeconds || 0;

      // Mix background music if enabled
      if (bgMusicConfig.trackId && bgMusicConfig.trackId !== 'none' && bgMusicConfig.volume > 0) {
        rawVoiceBase64 = data.audioBase64;
        try {
          const mixResult = await mixVoiceAndBackgroundMusic(data.audioBase64, bgMusicConfig);
          if (mixResult && mixResult.mixedBase64) {
            finalAudioBase64 = mixResult.mixedBase64;
            if (mixResult.durationSeconds) {
              finalDuration = mixResult.durationSeconds;
            }
          }
        } catch (mixErr) {
          console.warn('Background music mixing fallback:', mixErr);
        }
      }

      const trackObj = BACKGROUND_MUSIC_TRACKS.find((t) => t.id === bgMusicConfig.trackId);
      const trackName =
        bgMusicConfig.trackId === 'custom'
          ? bgMusicConfig.customAudioName || 'Custom Track'
          : trackObj?.name || bgMusicConfig.trackId;

      const newItem: GeneratedAudioItem = {
        id: `audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text: data.text || text.trim(),
        voice: selectedVoiceId,
        voiceName: voiceMeta.name,
        language: data.language || selectedLanguage,
        style: selectedStyle,
        emotion: data.emotion || selectedEmotion,
        emotionIntensity: data.emotionIntensity !== undefined ? data.emotionIntensity : emotionIntensity,
        pitch: data.pitch !== undefined ? data.pitch : vocalPitch,
        bgMusicTrackId: bgMusicConfig.trackId !== 'none' ? bgMusicConfig.trackId : undefined,
        bgMusicTrackName: bgMusicConfig.trackId !== 'none' ? trackName : undefined,
        bgMusicVolume: bgMusicConfig.trackId !== 'none' ? bgMusicConfig.volume : undefined,
        audioBase64: finalAudioBase64,
        rawVoiceBase64,
        mimeType: data.mimeType || 'audio/wav',
        durationSeconds: finalDuration,
        createdAt: Date.now(),
      };

      const updatedLibrary = [newItem, ...library.filter((i) => i.id !== newItem.id)];
      setLibrary(updatedLibrary);
      saveLibraryToDB(updatedLibrary);
      setActiveItem(newItem);

      if (isAutoSyncEnabled()) {
        synchronizeLibrary(updatedLibrary).catch((syncErr) => {
          console.warn('Auto-sync background warning:', syncErr);
        });
      }
    } catch (err: any) {
      console.error('TTS generation error:', err);
      setError(
        err.message || 'Something went wrong generating audio. Please check connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchAudioGenerated = (item: GeneratedAudioItem) => {
    setLibrary((prev) => {
      // Avoid duplicate by id or text/voice match
      const exists = prev.some((p) => p.id === item.id);
      if (exists) return prev;
      const updated = [item, ...prev];
      saveLibraryToDB(updated);
      if (isAutoSyncEnabled()) {
        synchronizeLibrary(updated).catch((e) => console.warn('Auto-sync warning:', e));
      }
      return updated;
    });
    setActiveItem(item);
  };

  const handleNewGeneratedAudio = (item: GeneratedAudioItem) => {
    handleBatchAudioGenerated(item);
  };

  const handleDeleteLibraryItem = (id: string) => {
    const updated = library.filter((item) => item.id !== id);
    setLibrary(updated);
    deleteItemFromDB(id);
    if (activeItem?.id === id) {
      setActiveItem(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleClearAllLibrary = () => {
    setLibrary([]);
    clearLibraryDB();
    setActiveItem(null);
  };

  const t = UI_TRANSLATIONS[uiLanguage] || UI_TRANSLATIONS.english;
  const effectiveLang: SupportedLanguage = selectedLanguage !== 'auto' ? selectedLanguage : uiLanguage;

  return (
    <div className="min-h-screen bg-[#050507] text-[#e0e0e0] flex flex-col font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background ambient decorative light orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <Header
        uiLanguage={uiLanguage}
        onSelectUILanguage={handleSelectUILanguage}
        currentLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        savedCount={library.length}
        activeStudioTab={activeStudioTab}
        onSelectStudioTab={setActiveStudioTab}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenCloudSyncModal={() => setIsCloudSyncOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Intro banner with Mode Selector */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-indigo-950/20">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 shadow-sm shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className={uiLanguage === 'urdu' ? 'font-urdu' : uiLanguage === 'hindi' ? 'font-hindi' : ''}>
                  {activeStudioTab === 'single'
                    ? t.banner.singleTitle
                    : activeStudioTab === 'voice_director'
                    ? t.banner.directorTitle
                    : activeStudioTab === 'poetry'
                    ? t.banner.poetryTitle
                    : activeStudioTab === 'naat_singing'
                    ? t.banner.naatTitle
                    : activeStudioTab === 'narrator'
                    ? t.banner.narratorTitle
                    : activeStudioTab === 'subtitles'
                    ? t.banner.subtitlesTitle
                    : activeStudioTab === 'video_creator'
                    ? t.banner.videoTitle
                    : activeStudioTab === 'voice_changer'
                    ? t.banner.voiceChangerTitle
                    : activeStudioTab === 'ai_studio'
                    ? t.banner.aiStudioTitle
                    : t.banner.batchTitle}
                </span>
              </h2>
              <p className={`text-xs sm:text-sm text-white/50 mt-1 leading-relaxed max-w-2xl ${uiLanguage === 'urdu' ? 'font-urdu' : uiLanguage === 'hindi' ? 'font-hindi' : ''}`}>
                {activeStudioTab === 'single'
                  ? t.banner.singleDesc
                  : activeStudioTab === 'voice_director'
                  ? t.banner.directorDesc
                  : activeStudioTab === 'poetry'
                  ? t.banner.poetryDesc
                  : activeStudioTab === 'naat_singing'
                  ? t.banner.naatDesc
                  : activeStudioTab === 'narrator'
                  ? t.banner.narratorDesc
                  : activeStudioTab === 'subtitles'
                  ? t.banner.subtitlesDesc
                  : activeStudioTab === 'video_creator'
                  ? t.banner.videoDesc
                  : activeStudioTab === 'voice_changer'
                  ? t.banner.voiceChangerDesc
                  : activeStudioTab === 'ai_studio'
                  ? t.banner.aiStudioDesc
                  : t.banner.batchDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Quick Switch Buttons */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                id="banner-mode-single"
                onClick={() => setActiveStudioTab('single')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeStudioTab === 'single'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{t.common.voiceStudio}</span>
              </button>

              <button
                type="button"
                id="banner-mode-ai"
                onClick={() => setActiveStudioTab('ai_studio')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeStudioTab === 'ai_studio'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-indigo-300 hover:text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{t.common.aiScriptStudio}</span>
              </button>

              <button
                type="button"
                id="banner-mode-batch"
                onClick={() => setActiveStudioTab('batch')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeStudioTab === 'batch'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.common.batchMode}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10 backdrop-blur-md text-xs text-white/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="font-medium text-white/80">{t.common.studioMaster}</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 flex items-start gap-3 text-rose-200 text-xs backdrop-blur-md">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-rose-300">Voice Synthesis Notice:</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white font-bold ml-2 cursor-pointer transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Conditional Tab Rendering */}
        {activeStudioTab === 'voice_director' ? (
          /* Feature 11: AI Voice Prompt Director */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <AIVoiceDirector onAudioGenerated={handleNewGeneratedAudio} />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-rose-400" />
                    <span>Studio Monitor</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>
              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />
            </div>
          </div>
        ) : activeStudioTab === 'poetry' ? (
          /* Feature 7: AI Poetry Tarannum & Melodic Recitation */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <AIPoetryStudio onGenerated={handleNewGeneratedAudio} />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Tarannum Player</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>
              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />
            </div>
          </div>
        ) : activeStudioTab === 'naat_singing' ? (
          /* Feature: AI Naat & Singing Studio with Daf & Melodic BGM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <AINaatSingingStudio onAudioGenerated={handleNewGeneratedAudio} />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-teal-400" />
                    <span>Naat & Vocal Player</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>
              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />
            </div>
          </div>
        ) : activeStudioTab === 'narrator' ? (
          /* Feature 8: AI Long Document & Book Narrator */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <AIDocumentNarrator onAudioGenerated={handleNewGeneratedAudio} />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>Audiobook Monitor</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>
              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />
            </div>
          </div>
        ) : activeStudioTab === 'subtitles' ? (
          /* Feature 4: AI Subtitle & Video Captions Generator */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <AISubtitlesGenerator
                activeAudioItem={activeItem}
                onSendToVideoCreator={(item, cues) => {
                  setActiveItem(item);
                  setTransferredCues(cues);
                  setActiveStudioTab('video_creator');
                }}
              />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    <span>Active Audio Source</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>
              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />
            </div>
          </div>
        ) : activeStudioTab === 'video_creator' ? (
          /* Feature 5: AI Waveform Video Creator */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <AIVideoCreator
                activeAudioItem={activeItem}
                initialCues={transferredCues}
              />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span>Active Audio Track</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>
              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />
            </div>
          </div>
        ) : activeStudioTab === 'voice_changer' ? (
          /* Feature 9: AI Voice Changer & Studio Vocal Effects */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <AIVoiceChanger
                activeAudioItem={activeItem}
                onProcessedAudio={handleNewGeneratedAudio}
              />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-violet-400" />
                    <span>Raw Voice Source</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>
              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />
            </div>
          </div>
        ) : activeStudioTab === 'batch' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Col (8 cols): Batch Processing Queue & Uploader */}
            <div className="lg:col-span-8 space-y-6">
              <BatchProcessing
                onAudioGenerated={handleBatchAudioGenerated}
                defaultVoiceId={selectedVoiceId}
                defaultStyle={selectedStyle}
                defaultLanguage={selectedLanguage}
              />
            </div>

            {/* Right Col (4 cols): Studio Monitor & Recent Library */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span>Studio Monitor</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>

              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />
            </div>
          </div>
        ) : activeStudioTab === 'ai_studio' ? (
          /* AI Script Studio Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Col (7 cols): Full AI Studio */}
            <div className="lg:col-span-7 space-y-6">
              <AIScriptStudio
                currentText={text}
                onApplyScript={handleApplyAIScript}
                selectedLanguage={selectedLanguage}
              />
            </div>

            {/* Right Col (5 cols): Studio Player & Library */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span>Studio Monitor & Download</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>

              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />
            </div>
          </div>
        ) : (
          /* Single Voice Studio Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Voice Customizer & Text Input (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Voice Persona */}
              <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
                <VoiceSelector
                  selectedVoiceId={selectedVoiceId}
                  onSelectVoice={setSelectedVoiceId}
                  language={effectiveLang}
                />
              </div>

              {/* Step 2: Tone & Cadence */}
              <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
                <StyleSelector
                  selectedStyle={selectedStyle}
                  onSelectStyle={setSelectedStyle}
                  language={effectiveLang}
                />
              </div>

              {/* Step 3: Emotional Mood, Pitch & Intensity */}
              <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
                <EmotionIntensitySelector
                  selectedEmotion={selectedEmotion}
                  onSelectEmotion={setSelectedEmotion}
                  intensity={emotionIntensity}
                  onChangeIntensity={setEmotionIntensity}
                  pitch={vocalPitch}
                  onChangePitch={setVocalPitch}
                  language={effectiveLang}
                />
              </div>

              {/* Step 4: Background Music & Soundscapes */}
              <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
                <BackgroundMusicSelector
                  config={bgMusicConfig}
                  onChangeConfig={setBgMusicConfig}
                  language={effectiveLang}
                />
              </div>

              {/* Optional Inline AI Voice Transcriber */}
              {isTranscriberOpen && (
                <div className="animate-in fade-in duration-200">
                  <AIVoiceTranscriber
                    onTranscribeComplete={(transcribed) => {
                      setText(transcribed);
                      setIsTranscriberOpen(false);
                    }}
                  />
                </div>
              )}

              {/* Step 5: Text Input & Generation */}
              <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
                <TextInputArea
                  text={text}
                  onChangeText={setText}
                  detectedLang={detectedLang}
                  selectedLang={selectedLanguage}
                  onGenerate={handleGenerateVoice}
                  isLoading={isLoading}
                  onApplySample={handleApplySample}
                  onEnhanceText={handleEnhanceText}
                  isEnhancing={isEnhancing}
                  onQuickTransform={handleQuickTransform}
                  isTransforming={isTransforming}
                  onOpenScriptStudio={() => setActiveStudioTab('ai_studio')}
                  onToggleTranscriber={() => setIsTranscriberOpen(!isTranscriberOpen)}
                  isTranscriberOpen={isTranscriberOpen}
                />
              </div>
            </div>

            {/* Right Column: Audio Player & Library History (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Current Active Player */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span>Studio Monitor & Download</span>
                  </h2>
                </div>
                <AudioPlayer item={activeItem} />
              </div>

              {/* Audio History Library */}
              <AudioLibrary
                items={library}
                activeItemId={activeItem?.id || null}
                onSelectItem={setActiveItem}
                onDeleteItem={handleDeleteLibraryItem}
                onClearAll={handleClearAllLibrary}
              />

              {/* Natural Voice Quality Tips */}
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-2.5 text-xs text-white/50">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Tips for 100% Natural Speech Synthesis:</span>
                </div>
                <ul className="space-y-2 pl-4 list-disc text-white/50 leading-relaxed">
                  <li>
                    <strong className="text-white/80">Punctuation Matters:</strong> Use commas (، / ,) and full stops (۔ / .) to trigger natural diaphragmatic breathing pauses.
                  </li>
                  <li>
                    <strong className="text-white/80">Tone Match:</strong> Choose &apos;Storytelling&apos; for audiobooks, &apos;Poetic&apos; for Urdu Shayari, or &apos;Conversational&apos; for daily messaging.
                  </li>
                  <li>
                    <strong className="text-white/80">Lossless Master:</strong> Downloaded WAV files are uncompressed and ready for YouTube, podcasts, reels, and video voiceovers.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Android APK & PWA Install Modal */}
      <AndroidApkModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Cross-Device Firebase & Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        uiLanguage={uiLanguage}
        localLibrary={library}
        onLibraryUpdated={(newItems) => {
          setLibrary(newItems);
          if (newItems.length > 0 && !activeItem) {
            setActiveItem(newItems[0]);
          }
        }}
      />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl py-5 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Awaaz AI — Urdu, English & Hindi Human Speech Synthesis Studio</p>
          <div className="flex items-center gap-3 font-medium text-white/50">
            <span>Lossless WAV Export</span>
            <span>•</span>
            <span>24kHz Studio Master</span>
            <span>•</span>
            <span>Multilingual Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
