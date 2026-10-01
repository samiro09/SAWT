import React, { useState } from 'react';
import {
  User,
  Users,
  Smile,
  Heart,
  Volume2,
  CheckCircle2,
  Sparkles,
  Sliders,
  Play,
  Square,
} from 'lucide-react';
import { VoicePersona, VoiceCategory, MoodStyle } from '../types/tts.ts';
import { VOICES, MOODS } from '../constants/voices.ts';

interface VoiceSelectorProps {
  selectedVoice: VoicePersona;
  onSelectVoice: (voice: VoicePersona) => void;
  selectedMood: MoodStyle;
  onSelectMood: (mood: MoodStyle) => void;
  onPreviewSample: (voice: VoicePersona) => void;
  isPreviewingVoiceId?: string | null;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  selectedMood,
  onSelectMood,
  onPreviewSample,
  isPreviewingVoiceId,
}) => {
  const [activeTab, setActiveTab] = useState<VoiceCategory | 'all'>('all');

  const categories: { id: VoiceCategory | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: 'كافة النبرات', icon: Users },
    { id: 'male', label: 'أصوات رجالية', icon: User },
    { id: 'female', label: 'أصوات نسائية', icon: Heart },
    { id: 'kids', label: 'أصوات أطفال', icon: Smile },
    { id: 'elderly', label: 'حكماء وشيوخ', icon: Sparkles },
  ];

  const filteredVoices =
    activeTab === 'all'
      ? VOICES
      : VOICES.filter((v) => v.category === activeTab);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              اختر نبرة الصوت وشخصية الإلقاء
            </h2>
            <p className="text-xs text-slate-400">
              أصوات متنوعة ومتقنة للفصحى: رجالي، نسائي، أطفال، وشيوخ
            </p>
          </div>
        </div>

        {/* Selected Voice indicator */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs text-amber-300">
          <span>الصوت الحالي:</span>
          <span className="font-bold text-white">{selectedVoice.name}</span>
          <span className="text-slate-400">({selectedVoice.title})</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Voices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice.id === voice.id;
          const isPreviewing = isPreviewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice)}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-amber-500/15 via-slate-800/90 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top card row: Avatar & Check */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${voice.avatarColor} flex items-center justify-center text-xl shadow-md ring-2 ring-white/10`}
                    >
                      {voice.accentEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-base">
                          {voice.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400">
                          {voice.category === 'male'
                            ? 'رجالي'
                            : voice.category === 'female'
                            ? 'نسائي'
                            : voice.category === 'kids'
                            ? 'أطفال'
                            : 'شيوخ'}
                        </span>
                      </div>
                      <p className="text-xs text-amber-400/90 font-medium">
                        {voice.title}
                      </p>
                    </div>
                  </div>

                  {/* Selected check */}
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-slate-500 transition-colors" />
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {voice.description}
                </p>
              </div>

              {/* Bottom card row: Preview button */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewSample(voice);
                  }}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isPreviewing
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                  title="استمع إلى عينة سريعة من نبرة هذا الصوت"
                >
                  {isPreviewing ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>إيقاف العينة</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current text-amber-400" />
                      <span>استمع للعينة</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-slate-500">
                  {voice.geminiVoiceName}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emotional Tone / Mood Selector */}
      <div className="pt-5 border-t border-slate-800/80">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs sm:text-sm font-bold text-white">
            مُعدّل الإحساس والنبرة الشعورية:
          </h3>
          <span className="text-xs text-slate-400">
            (توجيه إحساس الصوت وطريقة الإلقاء)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => onSelectMood(mood.id)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <span>{mood.icon}</span>
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
