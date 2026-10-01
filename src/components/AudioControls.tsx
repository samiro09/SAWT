import React from 'react';
import {
  Gauge,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Headphones,
  FileAudio,
  Radio,
} from 'lucide-react';
import { BitrateOption } from '../types/tts.ts';

interface AudioControlsProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  bitrate: BitrateOption;
  onBitrateChange: (bitrate: BitrateOption) => void;
  pitch: 'normal' | 'low' | 'high';
  onPitchChange: (pitch: 'normal' | 'low' | 'high') => void;
  onGenerate: () => void;
  isLoading: boolean;
  canGenerate: boolean;
  countdown?: number | null;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  speed,
  onSpeedChange,
  bitrate,
  onBitrateChange,
  pitch,
  onPitchChange,
  onGenerate,
  isLoading,
  canGenerate,
  countdown,
}) => {
  const speedPresets = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const bitrateOptions: {
    value: BitrateOption;
    label: string;
    sublabel: string;
    badge?: string;
  }[] = [
    {
      value: 320,
      label: '320 kbps',
      sublabel: 'استوديو فائق النقاء',
      badge: 'احترافي',
    },
    {
      value: 192,
      label: '192 kbps',
      sublabel: 'عالية قياسية متوازنة',
      badge: 'موصى به',
    },
    {
      value: 128,
      label: '128 kbps',
      sublabel: 'جودة قياسية جيدة',
    },
    {
      value: 64,
      label: '64 kbps',
      sublabel: 'حجم خفيف للمشاركة',
    },
  ];

  const pitchOptions: { id: 'low' | 'normal' | 'high'; label: string; desc: string }[] = [
    { id: 'low', label: 'جهوري وعميق', desc: 'نبرة وقورة وثقيلة' },
    { id: 'normal', label: 'طبيعي معتدل', desc: 'الطبقة الأصلية للصوت' },
    { id: 'high', label: 'حاد وحيوي', desc: 'طبقة مرتفعة ومشرقة' },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Title */}
      <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-800/80">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <SlidersHorizontal className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            إعدادات التحكم في سرعة وجودة الصوت
          </h2>
          <p className="text-xs text-slate-400">
            تخصيص دقيق لسرعة النطق، معدل الترميز MP3، وطبقة الصوت
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Speed Control */}
        <div className="bg-slate-950/50 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">سرعة الصوت (Speed)</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {speed.toFixed(2)}x
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-4"
            />

            {/* Quick buttons */}
            <div className="grid grid-cols-6 gap-1.5">
              {speedPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onSpeedChange(val)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    speed === val
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white'
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
            * 1.0x هي السرعة الطبيعية للإلقاء الفصيح. يمكنك أيضاً تعديل سرعة الاستماع لاحقاً داخل المشغل.
          </p>
        </div>

        {/* MP3 Quality & Bitrate */}
        <div className="bg-slate-950/50 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  جودة ملف الـ MP3 (Bitrate)
                </span>
              </div>
              <span className="text-xs text-slate-400">ترميز LAME 24kHz</span>
            </div>

            {/* Bitrate selection cards */}
            <div className="grid grid-cols-2 gap-2">
              {bitrateOptions.map((opt) => {
                const isSelected = bitrate === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onBitrateChange(opt.value)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-slate-200">
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{opt.sublabel}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
            * يتم توليد MP3 مباشر مع إمكانية تحميل نسخة WAV الأصلية غير المضغوطة أيضاً.
          </p>
        </div>
      </div>

      {/* Pitch Selector */}
      <div className="mb-6 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2 mb-2.5">
          <Radio className="w-4 h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-bold text-white">
            طبقة الصوت (Pitch Tone):
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {pitchOptions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPitchChange(p.id)}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                pitch === p.id
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/30'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-200">{p.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main CTA: Convert / Generate */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!canGenerate || isLoading || Boolean(countdown && countdown > 0)}
          onClick={onGenerate}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl relative overflow-hidden ${
            isLoading || (countdown && countdown > 0)
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/25 active:scale-[0.99] ring-2 ring-amber-400/50'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>جارٍ معالجة وتوليد الصوت العربي بالذكاء الاصطناعي...</span>
            </>
          ) : countdown && countdown > 0 ? (
            <>
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold animate-pulse">
                {countdown}
              </div>
              <span>يرجى الانتظار {countdown} ثانية قبل المحاولة التالية (تجديد الحصة)</span>
            </>
          ) : (
            <>
              <Headphones className="w-6 h-6 stroke-[2.2]" />
              <span>تحويل النص إلى صوت واستخراج ملف الـ MP3</span>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
