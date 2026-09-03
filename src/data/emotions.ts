import { EmotionConfig, VoiceEmotion } from '../types';

export const EMOTIONS: EmotionConfig[] = [
  {
    id: 'neutral',
    label: 'Natural & Balanced',
    urduLabel: 'قدرتی و متوازن',
    hindiLabel: 'संतुलित व प्राकृतिक',
    icon: 'Sparkles',
    color: 'indigo',
    description: 'Clean, objective, and natural human vocal equilibrium without overt exaggeration.',
    urduDescription: 'صاف، متوازن اور بغیر بناوٹ کے قدرتی لہجہ۔',
  },
  {
    id: 'joyful',
    label: 'Joyful & Happy',
    urduLabel: 'خوشگوار و مسرور',
    hindiLabel: 'आनंदित व खुश',
    icon: 'Smile',
    color: 'emerald',
    description: 'Radiant smiling warmth, cheerful uplift, and bright energetic human inflection.',
    urduDescription: 'چہرے پر مسکراہٹ، خوشی اور دلکش شادمانی کا احساس۔',
  },
  {
    id: 'sad',
    label: 'Sad & Melancholic',
    urduLabel: 'غمگین و رنجیدہ',
    hindiLabel: 'उदास व भावुक',
    icon: 'HeartCrack',
    color: 'blue',
    description: 'Somber vocal weight, heartfelt sorrow, melancholic pauses, and emotional vulnerability.',
    urduDescription: 'دلسوز اداسی، بھاری سانسیں اور غمگین احساسات۔',
  },
  {
    id: 'serious',
    label: 'Serious & Solemn',
    urduLabel: 'سنجیدہ و باوقار',
    hindiLabel: 'गंभीर व आधिकारिक',
    icon: 'Shield',
    color: 'amber',
    description: 'Deep authoritative gravitas, steadfast composure, and disciplined solemn delivery.',
    urduDescription: 'پُروقار سنجیدگی، ٹھہراؤ اور مضبوط بااثر انداز۔',
  },
  {
    id: 'excited',
    label: 'Excited & Enthusiastic',
    urduLabel: 'پُرجوش و ولولہ انگیز',
    hindiLabel: 'उत्साही व जोशीला',
    icon: 'Flame',
    color: 'orange',
    description: 'High adrenaline, animated pitch spikes, and passionate, breathless enthusiasm.',
    urduDescription: 'بے پناہ جوش، متحرک آواز اور تیز ولولہ۔',
  },
  {
    id: 'dramatic',
    label: 'Dramatic & Intense',
    urduLabel: 'ڈرامائی و اثر انگیز',
    hindiLabel: 'नाटकीय व गहरा',
    icon: 'Zap',
    color: 'purple',
    description: 'Cinematic theatrical cadence, suspenseful pregnant pauses, and gripping vocal climaxes.',
    urduDescription: 'فلمی سسپنس، گہرا ٹھہراؤ اور سنسنی خیز ڈرامائی اثر۔',
  },
  {
    id: 'whisper',
    label: 'Intimate Whisper',
    urduLabel: 'مدہم سرگوشی و راز',
    hindiLabel: 'धीमी फुसफुसाहट',
    icon: 'VolumeX',
    color: 'teal',
    description: 'Soft, airy close-mic whispered breathing, confidential closeness, and gentle intimacy.',
    urduDescription: 'کان میں سرگوشی، دھیمی ہوا اور پرائیویٹ گفتگو۔',
  },
  {
    id: 'angry',
    label: 'Fierce & Passionate',
    urduLabel: 'جلال و غصہ',
    hindiLabel: 'क्रोध व तीव्र भाव',
    icon: 'AlertTriangle',
    color: 'rose',
    description: 'Sharp biting articulation, tense rhythmic projection, and fierce passionate fire.',
    urduDescription: 'تیز ترار، غصے اور گرج دار جلال کی لہر۔',
  },
];

export interface IntensityPreset {
  level: number;
  label: string;
  urduLabel: string;
  hindiLabel: string;
  tag: string;
  description: string;
}

export const INTENSITY_PRESETS: IntensityPreset[] = [
  {
    level: 25,
    label: 'Subtle',
    urduLabel: 'ہلکا / دھیما',
    hindiLabel: 'हल्का भाव',
    tag: '25% Subtle',
    description: 'A light, gentle undertone blended seamlessly into natural speech.',
  },
  {
    level: 50,
    label: 'Moderate',
    urduLabel: 'درمیانہ / واضح',
    hindiLabel: 'मध्यम भाव',
    tag: '50% Natural',
    description: 'Balanced, organic emotional presence ideal for everyday storytelling and dialogue.',
  },
  {
    level: 75,
    label: 'Strong',
    urduLabel: 'گہرا / شدید',
    hindiLabel: 'गहरा भाव',
    tag: '75% Strong',
    description: 'High expressive power, prominent emotional shifts, and pronounced vocal color.',
  },
  {
    level: 100,
    label: 'Peak Intense',
    urduLabel: 'انتہائی عروج',
    hindiLabel: 'चरम तीव्रता',
    tag: '100% Extreme',
    description: 'Maximum theatrical emotion with peak vocal dynamics and unfiltered emotional weight.',
  },
];
