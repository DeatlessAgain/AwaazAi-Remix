import { GeneratedAudioItem, SupportedLanguage, BatchTextItem } from '../types';
import JSZip from 'jszip';
import {
  getLibraryFromDB,
  saveLibraryToDB,
  deleteItemFromDB,
  clearLibraryDB,
} from './audioStorage';
import {
  AudioOutputFormat,
  AUDIO_FORMAT_OPTIONS,
  convertAudioToFormat,
  triggerBlobDownload,
} from './audioFormatConverter';

export {
  getLibraryFromDB,
  saveLibraryToDB,
  deleteItemFromDB,
  clearLibraryDB,
  type AudioOutputFormat,
  AUDIO_FORMAT_OPTIONS,
  convertAudioToFormat,
  triggerBlobDownload,
};

export function detectLanguageFromText(text: string): SupportedLanguage {
  if (!text || !text.trim()) return 'auto';

  // Check for Arabic/Urdu Unicode range
  const urduRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  // Check for Devanagari (Hindi) Unicode range
  const hindiRegex = /[\u0900-\u097F]/;

  if (urduRegex.test(text)) {
    return 'urdu';
  }
  if (hindiRegex.test(text)) {
    return 'hindi';
  }
  return 'english';
}

export function base64ToBlobUrl(base64: string, mimeType = 'audio/wav'): string {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to convert base64 to blob url:', error);
    return `data:${mimeType};base64,${base64}`;
  }
}

export function downloadAudioFile(
  base64: string,
  fileName = 'awaaz-ai-voice.wav',
  mimeType = 'audio/wav'
) {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName.endsWith('.wav') ? fileName : `${fileName}.wav`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (e) {
    console.error('Download failed:', e);
  }
}

export function formatSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function loadLibraryFromStorage(): GeneratedAudioItem[] {
  // Provided for backward compatibility; App.tsx loads asynchronously via getLibraryFromDB
  return [];
}

export function saveLibraryToStorage(items: GeneratedAudioItem[]) {
  // Delegate safely to IndexedDB
  saveLibraryToDB(items).catch((err) => {
    console.warn('Failed to save to database:', err);
  });
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function downloadBatchAsZip(
  items: GeneratedAudioItem[],
  zipFileName = 'awaaz-ai-bulk-audio.zip'
): Promise<void> {
  if (!items || items.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('awaaz-ai-voiceovers') || zip;

  // Track filenames to prevent overwrites
  const usedNames = new Set<string>();

  items.forEach((item, index) => {
    const rawBytes = base64ToUint8Array(item.audioBase64);
    
    // Clean snippet for filename
    const cleanSnippet = item.text
      .replace(/[\n\r\t]/g, ' ')
      .replace(/[\\/:*?"<>|]/g, '')
      .trim()
      .slice(0, 24);
    
    const padIndex = String(index + 1).padStart(2, '0');
    let fileName = `${padIndex}_${item.voice}_${cleanSnippet || 'audio'}.wav`;
    
    if (usedNames.has(fileName)) {
      fileName = `${padIndex}_${item.voice}_${item.id.slice(0, 6)}.wav`;
    }
    usedNames.add(fileName);

    folder.file(fileName, rawBytes);
  });

  // Also include a metadata summary text file
  const metaLines = items.map(
    (item, i) =>
      `[${i + 1}] Voice: ${item.voice} | Style: ${item.style} | Language: ${item.language} | Duration: ${item.durationSeconds}s\nScript: ${item.text}\n`
  );
  folder.file('manifest_summary.txt', `Awaaz AI Studio - Batch Audio Export\nTotal Clips: ${items.length}\nDate: ${new Date().toLocaleString()}\n\n` + metaLines.join('\n---\n'));

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2500);
}

export function parseBatchFileInput(rawText: string, fileType: 'txt' | 'csv' | 'json'): string[] {
  if (!rawText.trim()) return [];

  if (fileType === 'json') {
    try {
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object' && 'text' in item) return String(item.text).trim();
            return '';
          })
          .filter((t) => t.length > 0);
      }
    } catch {
      // fallback to line parsing if json parsing fails
    }
  }

  if (fileType === 'csv') {
    const lines = rawText.split(/\r?\n/);
    const results: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // If comma separated, take first non-empty column or strip quotes
      const clean = trimmed.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      if (clean && clean.toLowerCase() !== 'text' && clean.toLowerCase() !== 'script') {
        results.push(clean);
      }
    }
    return results;
  }

  // TXT format - split by non-empty lines or double linebreaks for multi-line scripts
  const rawParagraphs = rawText.split(/\n\s*\n/);
  if (rawParagraphs.length > 1) {
    return rawParagraphs.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  return rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

