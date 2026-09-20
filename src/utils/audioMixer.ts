/**
 * Audio Mixer & Voice Ducking Engine
 * Mixes synthesized vocal audio with background music tracks
 * with intelligent automatic voice-ducking and exports lossless WAV files.
 */

import { synthesizeBackgroundMusicBuffer } from './bgMusicSynthesizer';
import { BackgroundMusicConfig } from '../types';

let mixerAudioCtx: AudioContext | null = null;

function getMixerContext(): AudioContext {
  if (!mixerAudioCtx || mixerAudioCtx.state === 'closed') {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    mixerAudioCtx = new AudioContextClass();
  }
  return mixerAudioCtx;
}

/**
 * Decodes base64 audio string to AudioBuffer
 */
export async function decodeBase64ToAudioBuffer(
  base64Data: string,
  ctx?: BaseAudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioCtx = ctx || getMixerContext();
  return await audioCtx.decodeAudioData(bytes.buffer.slice(0));
}

/**
 * Converts an AudioBuffer into standard 16-bit PCM RIFF WAV Base64
 */
export function audioBufferToWavBase64(buffer: AudioBuffer): string {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const length = buffer.length;

  // Interleave channels
  const numSamples = length * numChannels;
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const dataSize = numSamples * (bitDepth / 8);
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples with soft limiting
  let offset = 44;
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channelData[ch][i];
      // Soft saturation limiter to prevent clipping
      sample = Math.tanh(sample);
      const clamped = Math.max(-1, Math.min(1, sample));
      const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(offset, Math.round(intSample), true);
      offset += 2;
    }
  }

  // Convert binary ArrayBuffer to base64
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  const chunk = 0x8000;
  for (let i = 0; i < len; i += chunk) {
    const sub = bytes.subarray(i, Math.min(i + chunk, len));
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export interface AdvancedVocalEffects {
  mushairaEchoLevel?: number; // 0 to 100
  humNawaChorus?: boolean; // Backing chorus / hum-nawa effect
  chorusMixLevel?: number; // 0 to 100
}

/**
 * Mixes Voice Audio Base64 with Background Music, Auto-Ducking and Optional Studio Vocal FX
 */
export async function mixVoiceAndBackgroundMusic(
  voiceBase64: string,
  bgConfig: BackgroundMusicConfig,
  vocalEffects?: AdvancedVocalEffects
): Promise<{
  mixedBase64: string;
  durationSeconds: number;
}> {
  const hasBgm = bgConfig.trackId && bgConfig.trackId !== 'none' && bgConfig.volume > 0;
  const echoLevel = vocalEffects?.mushairaEchoLevel || 0;
  const hasChorus = Boolean(vocalEffects?.humNawaChorus);

  if (!hasBgm && echoLevel <= 0 && !hasChorus) {
    return {
      mixedBase64: voiceBase64,
      durationSeconds: 0,
    };
  }

  try {
    // 1. Decode voice audio
    const voiceBuffer = await decodeBase64ToAudioBuffer(voiceBase64);
    const sampleRate = voiceBuffer.sampleRate;
    const voiceDuration = voiceBuffer.duration;

    // Add tail for smooth BGM musical outro fade or echo tail
    const extraTail = echoLevel > 0 ? 1.2 : 0.8;
    const totalDuration = voiceDuration + extraTail;
    const totalSamples = Math.ceil(totalDuration * sampleRate);

    // 2. Obtain background music buffer if enabled
    let bgBuffer: AudioBuffer | null = null;
    if (hasBgm) {
      if (bgConfig.customAudioBase64) {
        bgBuffer = await decodeBase64ToAudioBuffer(bgConfig.customAudioBase64);
      } else {
        bgBuffer = await synthesizeBackgroundMusicBuffer(
          bgConfig.trackId,
          totalDuration,
          sampleRate
        );
      }
    }

    // 3. Render final mix in OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    // Voice Source Node
    const voiceSource = offlineCtx.createBufferSource();
    voiceSource.buffer = voiceBuffer;
    const voiceGain = offlineCtx.createGain();
    voiceGain.gain.setValueAtTime(1.0, 0);
    voiceSource.connect(voiceGain);
    voiceGain.connect(offlineCtx.destination);

    // Optional Hum-Nawa (Backing Chorus) effect: Parallel doubled voice with subtle delay and filtering
    if (hasChorus) {
      const chorusSource = offlineCtx.createBufferSource();
      chorusSource.buffer = voiceBuffer;
      const chorusGain = offlineCtx.createGain();
      chorusGain.gain.setValueAtTime(0.38, 0);

      const chorusFilter = offlineCtx.createBiquadFilter();
      chorusFilter.type = 'lowpass';
      chorusFilter.frequency.setValueAtTime(3200, 0);

      chorusSource.connect(chorusFilter);
      chorusFilter.connect(chorusGain);
      chorusGain.connect(offlineCtx.destination);
      // Start 25ms later to create natural acoustic group doubling
      chorusSource.start(0.025);
    }

    // Optional Mushaira Mic Echo & Reverb effect
    if (echoLevel > 0) {
      const delayNode = offlineCtx.createDelay(1.0);
      delayNode.delayTime.setValueAtTime(0.19, 0); // 190ms authentic mic delay

      const feedbackNode = offlineCtx.createGain();
      const feedbackAmount = Math.min(0.48, (echoLevel / 100) * 0.48);
      feedbackNode.gain.setValueAtTime(feedbackAmount, 0);

      const echoFilter = offlineCtx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.setValueAtTime(2600, 0);

      const echoWetGain = offlineCtx.createGain();
      const wetAmount = Math.min(0.55, (echoLevel / 100) * 0.55);
      echoWetGain.gain.setValueAtTime(wetAmount, 0);

      // Connect: Voice -> Delay -> Feedback Loop -> Filter -> Wet Gain -> Destination
      voiceSource.connect(delayNode);
      delayNode.connect(echoFilter);
      echoFilter.connect(feedbackNode);
      feedbackNode.connect(delayNode);
      echoFilter.connect(echoWetGain);
      echoWetGain.connect(offlineCtx.destination);
    }

    voiceSource.start(0);

    // Background Music Source Node (if present)
    if (bgBuffer && hasBgm) {
      const bgSource = offlineCtx.createBufferSource();
      bgSource.buffer = bgBuffer;
      bgSource.loop = true;

      const bgGain = offlineCtx.createGain();
      const nominalBgGain = Math.max(0, Math.min(1, (bgConfig.volume / 100) * 0.7));

      // Auto-Ducking calculation
      if (bgConfig.autoDucking) {
        const windowSize = Math.floor(sampleRate * 0.05);
        const voiceSamples = voiceBuffer.getChannelData(0);
        const numWindows = Math.floor(voiceSamples.length / windowSize);

        bgGain.gain.setValueAtTime(nominalBgGain, 0);
        const duckedGain = nominalBgGain * 0.32;

        for (let w = 0; w < numWindows; w++) {
          let sumSq = 0;
          const startIdx = w * windowSize;
          for (let i = 0; i < windowSize; i++) {
            const s = voiceSamples[startIdx + i];
            sumSq += s * s;
          }
          const rms = Math.sqrt(sumSq / windowSize);
          const windowTime = (w * windowSize) / sampleRate;

          if (rms > 0.018) {
            bgGain.gain.setTargetAtTime(duckedGain, windowTime, 0.06);
          } else {
            bgGain.gain.setTargetAtTime(nominalBgGain, windowTime, 0.2);
          }
        }

        bgGain.gain.setValueAtTime(nominalBgGain, voiceDuration);
        bgGain.gain.linearRampToValueAtTime(0, totalDuration);
      } else {
        bgGain.gain.setValueAtTime(0, 0);
        bgGain.gain.linearRampToValueAtTime(nominalBgGain, 0.3);
        bgGain.gain.setValueAtTime(nominalBgGain, voiceDuration + 0.1);
        bgGain.gain.linearRampToValueAtTime(0, totalDuration);
      }

      bgSource.connect(bgGain);
      bgGain.connect(offlineCtx.destination);
      bgSource.start(0);
    }

    // 4. Render and export
    const renderedBuffer = await offlineCtx.startRendering();
    const mixedWavBase64 = audioBufferToWavBase64(renderedBuffer);

    return {
      mixedBase64: mixedWavBase64,
      durationSeconds: totalDuration,
    };
  } catch (error) {
    console.error('Error during audio mixing:', error);
    return {
      mixedBase64: voiceBase64,
      durationSeconds: 0,
    };
  }
}
