import { VideoModelOption } from '../types';

export const VIDEO_ENGINE_MODELS: VideoModelOption[] = [
  {
    id: 'pollinations_flux',
    name: 'Pollinations FLUX & Motion',
    urduName: 'پولینیشنز فلکس (100% مفت اور لامحدود)',
    badge: '100% Free • Unlimited',
    isFree: true,
    costLabel: '0 PKR / Free',
    speedLabel: 'Fast (5-10s)',
    description: 'Generates high-resolution AI scenes using FLUX with 3D camera pan/zoom motion, ambient particle dynamics, and audio waveform. Zero API keys, zero quota limits.',
    urduDescription: 'جدید فلکس ماڈل کے ذریعے قدرتی اور اسلامی مناظر جنریٹ کرتا ہے اور کیمرہ موشن، پارٹیکلز اور سب ٹائٹلز جوڑ کر مفت ویڈیو تیار کرتا ہے۔ کوئی کوٹہ ختم ہونے کا ڈر نہیں۔',
  },
  {
    id: 'scenic_stock',
    name: '4K Islamic & Nature Scenic Loops',
    urduName: '4K اسلامی و قدرتی ویڈیو کلپس (100% مفت)',
    badge: '100% Free • 4K HD',
    isFree: true,
    costLabel: '0 PKR / Free',
    speedLabel: 'Instant (1-2s)',
    description: 'Curated 4K/HD scenic video loops for Naat, Poetry & Quranic recitations (Madinah Dome, Makkah, Holy Minarets, Sunset Clouds, Stars, Candle Glow, Rain).',
    urduDescription: 'نعت، غزل اور قرآت کے لیے مدینہ منورہ، مکہ مکرمہ، پرسکون مساجد، رات کے آسمان اور موم بتی کے 4K مناظر۔ ایک کلک پر فوری ڈاؤن لوڈ۔',
  },
  {
    id: 'audio_visualizer',
    name: 'Audio-Reactive Music & Reels Visualizer',
    urduName: 'آڈیو سپیکٹرم و ریلز میکر (100% مفت)',
    badge: '100% Free • Instant',
    isFree: true,
    costLabel: '0 PKR / Free',
    speedLabel: 'Realtime (Audio Duration)',
    description: 'Transforms your recorded or synthesized audio into viral Instagram Reels & YouTube Shorts with real-time waveform bars, circular spectrum, particles, and karaoke lyrics.',
    urduDescription: 'اپنی آواز اور نعت کے لیے متحرک نیون ساؤنڈ ویوز، دھڑکتی لہریں، اردو سب ٹائٹلز اور بیک گراؤنڈ بنا کر یوٹیوب و انسٹاگرام کے لیے ویڈیو بنائیں۔',
  },
  {
    id: 'veo_3_1',
    name: 'Google Veo 3.1 AI (Google DeepMind)',
    urduName: 'گوگل وائیو 3.1 (پیڈ کوٹہ درکار)',
    badge: 'Paid Quota Required',
    isFree: false,
    costLabel: 'Google Cloud Billing',
    speedLabel: '1 - 2 Minutes',
    description: 'Official Google DeepMind Veo Video Generator. Synthesizes full photorealistic video frames on Google servers. Requires paid Gemini API billing (Error 429 occurs on Free Tier).',
    urduDescription: 'گوگل کا آفیشل AI ویڈیو ماڈل۔ اس کے لیے گوگل کلاؤڈ بلنگ/پیڈ کوٹہ لازمی ہے۔ اگر فری کوٹہ ختم ہو تو اوپر دیے گئے مفت ماڈلز استعمال کریں۔',
  },
];

export interface ScenicStockScene {
  id: string;
  title: string;
  urduTitle: string;
  category: 'islamic' | 'spiritual' | 'nature' | 'ambience';
  categoryUrdu: string;
  imageUrl: string;
  defaultMotion: 'drone_sweep' | 'push_in' | 'living_portrait' | 'slow_motion';
  defaultParticles: 'gold_embers' | 'rose_petals' | 'rain' | 'snow' | 'none';
  promptDescription: string;
}

export const SCENIC_STOCK_SCENES: ScenicStockScene[] = [
  {
    id: 'madinah_green_dome',
    title: 'Madinah Munawwarah & Green Dome at Twilight',
    urduTitle: 'مسجد نبوی شریف اور گنبد خضریٰ',
    category: 'islamic',
    categoryUrdu: 'اسلامی و روحانی',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1280&q=80',
    defaultMotion: 'push_in',
    defaultParticles: 'gold_embers',
    promptDescription: 'Majestic view of Masjid an-Nabawi in Madinah with the iconic green dome glowing under twilight stars and spiritual ambience',
  },
  {
    id: 'makkah_holy_kaaba',
    title: 'Makkah Al-Mukarramah & Holy Kaaba',
    urduTitle: 'مسجد الحرام اور بیت اللہ شریف',
    category: 'islamic',
    categoryUrdu: 'اسلامی و روحانی',
    imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1280&q=80',
    defaultMotion: 'drone_sweep',
    defaultParticles: 'gold_embers',
    promptDescription: 'Holy Kaaba in Makkah surrounded by pilgrims performing Tawaf with illuminating sacred light beams',
  },
  {
    id: 'badshahi_mosque_sunset',
    title: 'Badshahi Mosque Minarets at Sunset',
    urduTitle: 'بادشاہی مسجد اور سنہری شام',
    category: 'islamic',
    categoryUrdu: 'اسلامی و روحانی',
    imageUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=1280&q=80',
    defaultMotion: 'drone_sweep',
    defaultParticles: 'gold_embers',
    promptDescription: 'Red sandstone domes and minarets of Badshahi Mosque in Lahore with pigeons flying into the golden dusk horizon',
  },
  {
    id: 'sacred_lantern_candle',
    title: 'Traditional Oriental Lantern & Candle Flame',
    urduTitle: 'روایتی فانوس اور نورانی شمع',
    category: 'spiritual',
    categoryUrdu: 'روحانی و غزل',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1280&q=80',
    defaultMotion: 'living_portrait',
    defaultParticles: 'gold_embers',
    promptDescription: 'Intricate brass Islamic lantern with warm glowing candle casting decorative geometric shadows in dim atmospheric room',
  },
  {
    id: 'cosmic_milky_way_stars',
    title: 'Milky Way Galaxy & Starry Night Sky',
    urduTitle: 'کہکشاں، آسمان اور چمکتے تارے',
    category: 'nature',
    categoryUrdu: 'قدرتی مناظر',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80',
    defaultMotion: 'slow_motion',
    defaultParticles: 'snow',
    promptDescription: 'Deep purple cosmic nebula and shimmering stars stretching over a tranquil silhouettes of mountains',
  },
  {
    id: 'golden_desert_sunset',
    title: 'Golden Desert Dunes in Evening Breeze',
    urduTitle: 'سنہرے صحرائی ٹیلے اور شام کا وقت',
    category: 'nature',
    categoryUrdu: 'قدرتی مناظر',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1280&q=80',
    defaultMotion: 'drone_sweep',
    defaultParticles: 'gold_embers',
    promptDescription: 'Expansive Arabian desert sand dunes reflecting warm orange sunset rays with soft wind drifting across ridges',
  },
  {
    id: 'misty_pine_mountains',
    title: 'Misty Pine Forest & Majestic Mountain Peaks',
    urduTitle: 'دھندلے پہاڑ اور صنوبر کے جنگل',
    category: 'nature',
    categoryUrdu: 'قدرتی مناظر',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&q=80',
    defaultMotion: 'push_in',
    defaultParticles: 'snow',
    promptDescription: 'Cinematic towering snow-capped mountain summits shrouded in morning mist and evergreen pine trees',
  },
  {
    id: 'rainy_window_melancholy',
    title: 'Gentle Raindrops on Window with City Lights',
    urduTitle: 'کھڑکی پر بارش اور شام کا عکس',
    category: 'ambience',
    categoryUrdu: 'شاعری و غزل',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1280&q=80',
    defaultMotion: 'living_portrait',
    defaultParticles: 'rain',
    promptDescription: 'Atmospheric macro view of rain droplets sliding down transparent glass window with warm blurry bokeh streetlamps',
  },
  {
    id: 'velvet_rose_petals',
    title: 'Velvet Red Roses with Golden Light Bokeh',
    urduTitle: 'سرخ گلاب اور سنہری روشنی کا عکس',
    category: 'spiritual',
    categoryUrdu: 'نعت و ترنم',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80',
    defaultMotion: 'living_portrait',
    defaultParticles: 'rose_petals',
    promptDescription: 'Poetic close up of dark velvet red roses with morning dew drops and soft sparkling golden bokeh lights',
  },
];

export interface VideoPromptPreset {
  id: string;
  category: string;
  urduCategory: string;
  title: string;
  urduTitle: string;
  prompt: string;
  style: string;
  camera: 'drone_sweep' | 'push_in' | 'living_portrait' | 'slow_motion';
}

export const VIDEO_PROMPT_PRESETS: VideoPromptPreset[] = [
  {
    id: 'p_naat_madinah',
    category: 'Naat & Hamd',
    urduCategory: 'نعت و حمد',
    title: 'Madinah Green Dome Dusk',
    urduTitle: 'مدینہ شریف و گنبد خضریٰ',
    prompt: 'Masjid an-Nabawi in Madinah al-Munawwarah at serene sunset, glowing green dome, white marble courtyard, flying pigeons, 8k cinematic spiritual documentary drone shot',
    style: 'cinematic',
    camera: 'drone_sweep',
  },
  {
    id: 'p_naat_kaaba',
    category: 'Naat & Hamd',
    urduCategory: 'نعت و حمد',
    title: 'Holy Kaaba Divine Light',
    urduTitle: 'بیت اللہ شریف اور نور کی کرنیں',
    prompt: 'Holy Kaaba in Makkah with divine golden rays piercing through night clouds, peaceful crowds, golden calligraphic kiswa details, ultra realistic 4k',
    style: 'spiritual',
    camera: 'push_in',
  },
  {
    id: 'p_poetry_candle',
    category: 'Urdu Poetry',
    urduCategory: 'اردو شاعری و غزل',
    title: 'Classical Candle & Mehfil',
    urduTitle: 'شمع، پروانہ اور مشاعرہ',
    prompt: 'Melancholic antique brass candle holder with flickering golden flame, parchment poetry scroll with Urdu calligraphy, slow smoke curl, cinematic shallow depth of field',
    style: 'vintage_cinematic',
    camera: 'living_portrait',
  },
  {
    id: 'p_poetry_rain',
    category: 'Urdu Poetry',
    urduCategory: 'اردو شاعری و غزل',
    title: 'Rainy Night Glass Window',
    urduTitle: 'بارش، بھیگی سڑک اور یادیں',
    prompt: 'Raindrops running down window pane at night overlooking misty cobblestone street with vintage street lamps and amber reflection, cinematic mood',
    style: 'moody_film',
    camera: 'slow_motion',
  },
  {
    id: 'p_nature_desert',
    category: 'Nature & Landscape',
    urduCategory: 'قدرتی مناظر',
    title: 'Arabian Desert Horizon',
    urduTitle: 'سنہرے صحرائی ٹیلے',
    prompt: 'Endless golden desert dunes under magnificent purple and orange sunset sky, gentle desert wind creating fine sand ripples, 4k ultra wide cinematic drone shot',
    style: 'photorealistic',
    camera: 'drone_sweep',
  },
  {
    id: 'p_nature_galaxy',
    category: 'Nature & Landscape',
    urduCategory: 'قدرتی مناظر',
    title: 'Cosmic Galaxy & Stardust',
    urduTitle: 'کہکشاں اور کائنات',
    prompt: 'Stunning Milky Way galaxy core over a tranquil reflective lake, shooting stars, glowing blue and purple stardust, award winning astrophotography 8k',
    style: 'cosmic',
    camera: 'slow_motion',
  },
];
