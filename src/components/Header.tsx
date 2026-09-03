import React from 'react';
import { Volume2, Sparkles, Languages, Globe, Music, Radio, Mic, Layers, Wand2, Film, Smartphone, Cloud } from 'lucide-react';
import { SupportedLanguage, StudioTab, UILanguage } from '../types';
import { UI_TRANSLATIONS } from '../utils/uiTranslations';

interface HeaderProps {
  uiLanguage: UILanguage;
  onSelectUILanguage: (lang: UILanguage) => void;
  currentLanguage?: SupportedLanguage;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
  savedCount: number;
  activeStudioTab: StudioTab;
  onSelectStudioTab: (tab: StudioTab) => void;
  onOpenAndroidModal?: () => void;
  onOpenCloudSyncModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  uiLanguage,
  onSelectUILanguage,
  currentLanguage,
  onSelectLanguage,
  savedCount,
  activeStudioTab,
  onSelectStudioTab,
  onOpenAndroidModal,
  onOpenCloudSyncModal,
}) => {
  const t = UI_TRANSLATIONS[uiLanguage] || UI_TRANSLATIONS.english;

  return (
    <header className="border-b border-white/5 bg-[#050507]/85 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Studio Tabs */}
        <div className="flex flex-wrap items-center justify-between md:justify-start gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
              <Volume2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span className={uiLanguage === 'urdu' ? 'font-urdu' : uiLanguage === 'hindi' ? 'font-hindi' : ''}>
                    {t.header.appTitle}
                  </span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3" />
                  {t.header.neuralBadge}
                </span>
              </div>
              <p className={`text-[11px] text-white/50 ${uiLanguage === 'urdu' ? 'font-urdu' : uiLanguage === 'hindi' ? 'font-hindi' : ''}`}>
                {t.header.appSubtitle}
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full scrollbar-none">
            <button
              type="button"
              id="header-tab-single"
              onClick={() => onSelectStudioTab('single')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'single'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{t.header.tabs.single}</span>
            </button>

            <button
              type="button"
              id="header-tab-voice-director"
              onClick={() => onSelectStudioTab('voice_director')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'voice_director'
                  ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md shadow-rose-500/20'
                  : 'text-rose-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.header.tabs.voice_director}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-rose-500/30 rounded-full text-rose-200 font-mono">
                AI
              </span>
            </button>

            <button
              type="button"
              id="header-tab-poetry"
              onClick={() => onSelectStudioTab('poetry')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'poetry'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-emerald-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.header.tabs.poetry}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/30 rounded-full text-emerald-200 font-mono font-urdu">
                ترنم
              </span>
            </button>

            <button
              type="button"
              id="header-tab-naat-singing"
              onClick={() => onSelectStudioTab('naat_singing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'naat_singing'
                  ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-md shadow-teal-500/20 ring-1 ring-emerald-400/40'
                  : 'text-teal-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.header.tabs.naat_singing}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-teal-500/30 rounded-full text-emerald-200 font-mono font-urdu">
                نعت
              </span>
            </button>

            <button
              type="button"
              id="header-tab-narrator"
              onClick={() => onSelectStudioTab('narrator')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'narrator'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-amber-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.header.tabs.narrator}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/30 rounded-full text-amber-200 font-mono">
                PDF
              </span>
            </button>

            <button
              type="button"
              id="header-tab-subtitles"
              onClick={() => onSelectStudioTab('subtitles')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'subtitles'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-blue-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t.header.tabs.subtitles}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/30 rounded-full text-blue-200 font-mono">
                SRT
              </span>
            </button>

            <button
              type="button"
              id="header-tab-video-creator"
              onClick={() => onSelectStudioTab('video_creator')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'video_creator'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-purple-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.header.tabs.video_creator}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/30 rounded-full text-purple-200 font-mono">
                AI Video
              </span>
            </button>

            <button
              type="button"
              id="header-tab-voice-changer"
              onClick={() => onSelectStudioTab('voice_changer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'voice_changer'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20'
                  : 'text-violet-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t.header.tabs.voice_changer}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-violet-500/30 rounded-full text-violet-200 font-mono">
                DSP
              </span>
            </button>

            <button
              type="button"
              id="header-tab-ai-studio"
              onClick={() => onSelectStudioTab('ai_studio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'ai_studio'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-indigo-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>{t.header.tabs.ai_studio}</span>
            </button>

            <button
              type="button"
              id="header-tab-batch"
              onClick={() => onSelectStudioTab('batch')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeStudioTab === 'batch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-300" />
              <span>{t.header.tabs.batch}</span>
            </button>
          </div>
        </div>

        {/* Global UI Language Setting Toggle & Badges */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Global UI Language Switcher (Persists in localStorage) */}
          <div
            id="global-ui-language-setting"
            className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner"
            title={`${t.header.uiLangLabel} (English / اردو / हिंदी)`}
          >
            <div className="flex items-center gap-1.5 pl-2 pr-1 text-white/50 text-xs font-medium select-none">
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold hidden sm:inline">
                {t.header.uiLangLabel}:
              </span>
            </div>

            <button
              id="ui-lang-btn-english"
              type="button"
              onClick={() => onSelectUILanguage('english')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                uiLanguage === 'english'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 font-bold ring-1 ring-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title="English UI Interface"
            >
              English
            </button>

            <button
              id="ui-lang-btn-urdu"
              type="button"
              onClick={() => onSelectUILanguage('urdu')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium font-urdu transition-all cursor-pointer ${
                uiLanguage === 'urdu'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 font-bold ring-1 ring-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title="اردو انٹرفیس (Urdu UI Interface)"
            >
              اردو
            </button>

            <button
              id="ui-lang-btn-hindi"
              type="button"
              onClick={() => onSelectUILanguage('hindi')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium font-hindi transition-all cursor-pointer ${
                uiLanguage === 'hindi'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 font-bold ring-1 ring-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title="हिंदी इंटरफ़ेस (Hindi UI Interface)"
            >
              हिंदी
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCloudSyncModal && (
              <button
                type="button"
                id="btn-open-cloud-sync-modal"
                onClick={onOpenCloudSyncModal}
                className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-500/20"
                title="Cloud & Firebase Library Sync"
              >
                <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">
                  {uiLanguage === 'urdu' ? 'کلاؤڈ سنک' : uiLanguage === 'hindi' ? 'क्लाउड सिंक' : 'Cloud Sync'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/30 rounded-full text-indigo-200 font-mono">
                  {savedCount}
                </span>
              </button>
            )}

            {onOpenAndroidModal && (
              <button
                type="button"
                id="btn-open-android-apk-modal"
                onClick={onOpenAndroidModal}
                className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-indigo-600/30 hover:from-emerald-600/50 hover:to-indigo-600/50 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/20"
                title="Install Android App (.APK / PWA)"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{t.header.androidApp}</span>
                <span className="sm:hidden">App</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/30 rounded-full text-emerald-200 font-mono">
                  {t.header.androidOnline}
                </span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-indigo-300">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{t.header.studioLossless}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


