import React from 'react';
import { Volume2, Sparkles, History, HelpCircle, Music } from 'lucide-react';

interface NavbarProps {
  historyCount: number;
  onOpenHistory: () => void;
  onOpenSamples: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  historyCount,
  onOpenHistory,
  onOpenSamples,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40">
            <Volume2 className="w-6 h-6 stroke-[2.2]" />
            <span className="absolute -top-1 -left-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                صَوْتُـك
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                  استوديو الصوت العربي
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              تحويل النصوص العربية إلى صوت واقعي بنبرات متعددة وتحميل MP3
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSamples}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer shadow-sm active:scale-95"
            title="نماذج نصوص جاهزة"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">نماذج نصوص</span>
            <span className="md:hidden">نماذج</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer shadow-sm active:scale-95"
            title="سجل التسجيلات السابقة"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>السجل</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950">
                {historyCount}
              </span>
            )}
          </button>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MP3 عالي الدقة 320kbps</span>
          </div>
        </div>
      </div>
    </header>
  );
};
