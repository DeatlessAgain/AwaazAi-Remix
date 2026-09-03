import { decodeBase64ToAudioBuffer } from './audioMixer';
// @ts-ignore
import * as lamejsModule from 'lamejs';

// Handle both ESM default and CommonJS module shapes for lamejs
const lamejs = (lamejsModule as any).default || lamejsModule;

export type AudioOutputFormat = 'wav' | 'mp3' | 'ogg' | 'aac';

export interface FormatOption {
  id: AudioOutputFormat;
  label: string;
  extension: string;
  mimeType: string;
  description: string;
  badge: string;
  recommendedFor: string;
  bitrate?: string;
}

export const AUDIO_FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'wav',
    label: 'WAV (Lossless Studio)',
    extension: '.wav',
    mimeType: 'audio/wav',
    description: 'Uncompressed 24/44.1kHz 16-bit PCM. Maximum fidelity for professional audio workstations.',
    badge: 'Lossless Studio',
    recommendedFor: 'Video Editing, DAWs, Master Archiving',
  },
  {
    id: 'mp3',
    label: 'MP3 (Universal Standard)',
    extension: '.mp3',
    mimeType: 'audio/mp3',
    description: 'High-quality 192kbps MP3. Compact file size, universal playback across all devices and social media.',
    badge: '192kbps MP3',
    recommendedFor: 'YouTube, Podcasts, WhatsApp, Social Media',
    bitrate: '192kbps',
  },
  {
    id: 'ogg',
    label: 'OGG (Opus / Vorbis)',
    extension: '.ogg',
    mimeType: 'audio/ogg',
    description: 'Modern open audio format with superior compression efficiency and low latency streaming.',
    badge: 'Opus / Vorbis',
    recommendedFor: 'Web Apps, Discord Bots, Gaming Engines',
  },
  {
    id: 'aac',
    label: 'AAC / M4A (Apple & Mobile)',
    extension: '.m4a',
    mimeType: 'audio/mp4',
    description: 'Advanced Audio Coding standard. Superior clarity at low bitrates for iOS and mobile apps.',
    badge: 'AAC High-Q',
    recommendedFor: 'iPhone/iPad, QuickTime, Streaming',
  },
];

/**
 * Converts Float32Array PCM samples (-1.0 to 1.0) to Int16Array (-32768 to 32767)
 */
function floatToInt16(samples: Float32Array): Int16Array {
  const len = samples.length;
  const result = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return result;
}

/**
 * Encodes an AudioBuffer into MP3 format using lamejs
 */
export async function encodeAudioBufferToMp3(
  audioBuffer: AudioBuffer,
  kbps = 192
): Promise<Blob> {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;

  const Mp3Encoder = lamejs.Mp3Encoder || (window as any).lamejs?.Mp3Encoder;
  if (!Mp3Encoder) {
    throw new Error('MP3 Encoder library not available.');
  }

  const mp3encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];

  const leftChannel = floatToInt16(audioBuffer.getChannelData(0));
  const rightChannel =
    channels > 1
      ? floatToInt16(audioBuffer.getChannelData(1))
      : leftChannel;

  const sampleBlockSize = 1152;
  const numSamples = leftChannel.length;

  for (let i = 0; i < numSamples; i += sampleBlockSize) {
    const leftChunk = leftChannel.subarray(i, i + sampleBlockSize);
    let mp3buf: Int8Array | Uint8Array;

    if (channels === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    } else {
      const rightChunk = rightChannel.subarray(i, i + sampleBlockSize);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const mp3Flush = mp3encoder.flush();
  if (mp3Flush.length > 0) {
    mp3Data.push(new Uint8Array(mp3Flush));
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Transcodes AudioBuffer to OGG or AAC using browser MediaRecorder API
 */
async function encodeUsingMediaRecorder(
  audioBuffer: AudioBuffer,
  targetMimeType: string,
  fallbackMimeType: string
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const AudioCtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();

      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);

      // Determine supported mime type
      let mimeType = targetMimeType;
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported(fallbackMimeType)) {
            mimeType = fallbackMimeType;
          } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          }
        }
      }

      const mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        audioCtx.close().catch(() => {});
        const finalBlob = new Blob(chunks, { type: mimeType });
        resolve(finalBlob);
      };

      mediaRecorder.onerror = (err) => {
        audioCtx.close().catch(() => {});
        reject(err);
      };

      mediaRecorder.start();
      source.start(0);

      source.onended = () => {
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 150);
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Converts given Audio base64 into the specified format blob
 */
export async function convertAudioToFormat(
  audioBase64: string,
  targetFormat: AudioOutputFormat
): Promise<{ blob: Blob; extension: string; mimeType: string }> {
  // If WAV format requested, return directly as WAV Blob
  if (targetFormat === 'wav') {
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return {
      blob: new Blob([bytes], { type: 'audio/wav' }),
      extension: '.wav',
      mimeType: 'audio/wav',
    };
  }

  // Decode WAV base64 into AudioBuffer
  const audioBuffer = await decodeBase64ToAudioBuffer(audioBase64);

  if (targetFormat === 'mp3') {
    const mp3Blob = await encodeAudioBufferToMp3(audioBuffer, 192);
    return {
      blob: mp3Blob,
      extension: '.mp3',
      mimeType: 'audio/mp3',
    };
  }

  if (targetFormat === 'ogg') {
    try {
      const oggBlob = await encodeUsingMediaRecorder(
        audioBuffer,
        'audio/ogg;codecs=opus',
        'audio/ogg'
      );
      return {
        blob: oggBlob,
        extension: '.ogg',
        mimeType: 'audio/ogg',
      };
    } catch (err) {
      console.warn('MediaRecorder OGG fallback to MP3:', err);
      const mp3Blob = await encodeAudioBufferToMp3(audioBuffer, 192);
      return { blob: mp3Blob, extension: '.mp3', mimeType: 'audio/mp3' };
    }
  }

  if (targetFormat === 'aac') {
    try {
      const aacBlob = await encodeUsingMediaRecorder(
        audioBuffer,
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4'
      );
      return {
        blob: aacBlob,
        extension: '.m4a',
        mimeType: 'audio/mp4',
      };
    } catch (err) {
      console.warn('MediaRecorder AAC fallback to MP3:', err);
      const mp3Blob = await encodeAudioBufferToMp3(audioBuffer, 192);
      return { blob: mp3Blob, extension: '.mp3', mimeType: 'audio/mp3' };
    }
  }

  // Default fallback
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return {
    blob: new Blob([bytes], { type: 'audio/wav' }),
    extension: '.wav',
    mimeType: 'audio/wav',
  };
}

/**
 * Triggers browser download for a Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2500);
}
