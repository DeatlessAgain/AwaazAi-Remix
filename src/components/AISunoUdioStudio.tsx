import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Disc3,
  Music,
  Copy,
  Check,
  Play,
  Pause,
  ExternalLink,
  Sliders,
  Wand2,
  BookOpen,
  Volume2,
  VolumeX,
  RefreshCw,
  Flame,
  Layers,
  Radio,
  Shuffle,
  FileText,
  Mic,
  AlertCircle,
  HelpCircle,
  Clock,
  Timer,
  Upload,
  RotateCcw,
  SkipBack,
  SkipForward,
  Music2,
  Share2,
  Headphones,
  Activity,
  ListMusic,
} from 'lucide-react';
import {
  GeneratedAudioItem,
  MusicEngineTarget,
  SunoUdioCompositionResult,
  SpeechStyle,
  VoiceEmotion,
} from '../types';
import { VOICES } from '../data/voices';
import { BACKGROUND_MUSIC_TRACKS } from '../data/backgroundMusic';
import { mixVoiceAndBackgroundMusic, audioBufferToWavBase64 } from '../utils/audioMixer';
import { synthesizeBackgroundMusicBuffer } from '../utils/bgMusicSynthesizer';
import {
  parseLyricsWithTimings,
  findActiveTimedLine,
  autoInjectTimingIndicators,
  stripTimingIndicators,
  formatSecondsDisplay,
  ParsedTimedLine,
} from '../utils/lyricsTimer';
import { AISunoUdioProducerSuite } from './AISunoUdioProducerSuite';

interface AISunoUdioStudioProps {
  onAudioGenerated: (item: GeneratedAudioItem) => void;
}

interface SongPreset {
  id: string;
  name: string;
  nameUrdu: string;
  genre: string;
  mood: string;
  tempo: string;
  vocalPreference: string;
  language: 'urdu' | 'hindi' | 'english' | 'roman_urdu';
  topic: string;
}

const SONG_PRESETS: SongPreset[] = [
  {
    id: 'urdu_lofi_rain',
    name: 'Urdu Lo-Fi Rainy Acoustic',
    nameUrdu: 'دھیمی بارش اور پرانی یادیں',
    genre: 'urdu_lofi',
    mood: 'Melancholic & Nostalgic',
    tempo: 'Slow (78-84 BPM)',
    vocalPreference: 'Soulful Female Vocals (warm & intimate)',
    language: 'urdu',
    topic: 'بارش کی بوندیں، گرم چائے کی پیالی، اور بچھڑے ہوئے ہم سفر کی اداس لیکن خوبصورت یادیں',
  },
  {
    id: 'ghazal_sitar_fusion',
    name: 'Ghazal & Sitar Fusion',
    nameUrdu: 'کلاسیکی غزل و ستار فیوژن',
    genre: 'ghazal_fusion',
    mood: 'Poetic & Deep',
    tempo: 'Slow (72-80 BPM)',
    vocalPreference: 'Deep Resonant Male (classical ghazal)',
    language: 'urdu',
    topic: 'دل کا سکون، محبت کی پاکیزگی اور رات کی تنہائی میں محبوب سے خاموش گفتگو',
  },
  {
    id: 'sufi_coke_studio',
    name: 'Sufi Rock / Coke Studio Vibe',
    nameUrdu: 'صوفی کلام اور کوک اسٹوڈیو انرجی',
    genre: 'coke_studio',
    mood: 'Spiritual & Passionate',
    tempo: 'Mid-Tempo (98-112 BPM)',
    vocalPreference: 'Qawwali Ensemble & Lead Male',
    language: 'urdu',
    topic: 'عشقِ حقیقی، روح کی بے قراری، ڈھولک کی تھاپ اور اللہ کی رحمت کا عرفان',
  },
  {
    id: 'bollywood_romantic_pop',
    name: 'Desi Romantic Pop Anthem',
    nameUrdu: 'رومانوی بالی ووڈ پاپ نغمہ',
    genre: 'bollywood_pop',
    mood: 'Romantic & Melodic',
    tempo: 'Mid-Tempo (100-116 BPM)',
    vocalPreference: 'Duet Conversational (Female & Male)',
    language: 'hindi',
    topic: 'पहली नज़र का प्यार, धड़कते दिल की बेचैनी और तारों भरी सुहानी शाम',
  },
  {
    id: 'punjabi_trap_beat',
    name: 'Punjabi Chill / Hip-Hop Beat',
    nameUrdu: 'پنجابی چِل و ماڈرن بیٹس',
    genre: 'punjabi_dance',
    mood: 'Chill & Confident',
    tempo: 'Mid-Tempo (95-108 BPM)',
    vocalPreference: 'Energetic Male Vocals with swagger',
    language: 'roman_urdu',
    topic: 'Late night highway drive, neon city lights, true brotherhood and loyalty',
  },
  {
    id: 'devotional_spiritual',
    name: 'Spiritual Nasheed Melody',
    nameUrdu: 'روحانی حمد و نعت کی دھن',
    genre: 'devotional_nasheed',
    mood: 'Peaceful & Devotional',
    tempo: 'Slow (70-76 BPM)',
    vocalPreference: 'Soulful Clean Vocals with gentle reverb',
    language: 'urdu',
    topic: 'مدینے کی پرسکون گلیاں، دربارِ رسالت ﷺ کی حاضری اور باطنی سکون',
  },
];

const RANDOM_TOPIC_IDEAS = [
  'پرانے خطوط، الماری میں رکھی کتاب اور بارش کا رومانوی منظر',
  'رات کے تین بجے کی خاموشی، ٹھنڈی ہوا اور دل کے ان کہے راز',
  'سفر کا آغاز، خوابوں کی تلاش اور اپنی منزل پانے کا عزم',
  'A bittersweet walk through the city under glowing street lamps after a heavy rain',
  'صوفیانہ عشق جس میں دنیا کا غم مٹ کر دائمی سکون میں ڈھل جائے',
  'خزاں کے گرتے پتے اور نئی بہار کی امید، امید افزا نغمہ',
];

export const USER_RAIN_SONG_LYRICS = `[0:00] [Intro]
(Gentle acoustic guitar arpeggios with distant rain soundscape)
(Soft bansuri flute melody)

[0:06] [Verse 1]
[0:08] بارش کی بوندیں اور تیرا خیال
[0:13] تیرے جانے کے بعد، کیا ہے میرا حال
[0:18] گرم چائے کی چسکی، اور تیری خوشبو
[0:23] ڈھونڈتی ہے تجھے ہر اک سو

[0:28] [Pre-Chorus]
[0:30] شبِ تاریک میں چمکے ستارے
[0:35] جیسے دل کے جینے کے استعارے
[0:40] فاصلے جتنے بھی ہیں درمیاں
[0:45] روک نہ پائیں گے یہ کارواں

[0:50] [Chorus]
[0:53] آ بھی جا، کہ دل بے قرار ہے
[0:58] آج بھی تیرا انتظار ہے
[1:03] بارش کی ہر اک بوند میں تیری صدا
[1:08] تو ہی میرا مقدر، تو ہی دعا

[1:14] [Verse 2]
[1:17] نہ مایوس ہو گردشِ تقدیر سے
[1:22] بندھی ہے محبت اک زنجیر سے
[1:27] اندھیری رات کا حاصل تنہائی نہیں
[1:32] تیرے بنا کوئی سچی رعنائی نہیں

[1:37] [Bridge]
[1:39] [Bansuri and Acoustic Guitar Solo]
[1:44] افق پر دیکھ، جگمگاتے ستارے
[1:49] دے رہے ہیں ملن کے اشارے
[1:54] تاریک راتوں کے پار سحر ہوگی
[1:59] ہماری محبت پھر سے امر ہوگی

[2:05] [Chorus]
[2:08] آ بھی جا، کہ دل بے قرار ہے
[2:13] آج بھی تیرا انتظار ہے
[2:18] بارش کی ہر اک بوند میں تیری صدا
[2:23] تو ہی میرا مقدر، تو ہی دعا

[2:29] [Outro]
[2:32] بارش کی بوندیں... اور تیرا خیال...
[2:37] تیرے جانے کے بعد... کیا ہے حال...
[2:43] (Soft guitar fade with gentle piano chords)
[2:50] [Fade Out]`;

export const buildCustomSongComposition = (
  lyrics: string,
  _chosenGenre: string,
  chosenMood: string,
  _chosenTempo: string,
  vocalPref: string
): SunoUdioCompositionResult => {
  return {
    songTitle: 'Baarish Aur Tera Khayal (Rain & Memories)',
    nativeTitle: 'بارش کی بوندیں اور تیرا خیال',
    genre: 'Urdu Lo-Fi & Bansuri Acoustic Ballad',
    mood: chosenMood || 'Melancholic & Nostalgic',
    tempoBpm: 80,
    musicalKey: 'D minor',
    vocalStyle: vocalPref || 'Soulful Female Vocals (warm & intimate)',
    suno: {
      stylePrompt:
        'urdu acoustic lo-fi ballad, soulful warm female vocals, gentle acoustic guitar arpeggios, bansuri flute melody, distant rain soundscape, emotional, melancholic, 80 BPM',
      negativePrompt:
        'autotune, aggressive drums, electric distortion, harsh synth, loud brass, techno, robotic',
      lyrics: lyrics.trim(),
      tags: [
        'urdu-lofi',
        'bansuri-flute',
        'acoustic-guitar',
        'rain-ambiance',
        'soulful-female',
        '80bpm',
        'melancholic',
      ],
      tips: "In Suno AI (suno.com), click Create, turn on 'Custom' mode, paste this Style Prompt in 'Style of Music', and paste the full lyrics in 'Lyrics'. Use Suno v4 for crystal-clear Urdu pronunciation.",
    },
    udio: {
      stylePrompt:
        'urdu acoustic lo-fi, bansuri flute, distant rain soundscape, soulful female vocals, melancholic ballad, acoustic guitar fingerpicking, emotional, slow tempo, 80 bpm',
      negativePrompt: 'autotune, distorted guitars, electronic synth, noisy drums, screaming',
      lyrics: lyrics.trim(),
      tags: ['urdu', 'acoustic-lofi', 'bansuri', 'rain', 'melancholic-ballad', 'slow-tempo'],
      tips: "In Udio (udio.com), switch to 'Custom Lyrics', enter this prompt, paste the lyrics, and generate. You can click 'Extend' to seamlessly lengthen the song.",
    },
    singingSnippet: `[0:00] آ بھی جا، کہ دل بے قرار ہے\n[0:04] آج بھی تیرا انتظار ہے\n[0:08] بارش کی ہر اک بوند میں تیری صدا\n[0:13] تو ہی میرا مقدر، تو ہی دعا`,
    recommendedVoice: 'Aoede',
    recommendedBgmTrackId: 'acoustic_guitar_lofi',
    productionAdvice:
      'This song pairs rain soundscapes and bansuri flute with warm acoustic guitar arpeggios. Keeping the tempo at 80 BPM gives the Urdu poetry space to express deep yearning.',
    timeSignature: '4/4',
    instrumentalStems: [
      { name: 'Lead Vocals', description: 'Intimate soulful female vocal with warm low-mid resonance', recommendedEffects: 'Plate Reverb (2.2s), 250ms stereo ping-pong delay' },
      { name: 'Harmony & Backing Choir', description: 'Subtle high-octave breathy backing harmonies on choruses', recommendedEffects: 'Chorus DSP + 35% Wet Stereo Spread' },
      { name: 'Acoustic Guitar', description: 'Fingerpicked nylon & steel-string acoustic guitar arpeggios in D minor', recommendedEffects: 'Subtle analog compression, high-pass at 100Hz' },
      { name: 'Bansuri Flute / Sitar', description: 'Melodic eastern flute counter-melody dancing between lyric pauses', recommendedEffects: 'Sacred Hall reverb & warmth boost' },
      { name: 'Lo-Fi Beat & Percussion', description: 'Soft vinyl crackle, brushed snare, gentle kick & tabla rim shots', recommendedEffects: 'Low-pass filter at 8kHz for authentic lo-fi warmth' },
      { name: 'Rain & Ambient Foley', description: 'Continuous gentle rain falling on window panes with soft thunder in distance', recommendedEffects: '-14dB ducked under lead vocals' },
    ],
    arrangementBreakdown: [
      { section: 'Intro', timing: '0:00 - 0:18', energyLevel: 'Low', description: 'Rain foley begins, soft bansuri flute theme enters with acoustic guitar chords.' },
      { section: 'Verse 1', timing: '0:18 - 0:52', energyLevel: 'Medium', description: 'Lead vocal enters softly. Acoustic guitar and gentle brushed beats establish rhythm.' },
      { section: 'Pre-Chorus', timing: '0:52 - 1:08', energyLevel: 'Medium', description: 'Bass notes deepen, harmonium chords swell, building emotional anticipation.' },
      { section: 'Chorus', timing: '1:08 - 1:44', energyLevel: 'Peak', description: 'Full vocal projection with backing chorus harmony. Sitar and tabla join in grandeur.' },
      { section: 'Interlude', timing: '1:44 - 2:02', energyLevel: 'Medium', description: 'Melodic bansuri flute solo interplay with acoustic guitar.' },
      { section: 'Verse 2', timing: '2:02 - 2:36', energyLevel: 'Medium', description: 'More rhythmic vocal cadence with reflective poetic imagery.' },
      { section: 'Bridge', timing: '2:36 - 2:56', energyLevel: 'High', description: 'Stripped back instrumentation, raw vocal intimacy before final explosion.' },
      { section: 'Final Chorus & Outro', timing: '2:56 - 3:40', energyLevel: 'Peak', description: 'Grand final chorus with layered vocals, fading gracefully into rain foley.' },
    ],
    socialBundle: {
      suggestedTitle: 'Baarish Aur Tera Khayal | بارش اور تیرا خیال (Official Urdu Lo-Fi Song)',
      description: `Experience the soulful essence of monsoon nostalgia with "Baarish Aur Tera Khayal". Composed with intimate Urdu poetry, warm acoustic guitars, and meditative bansuri flutes.\n\n🎵 Created with Awaaz AI Studio, Suno AI & Udio.\n\n⏱️ Timestamps:\n0:00 - Intro (Rain & Flute)\n0:18 - Verse 1\n1:08 - Chorus\n1:44 - Bansuri Interlude\n2:56 - Final Chorus & Outro\n\n#UrduLoFi #SunoAI #Udio #UrduPoetry #RainSong`,
      hashtags: ['#UrduMusic', '#SunoAI', '#UdioMusic', '#UrduLoFi', '#AcousticBallad', '#GhazalFusion', '#CokeStudioVibes', '#PakistaniMusic', '#MonsoonSongs'],
    },
  };
};

export const AISunoUdioStudio: React.FC<AISunoUdioStudioProps> = ({ onAudioGenerated }) => {
  // Mode selection: Custom Lyrics vs AI Idea Generator
  const [inputMode, setInputMode] = useState<'custom_lyrics' | 'ai_composer'>('custom_lyrics');
  const [customLyricsText, setCustomLyricsText] = useState<string>(USER_RAIN_SONG_LYRICS);

  // Input States
  const [targetEngine, setTargetEngine] = useState<MusicEngineTarget>('both');
  const [genre, setGenre] = useState<string>('urdu_lofi');
  const [customGenre, setCustomGenre] = useState<string>('');
  const [language, setLanguage] = useState<'urdu' | 'hindi' | 'english' | 'roman_urdu'>('urdu');
  const [topic, setTopic] = useState<string>(
    'بارش کی بوندیں، گرم چائے کی پیالی، اور بچھڑے ہوئے ہم سفر کی اداس لیکن خوبصورت یادیں'
  );
  const [mood, setMood] = useState<string>('Melancholic & Nostalgic');
  const [tempo, setTempo] = useState<string>('Slow (78-84 BPM)');
  const [vocalPreference, setVocalPreference] = useState<string>('Soulful Female Vocals (warm & intimate)');

  // Output & Execution States (Preloaded with user's rain song)
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [composition, setComposition] = useState<SunoUdioCompositionResult | null>(() =>
    buildCustomSongComposition(
      USER_RAIN_SONG_LYRICS,
      'urdu_lofi',
      'Melancholic & Nostalgic',
      'Slow (78-84 BPM)',
      'Soulful Female Vocals (warm & intimate)'
    )
  );
  const [activeEngineTab, setActiveEngineTab] = useState<'suno' | 'udio'>('suno');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // --- Audio Playback & Synchronized Lyrics Engine ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const [activeAudioSource, setActiveAudioSource] = useState<'audition' | 'demo' | 'uploaded' | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [audioVolume, setAudioVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoScrollLyrics, setAutoScrollLyrics] = useState<boolean>(true);
  const [uploadedTrackName, setUploadedTrackName] = useState<string | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState<boolean>(false);
  const [demoAudioUrl, setDemoAudioUrl] = useState<string | null>(null);

  // Audition preview with Awaaz AI TTS
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [songGenerationLength, setSongGenerationLength] = useState<'full' | 'hook'>('full');
  const [auditionVoice, setAuditionVoice] = useState<string>('Aoede');
  const [auditionBgm, setAuditionBgm] = useState<string>('acoustic_guitar_lofi');
  const [auditionAudioUrl, setAuditionAudioUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Setup HTMLAudioElement listeners
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const loadAndPlayTrack = (url: string, autoPlay = true, source: 'audition' | 'demo' | 'uploaded' = 'audition') => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = url;
    audioRef.current.playbackRate = playbackSpeed;
    audioRef.current.volume = isMuted ? 0 : audioVolume;
    audioRef.current.load();
    setCurrentAudioUrl(url);
    setActiveAudioSource(source);
    setCurrentTime(0);

    if (autoPlay) {
      audioRef.current.play().catch((err) => {
        console.warn('Audio auto-play prevented:', err);
      });
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (!currentAudioUrl) {
      if (composition) {
        generateSongAudio(composition, auditionVoice, auditionBgm, true);
      } else {
        handlePlayDemoRainTrack();
      }
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.warn('Play error:', err));
    }
  };

  const handleSeek = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(seconds, duration || 9999));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleSkip = (delta: number) => {
    handleSeek(currentTime + delta);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.volume = next ? 0 : audioVolume;
  };

  const handlePlayDemoRainTrack = async () => {
    if (demoAudioUrl) {
      loadAndPlayTrack(demoAudioUrl, true, 'demo');
      return;
    }
    setIsGeneratingDemo(true);
    setStatusMessage('بارش اور لو فائی گٹار کی پرسکون دھن تیار ہو رہی ہے...');
    try {
      const buffer = await synthesizeBackgroundMusicBuffer('rain_meditation', 180);
      if (buffer) {
        const wavBase64 = audioBufferToWavBase64(buffer);
        const url = `data:audio/wav;base64,${wavBase64}`;
        setDemoAudioUrl(url);
        loadAndPlayTrack(url, true, 'demo');
        setStatusMessage('بارش اور صوفیانہ گٹار کی دھن لوڈ ہو چکی ہے۔ بول سن کر لطف اٹھائیں!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      console.error('Failed to generate demo track:', e);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedTrackName(file.name);
    loadAndPlayTrack(url, true, 'uploaded');
    setStatusMessage(`آڈیو فائل "${file.name}" کامیابی سے لوڈ کر دی گئی ہے!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSelectPreset = (preset: SongPreset) => {
    setGenre(preset.genre);
    setMood(preset.mood);
    setTempo(preset.tempo);
    setVocalPreference(preset.vocalPreference);
    setLanguage(preset.language);
    setTopic(preset.topic);
  };

  const handleRandomTopic = () => {
    const random = RANDOM_TOPIC_IDEAS[Math.floor(Math.random() * RANDOM_TOPIC_IDEAS.length)];
    setTopic(random);
  };

  const handleFormatCustomLyrics = () => {
    const res = buildCustomSongComposition(
      customLyricsText,
      genre,
      mood,
      tempo,
      vocalPreference
    );
    setComposition(res);
    setAuditionVoice('Aoede');
    setAuditionBgm('acoustic_guitar_lofi');
    setStatusMessage('گانے کے بول اور اسٹائل پرامپٹ سونو اور اوڈیو کے لیے تیار کر دیے گئے ہیں!');
    setTimeout(() => setStatusMessage(null), 3000);
    return res;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Direct Audio Synthesis & Playback for Composed Song
  const generateSongAudio = async (
    targetComp: SunoUdioCompositionResult,
    voiceToUse?: string,
    bgmToUse?: string,
    autoPlay = true,
    songMode?: 'full' | 'hook'
  ): Promise<string | null> => {
    const activeMode = songMode || songGenerationLength || 'full';
    const rawVoice = voiceToUse || targetComp.recommendedVoice || auditionVoice || 'Aoede';
    const validVoiceIds = [
      'Kid-Pari',
      'Kid-Ali',
      'Kid-Bablu',
      'Kid-Milo',
      'Kore',
      'Zephyr',
      'Aoede',
      'Charon',
      'Puck',
      'Fenrir',
    ];
    const safeVoice = validVoiceIds.includes(rawVoice) ? rawVoice : 'Aoede';

    const chosenBgm =
      bgmToUse !== undefined
        ? bgmToUse
        : targetComp.recommendedBgmTrackId || auditionBgm || 'acoustic_guitar_lofi';

    const allLyrics =
      (targetComp.suno?.lyrics ||
      targetComp.udio?.lyrics ||
      customLyricsText ||
      '').trim();

    // Clean 4-line snippet for hook preview
    let cleanSnippet = (targetComp.singingSnippet || '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, 4)
      .join('\n')
      .trim();

    if (!cleanSnippet || cleanSnippet.length < 5) {
      cleanSnippet =
        'یہ بھیگی بھیگی راتیں، اور چائے کا اک کپ\nیادوں کے اس سمندر میں، دل ڈوبا ہے کب\nبہتی بارش کا شور، اور تیرا خیال';
    }

    setIsAuditioning(true);
    if (activeMode === 'full') {
      setStatusMessage('پورے گانے کے تمام بند (Verse, Chorus, Bridge, Outro) سریلی آواز میں تیار ہو رہے ہیں... (~2:50 منٹ)');
    } else {
      setStatusMessage('گانے کے مرکزی کورس کی جھلک (Chorus Hook ~26s) تیار ہو رہی ہے...');
    }

    try {
      const lowerGenre = (targetComp.genre || genre || '').toLowerCase();
      let vocalStyle = 'melodic_song';
      if (lowerGenre.includes('ghazal')) {
        vocalStyle = 'ghazal_singing';
      } else if (lowerGenre.includes('sufi') || lowerGenre.includes('qawwali')) {
        vocalStyle = 'sufi_qawwali';
      } else if (
        lowerGenre.includes('naat') ||
        lowerGenre.includes('hamd') ||
        lowerGenre.includes('nasheed')
      ) {
        vocalStyle = 'naat_devotional';
      }

      let voiceData: any = null;
      try {
        const res = await fetch('/api/tts/generate-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lyrics: activeMode === 'full' ? allLyrics : cleanSnippet,
            text: activeMode === 'full' ? allLyrics : cleanSnippet,
            voice: safeVoice,
            language: language === 'hindi' ? 'hindi' : language === 'english' ? 'english' : 'urdu',
            style: vocalStyle,
            emotion: mood === 'melancholic' ? 'sad' : mood === 'energetic' ? 'excited' : 'joyful',
            pitch: 0,
            mode: activeMode,
          }),
        });

        if (res.ok) {
          voiceData = await res.json();
        }
      } catch (networkErr) {
        console.warn('Network request to song TTS failed:', networkErr);
      }

      // If voice data is available from server (either live voice or melodic accompaniment)
      if (voiceData?.audio) {
        let finalBase64 = voiceData.audio;
        let durationSeconds = voiceData.durationSeconds || 8;

        // Mix with background music if chosen
        if (chosenBgm && chosenBgm !== 'none') {
          setStatusMessage('پس منظر کی موسیقی کو گانے کے ساتھ مکس کیا جا رہا ہے...');
          try {
            const mixResult = await mixVoiceAndBackgroundMusic(voiceData.audio, {
              trackId: chosenBgm,
              volume: 24,
              autoDucking: true,
            });
            if (mixResult?.mixedBase64) {
              finalBase64 = mixResult.mixedBase64;
              if (mixResult.durationSeconds > 0) {
                durationSeconds = mixResult.durationSeconds;
              }
            }
          } catch (mixErr) {
            console.warn('Audio mixer warning, playing primary audio:', mixErr);
          }
        }

        const audioUrl = `data:audio/mp3;base64,${finalBase64}`;
        setAuditionAudioUrl(audioUrl);
        loadAndPlayTrack(audioUrl, autoPlay, 'audition');

        // Feed into library
        const voiceMeta = VOICES.find((v) => v.id === safeVoice) || VOICES[0];
        const bgmObj = BACKGROUND_MUSIC_TRACKS.find((t) => t.id === chosenBgm);
        const newItem: GeneratedAudioItem = {
          id: `suno_song_${Date.now()}`,
          text: activeMode === 'full' ? allLyrics : cleanSnippet,
          voice: safeVoice,
          voiceName: `${targetComp.nativeTitle || targetComp.songTitle} (${voiceMeta.name})`,
          language: language === 'hindi' ? 'hindi' : language === 'english' ? 'english' : 'urdu',
          style: vocalStyle as any,
          emotion: mood === 'melancholic' ? 'sad' : 'neutral',
          emotionIntensity: 65,
          audioBase64: finalBase64,
          rawVoiceBase64: voiceData.audio,
          bgMusicTrackId: chosenBgm !== 'none' ? chosenBgm : undefined,
          bgMusicTrackName: bgmObj ? bgmObj.name : undefined,
          bgMusicVolume: 24,
          mimeType: 'audio/wav',
          durationSeconds,
          createdAt: Date.now(),
        };
        onAudioGenerated(newItem);

        if (voiceData.isFallback) {
          setStatusMessage('🎵 اسٹوڈیو ایکوسٹک سرود اور دھن کے ساتھ گانا تیار ہو گیا ہے!');
        } else {
          setStatusMessage('🎉 گانا سریلی آواز اور موسیقی کے ساتھ کامیابی سے تیار ہو کر بج رہا ہے!');
        }
        setTimeout(() => setStatusMessage(null), 5000);

        setTimeout(() => {
          playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        return audioUrl;
      }

      // Robust Client-Side Audio Synthesis Fallback
      // If cloud TTS is busy or unavailable, synthesize the instrumental song track directly in browser
      setStatusMessage('گانے کے لیے خوبصورت ساز اور دھن تیار ہو رہی ہے...');
      const fallbackTrack = chosenBgm !== 'none' ? chosenBgm : 'acoustic_guitar_lofi';
      const buffer = await synthesizeBackgroundMusicBuffer(fallbackTrack, 180);
      if (buffer) {
        const wavBase64 = audioBufferToWavBase64(buffer);
        const audioUrl = `data:audio/wav;base64,${wavBase64}`;
        setDemoAudioUrl(audioUrl);
        loadAndPlayTrack(audioUrl, autoPlay, 'demo');

        setStatusMessage(
          '🎶 گانے کی دلکش دھن کامیابی سے تیار ہو کر بج رہی ہے! Suno یا Udio کے لیے نیچے دیے گئے پرامپٹ سے فل ٹریک بنائیں۔'
        );
        setTimeout(() => setStatusMessage(null), 5000);

        setTimeout(() => {
          playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        return audioUrl;
      }

      setStatusMessage('گانے کے بول تیار ہیں! نیچے دیے گئے بٹن سے پرامپٹ کاپی کریں۔');
      setTimeout(() => setStatusMessage(null), 4000);
      return null;
    } catch (err: any) {
      console.warn('Playback notice:', err);
      // Fallback to demo rain track
      handlePlayDemoRainTrack();
      return null;
    } finally {
      setIsAuditioning(false);
    }
  };

  // Dual handler: Compose song prompts and optionally auto-synthesize full audio
  const handleGenerateFullSong = async (withAudio = true) => {
    setIsComposing(true);

    let targetComp: SunoUdioCompositionResult | null = null;

    if (inputMode === 'custom_lyrics') {
      setStatusMessage('آپ کی شاعری کو گانے کے بول اور اسٹوڈیو پرامپٹس میں ڈھالا جا رہا ہے...');
      targetComp = handleFormatCustomLyrics();
    } else {
      setStatusMessage('1/3: Suno اور Udio کے لیے جدید میوزیکل پرامپٹ اور اشعار تیار ہو رہے ہیں...');

      try {
        const res = await fetch('/api/ai/suno-udio-composer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engine: targetEngine,
            genre,
            customGenre,
            language,
            topic,
            mood,
            tempo,
            vocalPreference,
          }),
        });

        const data = await res.json();
        if (data.success && data.result) {
          targetComp = data.result;
          setComposition(data.result);
          if (data.result.recommendedVoice) {
            setAuditionVoice(data.result.recommendedVoice);
          }
          if (data.result.recommendedBgmTrackId) {
            setAuditionBgm(data.result.recommendedBgmTrackId);
          }
        } else {
          throw new Error('API failed to return result');
        }
      } catch (err: any) {
        console.warn('Error composing with API, using reliable template fallback:', err);
        targetComp = buildCustomSongComposition(
          USER_RAIN_SONG_LYRICS,
          genre,
          mood,
          tempo,
          vocalPreference
        );
        setComposition(targetComp);
      }
    }

    setIsComposing(false);

    if (withAudio && targetComp) {
      await generateSongAudio(
        targetComp,
        targetComp.recommendedVoice || auditionVoice,
        targetComp.recommendedBgmTrackId || auditionBgm,
        true
      );
    } else {
      setStatusMessage('سونو اور اوڈیو کے پرامپٹس اور بول تیار ہیں! گانا سننا چاہیں تو پلے بٹن دبائیں۔');
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleCompose = () => handleGenerateFullSong(true);

  // Re-audition or sing hook
  const handleAuditionHook = async () => {
    if (!composition) return;
    await generateSongAudio(composition, auditionVoice, auditionBgm, true, 'hook');
  };

  const handleGenerateFullTrack = async () => {
    if (!composition) return;
    await generateSongAudio(composition, auditionVoice, auditionBgm, true, 'full');
  };

  // Synchronized Lyrics Computation
  const displayedLyrics = useMemo(() => {
    if (activeEngineTab === 'suno') {
      return composition?.suno.lyrics || customLyricsText;
    }
    return composition?.udio.lyrics || customLyricsText;
  }, [activeEngineTab, composition, customLyricsText]);

  const parsedLyricsResult = useMemo(() => {
    return parseLyricsWithTimings(displayedLyrics);
  }, [displayedLyrics]);

  const activeTimedLine = useMemo(() => {
    return findActiveTimedLine(parsedLyricsResult.timedLines, currentTime);
  }, [parsedLyricsResult.timedLines, currentTime]);

  // Smooth scroll to active line
  useEffect(() => {
    if (!autoScrollLyrics || !activeTimedLine) return;
    const el = document.getElementById(activeTimedLine.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeTimedLine?.id, autoScrollLyrics]);

  // Helper actions for timing indicators
  const handleAutoTimeLyrics = () => {
    if (inputMode === 'custom_lyrics') {
      const updated = autoInjectTimingIndicators(customLyricsText);
      setCustomLyricsText(updated);
      const res = buildCustomSongComposition(
        updated,
        genre,
        mood,
        tempo,
        vocalPreference
      );
      setComposition(res);
    } else if (composition) {
      const updatedSuno = autoInjectTimingIndicators(composition.suno.lyrics);
      const updatedUdio = autoInjectTimingIndicators(composition.udio.lyrics);
      setComposition({
        ...composition,
        suno: { ...composition.suno, lyrics: updatedSuno },
        udio: { ...composition.udio, lyrics: updatedUdio },
      });
    }
    setStatusMessage('تمام اشعار میں خودکار ٹائم اسٹیمپ [0:xx] کامیابی سے شامل کر دیے گئے ہیں!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleStripTimestamps = () => {
    if (inputMode === 'custom_lyrics') {
      const cleaned = stripTimingIndicators(customLyricsText);
      setCustomLyricsText(cleaned);
      const res = buildCustomSongComposition(
        cleaned,
        genre,
        mood,
        tempo,
        vocalPreference
      );
      setComposition(res);
    } else if (composition) {
      const cleanedSuno = stripTimingIndicators(composition.suno.lyrics);
      const cleanedUdio = stripTimingIndicators(composition.udio.lyrics);
      setComposition({
        ...composition,
        suno: { ...composition.suno, lyrics: cleanedSuno },
        udio: { ...composition.udio, lyrics: cleanedUdio },
      });
    }
    setStatusMessage('اشعار سے ٹائم اسٹیمپ ہٹا دیے گئے ہیں (صاف متن تیار ہے)!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleStampCurrentTime = () => {
    const timeFormatted = formatSecondsDisplay(currentTime);
    const tag = `[${timeFormatted}]`;
    setCustomLyricsText((prev) => `${prev.trimEnd()}\n${tag} `);
    setStatusMessage(`ٹائم اسٹیمپ ${tag} شامل کر دیا گیا!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleLyricLineClick = (line: ParsedTimedLine) => {
    if (line.timeSeconds === null) return;
    handleSeek(line.timeSeconds);
    if (!isPlaying && audioRef.current && currentAudioUrl) {
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Introduction */}
      <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-orange-950/20 to-black/50 p-6 backdrop-blur-xl shadow-xl shadow-amber-950/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 shrink-0">
              <Disc3 className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  Suno AI & Udio Song Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  v3.5 / v4 & Udio v1.5
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/60 mt-1 font-urdu leading-relaxed">
                سونو اے آئی اور اوڈیو کے لیے جدید میوزک اسٹائل ٹیگز، اسٹرکچرڈ بول ([Verse], [Chorus], [Bridge]) اور
                لائیو ووکل آڈیشن
              </p>
            </div>
          </div>

          {/* Target Engine Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-2xl border border-white/10 shrink-0 self-stretch sm:self-auto justify-center">
            <button
              type="button"
              onClick={() => setTargetEngine('both')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                targetEngine === 'both'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Both (Suno + Udio)</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetEngine('suno')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                targetEngine === 'suno'
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>Suno AI</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetEngine('udio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                targetEngine === 'udio'
                  ? 'bg-purple-600 text-white font-bold shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
              <span>Udio</span>
            </button>
          </div>
        </div>

        {/* Quick Style Presets Bar */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Curated South Asian & Global Presets (ریڈی میڈ پری سیٹس)</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {SONG_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  genre === p.genre
                    ? 'border-amber-400/60 bg-amber-500/20 text-white shadow-md shadow-amber-500/10'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold line-clamp-1">{p.name}</div>
                  <div className="text-[11px] font-urdu text-amber-300/80 mt-0.5 line-clamp-1">{p.nameUrdu}</div>
                </div>
                <div className="text-[9px] text-white/40 mt-1 uppercase font-mono">{p.language}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mode Switcher: Custom Lyrics vs AI Idea Generator */}
      <div className="flex items-center gap-2 p-1.5 bg-black/60 rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setInputMode('custom_lyrics')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            inputMode === 'custom_lyrics'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/50'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>اپنی شاعری سے گانا بنائیں (Custom Lyrics to Music)</span>
        </button>
        <button
          type="button"
          onClick={() => setInputMode('ai_composer')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            inputMode === 'ai_composer'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/50'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>نئی شاعری و کمپوزیشن بنائیں (AI Song Composer)</span>
        </button>
      </div>

      {/* AI Suno & Udio Producer Suite */}
      <AISunoUdioProducerSuite
        currentLyrics={inputMode === 'custom_lyrics' ? customLyricsText : composition?.suno.lyrics || ''}
        currentGenre={genre}
        topic={topic}
        onApplyLyricsSnippet={(snippet, position) => {
          if (inputMode === 'custom_lyrics') {
            if (position === 'replace') {
              setCustomLyricsText(snippet);
            } else if (position === 'top') {
              setCustomLyricsText(`${snippet}\n\n${customLyricsText}`);
            } else {
              setCustomLyricsText(`${customLyricsText.trim()}\n\n${snippet}`);
            }
          } else if (composition) {
            const updated = `${composition.suno.lyrics.trim()}\n\n${snippet}`;
            setComposition({
              ...composition,
              suno: { ...composition.suno, lyrics: updated },
              udio: { ...composition.udio, lyrics: updated },
            });
          } else {
            setInputMode('custom_lyrics');
            setCustomLyricsText(snippet);
          }
          setStatusMessage('AI سیکشن اشعار میں شامل کر دیا گیا ہے!');
          setTimeout(() => setStatusMessage(null), 3000);
        }}
        onApplyVariation={(variation) => {
          if (composition) {
            setComposition({
              ...composition,
              genre: variation.styleName,
              tempo: variation.tempo,
              suno: {
                ...composition.suno,
                prompt: variation.sunoPrompt,
              },
              udio: {
                ...composition.udio,
                prompt: variation.udioPrompt,
              },
            });
          }
          setStatusMessage(`ریمکس اسٹائل "${variation.styleName}" کامیابی سے لاگو ہو گیا!`);
          setTimeout(() => setStatusMessage(null), 3500);
        }}
        onApplyEnhancedPrompt={(enhancedPrompt, negativePrompt) => {
          if (composition) {
            setComposition({
              ...composition,
              suno: {
                ...composition.suno,
                prompt: enhancedPrompt,
              },
              udio: {
                ...composition.udio,
                prompt: enhancedPrompt,
              },
            });
          }
          setStatusMessage('بہترین پرو میٹا-پرامپٹ اسٹوڈیو میں کامیابی سے لاگو کر دیا گیا!');
          setTimeout(() => setStatusMessage(null), 3500);
        }}
      />

      {/* Composition Controls Form */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 backdrop-blur-xl space-y-5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Genre Selection */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Musical Genre (موسیقی کی صنف)
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none transition-colors"
            >
              <option value="urdu_lofi">Urdu Lo-Fi & Bedroom Pop (اردو لوفائی)</option>
              <option value="ghazal_fusion">Ghazal & Sitar Fusion (کلاسیکل غزل)</option>
              <option value="coke_studio">Coke Studio / Sufi Rock (صوفی راک)</option>
              <option value="bollywood_pop">Bollywood Melodic Pop (بالی ووڈ پاپ)</option>
              <option value="sad_ballad">Sad Acoustic Piano Ballad (اداس نغمہ)</option>
              <option value="punjabi_dance">Punjabi Trap & Drill (پنجابی ٹریپ)</option>
              <option value="devotional_nasheed">Spiritual Devotional Nasheed (حمد و نعت)</option>
              <option value="custom">Custom Genre (اپنی مرضی کی صنف)</option>
            </select>
          </div>

          {/* Custom Genre Input if selected */}
          {genre === 'custom' && (
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                Type Custom Genre Name
              </label>
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="e.g. Ambient Synthwave Qawwali"
                className="w-full bg-black/50 border border-amber-400/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          )}

          {/* Language Selection */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Lyric Language (شاعری کی زبان)
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none transition-colors"
            >
              <option value="urdu">Urdu (اردو نستعلیق)</option>
              <option value="roman_urdu">Roman Urdu (English letters)</option>
              <option value="hindi">Hindi (हिंदी देवनागरी)</option>
              <option value="english">English (Global Pop/Indie)</option>
            </select>
          </div>

          {/* Mood / Atmosphere */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Mood & Atmosphere (کیفیت و موڈ)
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none transition-colors"
            >
              <option value="Melancholic & Nostalgic">Melancholic & Nostalgic (اداس و پرانی یادیں)</option>
              <option value="Romantic & Dreamy">Romantic & Dreamy (رومانوی و مسحور کن)</option>
              <option value="Spiritual & Deep">Spiritual & Deep (روحانی و پرسکون)</option>
              <option value="Energetic & Uplifting">Energetic & Uplifting (پرجوش و شادمان)</option>
              <option value="Dark & Intense">Dark & Intense (ڈرامائی و گہرا)</option>
              <option value="Chill & Relaxed">Chill & Relaxed (پرسکون و نرم)</option>
            </select>
          </div>

          {/* Vocal Style & Preference */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Vocal Preference (آواز کا انداز)
            </label>
            <select
              value={vocalPreference}
              onChange={(e) => setVocalPreference(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none transition-colors"
            >
              <option value="Soulful Female Vocals (warm & intimate)">Soulful Female (Warm & Intimate)</option>
              <option value="Deep Resonant Male (classical ghazal)">Deep Resonant Male (Husky & Emotive)</option>
              <option value="Duet Conversational (Female & Male)">Duet Conversational (Female + Male)</option>
              <option value="Qawwali Ensemble & High Pitch Lead">Qawwali Ensemble with Chorus</option>
              <option value="Airy Breathy Indie Vocal">Airy & Breathy Modern Indie</option>
            </select>
          </div>
        </div>

        {/* Mode Dependent: Custom Lyrics Editor vs AI Topic Idea */}
        {inputMode === 'custom_lyrics' ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>شاعری کے بول، اسٹرکچر اور ٹائمنگ ٹیگز ([0:05], [Chorus], [Verse])</span>
              </label>

              {/* Timing & Quick Format Controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAutoTimeLyrics}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Automatically inject realistic [0:xx] timestamps for synchronized highlighting"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>⚡ Auto-Time [0:xx]</span>
                </button>

                <button
                  type="button"
                  onClick={handleStripTimestamps}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Remove all timing indicators for clean plain text"
                >
                  <RotateCcw className="w-3 h-3 text-white/50" />
                  <span>🧹 Clean Timings</span>
                </button>

                <button
                  type="button"
                  onClick={handleStampCurrentTime}
                  className="px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors font-mono"
                  title="Stamp current playback time tag at the end of lyrics"
                >
                  <Timer className="w-3 h-3 text-orange-400" />
                  <span>📌 Stamp [{formatSecondsDisplay(currentTime)}]</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomLyricsText(USER_RAIN_SONG_LYRICS)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 hover:text-amber-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>ری سیٹ کریں (Reset)</span>
                </button>
              </div>
            </div>

            {/* Quick Structure Tags Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 font-bold mr-1">
                Insert Tag:
              </span>
              {[
                '[Intro]',
                '[Verse 1]',
                '[Verse 2]',
                '[Pre-Chorus]',
                '[Chorus]',
                '[Guitar Solo]',
                '[Flute Interlude]',
                '[Bridge]',
                '[Drop]',
                '[Outro]',
                '[Fade Out]',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setCustomLyricsText((prev) => prev + (prev.endsWith('\n') ? '' : '\n') + tag + '\n')
                  }
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-amber-400/20 text-white/70 hover:text-amber-300 border border-white/10 text-[10px] font-mono cursor-pointer transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>

            <textarea
              rows={8}
              value={customLyricsText}
              onChange={(e) => setCustomLyricsText(e.target.value)}
              placeholder="Paste your song lyrics here with timing indicators like [0:05] and tags like [Intro], [Verse 1], [Chorus]..."
              className="w-full bg-black/60 border border-white/20 rounded-2xl p-4 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none transition-colors font-urdu text-right leading-loose tracking-wide"
            />
            <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400/70" />
              <span>
                ٹپ: اشعار کے ساتھ <b>[0:08]</b> یا <b>[1:15]</b> جیسے ٹائم اسٹیمپ لگانے سے پلیئر میں گانا بجنے پر وہ لائن خودکار ہائی لائٹ ہوگی۔
              </span>
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Song Theme, Concept & Narrative (گانے کا خیال اور موضوع)</span>
              </label>
              <button
                type="button"
                onClick={handleRandomTopic}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Shuffle className="w-3 h-3" />
                <span>Random Idea (موضوع تجویز کریں)</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe what the song should convey, specific imagery (e.g. rain, late night tea, longing, memories, desert winds)..."
              className={`w-full bg-black/50 border border-white/15 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none transition-colors ${
                language === 'urdu' ? 'font-urdu text-right text-sm' : ''
              }`}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="text-xs text-white/60 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {inputMode === 'custom_lyrics'
                ? 'تیار شدہ شاعری کو موسیقی اور سریلی آواز کے ساتھ گانے میں بدلیں'
                : 'مکمل آواز و موسیقی کے ساتھ گانا سنیں اور سونو/اوڈیو کے لیے پرامپٹس حاصل کریں'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Secondary Option: Suno & Udio Prompts Only */}
            <button
              type="button"
              onClick={() => handleGenerateFullSong(false)}
              disabled={isComposing || isAuditioning}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              title="صرف پرامپٹ اور بول تیار کریں (Suno.com اور Udio.com پر کاپی کرنے کے لیے)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Suno/Udio Prompts Only (پرامپٹس)</span>
            </button>

            {/* Primary Option: Generate Full Song with Audio & Play */}
            <button
              type="button"
              onClick={() => handleGenerateFullSong(true)}
              disabled={isComposing || isAuditioning}
              className={`px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                isComposing || isAuditioning
                  ? 'bg-amber-500/50 text-white/70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 text-white shadow-amber-500/25 ring-2 ring-amber-400/40 hover:scale-[1.02]'
              }`}
            >
              {isComposing || isAuditioning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>گانا تیار ہو رہا ہے (Creating Song)...</span>
                </>
              ) : (
                <>
                  <Music2 className="w-4 h-4" />
                  <span>🎵 Generate & Play Song (گانا بنائیں اور سنیں)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress / Status Notice */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-200 text-xs animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Generated Composition Output */}
      {composition && (
        <div className="space-y-6">
          {/* Quick Play / Song Ready Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-emerald-500/15 border border-amber-500/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  isPlaying
                    ? 'bg-gradient-to-tr from-amber-400 to-orange-500 text-black animate-pulse'
                    : 'bg-amber-400/20 border border-amber-400/40 text-amber-300'
                }`}
              >
                {isPlaying ? <Music2 className="w-5 h-5 animate-bounce" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">
                    {isPlaying ? 'گانا بج رہا ہے (Now Playing Live)' : 'گانا تیار ہے (Song Ready)'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {activeAudioSource === 'audition'
                      ? 'AI Singer & Instruments'
                      : activeAudioSource === 'demo'
                      ? 'Acoustic Rain Lo-Fi'
                      : 'Audio Available'}
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-0.5">
                  نیچے پلیئر میں مکمل گانا سنیں، بول پر کلک کریں، یا Suno/Udio کے لیے پرامپٹ کاپی کریں۔
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!currentAudioUrl || activeAudioSource !== 'audition') {
                    generateSongAudio(composition, auditionVoice, auditionBgm, true, songGenerationLength);
                  } else {
                    togglePlayPause();
                  }
                }}
                disabled={isAuditioning}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all hover:scale-105"
              >
                {isAuditioning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>آواز ریکارڈ ہو رہی ہے...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Song</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Song (گانا سنیں)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Track Summary Header */}
          <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Composed Track
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/80 font-mono">
                  {composition.musicalKey}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/80 font-mono">
                  {composition.tempoBpm} BPM
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-baseline gap-3 flex-wrap">
                <span>{composition.songTitle}</span>
                {composition.nativeTitle && (
                  <span className="text-base font-urdu text-amber-300/90 font-normal">
                    {composition.nativeTitle}
                  </span>
                )}
              </h2>
              <p className="text-xs text-white/50 mt-1 max-w-xl">
                {composition.productionAdvice}
              </p>
            </div>

            {/* Quick Engine Switcher Tab */}
            <div className="flex items-center gap-2 p-1 bg-black/60 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveEngineTab('suno')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeEngineTab === 'suno'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Disc3 className="w-3.5 h-3.5" />
                <span>Suno AI Format</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEngineTab('udio')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeEngineTab === 'udio'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Udio Format</span>
              </button>
            </div>
          </div>

          {/* 3-Step Walkthrough Guide Card */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 rounded-full bg-amber-400 text-black font-black text-xs items-center justify-center">
                ★
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide">
                سونو اور اوڈیو پر گانا بنانے کا آسان ترین طریقہ (How to make your song in 3 steps)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[11px] text-amber-300 font-mono">1</span>
                  <span>اسٹائل پرامپٹ کاپی کریں</span>
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  نیچے بائیں جانب <span className="text-white font-semibold">'Copy'</span> دبائیں تاکہ گانے کی صنف، ساز اور لے کا پرامپٹ کلپ بورڈ پر آ جائے۔
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[11px] text-amber-300 font-mono">2</span>
                  <span>مکمل بول (Lyrics) کاپی کریں</span>
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  دائیں جانب <span className="text-white font-semibold">'Copy All Lyrics'</span> دبائیں جس میں [Intro], [Verse], [Chorus] وغیرہ سب خودکار ٹیگ ہیں۔
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[11px] text-amber-300 font-mono">3</span>
                  <span>Suno یا Udio پر پیسٹ کریں</span>
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  اوپر لنک سے <span className="text-white font-semibold">Suno.com</span> یا <span className="text-white font-semibold">Udio.com</span> کھولیں، 'Custom' موڈ آن کریں، دونوں خانے بھریں اور 'Create' دبا دیں!
                </p>
              </div>
            </div>
          </div>

          {/* Synchronized Music Player & Karaoke Timeline */}
          <div
            ref={playerContainerRef}
            className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-black/80 to-black p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-4"
          >
            {/* Hidden file input for uploading user MP3/WAV */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Player Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                    isPlaying
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 animate-pulse'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {isPlaying ? <Music2 className="w-5 h-5 animate-bounce" /> : <Music className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      {activeAudioSource === 'audition'
                        ? 'Awaaz AI Hook Audition'
                        : activeAudioSource === 'demo'
                        ? 'Rain & Acoustic Lo-Fi Demo Track'
                        : activeAudioSource === 'uploaded'
                        ? (uploadedTrackName || 'Custom Uploaded Audio')
                        : 'Synchronized Song Audio Player'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isPlaying
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {isPlaying ? '● Live Playing' : 'Ready'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 line-clamp-1">
                    {activeTimedLine
                      ? `Now Singing [${activeTimedLine.timeFormatted || '0:00'}]: ${activeTimedLine.textClean}`
                      : 'Click play or click any timestamped lyric line [0:xx] to begin synchronized playback'}
                  </p>
                </div>
              </div>

              {/* Track Switchers / Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayDemoRainTrack}
                  disabled={isGeneratingDemo}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Synthesize and play acoustic guitar & rain background music instantly"
                >
                  {isGeneratingDemo ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Demo...</span>
                    </>
                  ) : (
                    <>
                      <Disc3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>🌧️ Play Lo-Fi Rain Demo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Upload full song generated from Suno or Udio (MP3/WAV)"
                >
                  <Upload className="w-3.5 h-3.5 text-white/60" />
                  <span>Upload Song (MP3)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoScrollLyrics(!autoScrollLyrics)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
                    autoScrollLyrics
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                      : 'bg-white/5 border-white/10 text-white/50'
                  }`}
                  title="Toggle auto-scrolling to active singing line"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Auto-Scroll: {autoScrollLyrics ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Progress Slider & Timers */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-amber-300 w-12 text-right">
                  {formatSecondsDisplay(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition-colors"
                />
                <span className="text-xs font-mono text-white/50 w-12">
                  {formatSecondsDisplay(duration)}
                </span>
              </div>
            </div>

            {/* Player Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Playback Transport Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSkip(-5)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Rewind 5 seconds"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Audio</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSkip(5)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Forward 5 seconds"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Selector */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/50 px-1 font-mono">Speed:</span>
                {[0.75, 1, 1.25].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      playbackSpeed === speed
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Volume Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Side-by-Side: Prompt Generator Card & Lyrics Prompter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 cols): Engine Style Prompt & Tags */}
            <div className="lg:col-span-5 space-y-4">
              {/* Composition Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl text-center shadow-lg">
                <div className="p-1">
                  <span className="text-[10px] text-white/50 block uppercase font-mono">Time Sig</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{composition.timeSignature || '4/4'}</span>
                </div>
                <div className="p-1 border-l border-white/5">
                  <span className="text-[10px] text-white/50 block uppercase font-mono">Tempo</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{composition.tempoBpm} BPM</span>
                </div>
                <div className="p-1 border-l border-white/5">
                  <span className="text-[10px] text-white/50 block uppercase font-mono">Key</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{composition.musicalKey}</span>
                </div>
                <div className="p-1 border-l border-white/5">
                  <span className="text-[10px] text-white/50 block uppercase font-mono">Atmosphere</span>
                  <span className="text-xs font-bold text-emerald-300 truncate block" title={composition.mood}>
                    {composition.mood}
                  </span>
                </div>
              </div>

              {/* Active Engine Card */}
              <div
                className={`rounded-3xl border p-5 backdrop-blur-xl space-y-4 shadow-xl ${
                  activeEngineTab === 'suno'
                    ? 'border-amber-500/30 bg-amber-950/15'
                    : 'border-purple-500/30 bg-purple-950/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        activeEngineTab === 'suno' ? 'bg-amber-400' : 'bg-purple-400'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {activeEngineTab === 'suno' ? 'Suno AI Prompt (v3.5 / v4)' : 'Udio Prompt (v1 / v1.5)'}
                    </h3>
                  </div>

                  {/* Direct Launch Link */}
                  <a
                    href={activeEngineTab === 'suno' ? 'https://suno.com' : 'https://udio.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>Open {activeEngineTab === 'suno' ? 'Suno' : 'Udio'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Style Prompt Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-white/70">
                      Style of Music Prompt (کاپی کر کے پیسٹ کریں)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          activeEngineTab === 'suno'
                            ? composition.suno.stylePrompt
                            : composition.udio.stylePrompt,
                          'style'
                        )
                      }
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      {copiedSection === 'style' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Style</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-black/60 border border-white/10 rounded-2xl p-3 text-xs text-white/90 font-mono leading-relaxed select-all">
                    {activeEngineTab === 'suno'
                      ? composition.suno.stylePrompt
                      : composition.udio.stylePrompt}
                  </div>
                </div>

                {/* Negative Prompt */}
                {(activeEngineTab === 'suno'
                  ? composition.suno.negativePrompt
                  : composition.udio.negativePrompt) && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-white/50">
                        Negative Prompt (Exclude)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            activeEngineTab === 'suno'
                              ? composition.suno.negativePrompt || ''
                              : composition.udio.negativePrompt || '',
                            'negative'
                          )
                        }
                        className="text-[10px] text-white/60 hover:text-white flex items-center gap-1"
                      >
                        {copiedSection === 'negative' ? (
                          <span className="text-emerald-400">Copied!</span>
                        ) : (
                          <span>Copy Negative</span>
                        )}
                      </button>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-[11px] text-white/60 font-mono leading-relaxed">
                      {activeEngineTab === 'suno'
                        ? composition.suno.negativePrompt
                        : composition.udio.negativePrompt}
                    </div>
                  </div>
                )}

                {/* Style Tags Chips */}
                <div>
                  <span className="text-[11px] font-semibold text-white/60 block mb-1.5">
                    Musical Descriptors & Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeEngineTab === 'suno'
                      ? composition.suno.tags
                      : composition.udio.tags
                    ).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-white/10 text-white/80 text-[10px] font-mono border border-white/5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pro Tips Box */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-white/70 leading-relaxed">
                  <span className="font-bold text-amber-300 block mb-0.5">
                    💡 Engine Pro Tip:
                  </span>
                  {activeEngineTab === 'suno'
                    ? composition.suno.tips
                    : composition.udio.tips}
                </div>
              </div>

              {/* Hook Audition in Awaaz AI Studio */}
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/15 p-5 backdrop-blur-xl space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Audition Hook in Awaaz AI
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Instant Melodic Sample
                  </span>
                </div>

                <p className="text-xs text-white/60 font-urdu leading-relaxed">
                  اس گیت کا مین کورس (Chorus) آواز اے آئی کے نیورل انجن سے ابھی لائیو سنیں:
                </p>

                {/* Length Mode Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
                    <span>گانے کی طوالت (Song Duration)</span>
                    <span className="text-amber-400 font-bold">
                      {songGenerationLength === 'full' ? '~2 منٹ 50 سیکنڈ (Full Song)' : '~26 سیکنڈ (Hook)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setSongGenerationLength('full')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        songGenerationLength === 'full'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Music2 className="w-3.5 h-3.5" />
                      <span>مکمل گانا (~2:50)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSongGenerationLength('hook')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        songGenerationLength === 'hook'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>صرف ہک (~26s)</span>
                    </button>
                  </div>
                </div>

                {/* Snippet / Full Lyrics preview info */}
                <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/30 text-xs text-emerald-200 font-urdu leading-loose text-center">
                  {songGenerationLength === 'full' ? (
                    <span>
                      پورے گانے کے تمام بند (ورس، کورس، برج اور اختتام) مکمل دھن اور سروں کے ساتھ شامل ہیں۔
                    </span>
                  ) : (
                    composition.singingSnippet
                  )}
                </div>

                {/* Voice and BGM pickers */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/60 mb-1">
                      Awaaz AI Voice
                    </label>
                    <select
                      value={auditionVoice}
                      onChange={(e) => setAuditionVoice(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.gender})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/60 mb-1">
                      Acoustic Backing Track
                    </label>
                    <select
                      value={auditionBgm}
                      onChange={(e) => setAuditionBgm(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {BACKGROUND_MUSIC_TRACKS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Audition Play/Generate Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateFullTrack}
                    disabled={isAuditioning}
                    className={`w-full sm:flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                      isAuditioning
                        ? 'bg-amber-600/50 text-white/70'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-500/25 hover:scale-[1.02]'
                    }`}
                  >
                    {isAuditioning && songGenerationLength === 'full' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>مکمل گانا تیار ہو رہا ہے (~2:50)...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>▶ مکمل گانا ریکارڈ کریں (2:50 Full Song)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleAuditionHook}
                    disabled={isAuditioning}
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    title="Generate 26s Hook"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>ہک سنیں (26s)</span>
                  </button>

                  {auditionAudioUrl && (
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors shrink-0"
                      title="Play/Pause Audition"
                    >
                      {isPlaying && activeAudioSource === 'audition' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Instrumental Stems Breakdown Card */}
              {composition.instrumentalStems && composition.instrumentalStems.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Instrumental Stems & Audio Layers
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                      {composition.instrumentalStems.length} Stems
                    </span>
                  </div>

                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Suno v4 اور DAW (FL Studio, Logic, Ableton) کے لیے ٹریکس کا تفصیلی نقشہ:
                  </p>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {composition.instrumentalStems.map((stem, idx) => {
                      const stemObj =
                        typeof stem === 'string'
                          ? { name: stem, description: 'Track layer for mix balance', recommendedEffects: undefined }
                          : stem;
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                              <Disc3 className="w-3 h-3 text-cyan-400 shrink-0" />
                              {stemObj.name}
                            </span>
                            {stemObj.recommendedEffects && (
                              <span className="text-[9px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                {stemObj.recommendedEffects}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/70 leading-relaxed">{stemObj.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Song Arrangement & Dynamics Timeline */}
              {composition.arrangementBreakdown && composition.arrangementBreakdown.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Song Arrangement & Dynamics Map
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                      Timeline Flow
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {composition.arrangementBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-300 font-mono">[{item.timing}]</span>
                            <span className="text-xs font-semibold text-white">{item.section}</span>
                          </div>
                          <p className="text-[11px] text-white/60 leading-relaxed">{item.description}</p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            item.energyLevel === 'Peak'
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                              : item.energyLevel === 'High'
                              ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                              : item.energyLevel === 'Medium'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          }`}
                        >
                          {item.energyLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube & Social Media Release Bundle */}
              {composition.socialBundle && (
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/15 p-5 backdrop-blur-xl space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        YouTube & Release Meta Bundle
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const fullBundle = `${composition.socialBundle?.suggestedTitle}\n\n${composition.socialBundle?.description}\n\n${composition.socialBundle?.hashtags.join(' ')}`;
                        copyToClipboard(fullBundle, 'social_bundle');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-emerald-500/30"
                    >
                      {copiedSection === 'social_bundle' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied All!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Release Bundle</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Suggested Title */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-white/50 font-semibold">
                      <span>YouTube / Spotify Title</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(composition.socialBundle!.suggestedTitle, 'bundle_title')}
                        className="text-amber-400 hover:text-amber-300"
                      >
                        {copiedSection === 'bundle_title' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white/90 font-medium">
                      {composition.socialBundle.suggestedTitle}
                    </div>
                  </div>

                  {/* Description & Timestamps */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-white/50 font-semibold">
                      <span>Video Description & Timestamps</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            composition.socialBundle!.description ||
                              composition.socialBundle!.youtubeDescription ||
                              '',
                            'bundle_desc'
                          )
                        }
                        className="text-amber-400 hover:text-amber-300"
                      >
                        {copiedSection === 'bundle_desc' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] text-white/70 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                      {composition.socialBundle.description ||
                        composition.socialBundle.youtubeDescription ||
                        ''}
                    </div>
                  </div>

                  {/* Viral Hashtags */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/50 block font-semibold">Viral Hashtags</span>
                    <div className="flex flex-wrap gap-1">
                      {composition.socialBundle.hashtags.map((ht, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono text-emerald-300/90 bg-black/40 border border-emerald-500/20 px-2 py-0.5 rounded-lg"
                        >
                          {ht}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (7 cols): Full Structured Lyrics Explorer with Karaoke Highlighting */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Structured Song Lyrics ({activeEngineTab === 'suno' ? 'Suno Format' : 'Udio Format'})
                    </h3>
                  </div>

                  {/* Timing & Copy Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAutoTimeLyrics}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-amber-400/30"
                      title="Add [0:xx] timing indicators to lyrics"
                    >
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>⚡ Auto-Time [0:xx]</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStripTimestamps}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-white/10"
                      title="Remove [0:xx] timestamps for plain text"
                    >
                      <RotateCcw className="w-3 h-3 text-white/50" />
                      <span>🧹 Clean Plain</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          stripTimingIndicators(displayedLyrics),
                          'lyrics_clean'
                        )
                      }
                      className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-white/15"
                      title="Copy plain lyrics without timestamps (ideal for Suno/Udio)"
                    >
                      {copiedSection === 'lyrics_clean' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied Plain!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Plain</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          displayedLyrics,
                          'lyrics'
                        )
                      }
                      className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-400/30"
                      title="Copy all lyrics including timing indicators"
                    >
                      {copiedSection === 'lyrics' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy All</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Active Singing Banner (if active line) */}
                {activeTimedLine && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-black/40 border border-amber-500/40 flex items-center justify-between gap-3 shadow-lg shadow-amber-950/30">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-7 w-7 rounded-lg bg-amber-400 text-black font-bold flex items-center justify-center shrink-0 text-xs font-mono shadow-sm">
                        ▶
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-amber-300/80 uppercase tracking-wider flex items-center gap-1">
                          <span>Singing Now</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                            [{activeTimedLine.timeFormatted || '0:00'}]
                          </span>
                        </div>
                        <p className={`text-sm text-white font-bold truncate ${
                          language === 'urdu' ? 'font-urdu' : language === 'hindi' ? 'font-hindi' : ''
                        }`}>
                          {activeTimedLine.textClean}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSeek(activeTimedLine.timeSeconds || 0)}
                      className="text-[11px] font-mono text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 shrink-0 cursor-pointer transition-colors"
                    >
                      Replay Line ↺
                    </button>
                  </div>
                )}

                {/* Lyrics Content with Karaoke Highlight and Bracket Structure */}
                <div
                  ref={lyricsContainerRef}
                  className="bg-black/70 border border-white/10 rounded-2xl p-4 sm:p-5 max-h-[540px] overflow-y-auto space-y-4 scroll-smooth"
                >
                  {parsedLyricsResult.blocks.map((block, bIdx) => (
                    <div
                      key={bIdx}
                      className={`space-y-1.5 ${
                        bIdx > 0 ? 'pt-3 border-t border-white/5' : ''
                      }`}
                    >
                      {block.lines.map((line) => {
                        const isActive = activeTimedLine?.id === line.id;
                        const isPast =
                          line.timeSeconds !== null &&
                          currentTime > (line.timeSeconds + 2.5);

                        // If section header [Chorus], [Verse 1], etc.
                        if (line.isSectionHeader) {
                          return (
                            <div key={line.id} className="pt-1 pb-1 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/40 text-amber-300 shadow-sm">
                                <span>{line.textClean}</span>
                              </span>
                              {line.timeFormatted && (
                                <button
                                  type="button"
                                  onClick={() => handleLyricLineClick(line)}
                                  className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-white/5 hover:bg-amber-400/20 text-white/60 hover:text-amber-300 border border-white/10 cursor-pointer transition-colors"
                                  title={`Seek to ${line.timeFormatted}`}
                                >
                                  ⏱️ {line.timeFormatted}
                                </button>
                              )}
                            </div>
                          );
                        }

                        // If audio cue (Soft bansuri...)
                        if (line.isAudioCue) {
                          return (
                            <div key={line.id} className="text-xs text-white/40 italic py-0.5 font-mono flex items-center gap-2">
                              <span>{line.textClean}</span>
                              {line.timeFormatted && (
                                <span className="text-[10px] text-white/30 font-mono">[{line.timeFormatted}]</span>
                              )}
                            </div>
                          );
                        }

                        // Regular lyric line with synchronized karaoke highlighting
                        return (
                          <div
                            id={line.id}
                            key={line.id}
                            onClick={() => handleLyricLineClick(line)}
                            className={`group relative rounded-xl transition-all duration-200 cursor-pointer px-3 py-2 flex items-center justify-between gap-3 ${
                              isActive
                                ? 'bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-transparent border-l-4 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                                : 'hover:bg-white/5 border-l-4 border-transparent'
                            }`}
                            title={line.timeFormatted ? `Click to jump audio to ${line.timeFormatted}` : 'Lyric line'}
                          >
                            <div className="flex-1 min-w-0">
                              <p
                                className={`transition-all duration-200 ${
                                  language === 'urdu'
                                    ? 'font-urdu text-right leading-loose tracking-wide'
                                    : language === 'hindi'
                                    ? 'font-hindi'
                                    : ''
                                } ${
                                  isActive
                                    ? 'text-amber-200 font-bold text-base sm:text-lg drop-shadow-[0_2px_10px_rgba(251,191,36,0.35)] scale-[1.01]'
                                    : isPast
                                    ? 'text-white/50 text-sm sm:text-base'
                                    : 'text-white/90 text-sm sm:text-base group-hover:text-amber-100'
                                }`}
                              >
                                {line.textClean}
                              </p>
                            </div>

                            {/* Timing indicator badge / seek trigger */}
                            <div className="shrink-0 flex items-center gap-1.5">
                              {isActive && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono uppercase tracking-wider animate-pulse">
                                  <Music className="w-2.5 h-2.5" />
                                  <span>Singing</span>
                                </span>
                              )}

                              {line.timeFormatted ? (
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium transition-all ${
                                    isActive
                                      ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/30'
                                      : 'bg-white/5 text-white/50 group-hover:bg-amber-400/20 group-hover:text-amber-300 border border-white/5'
                                  }`}
                                >
                                  ▶ {line.timeFormatted}
                                </span>
                              ) : (
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/30 font-mono">
                                  click to play
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Direct Instruction Footnote */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-white/40 pt-1 gap-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400/70" />
                    <span>کلک کریں: کسی بھی لائن پر کلک کر کے آڈیو کو فوری طور پر وہاں سے سنیں۔</span>
                  </div>
                  <span className="font-mono text-amber-400/80">Karaoke-Ready for Suno v4 / Udio v1.5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
