export type SupportedLanguage = 'auto' | 'urdu' | 'hindi' | 'english';
export type UILanguage = 'english' | 'urdu' | 'hindi';

export type StudioTab =
  | 'single'
  | 'voice_director'
  | 'naat_singing'
  | 'poetry'
  | 'subtitles'
  | 'video_creator'
  | 'narrator'
  | 'voice_changer'
  | 'ai_studio'
  | 'batch';

export type SpeechStyle =
  | 'conversational'
  | 'warm_story'
  | 'news_anchor'
  | 'cheerful'
  | 'emotional_soft'
  | 'poetic'
  | 'naat_devotional'
  | 'melodic_song'
  | 'sufi_qawwali'
  | 'ghazal_singing'
  | 'child_cute'
  | 'child_playful'
  | 'kids_story'
  | 'cartoon_fun';

export type VoiceEmotion =
  | 'neutral'
  | 'joyful'
  | 'sad'
  | 'serious'
  | 'excited'
  | 'dramatic'
  | 'whisper'
  | 'angry';

export interface EmotionConfig {
  id: VoiceEmotion;
  label: string;
  urduLabel: string;
  hindiLabel: string;
  icon: string;
  color: string;
  description: string;
  urduDescription: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Kid';
  accent: string;
  description: string;
  urduDescription: string;
  hindiDescription: string;
  badge: string;
  avatarGradient: string;
  samplePitch: string;
  sampleText?: string;
  sampleTextUrdu?: string;
  sampleTextHindi?: string;
  isKidVoice?: boolean;
  ageGroup?: string;
  baseVoiceId?: string;
}

export interface BackgroundMusicTrack {
  id: string;
  name: string;
  urduName: string;
  hindiName: string;
  category: 'ambient' | 'traditional' | 'cinematic' | 'acoustic' | 'kids' | 'electronic';
  description: string;
  urduDescription: string;
  icon: string;
  color: string;
  defaultVolume: number; // 0 to 100
  isCustom?: boolean;
}

export interface BackgroundMusicConfig {
  trackId: string; // 'none' or track ID
  volume: number; // 0 to 100
  autoDucking: boolean; // Lower BGM during speech
  customAudioBase64?: string;
  customAudioName?: string;
}

export interface GeneratedAudioItem {
  id: string;
  text: string;
  voice: string;
  voiceName: string;
  language: SupportedLanguage;
  style: SpeechStyle;
  emotion?: VoiceEmotion;
  emotionIntensity?: number; // 0 to 100
  pitch?: number; // -50 (deep/low) to +50 (high/sharp), default 0
  bgMusicTrackId?: string;
  bgMusicTrackName?: string;
  bgMusicVolume?: number;
  audioBase64: string;
  rawVoiceBase64?: string; // Original voice without BGM if mixed
  mimeType: string;
  durationSeconds: number;
  createdAt: number;
}

export interface SampleTextItem {
  id: string;
  title: string;
  category: 'story' | 'poetry' | 'news' | 'dialogue' | 'inspiration' | 'kids_rhyme' | 'kids_story';
  language: 'urdu' | 'hindi' | 'english';
  text: string;
  recommendedVoice: string;
  recommendedStyle: SpeechStyle;
}

export type BatchItemStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface BatchTextItem {
  id: string;
  text: string;
  title?: string;
  voice?: string;
  style?: SpeechStyle;
  language?: SupportedLanguage;
  status: BatchItemStatus;
  result?: GeneratedAudioItem;
  error?: string;
}

export type ScriptGenre =
  | 'story'
  | 'poetry'
  | 'youtube'
  | 'podcast'
  | 'news'
  | 'meditation'
  | 'ad'
  | 'kids'
  | 'educational';

export type ScriptLength = 'short' | 'medium' | 'long';

export interface AIScriptGenParams {
  topic: string;
  genre: ScriptGenre;
  language: 'urdu' | 'hindi' | 'english';
  length: ScriptLength;
  tone?: string;
  targetAudience?: string;
}

export interface AIScriptGenResult {
  title: string;
  script: string;
  suggestedVoice: string;
  suggestedStyle: SpeechStyle;
  suggestedEmotion: VoiceEmotion;
  suggestedPitch?: number;
  suggestedBgmTrackId?: string;
  explanation?: string;
}

export type AITransformOp =
  | 'roman_to_urdu'
  | 'add_aerab'
  | 'translate_urdu'
  | 'translate_hindi'
  | 'translate_english'
  | 'tone_dramatic'
  | 'tone_poetic'
  | 'tone_kids'
  | 'tone_formal'
  | 'enhance_pacing'
  | 'bullet_to_script';

export interface AIAnalysisResult {
  sentiment: string;
  recommendedVoice: string;
  recommendedVoiceName: string;
  recommendedStyle: SpeechStyle;
  recommendedEmotion: VoiceEmotion;
  recommendedEmotionIntensity: number;
  recommendedPitch: number;
  recommendedBgmTrackId: string;
  pacingAdvice: string;
  pronunciationNotes: string[];
  keyHighlights: string[];
}

// Multi-Character Dialogue
export interface DialogueSpeaker {
  id: string;
  name: string;
  urduName?: string;
  voiceId: string;
  avatarColor: string;
  defaultStyle?: SpeechStyle;
  defaultEmotion?: VoiceEmotion;
}

export interface DialogueTurn {
  id: string;
  speakerId: string;
  speakerName: string;
  voiceId: string;
  text: string;
  style: SpeechStyle;
  emotion: VoiceEmotion;
  pauseAfterMs?: number; // silence gap after this turn
}

export interface DialogueProject {
  id: string;
  title: string;
  speakers: DialogueSpeaker[];
  turns: DialogueTurn[];
  bgMusicTrackId?: string;
  bgMusicVolume?: number;
}

// Subtitles & Captions
export interface SubtitleCue {
  id: number;
  start: number; // in seconds (e.g. 0.00)
  end: number; // in seconds (e.g. 2.45)
  text: string;
  speaker?: string;
}

export interface SubtitlesResult {
  cues: SubtitleCue[];
  srt: string;
  vtt: string;
  plainText: string;
}

// AI Video / Storyboard Visualizer
export type VideoAspectRatio = '9:16' | '16:9' | '1:1';
export type VideoVisualMode = 'karaoke_waveform' | 'storyboard_cinematic' | 'avatar_talk';
export type VideoStudioMode = 'text_to_video' | 'image_to_video' | 'audio_to_video';

// Video Generation Engines & Models
export type VideoEngineModel =
  | 'pollinations_flux' // 100% Free AI Video (Pollinations FLUX + Motion)
  | 'scenic_stock' // 100% Free 4K Scenic Loops (Islamic & Nature)
  | 'audio_visualizer' // 100% Free Audio Reactive Visualizer Video
  | 'veo_3_1'; // Google Veo 3.1 AI (Requires Paid Quota)

export interface VideoModelOption {
  id: VideoEngineModel;
  name: string;
  urduName: string;
  badge: string;
  isFree: boolean;
  costLabel: string;
  speedLabel: string;
  description: string;
  urduDescription: string;
}

export type CameraMotionType =
  | 'push_in'
  | 'drone_sweep'
  | 'pan_right'
  | 'slow_motion'
  | 'living_portrait'
  | 'ambient_particles'
  | '3d_parallax';

export interface VideoStoryScene {
  id: string;
  shotNumber: number;
  description: string;
  imagePrompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface GeneratedAIVideoItem {
  id: string;
  mode: VideoStudioMode;
  engineModel?: VideoEngineModel;
  title: string;
  prompt: string;
  aspectRatio: VideoAspectRatio;
  resolution: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  timestamp: string;
  cameraMotion?: string;
  audioTitle?: string;
}

export interface VideoScene {
  id: string;
  sceneIndex: number;
  text: string;
  imagePrompt?: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  durationSeconds?: number;
}

export interface VideoExportConfig {
  aspectRatio: VideoAspectRatio;
  visualMode: VideoVisualMode;
  themeColor: string;
  showCaptions: boolean;
  showWaveform: boolean;
  showWatermark: boolean;
  customLogoText?: string;
  captionFontSize?: number;
  animationStyle: 'smooth_zoom' | 'pan_left' | 'pulse' | 'static';
}

// Sound Effects (SFX)
export interface SFXCue {
  id: string;
  label: string;
  urduLabel: string;
  type: 'rain' | 'thunder' | 'wind' | 'fire' | 'footsteps' | 'door_knock' | 'applause' | 'heartbeat' | 'birds' | 'ambient_chimes';
  icon: string;
  timestampSeconds: number;
  volume: number; // 0 to 100
}

// Cross-lingual Translation & Dubbing
export interface TranslationDubbingResult {
  originalText: string;
  sourceLang: string;
  targetLang: string;
  translatedText: string;
  phoneticGuide?: string;
  suggestedVoiceId: string;
  suggestedStyle: SpeechStyle;
}

// AI Poetry & Tarannum
export interface PoetryCouplet {
  misra1: string;
  misra2: string;
  taqtee?: string;
  pauseAfterMs?: number;
}

export interface PoetryAnalysisResult {
  poetDetected?: string;
  bahrName?: string;
  bahrPattern?: string;
  mood: string;
  recommendedVoice: string;
  recommendedStyle: SpeechStyle;
  recommendedEmotion: VoiceEmotion;
  recommendedBgmTrackId: string;
  couplets: PoetryCouplet[];
  tarannumAdvice: string;
}

// AI Document & Long Form Narrator
export interface DocumentChapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  status: BatchItemStatus;
  voiceId?: string;
  style?: SpeechStyle;
  emotion?: VoiceEmotion;
  audioResult?: GeneratedAudioItem;
  error?: string;
}

export interface DocumentProject {
  id: string;
  title: string;
  author?: string;
  totalWords: number;
  chapters: DocumentChapter[];
  selectedVoiceId: string;
  selectedStyle: SpeechStyle;
  selectedEmotion: VoiceEmotion;
  bgMusicTrackId?: string;
  bgMusicVolume?: number;
}

// AI Voice Changer & DSP Effects
export type VoiceFXPreset =
  | 'clean'
  | 'studio_broadcast'
  | 'vintage_radio'
  | 'walkie_talkie'
  | 'scifi_robot'
  | 'cathedral_reverb'
  | 'deep_demon'
  | 'asmr_whisper'
  | 'stadium_announcer'
  | string;

export interface VoiceFXConfig {
  presetId?: string;
  preset?: VoiceFXPreset;
  pitchShiftPercent: number; // -50% to +50%
  reverbWet: number; // 0 to 1
  lowGainDb: number; // -20dB to +15dB
  midGainDb: number; // -20dB to +15dB
  highGainDb: number; // -20dB to +15dB
  distortion: number; // 0 to 100
  delayTimeMs: number; // 0 to 500ms
  delayFeedback: number; // 0 to 0.9
}

// AI Voice Prompt Director
export interface VoiceDirectorResult {
  interpretedIntent: string;
  optimizedScript: string;
  voiceId: string;
  style: SpeechStyle;
  emotion: VoiceEmotion;
  emotionIntensity: number;
  pitch: number;
  bgMusicTrackId: string;
  audioDirectives: string[];
}

// AI Naat, Hamd & Singing Studio
export type VocalGenre =
  | 'naat'
  | 'hamd'
  | 'ghazal_singing'
  | 'sufi_kalaam'
  | 'song_tarannum'
  | 'nasheed';

export interface NaatSingingAnalysisResult {
  genreDetected: string;
  title: string;
  maqamOrRaag: string;
  spiritualMood: string;
  recommendedVoice: string;
  recommendedStyle: SpeechStyle;
  recommendedEmotion: VoiceEmotion;
  recommendedBgmTrackId: string;
  bgmAdvice: string; // Explains why this specific BGM (e.g. Daf vs Harmonium) suits the track
  vocalAcoustics: {
    echoLevel: number; // 0 to 100
    reverbDepth: number; // 0 to 100
    vibratoRate: number; // 0 to 100
  };
  versesBreakdown: Array<{
    verseText: string;
    cadenceNotes: string;
    pauseAfterMs: number;
  }>;
}


