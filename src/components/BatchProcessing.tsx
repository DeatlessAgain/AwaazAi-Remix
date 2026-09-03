import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Layers,
  Sparkles,
  Play,
  Pause,
  Download,
  Trash2,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Archive,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Volume2,
  Music,
} from 'lucide-react';
import {
  BatchTextItem,
  GeneratedAudioItem,
  SupportedLanguage,
  SpeechStyle,
  VoiceOption,
} from '../types';
import { VOICES, SPEECH_STYLES } from '../data/voices';
import { BACKGROUND_MUSIC_TRACKS } from '../data/backgroundMusic';
import {
  detectLanguageFromText,
  downloadAudioFile,
  downloadBatchAsZip,
  parseBatchFileInput,
  formatSeconds,
  base64ToBlobUrl,
} from '../utils/audioHelper';
import { mixVoiceAndBackgroundMusic } from '../utils/audioMixer';

interface BatchProcessingProps {
  onAudioGenerated: (item: GeneratedAudioItem) => void;
  defaultVoiceId: string;
  defaultStyle: SpeechStyle;
  defaultLanguage: SupportedLanguage;
}

const SAMPLE_BATCH_PRESETS: { title: string; desc: string; items: string[] }[] = [
  {
    title: 'Kids Poems & Rhymes (بچوں کی نظمیں اور لوریاں 👶)',
    desc: 'Adorable nursery rhymes in Urdu, Hindi & English for children voices',
    items: [
      'مچھلی جل کی رانی ہے، جیون اس کا پانی ہے۔ ہاتھ لگاؤ گے تو ڈر جائے گی، باہر نکالو گے تو مر جائے گی!',
      'تتلی اڑی، بس پر چڑھی، سیٹ نہ ملی تو رونے لگی۔ ڈرائیور نے بولا آجا میرے پاس، تتلی بولی نا بابا نا!',
      'चंदा मामा दूर के, पुए पकाएं बूर के। आप खाएं थाली में, मुन्ने को दें प्याली में!',
      'Twinkle, twinkle, little star, how I wonder what you are! Up above the world so high, like a diamond in the sky.'
    ]
  },
  {
    title: 'Urdu & Hindi Poetry & Prose (مشاعرہ و کہانیاں)',
    desc: '3 authentic multi-lingual scripts with distinct emotive tones',
    items: [
      'ستاروں سے آگے جہاں اور بھی ہیں، ابھی عشق کے امتحاں اور بھی ہیں۔',
      'لہلہاتے ہوئے کھیتوں میں صبح کی پہلی کرن زندگی کا نیا پیغام لے کر آتی ہے۔',
      'कौशिश करने वालों की कभी हार नहीं होती, लहरों से डर कर नौका पार नहीं होती।'
    ]
  },
  {
    title: 'Multi-lingual News & Media Bulletin (خبریں اور اعلانات)',
    desc: 'Professional broadcast voiceovers in Urdu, English and Hindi',
    items: [
      'Good evening. Welcome to the prime news broadcast with live international updates.',
      'آج کے اہم ترین تجارتی اور موسمیاتی اعلانات کے ساتھ ہم حاضر ہیں۔',
      'आज के मौसम समाचार में उत्तर भारत में हल्की बारिश की संभावना जताई गई है।'
    ]
  },
  {
    title: 'English Story & Narration',
    desc: 'Expressive audiobook and video storytelling paragraphs',
    items: [
      'The morning mist hovered quietly over the enchanted forest, waiting for the sun to rise.',
      'With a deep breath and relentless courage, she stepped through the ancient doorway into the unknown.',
      'Technology and human imagination together create the stories that shape our collective future.'
    ]
  }
];

export const BatchProcessing: React.FC<BatchProcessingProps> = ({
  onAudioGenerated,
  defaultVoiceId,
  defaultStyle,
  defaultLanguage,
}) => {
  const [items, setItems] = useState<BatchTextItem[]>([
    {
      id: 'batch-init-1',
      text: 'ستاروں سے آگے جہاں اور بھی ہیں، ابھی عشق کے امتحاں اور بھی ہیں۔',
      voice: 'Kore',
      style: 'poetic',
      language: 'urdu',
      status: 'pending'
    },
    {
      id: 'batch-init-2',
      text: 'कौशिश करने वालों की कभी हार नहीं होती, लहरों से डर कर नौका पार नहीं होती।',
      voice: 'Charon',
      style: 'poetic',
      language: 'hindi',
      status: 'pending'
    },
    {
      id: 'batch-init-3',
      text: 'Welcome to Awaaz AI Studio. High-fidelity speech synthesis designed for natural human storytelling.',
      voice: 'Aoede',
      style: 'conversational',
      language: 'english',
      status: 'pending'
    }
  ]);

  const [inputMode, setInputMode] = useState<'upload' | 'paste' | 'preset'>('upload');
  const [rawPastedText, setRawPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isZipping, setIsZipping] = useState(false);
  const [batchVoice, setBatchVoice] = useState(defaultVoiceId || 'Kore');
  const [batchStyle, setBatchStyle] = useState<SpeechStyle>(defaultStyle || 'conversational');
  const [batchLanguage, setBatchLanguage] = useState<SupportedLanguage>(defaultLanguage || 'auto');
  const [batchBgmTrack, setBatchBgmTrack] = useState<string>('none');
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [activeAudioObj, setActiveAudioObj] = useState<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRequestedRef = useRef(false);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioObj) {
        activeAudioObj.pause();
      }
    };
  }, [activeAudioObj]);

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileType = fileName.endsWith('.json')
      ? 'json'
      : fileName.endsWith('.csv')
      ? 'csv'
      : 'txt';

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const parsedLines = parseBatchFileInput(content, fileType);
      if (parsedLines.length === 0) {
        alert('No valid text lines found in file. Please ensure text is separated by lines.');
        return;
      }

      const newBatchItems: BatchTextItem[] = parsedLines.map((line, idx) => ({
        id: `batch-${Date.now()}-${idx}`,
        text: line,
        voice: batchVoice,
        style: batchStyle,
        language: detectLanguageFromText(line),
        status: 'pending'
      }));

      setItems((prev) => [...prev, ...newBatchItems]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Add Pasted Lines
  const handleAddPastedLines = () => {
    if (!rawPastedText.trim()) return;
    const lines = parseBatchFileInput(rawPastedText, 'txt');
    if (lines.length === 0) return;

    const newItems: BatchTextItem[] = lines.map((line, idx) => ({
      id: `batch-paste-${Date.now()}-${idx}`,
      text: line,
      voice: batchVoice,
      style: batchStyle,
      language: detectLanguageFromText(line),
      status: 'pending'
    }));

    setItems((prev) => [...prev, ...newItems]);
    setRawPastedText('');
  };

  // Load Preset
  const handleLoadPreset = (presetItems: string[]) => {
    const newItems: BatchTextItem[] = presetItems.map((line, idx) => ({
      id: `batch-preset-${Date.now()}-${idx}`,
      text: line,
      voice: batchVoice,
      style: batchStyle,
      language: detectLanguageFromText(line),
      status: 'pending'
    }));
    setItems(newItems);
  };

  // Apply default voice/style to all pending items
  const handleApplyDefaultsToAll = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        voice: batchVoice,
        style: batchStyle,
        language: batchLanguage !== 'auto' ? batchLanguage : detectLanguageFromText(item.text)
      }))
    );
  };

  // Add single empty row
  const handleAddEmptyRow = () => {
    const newItem: BatchTextItem = {
      id: `batch-manual-${Date.now()}`,
      text: '',
      voice: batchVoice,
      style: batchStyle,
      language: 'auto',
      status: 'pending'
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Update specific item text
  const handleUpdateItemText = (id: string, newText: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              text: newText,
              language: detectLanguageFromText(newText)
            }
          : item
      )
    );
  };

  // Update item voice
  const handleUpdateItemVoice = (id: string, voice: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, voice } : item))
    );
  };

  // Update item style
  const handleUpdateItemStyle = (id: string, style: SpeechStyle) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, style } : item))
    );
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all
  const handleClearAll = () => {
    if (isProcessing) return;
    if (activeAudioObj) {
      activeAudioObj.pause();
      setCurrentlyPlayingId(null);
    }
    setItems([]);
  };

  // Run Batch Generation
  const handleStartBatch = async () => {
    if (isProcessing || items.length === 0) return;

    setIsProcessing(true);
    cancelRequestedRef.current = false;

    for (let i = 0; i < items.length; i++) {
      if (cancelRequestedRef.current) {
        break;
      }

      const item = items[i];
      if (item.status === 'completed' && item.result) {
        continue;
      }

      if (!item.text.trim()) {
        continue;
      }

      setCurrentIndex(i);

      // Update status to processing
      setItems((prev) =>
        prev.map((t, idx) => (idx === i ? { ...t, status: 'processing', error: undefined } : t))
      );

      try {
        const itemLanguage = item.language || detectLanguageFromText(item.text);
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: item.text.trim(),
            voice: item.voice || batchVoice || 'Kore',
            language: itemLanguage,
            style: item.style || batchStyle || 'conversational',
            emotion: 'neutral',
            emotionIntensity: 50,
          })
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

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Speech generation failed');
        }

        let finalAudioBase64 = data.audioBase64;
        let rawVoiceBase64: string | undefined = undefined;
        let finalDuration = data.durationSeconds || 0;

        if (batchBgmTrack && batchBgmTrack !== 'none') {
          rawVoiceBase64 = data.audioBase64;
          try {
            const trackObj = BACKGROUND_MUSIC_TRACKS.find((t) => t.id === batchBgmTrack);
            const mixResult = await mixVoiceAndBackgroundMusic(data.audioBase64, {
              trackId: batchBgmTrack,
              volume: trackObj?.defaultVolume || 18,
              autoDucking: true,
            });
            if (mixResult && mixResult.mixedBase64) {
              finalAudioBase64 = mixResult.mixedBase64;
              if (mixResult.durationSeconds) finalDuration = mixResult.durationSeconds;
            }
          } catch (mixErr) {
            console.warn('Batch BGM mix error:', mixErr);
          }
        }

        const voiceOption = VOICES.find((v) => v.id === data.voice);
        const bgmTrackObj = BACKGROUND_MUSIC_TRACKS.find((t) => t.id === batchBgmTrack);

        const generatedAudio: GeneratedAudioItem = {
          id: `audio-${Date.now()}-${i}`,
          text: data.text,
          voice: data.voice,
          voiceName: voiceOption ? voiceOption.name : data.voice,
          language: data.language,
          style: data.style,
          bgMusicTrackId: batchBgmTrack !== 'none' ? batchBgmTrack : undefined,
          bgMusicTrackName: batchBgmTrack !== 'none' ? bgmTrackObj?.name : undefined,
          bgMusicVolume: batchBgmTrack !== 'none' ? (bgmTrackObj?.defaultVolume || 18) : undefined,
          audioBase64: finalAudioBase64,
          rawVoiceBase64,
          mimeType: data.mimeType || 'audio/wav',
          durationSeconds: finalDuration,
          createdAt: Date.now()
        };

        // Notify parent library
        onAudioGenerated(generatedAudio);

        // Update item status
        setItems((prev) =>
          prev.map((t, idx) =>
            idx === i
              ? {
                  ...t,
                  status: 'completed',
                  result: generatedAudio
                }
              : t
          )
        );
      } catch (err: any) {
        console.error(`Batch item ${i} failed:`, err);
        setItems((prev) =>
          prev.map((t, idx) =>
            idx === i
              ? {
                  ...t,
                  status: 'error',
                  error: err.message || 'Generation failed'
                }
              : t
          )
        );
      }

      // Brief delay between requests to be gentle on connection
      await new Promise((r) => setTimeout(r, 400));
    }

    setIsProcessing(false);
    setCurrentIndex(-1);
  };

  // Stop Batch
  const handleStopBatch = () => {
    cancelRequestedRef.current = true;
    setIsProcessing(false);
    setCurrentIndex(-1);
  };

  // Play/pause preview for single batch item
  const handleTogglePlayItem = (item: BatchTextItem) => {
    if (!item.result) return;

    if (currentlyPlayingId === item.id && activeAudioObj) {
      activeAudioObj.pause();
      setCurrentlyPlayingId(null);
      return;
    }

    if (activeAudioObj) {
      activeAudioObj.pause();
    }

    const audioUrl = base64ToBlobUrl(item.result.audioBase64, item.result.mimeType);
    const audio = new Audio(audioUrl);
    audio.onended = () => setCurrentlyPlayingId(null);
    audio.onerror = () => setCurrentlyPlayingId(null);
    audio.play();
    setActiveAudioObj(audio);
    setCurrentlyPlayingId(item.id);
  };

  // Download All as ZIP
  const handleDownloadAllZip = async () => {
    const completedItems = items
      .filter((i) => i.status === 'completed' && i.result)
      .map((i) => i.result as GeneratedAudioItem);

    if (completedItems.length === 0) {
      alert('Please generate audio clips before downloading.');
      return;
    }

    try {
      setIsZipping(true);
      await downloadBatchAsZip(completedItems, `awaaz-ai-batch-${Date.now()}.zip`);
    } catch (e) {
      console.error('ZIP generation failed:', e);
      alert('Failed to package ZIP. Downloading files individually.');
      completedItems.forEach((item, idx) => {
        setTimeout(() => {
          downloadAudioFile(item.audioBase64, `clip-${idx + 1}-${item.voice}.wav`, item.mimeType);
        }, idx * 300);
      });
    } finally {
      setIsZipping(false);
    }
  };

  // Bulk download individual files
  const handleBulkDownloadIndividual = () => {
    const completedItems = items
      .filter((i) => i.status === 'completed' && i.result)
      .map((i) => i.result as GeneratedAudioItem);

    if (completedItems.length === 0) return;

    completedItems.forEach((item, idx) => {
      setTimeout(() => {
        downloadAudioFile(item.audioBase64, `clip-${idx + 1}-${item.voice}.wav`, item.mimeType);
      }, idx * 250);
    });
  };

  return (
    <div className="space-y-6">
      {/* Batch Setup Banner */}
      <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Batch Processing & Bulk Audio Studio</span>
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Bulk .WAV & ZIP
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Upload text files (.txt, .csv, .json) or paste multiple scripts to generate all voices in one queue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              id="batch-mode-upload"
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>

            <button
              type="button"
              id="batch-mode-paste"
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                inputMode === 'paste'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Lines</span>
            </button>

            <button
              type="button"
              id="batch-mode-preset"
              onClick={() => setInputMode('preset')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                inputMode === 'preset'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Batch</span>
            </button>
          </div>
        </div>

        {/* Input Mode Content */}
        {inputMode === 'upload' && (
          <div className="space-y-3">
            <label
              htmlFor="batch-file-input"
              className="border-2 border-dashed border-white/15 hover:border-indigo-500/60 bg-white/5 hover:bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-white">
                Click or Drag & Drop Script File (.txt, .csv, .json)
              </p>
              <p className="text-xs text-white/40 mt-1">
                Each line or paragraph will be parsed into a separate voice clip queue item.
              </p>
              <input
                id="batch-file-input"
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {inputMode === 'paste' && (
          <div className="space-y-3">
            <textarea
              id="batch-paste-textarea"
              value={rawPastedText}
              onChange={(e) => setRawPastedText(e.target.value)}
              placeholder="Paste multiple sentences or paragraphs here (one per line)...&#10;Line 1: یہ پہلا اردو جملہ ہے۔&#10;Line 2: यह दूसरा हिंदी वाक्य है।&#10;Line 3: This is the third English line."
              className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 resize-y"
            />
            <div className="flex justify-end">
              <button
                type="button"
                id="add-pasted-lines-btn"
                onClick={handleAddPastedLines}
                disabled={!rawPastedText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Parse & Add to Queue ({rawPastedText.split('\n').filter(Boolean).length} lines)</span>
              </button>
            </div>
          </div>
        )}

        {inputMode === 'preset' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_BATCH_PRESETS.map((preset, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white mb-1">{preset.title}</h4>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-3">
                    {preset.desc}
                  </p>
                </div>
                <button
                  type="button"
                  id={`load-batch-preset-${idx}`}
                  onClick={() => handleLoadPreset(preset.items)}
                  className="w-full py-1.5 rounded-xl bg-white/10 hover:bg-indigo-600 hover:text-white text-indigo-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Load {preset.items.length} Clips</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Global Batch Controls Bar */}
        <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-white/40 text-[11px] uppercase tracking-wider">Default Voice:</span>
              <select
                id="batch-default-voice-select"
                value={batchVoice}
                onChange={(e) => setBatchVoice(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id} className="bg-stone-900 text-white">
                    {v.name} ({v.gender}, {v.accent})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-white/40 text-[11px] uppercase tracking-wider">Default Style:</span>
              <select
                id="batch-default-style-select"
                value={batchStyle}
                onChange={(e) => setBatchStyle(e.target.value as SpeechStyle)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {SPEECH_STYLES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-stone-900 text-white">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-white/40 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Music className="w-3 h-3 text-amber-400" />
                <span>BGM:</span>
              </span>
              <select
                id="batch-default-bgm-select"
                value={batchBgmTrack}
                onChange={(e) => setBatchBgmTrack(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {BACKGROUND_MUSIC_TRACKS.map((t) => (
                  <option key={t.id} value={t.id} className="bg-stone-900 text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              id="apply-defaults-all-btn"
              onClick={handleApplyDefaultsToAll}
              title="Apply selected voice and style to all items in list"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Apply to All Rows</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="add-single-row-btn"
              onClick={handleAddEmptyRow}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>

            <button
              type="button"
              id="clear-batch-queue-btn"
              onClick={handleClearAll}
              disabled={isProcessing || items.length === 0}
              className="px-3 py-1.5 rounded-xl text-white/40 hover:text-rose-400 hover:bg-white/5 transition-all flex items-center gap-1 disabled:opacity-30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Batch Actions Bar */}
      <div className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">
                Queue Status: {completedCount}/{items.length} Ready
              </span>
              {pendingCount > 0 && (
                <span className="text-white/40 font-mono">({pendingCount} pending)</span>
              )}
              {errorCount > 0 && (
                <span className="text-rose-400 font-bold">({errorCount} failed)</span>
              )}
            </div>
            <span className="font-mono font-bold text-indigo-300">{progressPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          {isProcessing ? (
            <button
              type="button"
              id="stop-batch-btn"
              onClick={handleStopBatch}
              className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Batch Queue</span>
            </button>
          ) : (
            <button
              type="button"
              id="start-batch-btn"
              onClick={handleStartBatch}
              disabled={items.length === 0}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:brightness-110 text-white font-bold text-xs transition-all shadow-xl shadow-indigo-500/25 disabled:opacity-40 disabled:hover:brightness-100 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Generate All Audio Clips ({items.length})</span>
            </button>
          )}

          {/* Bulk Download ZIP Button */}
          <button
            type="button"
            id="bulk-download-zip-btn"
            onClick={handleDownloadAllZip}
            disabled={completedCount === 0 || isZipping}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-lg shadow-black/20"
            title="Download all generated audio files inside a single .ZIP archive"
          >
            {isZipping ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <Archive className="w-4 h-4 text-indigo-300" />
            )}
            <span>Download All as ZIP ({completedCount})</span>
          </button>

          {/* Bulk Download Individual */}
          <button
            type="button"
            id="bulk-download-wav-btn"
            onClick={handleBulkDownloadIndividual}
            disabled={completedCount === 0}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
            title="Download all generated .WAV files individually"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Items Table / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs uppercase tracking-widest font-bold text-white/50">
            Batch Items Queue ({items.length})
          </h3>
          <span className="text-xs text-white/40">
            Customize per-item voice persona and tone
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-white/10 bg-white/5 text-white/40 backdrop-blur-xl">
            <Layers className="w-8 h-8 mx-auto text-indigo-400/60 mb-2" />
            <p className="text-sm font-semibold text-white">Queue is empty</p>
            <p className="text-xs text-white/40 mt-1">
              Upload a script file, paste lines, or load a sample batch to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {items.map((item, idx) => {
              const isCurrent = isProcessing && currentIndex === idx;
              const isUrdu = item.language === 'urdu' || detectLanguageFromText(item.text) === 'urdu';
              const isPlaying = currentlyPlayingId === item.id;

              return (
                <div
                  key={item.id}
                  id={`batch-row-${item.id}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : item.status === 'completed'
                      ? 'bg-white/5 border-white/10 hover:border-white/20'
                      : item.status === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Left: Index & Script input */}
                  <div className="flex items-start gap-3 flex-1 w-full">
                    <span className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-white/60 shrink-0 mt-1">
                      {idx + 1}
                    </span>

                    <div className="flex-1 space-y-1.5 w-full">
                      <textarea
                        value={item.text}
                        onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                        placeholder="Enter text script..."
                        rows={2}
                        className={`w-full bg-black/20 border border-white/5 hover:border-white/15 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-y ${
                          isUrdu ? 'font-urdu text-sm' : ''
                        }`}
                      />

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/5 uppercase font-medium">
                          {item.language || detectLanguageFromText(item.text)}
                        </span>
                        <span className="text-white/30 font-mono">
                          {item.text.length} chars
                        </span>
                        {item.error && (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {item.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Voice & Style selectors */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Voice selector */}
                    <select
                      value={item.voice || batchVoice}
                      onChange={(e) => handleUpdateItemVoice(item.id, e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {VOICES.map((v) => (
                        <option key={v.id} value={v.id} className="bg-stone-900 text-white">
                          {v.name}
                        </option>
                      ))}
                    </select>

                    {/* Style selector */}
                    <select
                      value={item.style || batchStyle}
                      onChange={(e) => handleUpdateItemStyle(item.id, e.target.value as SpeechStyle)}
                      className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {SPEECH_STYLES.map((s) => (
                        <option key={s.id} value={s.id} className="bg-stone-900 text-white">
                          {s.label.split(' ')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {item.status === 'processing' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Synthesizing...</span>
                      </div>
                    )}

                    {item.status === 'completed' && item.result && (
                      <div className="flex items-center gap-1.5">
                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          id={`play-batch-item-${item.id}`}
                          onClick={() => handleTogglePlayItem(item)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isPlaying
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/50 scale-105'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                          title={isPlaying ? 'Pause' : 'Play audio preview'}
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Download Item Button */}
                        <button
                          type="button"
                          id={`download-batch-item-${item.id}`}
                          onClick={() =>
                            downloadAudioFile(
                              item.result!.audioBase64,
                              `clip-${idx + 1}-${item.voice}.wav`,
                              item.result!.mimeType
                            )
                          }
                          className="p-2 rounded-full bg-white/5 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-white/10 transition-all cursor-pointer"
                          title="Download .wav audio"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-[11px] font-mono text-white/40">
                          {formatSeconds(item.result.durationSeconds)}
                        </span>
                      </div>
                    )}

                    {item.status === 'error' && (
                      <button
                        type="button"
                        onClick={handleStartBatch}
                        className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-medium border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}

                    {item.status === 'pending' && (
                      <span className="text-[11px] text-white/40 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                        Pending
                      </span>
                    )}

                    {/* Delete item */}
                    <button
                      type="button"
                      id={`delete-batch-row-${item.id}`}
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={isCurrent}
                      className="p-2 text-white/30 hover:text-rose-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-20"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
