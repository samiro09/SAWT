import React from 'react';
import {
  History,
  Trash2,
  Play,
  Download,
  Clock,
  FileAudio,
  X,
  Volume2,
  Calendar,
} from 'lucide-react';
import { GeneratedAudioItem } from '../types/tts.ts';

interface AudioHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  items: GeneratedAudioItem[];
  onSelectTrack: (item: GeneratedAudioItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  currentTrackId?: string;
}

export const AudioHistory: React.FC<AudioHistoryProps> = ({
  isOpen,
  onClose,
  items,
  onSelectTrack,
  onDeleteItem,
  onClearAll,
  currentTrackId,
}) => {
  if (!isOpen) return null;

  const downloadMp3 = (item: GeneratedAudioItem) => {
    const byteCharacters = atob(item.mp3Base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitized = item.text
      .slice(0, 25)
      .replace(/[^\u0600-\u06FF\w\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '_') || 'audio';
    a.download = `${sanitized}_${item.bitrate}kbps.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                سجل التسجيلات الصوتية ({items.length})
              </h3>
              <p className="text-xs text-slate-400">
                المقاطع الصوتية المحفوظة محلياً للاستماع والتحميل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs px-3 py-1.5 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 transition-colors cursor-pointer"
              >
                مسح الكل
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">لا توجد تسجيلات سابقة حتى الآن</p>
              <p className="text-xs text-slate-600 mt-1">
                المقاطع التي تولدها ستظهر هنا تلقائياً لسهولة الرجوع إليها وتحميلها بصيغة MP3
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isCurrent = currentTrackId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20'
                      : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs sm:text-sm text-white">
                        {item.voiceTitle}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                        {item.moodLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.duration} ثانية
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      "{item.text}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTrack(item);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>تشغيل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadMp3(item)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 transition-colors cursor-pointer"
                      title="تحميل MP3"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="حذف من السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
