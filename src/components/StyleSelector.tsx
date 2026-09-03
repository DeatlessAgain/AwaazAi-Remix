import React from 'react';
import { SPEECH_STYLES } from '../data/voices';
import { SpeechStyle, SupportedLanguage } from '../types';
import {
  MessageSquare,
  BookOpen,
  Sparkles,
  Radio,
  Smile,
  Heart,
  Baby,
  Moon,
  Feather,
} from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: SpeechStyle;
  onSelectStyle: (style: SpeechStyle) => void;
  language: SupportedLanguage;
}

const iconMap: Record<string, React.ReactNode> = {
  Baby: <Baby className="w-4 h-4" />,
  Moon: <Moon className="w-4 h-4" />,
  Feather: <Feather className="w-4 h-4" />,
  MessageSquare: <MessageSquare className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Radio: <Radio className="w-4 h-4" />,
  Smile: <Smile className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
};

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
  language,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-bold flex items-center gap-1.5">
            <span>2. Speech Tone & Emotion (لہجہ اور انداز)</span>
          </h2>
          <span className="text-[10px] text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/30 font-medium">
            10 Emotional Styles
          </span>
        </div>
        <span className="text-xs text-white/40 hidden sm:inline">
          Organic cadence & breath control
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {SPEECH_STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;
          const isKidStyle =
            style.id === 'child_cute' ||
            style.id === 'child_playful' ||
            style.id === 'kids_story' ||
            style.id === 'cartoon_fun';

          return (
            <button
              key={style.id}
              id={`style-btn-${style.id}`}
              type="button"
              onClick={() => onSelectStyle(style.id as SpeechStyle)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? isKidStyle
                    ? 'bg-pink-950/20 border-pink-500/60 text-pink-200 ring-1 ring-pink-500/40 shadow-md shadow-pink-500/10'
                    : 'bg-white/10 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/40 shadow-md shadow-indigo-500/10'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`p-1.5 rounded-xl ${
                    isSelected
                      ? isKidStyle
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'bg-indigo-600 text-white shadow-sm'
                      : isKidStyle
                      ? 'bg-pink-500/15 text-pink-300'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {iconMap[style.icon] || <Sparkles className="w-4 h-4" />}
                </span>
                {isSelected && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isKidStyle ? 'bg-pink-400' : 'bg-indigo-400'
                    } animate-pulse`}
                  />
                )}
              </div>

              <div>
                <p className="text-xs font-bold leading-tight line-clamp-1 text-white">
                  {language === 'hindi' ? style.hindiLabel : style.label.split(' ')[0]}
                </p>
                <p className="text-[10px] text-white/40 mt-1 line-clamp-1">
                  {style.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
