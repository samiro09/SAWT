import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Wand2,
  Trash2,
  Clock,
  Type,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

interface TextEditorProps {
  text: string;
  onChange: (val: string) => void;
  onOpenSamples: () => void;
  isLoading: boolean;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  onChange,
  onOpenSamples,
  isLoading,
}) => {
  const [isTashkeelLoading, setIsTashkeelLoading] = useState(false);
  const [isOptimizerLoading, setIsOptimizerLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute word count and character count
  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = text.length;

  // Average Arabic speech rate: ~120 to 140 words per minute (approx 2.1 words per second)
  const estimatedSeconds = Math.ceil(wordCount / 2.1);
  const estMinutes = Math.floor(estimatedSeconds / 60);
  const estSecs = estimatedSeconds % 60;
  const timeFormatted = `${estMinutes > 0 ? `${estMinutes} د و ` : ''}${estSecs} ث`;

  // Check if text has Arabic diacritics
  const hasDiacritics = /[\u064B-\u065F\u0670]/.test(text);

  // Auto-tashkeel using backend
  const handleAutoTashkeel = async () => {
    if (!text.trim() || isTashkeelLoading || isLoading) return;
    setErrorMessage(null);
    setIsTashkeelLoading(true);

    try {
      const res = await fetch('/api/tashkeel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل تشكيل النص');
      }
      if (data.vowelledText) {
        onChange(data.vowelledText);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء تشكيل النص');
    } finally {
      setIsTashkeelLoading(false);
    }
  };

  // Strip diacritics
  const handleRemoveTashkeel = () => {
    const stripped = text.replace(/[\u064B-\u065F\u0670]/g, '');
    onChange(stripped);
  };

  // Optimize text style
  const handleOptimizeScript = async (type: 'story' | 'news' | 'promo') => {
    if (!text.trim() || isOptimizerLoading || isLoading) return;
    setErrorMessage(null);
    setIsOptimizerLoading(true);

    try {
      const res = await fetch('/api/optimize-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل تحسين النص');
      }
      if (data.optimizedText) {
        onChange(data.optimizedText);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر تحسين النص');
    } finally {
      setIsOptimizerLoading(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative backdrop-blur-sm">
      {/* Header bar of editor */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              النص العربي المراد قراءته
              {hasDiacritics && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  نص مُشكّل
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              اكتب أو الصق نصاً فصيحاً أو استخدم ميزة التشكيل التلقائي لنطق سليم 100%
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenSamples}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>اختر نموذجاً جاهزاً</span>
          </button>

          {text && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition-all cursor-pointer"
                title="نسخ النص"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-400/80 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 transition-all cursor-pointer"
                title="مسح النص"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Text Area */}
      <div className="relative">
        <textarea
          rows={6}
          dir="rtl"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="اكتب هنا النص العربي الذي ترغب في تحويله إلى صوت بنبرة طبيعية... يمكنك إضافة التشكيل يدوياً أو الضغط على زر «تشكيل ذكي بالحركات» بالأسفل لضبط النطق بدقة متناهية."
          className="w-full bg-slate-950/70 border border-slate-800 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 rounded-2xl p-4 sm:p-5 text-slate-100 text-base sm:text-lg leading-relaxed placeholder:text-slate-600 outline-none resize-y transition-all min-h-[160px] font-sans"
        />

        {/* Character & Word counter overlay */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-2 px-1 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <span>{charCount} حرف</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>{wordCount} كلمة</span>
            {wordCount > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>الوقت المقدر: {timeFormatted}</span>
                </span>
              </>
            )}
          </div>

          {charCount > 1200 && (
            <span className="text-amber-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              نص طويل، يفضل تقصيره لسرعة التوليد
            </span>
          )}
        </div>
      </div>

      {/* Error notification if any */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Smart Text Enhancement Tools */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Tashkeel Button */}
          <button
            type="button"
            disabled={!text.trim() || isTashkeelLoading || isLoading}
            onClick={handleAutoTashkeel}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md ${
              isTashkeelLoading
                ? 'bg-amber-600/50 text-amber-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-95 shadow-amber-500/20'
            } disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none`}
            title="إضافة الحركات الإعرابية التامة لنطق عربي فصيح وخالٍ من الأخطاء"
          >
            <Sparkles className={`w-4 h-4 ${isTashkeelLoading ? 'animate-spin' : ''}`} />
            <span>{isTashkeelLoading ? 'جارٍ تشكيل النص...' : 'تشكيل ذكي بالحركات 🪄'}</span>
          </button>

          {/* Remove Tashkeel */}
          {hasDiacritics && (
            <button
              type="button"
              onClick={handleRemoveTashkeel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer"
              title="إزالة التشكيل والحركات للبدء من جديد"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>إزالة التشكيل</span>
            </button>
          )}
        </div>

        {/* Script Optimizer Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 hidden lg:inline flex items-center gap-1">
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            تحسين للإلقاء:
          </span>
          <button
            type="button"
            disabled={!text.trim() || isOptimizerLoading || isLoading}
            onClick={() => handleOptimizeScript('story')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            سرد قصصي 📖
          </button>
          <button
            type="button"
            disabled={!text.trim() || isOptimizerLoading || isLoading}
            onClick={() => handleOptimizeScript('news')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            نشرة أخبار 🎙️
          </button>
          <button
            type="button"
            disabled={!text.trim() || isOptimizerLoading || isLoading}
            onClick={() => handleOptimizeScript('promo')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            إعلان تسويقي 📢
          </button>
        </div>
      </div>
    </div>
  );
};
