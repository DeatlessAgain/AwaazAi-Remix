import React, { useState } from 'react';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Play,
  Pause,
  Download,
  CheckCircle,
  Clock,
  RefreshCw,
  Layers,
  Sparkles,
  Archive,
  Volume2,
  ListOrdered,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  DocumentChapter,
  DocumentProject,
  GeneratedAudioItem,
  SpeechStyle,
  VoiceEmotion,
} from '../types';
import { VOICES } from '../data/voices';
import { mixVoiceAndBackgroundMusic } from '../utils/audioMixer';

interface AIDocumentNarratorProps {
  onAudioGenerated?: (item: GeneratedAudioItem) => void;
}

export const AIDocumentNarrator: React.FC<AIDocumentNarratorProps> = ({
  onAudioGenerated,
}) => {
  const [documentTitle, setDocumentTitle] = useState<string>('داستانِ بہار و خزاں (Audiobook)');
  const [rawText, setRawText] = useState<string>(
    `باب اول: سفر کا آغاز
پرانے وقتوں کی بات ہے کہ ایک دور دراز خوبصورت وادی میں ایک دانشمند بزرگ رہتے تھے۔ وہ ہر روز صبح سویرے اٹھتے اور پرندوں کی نغمگی سن کر قدرت کے حسین نظاروں پر غور کرتے۔ ایک دن انہوں نے گاؤں کے نوجوانوں کو جمع کیا اور کہا کہ علم و حکمت کا اصل سفر انسان کے اپنے اندر سے شروع ہوتا ہے۔

باب دوم: پہاڑوں کا راز
جب نوجوان قافلہ پہاڑوں کے دامن میں پہنچا تو سورج کی کرنیں برف پوش چوٹیوں پر سونا بکھیر رہی تھیں۔ راستے کٹھن اور دشوار گزار تھے، مگر ان کے دلوں میں سچائی کی تلاش کا جذبہ روشن تھا۔ ہر موڑ پر ایک نیا امتحان ان کا منتظر تھا۔

باب سوم: منزل کی نوید
کئی دنوں کی مسافت کے بعد بالآخر وہ اس پراسرار جھیل کے کنارے پہنچ گئے جس کے بارے میں پرانی کتابوں میں لکھا تھا۔ جھیل کا پانی آئینے کی طرح شفاف تھا جس میں نیلے آسمان کا عکس نظر آتا تھا۔`
  );

  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [project, setProject] = useState<DocumentProject | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('Charon');
  const [selectedStyle, setSelectedStyle] = useState<SpeechStyle>('warm_story');
  const [selectedEmotion, setSelectedEmotion] = useState<VoiceEmotion>('neutral');
  const [selectedBgmId, setSelectedBgmId] = useState<string>('calm_lofi');
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(-1);
  const [playingChapterId, setPlayingChapterId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // File Upload Reader (.txt, .md, text extraction)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
  };

  // Run AI Chapter Segmentation
  const handleParseChapters = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rawText.trim(),
          documentTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to segment document into chapters.');
      }

      if (data.project) {
        setProject(data.project);
        setSelectedVoiceId(data.project.selectedVoiceId || 'Charon');
        setSelectedStyle(data.project.selectedStyle || 'warm_story');
        setSelectedEmotion(data.project.selectedEmotion || 'neutral');
        setSelectedBgmId(data.project.bgMusicTrackId || 'calm_lofi');
      }
    } catch (err: any) {
      console.error('Parse document error:', err);
      setError(err.message || 'Error parsing document.');
    } finally {
      setIsParsing(false);
    }
  };

  // Generate a single chapter
  const generateChapterAudio = async (chapter: DocumentChapter): Promise<GeneratedAudioItem> => {
    const res = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: chapter.content,
        voice: selectedVoiceId,
        language: 'auto',
        style: selectedStyle,
        emotion: selectedEmotion,
        emotionIntensity: 50,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || `Failed to narrate chapter ${chapter.chapterNumber}`);
    }

    let finalAudioBase64 = data.audioBase64;
    const rawVoiceBase64 = data.audioBase64;

    if (selectedBgmId && selectedBgmId !== 'none') {
      try {
        const mixRes = await mixVoiceAndBackgroundMusic(rawVoiceBase64, {
          trackId: selectedBgmId,
          volume: 15,
          autoDucking: true,
        });
        if (mixRes && mixRes.mixedBase64) {
          finalAudioBase64 = mixRes.mixedBase64;
        }
      } catch (e) {
        console.warn('BGM mixing note in narrator:', e);
      }
    }

    const voiceObj = VOICES.find((v) => v.id === selectedVoiceId);

    const item: GeneratedAudioItem = {
      id: `doc_${chapter.id}_${Date.now()}`,
      text: chapter.content,
      voice: selectedVoiceId,
      voiceName: voiceObj?.name || selectedVoiceId,
      language: 'urdu',
      style: selectedStyle,
      emotion: selectedEmotion,
      bgMusicTrackId: selectedBgmId,
      audioBase64: finalAudioBase64,
      rawVoiceBase64,
      mimeType: 'audio/wav',
      durationSeconds: data.durationSeconds || 10,
      createdAt: Date.now(),
    };

    return item;
  };

  // Start Batch Generation of all pending chapters
  const handleStartBatchNarration = async () => {
    if (!project || project.chapters.length === 0) return;
    setIsProcessingQueue(true);
    setError(null);

    const updatedChapters = [...project.chapters];

    for (let i = 0; i < updatedChapters.length; i++) {
      if (updatedChapters[i].status === 'completed' && updatedChapters[i].audioResult) {
        continue;
      }
      setCurrentChapterIndex(i);
      updatedChapters[i].status = 'processing';
      setProject({ ...project, chapters: [...updatedChapters] });

      try {
        const audioItem = await generateChapterAudio(updatedChapters[i]);
        updatedChapters[i].status = 'completed';
        updatedChapters[i].audioResult = audioItem;
        if (onAudioGenerated) onAudioGenerated(audioItem);
      } catch (err: any) {
        updatedChapters[i].status = 'error';
        updatedChapters[i].error = err.message || 'Failed to narrate.';
      }
      setProject({ ...project, chapters: [...updatedChapters] });
    }

    setIsProcessingQueue(false);
    setCurrentChapterIndex(-1);
  };

  // Export full audiobook as ZIP archive
  const handleDownloadAudiobookZip = async () => {
    if (!project) return;
    const completedChapters = project.chapters.filter((c) => c.status === 'completed' && c.audioResult);
    if (completedChapters.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(project.title.replace(/[/\\?%*:|"<>]/g, '_')) || zip;

      // Add playlist manifest
      let manifest = `# ${project.title}\nNarrator: ${selectedVoiceId}\nTotal Chapters: ${completedChapters.length}\n\n`;

      completedChapters.forEach((ch, idx) => {
        const chNum = String(idx + 1).padStart(2, '0');
        const filename = `Chapter_${chNum}_${ch.title.replace(/[/\\?%*:|"<>]/g, '_')}.wav`;
        manifest += `${chNum}. ${ch.title} (${ch.audioResult?.durationSeconds.toFixed(1)}s)\n`;

        if (ch.audioResult?.audioBase64) {
          const binary = atob(ch.audioResult.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let b = 0; b < binary.length; b++) {
            bytes[b] = binary.charCodeAt(b);
          }
          folder.file(filename, bytes);
        }
      });

      folder.file('Playlist_Metadata.txt', manifest);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/[/\\?%*:|"<>]/g, '_')}_Audiobook.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (zipErr) {
      console.error('ZIP export error:', zipErr);
      setError('Failed to build Audiobook ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = project ? project.chapters.filter((c) => c.status === 'completed').length : 0;
  const totalCount = project ? project.chapters.length : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-indigo-950/40 border border-amber-500/20 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  AI Long Document & Book Narrator (پی ڈی ایف و آڈیو بک اسٹوڈیو)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Audiobook • Chapters • ZIP
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Upload long manuscripts, novels, PDFs or reports. AI automatically segments chapters, formats natural pauses, and narrators the complete audiobook.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {project && completedCount > 0 && (
              <button
                type="button"
                id="btn-download-audiobook-zip"
                onClick={handleDownloadAudiobookZip}
                disabled={isZipping}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Archive className="w-4 h-4" />
                <span>{isZipping ? 'Zipping...' : `Download Audiobook ZIP (${completedCount}/${totalCount})`}</span>
              </button>
            )}
            <button
              type="button"
              id="btn-parse-chapters"
              onClick={handleParseChapters}
              disabled={isParsing || !rawText.trim()}
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
              <span>{isParsing ? 'Segmenting Chapters...' : 'Parse & Build Chapters'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Main Grid: Document Input vs Chapter Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Manuscript Input & Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Audiobook / Document Title</label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g. My History of Pakistan (Audiobook)"
                className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Drag and Drop or File Upload Box */}
            <label className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-dashed border-white/15 hover:border-amber-400 hover:bg-white/10 transition-all cursor-pointer text-center space-y-1">
              <UploadCloud className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-semibold text-white">Upload File (.TXT, .MD, .DOC)</span>
              <span className="text-[10px] text-white/40">Or paste raw document text below</span>
              <input type="file" accept=".txt,.md,.text" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/70">Raw Manuscript Text</label>
                <span className="text-[11px] text-white/40 font-mono">
                  {rawText.trim().split(/\s+/).filter(Boolean).length} Words
                </span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                placeholder="Paste the full text of your book or document..."
                className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/15 text-xs text-white/90 font-mono leading-relaxed focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Narrator Voice Settings */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Narrator Voice Profile</label>
                <select
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Charon">Charon (Deep Authoritative Baritone Male)</option>
                  <option value="Fenrir">Fenrir (Dramatic Classic Storyteller Male)</option>
                  <option value="Kore">Kore (Warm Soothing Literary Female)</option>
                  <option value="Aoede">Aoede (Delicate Gentle Female)</option>
                  <option value="Zephyr">Zephyr (Engaging Dynamic Female)</option>
                  <option value="Puck">Puck (Young Lively Male)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Style</label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="warm_story">Warm Storyteller</option>
                    <option value="conversational">Conversational</option>
                    <option value="news_anchor">Formal Documentary</option>
                    <option value="poetic">Poetic Literary</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Ambience Music</label>
                  <select
                    value={selectedBgmId}
                    onChange={(e) => setSelectedBgmId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="calm_lofi">Calm Piano & Ambient</option>
                    <option value="cinematic_drama">Cinematic Drama Strings</option>
                    <option value="sufi_flute">Sufi Flute & Rabab</option>
                    <option value="none">No Music (Pure Voice)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chapters Generation Pipeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-amber-400" />
                  <span>Chapter Narration Pipeline</span>
                </h3>
                {project && (
                  <p className="text-xs text-white/50">
                    {project.chapters.length} Chapters • {project.totalWords} Total Words
                  </p>
                )}
              </div>

              {project && (
                <button
                  type="button"
                  id="btn-start-batch-narration"
                  onClick={handleStartBatchNarration}
                  disabled={isProcessingQueue}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isProcessingQueue ? 'Narrating Queue...' : 'Narrate All Chapters'}</span>
                </button>
              )}
            </div>

            {/* Chapter Items List */}
            {project ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {project.chapters.map((ch, idx) => {
                  const isCurrent = currentChapterIndex === idx;
                  const isCompleted = ch.status === 'completed';
                  const isPlaying = playingChapterId === ch.id;

                  return (
                    <div
                      key={ch.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-950/50 border-amber-500 shadow-md'
                          : isCompleted
                          ? 'bg-white/5 border-emerald-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-bold text-amber-300 font-mono">
                              {ch.chapterNumber}
                            </span>
                            <h4 className="text-xs font-bold text-white">{ch.title}</h4>
                            {isCompleted && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Ready ({ch.audioResult?.durationSeconds.toFixed(1)}s)
                              </span>
                            )}
                            {ch.status === 'processing' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 animate-pulse">
                                Synthesizing voice...
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/60 line-clamp-2 pl-8">
                            {ch.content}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isCompleted && ch.audioResult && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPlaying) {
                                    setPlayingChapterId(null);
                                  } else {
                                    setPlayingChapterId(ch.id);
                                    const audio = new Audio(
                                      `data:${ch.audioResult.mimeType};base64,${ch.audioResult.audioBase64}`
                                    );
                                    audio.play();
                                    audio.onended = () => setPlayingChapterId(null);
                                  }
                                }}
                                className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md cursor-pointer"
                              >
                                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                              </button>
                              <a
                                href={`data:${ch.audioResult.mimeType};base64,${ch.audioResult.audioBase64}`}
                                download={`Chapter_${ch.chapterNumber}_${ch.title}.wav`}
                                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-white/30 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">No Document Parsed Yet</h4>
                  <p className="text-xs text-white/40 max-w-sm mx-auto">
                    Click "Parse & Build Chapters" above to have AI organize your manuscript into chapters and prepare narration.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
