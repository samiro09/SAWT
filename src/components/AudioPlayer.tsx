import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Check,
  FastForward,
  Rewind,
  Music2,
  FileAudio,
  Sparkles,
  Repeat,
  Radio,
} from 'lucide-react';
import { GeneratedAudioItem } from '../types/tts.ts';

interface AudioPlayerProps {
  currentAudio: GeneratedAudioItem | null;
  onClearAudio?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ currentAudio }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // When a new audio item is loaded, reset player
  useEffect(() => {
    if (currentAudio && audioRef.current) {
      audioRef.current.src = `data:audio/mp3;base64,${currentAudio.mp3Base64}`;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      // Play automatically when generated
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentAudio]);

  const togglePlay = () => {
    if (!audioRef.current || !currentAudio) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.log('Audio playback error', e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration || isNaN(duration)) {
        setDuration(audioRef.current.duration || currentAudio?.duration || 0);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || currentAudio?.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleSkip = (offset: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + offset)
      );
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleAudioEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Helper to trigger file download
  const downloadFile = (base64: string, filename: string, mime: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadMp3 = () => {
    if (!currentAudio) return;
    const sanitizedTitle = currentAudio.text
      .slice(0, 30)
      .replace(/[^\u0600-\u06FF\w\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '_') || 'sawtek_arabic_audio';
    downloadFile(
      currentAudio.mp3Base64,
      `${sanitizedTitle}_${currentAudio.bitrate}kbps.mp3`,
      'audio/mp3'
    );
  };

  const downloadWav = () => {
    if (!currentAudio) return;
    const sanitizedTitle = currentAudio.text
      .slice(0, 30)
      .replace(/[^\u0600-\u06FF\w\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '_') || 'sawtek_arabic_audio';
    downloadFile(
      currentAudio.wavBase64,
      `${sanitizedTitle}_studio_24khz.wav`,
      'audio/wav'
    );
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!currentAudio) {
    return (
      <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-800/70 text-slate-500 flex items-center justify-center">
          <Music2 className="w-8 h-8 opacity-60" />
        </div>
        <h3 className="text-lg font-bold text-slate-300 mb-1">
          مشغل الصوت بانتظار توليد المقطع
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          اكتب النص واضغط على «تحويل النص إلى صوت» للاستماع للمقطع، مشاهدة الموجات التفاعلية، وتحميل ملف الـ MP3 مباشرة.
        </p>
      </div>
    );
  }

  // Waveform bars count
  const waveBars = 36;
  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden ring-1 ring-amber-500/20 backdrop-blur-xl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        loop={isLooping}
      />

      {/* Top bar: voice info & badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20">
            <Radio className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {currentAudio.voiceTitle}
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {currentAudio.moodLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 max-w-md">
              "{currentAudio.text.slice(0, 70)}..."
            </p>
          </div>
        </div>

        {/* Quality Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-semibold">
            MP3 • {currentAudio.bitrate} kbps
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            {formatFileSize(currentAudio.mp3Size)}
          </span>
        </div>
      </div>

      {/* Animated Waveform Visualizer */}
      <div className="py-4 px-2 relative z-10">
        <div className="h-20 flex items-center justify-between gap-1 sm:gap-1.5 px-2 bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden">
          {Array.from({ length: waveBars }).map((_, idx) => {
            const barRatio = idx / waveBars;
            const isPassed = barRatio <= progressRatio;
            // Generate pleasing organic heights
            const baseHeight = 20 + Math.sin(idx * 0.45) * 35 + (idx % 3) * 15;
            const activeWaveAnim = isPlaying
              ? Math.sin((currentTime * 8) + idx) * 15
              : 0;
            const finalHeight = Math.max(12, Math.min(68, baseHeight + activeWaveAnim));

            return (
              <div
                key={idx}
                onClick={() => {
                  const targetSec = (idx / waveBars) * duration;
                  if (audioRef.current) {
                    audioRef.current.currentTime = targetSec;
                    setCurrentTime(targetSec);
                  }
                }}
                className={`flex-1 rounded-full transition-all cursor-pointer ${
                  isPassed
                    ? 'bg-gradient-to-t from-amber-500 to-yellow-300 shadow-sm shadow-amber-400/30'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                style={{
                  height: `${finalHeight}px`,
                  transition: 'height 0.1s ease',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Scrubber and Time row */}
      <div className="relative z-10 mb-5">
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-1 px-1">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main playback control buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800 relative z-10">
        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {[0.75, 1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => handlePlaybackRateChange(rate)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                playbackRate === rate
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`سرعة الاستماع ${rate}x`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Center Playback Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="تأخير 5 ثوانٍ"
          >
            <Rewind className="w-5 h-5" />
          </button>

          {/* Big Play / Pause button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/20 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصوت'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current stroke-[1.5]" />
            ) : (
              <Play className="w-7 h-7 fill-current stroke-[1.5] translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(5)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="تقديم 5 ثوانٍ"
          >
            <FastForward className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isLooping
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border-transparent'
            }`}
            title={isLooping ? 'تكرار التشغيل مفعل' : 'تفعيل تكرار التشغيل'}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Download Action Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        {/* Primary Download: MP3 */}
        <button
          type="button"
          onClick={downloadMp3}
          className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-[0.98] ring-1 ring-emerald-400/40"
          title="تحميل الملف بصيغة MP3 المتوافقة مع كافة الأجهزة"
        >
          <Download className="w-5 h-5 stroke-[2.2]" />
          <span>تحميل ملف MP3 ({currentAudio.bitrate} kbps)</span>
        </button>

        {/* Secondary Download: WAV Studio Quality */}
        <button
          type="button"
          onClick={downloadWav}
          className="py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700/80 transition-all cursor-pointer active:scale-[0.98]"
          title="تحميل ملف الصوت الخام الأصلي بصيغة WAV نقاء 24kHz"
        >
          <FileAudio className="w-4 h-4 text-amber-400" />
          <span>تحميل النسخة النقية (WAV 24kHz)</span>
        </button>
      </div>
    </div>
  );
};
