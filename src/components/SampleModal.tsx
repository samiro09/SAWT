import React from 'react';
import { Sparkles, X, Check, BookOpen, ArrowRight } from 'lucide-react';
import { SAMPLE_TEXTS, SamplePreset, VOICES } from '../constants/voices.ts';

interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SamplePreset) => void;
}

export const SampleModal: React.FC<SampleModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                مكتبة النماذج والنصوص الجاهزة
              </h3>
              <p className="text-xs text-slate-400">
                اختر قالباً نصياً مضبوطاً بالحركات لتجربة النبرات فوراً
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_TEXTS.map((sample) => {
              const suggestedVoice = VOICES.find(
                (v) => v.id === sample.suggestedVoiceId
              );

              return (
                <div
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample);
                    onClose();
                  }}
                  className="group bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                        {sample.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {sample.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-3">
                      {sample.text}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      صوت مقترح:{' '}
                      <strong className="text-white">
                        {suggestedVoice?.name || 'عمر'}
                      </strong>
                    </span>

                    <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                      استخدم هذا النص
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
