import React, { useState } from 'react';
import { GeneratedAudioItem } from '../types';
import {
  Download,
  Play,
  Trash2,
  Clock,
  Music,
  Check,
  Copy,
  ChevronDown,
  Loader2,
  FileAudio,
  Cloud,
} from 'lucide-react';
import {
  formatSeconds,
  AudioOutputFormat,
  AUDIO_FORMAT_OPTIONS,
  convertAudioToFormat,
  triggerBlobDownload,
} from '../utils/audioHelper';

interface AudioLibraryProps {
  items: GeneratedAudioItem[];
  activeItemId: string | null;
  onSelectItem: (item: GeneratedAudioItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onOpenCloudSync?: () => void;
}

export const AudioLibrary: React.FC<AudioLibraryProps> = ({
  items,
  activeItemId,
  onSelectItem,
  onDeleteItem,
  onClearAll,
  onOpenCloudSync,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFormatMenuId, setActiveFormatMenuId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (items.length === 0) {
    return null;
  }

  const handleCopyText = (item: GeneratedAudioItem) => {
    navigator.clipboard.writeText(item.text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDownload = async (item: GeneratedAudioItem, format: AudioOutputFormat = 'mp3') => {
    const safeSnippet = item.text
      .slice(0, 24)
      .replace(/[^\w\s\u0600-\u06FF\u0900-\u097F-]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const filename = `Awaaz_${item.voice}_${safeSnippet || 'audio'}`;

    try {
      setDownloadingId(item.id);
      const { blob, extension } = await convertAudioToFormat(item.audioBase64, format);
      triggerBlobDownload(blob, `${filename}${extension}`);
    } catch (err) {
      console.error('Library download error:', err);
      const { blob, extension } = await convertAudioToFormat(item.audioBase64, 'wav');
      triggerBlobDownload(blob, `${filename}${extension}`);
    } finally {
      setDownloadingId(null);
      setActiveFormatMenuId(null);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-white">
              Generated Audio History (تاریخچہ و آڈیوز)
            </h3>
            <p className="text-[11px] text-white/40">
              {items.length} clips ready for instant playback & studio download
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              id="library-cloud-sync-btn"
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-xs text-indigo-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer font-medium"
              title="Sync with Firebase & Cloud"
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cloud Sync</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClearAll}
            id="clear-all-library-btn"
            className="text-xs text-white/40 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {items.map((item) => {
          const isActive = activeItemId === item.id;
          const isUrdu = item.language === 'urdu';

          return (
            <div
              key={item.id}
              id={`library-item-${item.id}`}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group backdrop-blur-xl ${
                isActive
                  ? 'bg-white/10 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400/40'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {item.voice}
                    </span>
                    <span className="text-[10px] uppercase text-white/50 font-medium bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      {item.language}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {item.style.replace('_', ' ')}
                    </span>
                    {item.emotion && item.emotion !== 'neutral' && (
                      <span className="text-[9px] capitalize text-rose-300 font-medium bg-rose-500/15 px-1.5 py-0.2 rounded-md border border-rose-500/30">
                        {item.emotion} ({item.emotionIntensity || 50}%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-white/40 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{formatSeconds(item.durationSeconds)}</span>
                  </div>
                </div>

                <p
                  className={`text-xs text-white/70 line-clamp-2 leading-relaxed ${
                    isUrdu ? 'font-urdu' : ''
                  }`}
                >
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  id={`play-library-${item.id}`}
                  onClick={() => onSelectItem(item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isActive ? 'Playing' : 'Play'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {/* Copy Text */}
                  <button
                    type="button"
                    onClick={() => handleCopyText(item)}
                    id={`copy-library-text-${item.id}`}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Copy text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Download with Format Dropdown */}
                  <div className="relative">
                    <div className="flex items-center rounded-full bg-white/5 hover:bg-indigo-600 hover:text-white text-indigo-300 text-xs font-semibold transition-all border border-white/10 overflow-hidden">
                      <button
                        type="button"
                        id={`download-library-${item.id}`}
                        disabled={downloadingId === item.id}
                        onClick={() => handleDownload(item, 'mp3')}
                        className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Quick download as MP3"
                      >
                        {downloadingId === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>MP3</span>
                      </button>

                      <button
                        type="button"
                        id={`toggle-library-format-${item.id}`}
                        onClick={() => setActiveFormatMenuId(activeFormatMenuId === item.id ? null : item.id)}
                        className="px-1.5 py-1.5 border-l border-white/10 hover:bg-black/20 cursor-pointer"
                        title="Choose audio format"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Format popup menu for library item */}
                    {activeFormatMenuId === item.id && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-44 p-1.5 rounded-xl bg-stone-900 border border-white/15 shadow-2xl backdrop-blur-xl z-50 space-y-1">
                        <div className="px-2 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                          Export Format
                        </div>
                        {AUDIO_FORMAT_OPTIONS.map((fmt) => (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => handleDownload(item, fmt.id)}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-indigo-600 text-white text-xs font-medium transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>{fmt.label.split(' ')[0]}</span>
                            <span className="text-[10px] text-white/50">{fmt.extension}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delete Item */}
                  <button
                    type="button"
                    id={`delete-library-${item.id}`}
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Delete clip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
