import { UILanguage } from '../types';

export interface UITranslationStrings {
  header: {
    appTitle: string;
    appSubtitle: string;
    neuralBadge: string;
    uiLangLabel: string;
    tabs: {
      single: string;
      voice_director: string;
      poetry: string;
      naat_singing: string;
      narrator: string;
      subtitles: string;
      video_creator: string;
      voice_changer: string;
      ai_studio: string;
      batch: string;
    };
    androidApp: string;
    androidOnline: string;
    studioLossless: string;
  };
  banner: {
    singleTitle: string;
    singleDesc: string;
    aiStudioTitle: string;
    aiStudioDesc: string;
    batchTitle: string;
    batchDesc: string;
    poetryTitle: string;
    poetryDesc: string;
    naatTitle: string;
    naatDesc: string;
    narratorTitle: string;
    narratorDesc: string;
    videoTitle: string;
    videoDesc: string;
    subtitlesTitle: string;
    subtitlesDesc: string;
    voiceChangerTitle: string;
    voiceChangerDesc: string;
    directorTitle: string;
    directorDesc: string;
  };
  common: {
    voiceStudio: string;
    aiScriptStudio: string;
    batchMode: string;
    player: string;
    savedLibrary: string;
    studioMaster: string;
  };
}

export const UI_TRANSLATIONS: Record<UILanguage, UITranslationStrings> = {
  english: {
    header: {
      appTitle: 'Awaaz AI',
      appSubtitle: 'Ultra-Realistic Voice Studio for Urdu, English & Hindi',
      neuralBadge: 'Neural Human TTS',
      uiLangLabel: 'UI Language',
      tabs: {
        single: 'Voice Studio',
        voice_director: 'Voice Director',
        poetry: 'Poetry & Tarannum',
        naat_singing: 'Naat & Singing',
        narrator: 'Book Narrator',
        subtitles: 'Subtitles & SRT',
        video_creator: 'AI Video Studio',
        voice_changer: 'Voice FX',
        ai_studio: 'AI Script',
        batch: 'Batch Queue',
      },
      androidApp: 'Android App (.APK)',
      androidOnline: 'Online',
      studioLossless: '24kHz Studio Lossless',
    },
    banner: {
      singleTitle: 'Ultra-Realistic Natural Human Voice Engine',
      singleDesc:
        'Convert Urdu, English and Hindi scripts into organic, breathing human speech with lifelike emotion and studio audio. Native accents, organic pauses, and authentic emotive cadence.',
      aiStudioTitle: 'AI Script Generation & Linguistic Studio',
      aiStudioDesc:
        'Generate YouTube scripts, poetry, news bulletins, diacritics (اعراب), and Roman Urdu conversion with Gemini AI.',
      batchTitle: 'Bulk Batch Text-to-Speech & ZIP Export',
      batchDesc:
        'Upload text files or spreadsheets to synthesize dozens of voice clips simultaneously with instant ZIP archive.',
      poetryTitle: 'AI Poetry Recitation & Tarannum Studio',
      poetryDesc:
        'Recite Ghazals and Nazms with classical melodic rhythm, emotional cadences, and acoustic background rubab.',
      naatTitle: 'AI Naat & Devotional Singing Studio',
      naatDesc:
        'Produce spiritual Naats and vocal melodies with traditional Daf percussion and divine resonance.',
      narratorTitle: 'AI Long Document & Book Narrator',
      narratorDesc:
        'Import PDF, TXT or DOCX books and convert into episodic audiobooks with automatic chapter split.',
      videoTitle: 'AI Video Creator & Social Reels Studio',
      videoDesc:
        'Generate stunning 4K videos and social reels from scripts, images and audio with reactive visualizers.',
      subtitlesTitle: 'AI Subtitles & SRT Generator',
      subtitlesDesc:
        'Automatic transcription with word-level timestamps, SRT export, and synchronized karaoke display.',
      voiceChangerTitle: 'Neural Voice FX & DSP Studio',
      voiceChangerDesc:
        'Transform pitch, timbre, radio effects, robotic vocoder, and spatial acoustic reverbs in real time.',
      directorTitle: 'AI Voice Director & Drama Studio',
      directorDesc:
        'Multi-character conversational drama, dialogue script direction, and emotional storytelling with paired voices.',
    },
    common: {
      voiceStudio: 'Voice Studio',
      aiScriptStudio: 'AI Script Studio',
      batchMode: 'Batch Mode',
      player: 'Audio Player',
      savedLibrary: 'Audio Library',
      studioMaster: '24kHz Studio Master',
    },
  },
  urdu: {
    header: {
      appTitle: 'آواز اے آئی',
      appSubtitle: 'اردو، انگریزی اور ہندی کے لیے قدرتی انسانی آواز کا اسٹوڈیو',
      neuralBadge: 'نیورل ہیومن ٹی ٹی ایس',
      uiLangLabel: 'انٹرفیس زبان',
      tabs: {
        single: 'وائس اسٹوڈیو',
        voice_director: 'وائس ڈائریکٹر',
        poetry: 'شاعری و ترنم',
        naat_singing: 'نعت و گانا اسٹوڈیو',
        narrator: 'کتاب راوی',
        subtitles: 'سب ٹائٹلز و ایس آر ٹی',
        video_creator: 'اے آئی ویڈیو اسٹوڈیو',
        voice_changer: 'وائس ایف ایکس',
        ai_studio: 'اے آئی اسکرپٹ',
        batch: 'بیچ کیو',
      },
      androidApp: 'اینڈرائڈ ایپ (.APK)',
      androidOnline: 'آن لائن',
      studioLossless: '24kHz اسٹوڈیو آواز',
    },
    banner: {
      singleTitle: 'قدرتی جاندار انسانی آواز کی تخلیق',
      singleDesc:
        'اردو، انگریزی اور ہندی تحریر کو جاندار انسانی آواز میں تبدیل کریں اور ڈاؤنلوڈ کریں۔ فطری تاثرات، ٹھہراؤ اور اعلیٰ اسٹوڈیو کوالٹی۔',
      aiStudioTitle: 'اے آئی اسکرپٹ اور لسانی اسٹوڈیو',
      aiStudioDesc:
        'جیمنی اے آئی سے کہانیاں، شاعری، یوٹیوب اسکرپٹ تیار کریں، اعراب لگائیں، یا رومن اردو کو اصل اردو میں تبدیل کریں۔',
      batchTitle: 'بلک بیچ ٹیکسٹ ٹو اسپیچ اور زپ ایکسپورٹ',
      batchDesc:
        'فائل (.txt, .csv, .json) اپلوڈ کریں یا ایک ساتھ متعدد اسکرپٹس کا آڈیو بنا کر زپ فائل میں ڈاؤنلوڈ کریں۔',
      poetryTitle: 'اردو شاعری اور ترنم اسٹوڈیو',
      poetryDesc:
        'غزلیں، نظمیں اور اشعار روایتی ترنم، ڈرامائی لحن اور دلکش رباب کی دھن کے ساتھ پیش کریں۔',
      naatTitle: 'اے آئی نعت و نغمہ خوانی اسٹوڈیو',
      naatDesc:
        'دف اور روحانی سروں کے ساتھ دلکش نعتیں، حمد اور صوفیانہ کلام تیار کریں۔',
      narratorTitle: 'طویل دستاویزات اور کتب خوانی',
      narratorDesc:
        'پی ڈی ایف اور کتابیں خودکار طور پر ابواب میں تقسیم کر کے مکمل آڈیو بکس میں تبدیل کریں۔',
      videoTitle: 'اے آئی ویڈیو اور سوشل ریلز اسٹوڈیو',
      videoDesc:
        'آڈیو، اسکرپٹ اور تصاویر سے سوشل میڈیا ریلز، اسٹیٹس اور 4K ویڈیوز تخلیق کریں۔',
      subtitlesTitle: 'سب ٹائٹلز و ایس آر ٹی جنریٹر',
      subtitlesDesc:
        'آڈیو کی خودکار اردو/انگریزی ٹرانسکرپشن، الفاظ کے ٹائم اسٹیمپ اور ایس آر ٹی فائل ایکسپورٹ۔',
      voiceChangerTitle: 'نیورل وائس ایف ایکس اور صوتی اثرات',
      voiceChangerDesc:
        'آواز کو روبوٹک، ریڈیو، ٹیلی فون یا بھاری سروں میں فوری طور پر تبدیل کریں۔',
      directorTitle: 'اے آئی وائس ڈائریکٹر و مکالمہ اسٹوڈیو',
      directorDesc:
        'مکالماتی ڈرامہ اور کثیر کرداروں کی کہانی کے لیے AI آوازیں خودکار انداز میں ترتیب دیں۔',
    },
    common: {
      voiceStudio: 'وائس اسٹوڈیو',
      aiScriptStudio: 'اے آئی اسکرپٹ',
      batchMode: 'بیچ موڈ',
      player: 'آڈیو پلیئر',
      savedLibrary: 'آڈیو لائبریری',
      studioMaster: '24kHz اسٹوڈیو ماسٹر',
    },
  },
  hindi: {
    header: {
      appTitle: 'आवाज़ एआई',
      appSubtitle: 'उर्दू, अंग्रेज़ी और हिंदी के लिए अल्ट्रा-रियलिस्टिक वॉयस स्टूडियो',
      neuralBadge: 'न्यूरल ह्यूमन टीटीएस',
      uiLangLabel: 'इंटरफ़ेस भाषा',
      tabs: {
        single: 'वॉयस स्टूडियो',
        voice_director: 'वॉयस डायरेक्टर',
        poetry: 'शायरी व तरन्नुम',
        naat_singing: 'नात व गायन',
        narrator: 'बुक नैरेटर',
        subtitles: 'सबटाइटल व एसआरटी',
        video_creator: 'एआई वीडियो स्टूडियो',
        voice_changer: 'वॉयस इफेक्ट्स',
        ai_studio: 'एआई स्क्रिप्ट',
        batch: 'बैच कतार',
      },
      androidApp: 'एंड्रॉइड ऐप (.APK)',
      androidOnline: 'ऑनलाइन',
      studioLossless: '24kHz स्टूडियो ऑडियो',
    },
    banner: {
      singleTitle: 'अल्ट्रा-रियलिस्टिक प्राकृतिक मानव आवाज़ इंजन',
      singleDesc:
        'उर्दू, अंग्रेज़ी और हिंदी टेक्स्ट को जीवंत मानवीय आवाज़ में बदलें और डाउनलोड करें। स्वाभाविक ठहराव, जीवंत भावनाएं और स्टूडियो साउंड।',
      aiStudioTitle: 'एआई स्क्रिप्ट जनरेशन और भाषाई स्टूडियो',
      aiStudioDesc:
        'कहानियां, कविताएं, यूट्यूब स्क्रिप्ट तैयार करें, मात्राएं (اعراب) लगाएं और रोमन उर्दू से देवनागरी रूपांतरण करें।',
      batchTitle: 'थोक बैच टेक्स्ट-टू-स्पीच और ज़िप एक्सपोर्ट',
      batchDesc:
        'फ़ाइलें अपलोड करें या एक साथ दर्जनों ऑडियो क्लिप बनाकर तत्काल ज़िप संग्रह में डाउनलोड करें।',
      poetryTitle: 'शायरी पाठ और तरन्नुम स्टूडियो',
      poetryDesc:
        'ग़ज़लें और नज़्में शास्त्रीय तरन्नुम और सुरमयी पृष्ठभूमि संगीत के साथ प्रस्तुत करें।',
      naatTitle: 'एआई नात और भक्ति गायन स्टूडियो',
      naatDesc:
        'पारंपरिक दफ़ ताल और आध्यात्मिक सुरों के साथ नात और गायन ट्रैक बनाएं।',
      narratorTitle: 'लंबी दस्तावेज़ और पुस्तक वाचन',
      narratorDesc:
        'पीडीएफ और पुस्तकें आयात करके अध्यायों के साथ पूर्ण ऑडियोबुक्स में बदलें।',
      videoTitle: 'एआई वीडियो और सोशल रील्स स्टूडियो',
      videoDesc:
        'टेक्स्ट, इमेज और ऑडियो से सोशल मीडिया रील्स और 4K वीडियो तैयार करें।',
      subtitlesTitle: 'एआई सबटाइटल और एसआरटी जनरेटर',
      subtitlesDesc:
        'शब्द-स्तर टाइमस्टैम्प और एसआरटी एक्सपोर्ट के साथ स्वचालित प्रतिलेखन।',
      voiceChangerTitle: 'न्यूरल वॉयस इफेक्ट्स और डीएसपी स्टूडियो',
      voiceChangerDesc:
        'पिच, टिम्बर, रेडियो प्रभाव और रोबोटिक वोकोडर में आवाज़ को वास्तविक समय में रूपांतरित करें।',
      directorTitle: 'एआई वॉयस डायरेक्टर व ड्रामा स्टूडियो',
      directorDesc:
        'मल्टी-कैरेक्टर वार्तालाप नाटक और भावनात्मक कहानियों के लिए संवाद निर्देशन।',
    },
    common: {
      voiceStudio: 'वॉयस स्टूडियो',
      aiScriptStudio: 'एआई स्क्रिप्ट',
      batchMode: 'बैच मोड',
      player: 'ऑडियो प्लेयर',
      savedLibrary: 'ऑडियो लाइब्रेरी',
      studioMaster: '24kHz स्टूडियो मास्टर',
    },
  },
};

export const UI_LANG_OPTIONS: { id: UILanguage; label: string; nativeName: string; fontClass: string }[] = [
  { id: 'english', label: 'English', nativeName: 'EN', fontClass: 'font-sans' },
  { id: 'urdu', label: 'اردو', nativeName: 'اردو', fontClass: 'font-urdu' },
  { id: 'hindi', label: 'हिंदी', nativeName: 'हिंदी', fontClass: 'font-hindi' },
];

export const getStoredUILanguage = (): UILanguage => {
  try {
    const saved = localStorage.getItem('awaaz_ui_language');
    if (saved === 'english' || saved === 'urdu' || saved === 'hindi') {
      return saved;
    }
  } catch (e) {
    console.warn('Could not read localStorage:', e);
  }
  return 'english';
};

export const setStoredUILanguage = (lang: UILanguage): void => {
  try {
    localStorage.setItem('awaaz_ui_language', lang);
  } catch (e) {
    console.warn('Could not write localStorage:', e);
  }
};
