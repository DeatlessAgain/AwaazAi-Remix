/**
 * Procedural Web Audio Synthesizer for Background Music
 * Generates rich, studio-grade background music tracks and ambient beds
 * completely offline with zero external network dependencies.
 */

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    globalAudioCtx = new AudioContextClass();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

/**
 * Creates a synthetic audio buffer for a given track and duration
 */
export async function synthesizeBackgroundMusicBuffer(
  trackId: string,
  durationSeconds: number,
  sampleRate = 44100
): Promise<AudioBuffer | null> {
  if (!trackId || trackId === 'none') return null;

  // Clamp duration between 4s and 600s
  const duration = Math.max(4, Math.min(durationSeconds, 600));
  const totalSamples = Math.ceil(duration * sampleRate);

  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  switch (trackId) {
    case 'sufi_flute':
      renderSufiFlute(offlineCtx, duration);
      break;
    case 'poetic_sitar':
      renderPoeticSitar(offlineCtx, duration);
      break;
    case 'calm_lofi':
      renderCalmLofi(offlineCtx, duration);
      break;
    case 'cinematic_drama':
      renderCinematicDrama(offlineCtx, duration);
      break;
    case 'sad_violin':
      renderSadViolin(offlineCtx, duration);
      break;
    case 'news_broadcast':
      renderNewsBroadcast(offlineCtx, duration);
      break;
    case 'kids_playful':
      renderKidsPlayful(offlineCtx, duration);
      break;
    case 'rain_meditation':
      renderRainMeditation(offlineCtx, duration);
      break;
    case 'spiritual_daf':
      renderSpiritualDaf(offlineCtx, duration);
      break;
    case 'harmonium_tabla':
      renderHarmoniumTabla(offlineCtx, duration);
      break;
    case 'sufi_qawwali_clap':
      renderSufiQawwaliClap(offlineCtx, duration);
      break;
    case 'ambient_spiritual_drone':
      renderAmbientSpiritualDrone(offlineCtx, duration);
      break;
    case 'acoustic_guitar_lofi':
      renderAcousticGuitarLofi(offlineCtx, duration);
      break;
    default:
      renderCalmLofi(offlineCtx, duration);
      break;
  }

  try {
    return await offlineCtx.startRendering();
  } catch (err) {
    console.error('Failed to render background music offline:', err);
    return null;
  }
}

// 1. Sufi Flute & Rabab: Eastern bamboo flute + Tanpura drone
function renderSufiFlute(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.45, 0);
  masterGain.connect(ctx.destination);

  // Tanpura Root & 5th Drones (C3, G3, C4)
  const droneFreqs = [130.81, 196.0, 261.63, 392.0];
  droneFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq + (idx === 0 ? 0.2 : -0.2), 0);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, 0);

    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), 1.5);
    gain.gain.setValueAtTime(0.08 / (idx + 1), duration - 1.5);
    gain.gain.linearRampToValueAtTime(0, duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(0);
    osc.stop(duration);
  });

  // Eastern Raga Melodic Notes Loop (C4, Eb4, F4, G4, Bb4, C5, Bb4, G4, Eb4, D4, C4)
  const ragaScale = [261.63, 311.13, 349.23, 392.0, 466.16, 523.25, 466.16, 392.0, 311.13, 293.66, 261.63];
  let noteTime = 0.8;
  let noteIdx = 0;

  while (noteTime < duration - 1.0) {
    const freq = ragaScale[noteIdx % ragaScale.length];
    const noteDuration = (noteIdx % 3 === 0 ? 2.2 : 1.4);

    if (noteTime + noteDuration > duration) break;

    // Flute Body Oscillator (Sine + Triangle with vibrato LFO)
    const fluteOsc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const fluteGain = ctx.createGain();
    const fluteFilter = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    // 5.2 Hz Eastern flute vibrato
    lfo.frequency.setValueAtTime(5.2, noteTime);
    lfoGain.gain.setValueAtTime(3.5, noteTime);
    lfo.connect(fluteOsc.frequency);
    lfo.connect(subOsc.frequency);

    fluteOsc.type = 'sine';
    fluteOsc.frequency.setValueAtTime(freq, noteTime);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq, noteTime);

    fluteFilter.type = 'lowpass';
    fluteFilter.frequency.setValueAtTime(1400, noteTime);
    fluteFilter.Q.setValueAtTime(2.5, noteTime);

    // Flute Breath / Attack Envelope
    fluteGain.gain.setValueAtTime(0, noteTime);
    fluteGain.gain.linearRampToValueAtTime(0.18, noteTime + 0.35);
    fluteGain.gain.exponentialRampToValueAtTime(0.12, noteTime + noteDuration * 0.7);
    fluteGain.gain.linearRampToValueAtTime(0.001, noteTime + noteDuration);

    fluteOsc.connect(fluteFilter);
    subOsc.connect(fluteFilter);
    fluteFilter.connect(fluteGain);
    fluteGain.connect(masterGain);

    lfo.start(noteTime);
    lfo.stop(noteTime + noteDuration);
    fluteOsc.start(noteTime);
    fluteOsc.stop(noteTime + noteDuration);
    subOsc.start(noteTime);
    subOsc.stop(noteTime + noteDuration);

    noteTime += noteDuration + 0.4;
    noteIdx++;
  }
}

// 2. Poetic Sitar & Tanpura
function renderPoeticSitar(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.42, 0);
  masterGain.connect(ctx.destination);

  // Tanpura D D A D
  const droneFreqs = [146.83, 220.0, 293.66];
  droneFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq + (idx * 0.3), 0);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, 0);

    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.06, 1.0);
    gain.gain.setValueAtTime(0.06, duration - 1.0);
    gain.gain.linearRampToValueAtTime(0, duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(0);
    osc.stop(duration);
  });

  // Plucked Sitar Notes (D4, F#4, A4, C#5, D5, E5, D5, A4)
  const sitarScale = [293.66, 369.99, 440.0, 554.37, 587.33, 659.25, 587.33, 440.0];
  let time = 0.6;
  let idx = 0;

  while (time < duration - 1.0) {
    const freq = sitarScale[idx % sitarScale.length];
    const pluckLen = 1.2;

    const osc = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(freq * 2, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.8, time);
    filter.Q.setValueAtTime(3.0, time);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + pluckLen);

    osc.connect(filter);
    oscHarmonic.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + pluckLen);
    oscHarmonic.start(time);
    oscHarmonic.stop(time + pluckLen);

    time += 0.9;
    idx++;
  }
}

// 3. Calm Lo-Fi & Piano (Warm maj7 chords)
function renderCalmLofi(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.4, 0);
  masterGain.connect(ctx.destination);

  // Chord Progression: Cmaj7 -> Am7 -> Dm7 -> G7sus4 (4 bars loop)
  const chords = [
    [130.81, 196.0, 246.94, 329.63], // Cmaj7
    [110.0, 164.81, 220.0, 261.63],  // Am7
    [146.83, 220.0, 261.63, 349.23], // Dm7
    [98.0, 146.83, 196.0, 293.66],   // G7sus4
  ];

  let time = 0;
  let chordIdx = 0;
  const chordDuration = 3.5;

  while (time < duration) {
    const chord = chords[chordIdx % chords.length];

    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.07, time + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.04, time + chordDuration * 0.8);
      gain.gain.linearRampToValueAtTime(0.001, time + chordDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + chordDuration);
    });

    time += chordDuration;
    chordIdx++;
  }
}

// 4. Cinematic Drama & Tension Strings
function renderCinematicDrama(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.45, 0);
  masterGain.connect(ctx.destination);

  // Sub bass drone D1 / D2 (36.7Hz / 73.4Hz)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(73.42, 0);
  subGain.gain.setValueAtTime(0.12, 0);
  subOsc.connect(subGain);
  subGain.connect(masterGain);
  subOsc.start(0);
  subOsc.stop(duration);

  // Dark minor chord pads (D minor -> Bb maj -> Gm -> A dim)
  const pads = [
    [146.83, 220.0, 261.63, 349.23], // Dm7
    [116.54, 174.61, 233.08, 293.66], // Bbmaj7
    [98.0, 146.83, 196.0, 233.08],   // Gm
    [110.0, 164.81, 220.0, 311.13],  // Adim
  ];

  let time = 0;
  let idx = 0;
  const padDuration = 4.5;

  while (time < duration) {
    const chord = pads[idx % pads.length];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, time);
      filter.frequency.linearRampToValueAtTime(700, time + padDuration * 0.5);
      filter.frequency.linearRampToValueAtTime(400, time + padDuration);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 1.2);
      gain.gain.setValueAtTime(0.06, time + padDuration - 1.0);
      gain.gain.linearRampToValueAtTime(0.001, time + padDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + padDuration);
    });

    time += padDuration - 0.5; // Smooth crossfade
    idx++;
  }
}

// 5. Sad Violin & Cello
function renderSadViolin(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.42, 0);
  masterGain.connect(ctx.destination);

  // Minor cello bassline (A2, F2, D2, E2)
  const celloNotes = [110.0, 87.31, 73.42, 82.41];
  let time = 0;
  let idx = 0;
  const noteDuration = 4.0;

  while (time < duration) {
    const freq = celloNotes[idx % celloNotes.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.8);
    gain.gain.setValueAtTime(0.08, time + noteDuration - 0.8);
    gain.gain.linearRampToValueAtTime(0.001, time + noteDuration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + noteDuration);

    // Solo Violin expressive lead note
    const violinFreqs = [440.0, 392.0, 349.23, 329.63, 293.66, 329.63, 440.0];
    const vFreq = violinFreqs[idx % violinFreqs.length];
    const vOsc = ctx.createOscillator();
    const vGain = ctx.createGain();
    const vFilter = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    lfo.frequency.setValueAtTime(4.6, time + 0.5);
    lfoGain.gain.setValueAtTime(3.0, time + 0.5);
    lfo.connect(vOsc.frequency);

    vOsc.type = 'sawtooth';
    vOsc.frequency.setValueAtTime(vFreq, time + 0.5);

    vFilter.type = 'bandpass';
    vFilter.frequency.setValueAtTime(850, time + 0.5);
    vFilter.Q.setValueAtTime(1.8, time + 0.5);

    vGain.gain.setValueAtTime(0, time + 0.5);
    vGain.gain.linearRampToValueAtTime(0.09, time + 1.2);
    vGain.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

    vOsc.connect(vFilter);
    vFilter.connect(vGain);
    vGain.connect(masterGain);

    lfo.start(time + 0.5);
    lfo.stop(time + noteDuration);
    vOsc.start(time + 0.5);
    vOsc.stop(time + noteDuration);

    time += noteDuration;
    idx++;
  }
}

// 6. News & Broadcast Pulse
function renderNewsBroadcast(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.35, 0);
  masterGain.connect(ctx.destination);

  // 120 BPM pulse (0.5s beat)
  const beat = 0.25;
  let time = 0;
  let step = 0;

  const arpeggio = [220.0, 329.63, 440.0, 659.25, 440.0, 329.63];

  while (time < duration) {
    // Synth tick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const freq = arpeggio[step % arpeggio.length];
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.2);

    // Deep sub kick on 1st & 3rd beat
    if (step % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(110, time);
      kickOsc.frequency.exponentialRampToValueAtTime(45, time + 0.15);

      kickGain.gain.setValueAtTime(0.18, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);

      kickOsc.start(time);
      kickOsc.stop(time + 0.25);
    }

    time += beat;
    step++;
  }
}

// 7. Kids Playful Xylophone & Bells
function renderKidsPlayful(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.38, 0);
  masterGain.connect(ctx.destination);

  // Pentatonic playful bounce (C5, D5, E5, G5, A5, C6, A5, G5, E5, D5)
  const melody = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 880.0, 783.99, 659.25, 587.33];
  let time = 0.2;
  let idx = 0;

  while (time < duration - 0.5) {
    const freq = melody[idx % melody.length];
    const osc = ctx.createOscillator();
    const bellOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    bellOsc.type = 'triangle';
    bellOsc.frequency.setValueAtTime(freq * 2.76, time); // Bell inharmonicity

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    osc.connect(gain);
    bellOsc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.5);
    bellOsc.start(time);
    bellOsc.stop(time + 0.5);

    time += (idx % 2 === 0 ? 0.35 : 0.45);
    idx++;
  }
}

// 8. Rain & Meditation Drone
function renderRainMeditation(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.4, 0);
  masterGain.connect(ctx.destination);

  // 432 Hz Sacred Calm Meditation Harmonic Drone
  const freqs = [108.0, 216.0, 432.0];
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, 0);

    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.08, 2.0);
    gain.gain.setValueAtTime(0.08, duration - 2.0);
    gain.gain.linearRampToValueAtTime(0, duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(0);
    osc.stop(duration);
  });

  // Pink noise simulation for gentle rain texture
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
    b6 = white * 0.115926;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(1100, 0);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, 0);
  noiseGain.gain.linearRampToValueAtTime(0.07, 1.5);
  noiseGain.gain.setValueAtTime(0.07, duration - 1.5);
  noiseGain.gain.linearRampToValueAtTime(0, duration);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  noiseSource.start(0);
  noiseSource.stop(duration);
}

// 9. Spiritual Daf & Frame Drum (Authentic Middle Eastern & South Asian Daf Beat)
function renderSpiritualDaf(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.48, 0);
  masterGain.connect(ctx.destination);

  // Ethereal subtle holy drone (D2, A2, D3)
  const droneFreqs = [73.42, 110.0, 146.83];
  droneFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = idx === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, 0);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, 0);

    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), 2.0);
    gain.gain.setValueAtTime(0.06 / (idx + 1), duration - 2.0);
    gain.gain.linearRampToValueAtTime(0, duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(0);
    osc.stop(duration);
  });

  // Daf Rhythmic Taal / Wazan (Dum - Tak - Tak - Dum - Tak) ~ 68 BPM (0.88s per beat)
  const beatInterval = 0.88;
  let t = 0.5;

  while (t < duration - 0.8) {
    // 1. "DUM" (Bass strike at center of skin)
    const dumOsc = ctx.createOscillator();
    const dumGain = ctx.createGain();
    dumOsc.type = 'sine';
    dumOsc.frequency.setValueAtTime(82, t);
    dumOsc.frequency.exponentialRampToValueAtTime(45, t + 0.28);

    dumGain.gain.setValueAtTime(0.42, t);
    dumGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    dumOsc.connect(dumGain);
    dumGain.connect(masterGain);
    dumOsc.start(t);
    dumOsc.stop(t + 0.35);

    // 2. "TAK" (Crisp rim snap on beat 2)
    const tTak1 = t + beatInterval * 0.5;
    if (tTak1 < duration - 0.3) {
      renderDafRimSnap(ctx, masterGain, tTak1, 0.18);
    }

    // 3. "TAK" (Gentle syncopation before next Dum)
    const tTak2 = t + beatInterval * 0.82;
    if (tTak2 < duration - 0.3) {
      renderDafRimSnap(ctx, masterGain, tTak2, 0.12);
    }

    t += beatInterval;
  }
}

function renderDafRimSnap(ctx: BaseAudioContext, destination: AudioNode, time: number, vol: number) {
  const snapOsc = ctx.createOscillator();
  const snapGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  snapOsc.type = 'triangle';
  snapOsc.frequency.setValueAtTime(260, time);
  snapOsc.frequency.exponentialRampToValueAtTime(140, time + 0.08);

  filter.type = 'highpass';
  filter.frequency.setValueAtTime(180, time);

  snapGain.gain.setValueAtTime(vol, time);
  snapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

  snapOsc.connect(filter);
  filter.connect(snapGain);
  snapGain.connect(destination);

  snapOsc.start(time);
  snapOsc.stop(time + 0.09);
}

// 10. Harmonium & Classic Tabla (Warm Ghazal & Geet Accompaniment)
function renderHarmoniumTabla(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.44, 0);
  masterGain.connect(ctx.destination);

  // Harmonium Bellows & Chords (C Major / Raag Bhairavi warm harmony)
  const harmoniumChords = [
    [130.81, 164.81, 196.0],  // C major
    [110.0, 146.83, 196.0],   // G/B inversion
    [130.81, 155.56, 196.0],  // C minor (Bhairavi touch)
    [116.54, 146.83, 174.61], // Bb major
  ];

  let chordTime = 0.5;
  let chordIdx = 0;
  while (chordTime < duration - 1.0) {
    const chord = harmoniumChords[chordIdx % harmoniumChords.length];
    const chordLen = 3.6;

    chord.forEach((freq) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Reed sound is sawtooth with mild detune
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, chordTime);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 1.003, chordTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, chordTime);

      gain.gain.setValueAtTime(0, chordTime);
      gain.gain.linearRampToValueAtTime(0.07, chordTime + 0.4);
      gain.gain.setValueAtTime(0.07, chordTime + chordLen - 0.5);
      gain.gain.linearRampToValueAtTime(0.001, chordTime + chordLen);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc1.start(chordTime);
      osc1.stop(chordTime + chordLen);
      osc2.start(chordTime);
      osc2.stop(chordTime + chordLen);
    });

    chordTime += chordLen;
    chordIdx++;
  }

  // Classic Tabla "Dha Dhin Dhin Dha" Taal
  let tablaTime = 0.8;
  const taalStep = 0.55;
  let beatCount = 0;

  while (tablaTime < duration - 0.8) {
    const isBayan = beatCount % 4 === 0 || beatCount % 4 === 3;
    if (isBayan) {
      // Bayan (Bass Tabla Ge/Dha) with pitch bend
      const bayanOsc = ctx.createOscillator();
      const bayanGain = ctx.createGain();
      bayanOsc.type = 'sine';
      bayanOsc.frequency.setValueAtTime(95, tablaTime);
      bayanOsc.frequency.exponentialRampToValueAtTime(60, tablaTime + 0.22);

      bayanGain.gain.setValueAtTime(0.24, tablaTime);
      bayanGain.gain.exponentialRampToValueAtTime(0.001, tablaTime + 0.26);

      bayanOsc.connect(bayanGain);
      bayanGain.connect(masterGain);
      bayanOsc.start(tablaTime);
      bayanOsc.stop(tablaTime + 0.26);
    }

    // Dayan (Treble Tabla Na/Tin)
    const dayanOsc = ctx.createOscillator();
    const dayanGain = ctx.createGain();
    const dayanFilter = ctx.createBiquadFilter();

    dayanOsc.type = 'triangle';
    dayanOsc.frequency.setValueAtTime(261.63, tablaTime);

    dayanFilter.type = 'bandpass';
    dayanFilter.frequency.setValueAtTime(523.25, tablaTime);
    dayanFilter.Q.setValueAtTime(4.0, tablaTime);

    dayanGain.gain.setValueAtTime(0.15, tablaTime);
    dayanGain.gain.exponentialRampToValueAtTime(0.001, tablaTime + 0.14);

    dayanOsc.connect(dayanFilter);
    dayanFilter.connect(dayanGain);
    dayanGain.connect(masterGain);

    dayanOsc.start(tablaTime);
    dayanOsc.stop(tablaTime + 0.14);

    tablaTime += taalStep;
    beatCount++;
  }
}

// 11. Sufi Qawwali Claps & Dholak (Ecstatic Devotional Rhythm)
function renderSufiQawwaliClap(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.45, 0);
  masterGain.connect(ctx.destination);

  // Harmonium Root Swell (C3, G3)
  [130.81, 196.0].forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, 0);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, 0);

    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.08, 1.2);
    gain.gain.setValueAtTime(0.08, duration - 1.2);
    gain.gain.linearRampToValueAtTime(0, duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(0);
    osc.stop(duration);
  });

  // Fast Rhythmic Sufi Claps & Dholak (110 BPM)
  const tempo = 0.54;
  let t = 0.6;
  while (t < duration - 0.6) {
    // Dholak Bass
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(110, t);
    bassOsc.frequency.exponentialRampToValueAtTime(55, t + 0.16);

    bassGain.gain.setValueAtTime(0.3, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(t);
    bassOsc.stop(t + 0.2);

    // Synchronized Qawwali Hand Clap (Noise burst simulation)
    const clapTime = t + tempo * 0.5;
    if (clapTime < duration - 0.2) {
      renderHandClap(ctx, masterGain, clapTime);
    }

    t += tempo;
  }
}

function renderHandClap(ctx: BaseAudioContext, destination: AudioNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(380, time);

  filter.type = 'highpass';
  filter.frequency.setValueAtTime(250, time);

  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + 0.08);
}

// 12. Noorani Ambient Drone (Pure Devotional Atmosphere, No aggressive instruments)
function renderAmbientSpiritualDrone(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.42, 0);
  masterGain.connect(ctx.destination);

  // Solfeggio 528 Hz (Sacred Transformation) & 432 Hz Harmonics
  const sacredFreqs = [108.0, 162.0, 216.0, 324.0, 528.0];
  sacredFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, 0);

    // Ethereal slow breathing swell (0.2 Hz)
    lfo.frequency.setValueAtTime(0.18 + idx * 0.04, 0);
    lfoGain.gain.setValueAtTime(0.015, 0);
    lfo.connect(gain.gain);

    const baseVol = 0.07 / (idx + 1);
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(baseVol, 2.5);
    gain.gain.setValueAtTime(baseVol, duration - 2.5);
    gain.gain.linearRampToValueAtTime(0, duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(0);
    osc.stop(duration);
    lfo.start(0);
    lfo.stop(duration);
  });
}

// 13. Acoustic Guitar & Gentle Melody (Romantic nylon guitar arpeggio)
function renderAcousticGuitarLofi(ctx: BaseAudioContext, duration: number) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.4, 0);
  masterGain.connect(ctx.destination);

  // Nylon Guitar Chord notes (Em9 -> Cmaj7 -> G -> Dsus4)
  const guitarScale = [164.81, 196.0, 246.94, 329.63, 392.0, 493.88, 587.33];
  let time = 0.5;
  let noteIdx = 0;

  while (time < duration - 1.0) {
    const freq = guitarScale[noteIdx % guitarScale.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);

    gain.gain.setValueAtTime(0.26, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 1.1);

    time += 0.55;
    noteIdx++;
  }
}

/**
 * Preview sound player for instant UI auditions (plays 5-6s sample in real-time)
 */
let previewAudioSource: AudioBufferSourceNode | null = null;
let previewGainNode: GainNode | null = null;

export async function playTrackPreview(trackId: string, volume = 0.3): Promise<void> {
  stopTrackPreview();
  if (trackId === 'none') return;

  const audioCtx = getAudioContext();
  const buffer = await synthesizeBackgroundMusicBuffer(trackId, 6.0, audioCtx.sampleRate);
  if (!buffer) return;

  previewAudioSource = audioCtx.createBufferSource();
  previewAudioSource.buffer = buffer;

  previewGainNode = audioCtx.createGain();
  previewGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  previewGainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.3);
  previewGainNode.gain.setValueAtTime(volume, audioCtx.currentTime + 5.2);
  previewGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 6.0);

  previewAudioSource.connect(previewGainNode);
  previewGainNode.connect(audioCtx.destination);

  previewAudioSource.start();
  previewAudioSource.onended = () => {
    previewAudioSource = null;
    previewGainNode = null;
  };
}

export function stopTrackPreview(): void {
  if (previewAudioSource) {
    try {
      previewAudioSource.stop();
      previewAudioSource.disconnect();
    } catch {
      // ignore
    }
    previewAudioSource = null;
  }
}
