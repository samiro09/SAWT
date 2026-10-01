import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  MessageSquare,
  Wand2,
  Copy,
  Check,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { VoicePersona, DialogueTurn, DialogueSpeakerConfig, DialoguePreset } from '../types/tts.ts';
import { VOICES, DIALOGUE_PRESETS } from '../constants/voices.ts';

interface DialogueEditorProps {
  speaker1: DialogueSpeakerConfig;
  onSpeaker1Change: (spk: DialogueSpeakerConfig) => void;
  speaker2: DialogueSpeakerConfig;
  onSpeaker2Change: (spk: DialogueSpeakerConfig) => void;
  turns: DialogueTurn[];
  onTurnsChange: (turns: DialogueTurn[]) => void;
  onLoadPreset: (preset: DialoguePreset) => void;
  isLoading: boolean;
}

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  speaker1,
  onSpeaker1Change,
  speaker2,
  onSpeaker2Change,
  turns,
  onTurnsChange,
  onLoadPreset,
  isLoading,
}) => {
  const [isTashkeelLoading, setIsTashkeelLoading] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [fastScriptText, setFastScriptText] = useState('');
  const [copied, setCopied] = useState(false);

  // Add turn
  const handleAddTurn = (speakerChoice?: 'speaker1' | 'speaker2') => {
    const lastTurn = turns[turns.length - 1];
    const nextSpeaker = speakerChoice || (lastTurn?.speaker === 'speaker1' ? 'speaker2' : 'speaker1');
    const newTurn: DialogueTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      speaker: nextSpeaker,
      text: '',
    };
    onTurnsChange([...turns, newTurn]);
  };

  // Update a turn's text
  const handleTurnTextChange = (id: string, text: string) => {
    onTurnsChange(
      turns.map((t) => (t.id === id ? { ...t, text } : t))
    );
  };

  // Toggle speaker for a turn
  const handleToggleSpeaker = (id: string) => {
    onTurnsChange(
      turns.map((t) =>
        t.id === id
          ? { ...t, speaker: t.speaker === 'speaker1' ? 'speaker2' : 'speaker1' }
          : t
      )
    );
  };

  // Delete a turn
  const handleDeleteTurn = (id: string) => {
    if (turns.length <= 1) return;
    onTurnsChange(turns.filter((t) => t.id !== id));
  };

  // Swap turn positions
  const handleMoveTurn = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= turns.length) return;
    const copy = [...turns];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    onTurnsChange(copy);
  };

  // Auto-tashkeel all dialogue lines
  const handleTashkeelAll = async () => {
    if (isTashkeelLoading || isLoading) return;
    setIsTashkeelLoading(true);

    try {
      const updatedTurns = [...turns];
      for (let i = 0; i < updatedTurns.length; i++) {
        if (!updatedTurns[i].text.trim()) continue;
        try {
          const res = await fetch('/api/tashkeel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: updatedTurns[i].text }),
          });
          const data = await res.json();
          if (data.vowelledText) {
            updatedTurns[i] = { ...updatedTurns[i], text: data.vowelledText };
          }
        } catch (e) {
          console.error(e);
        }
      }
      onTurnsChange(updatedTurns);
    } finally {
      setIsTashkeelLoading(false);
    }
  };

  // Parse fast script text into turns
  const handleParseFastScript = () => {
    if (!fastScriptText.trim()) return;
    const lines = fastScriptText.split('\n').filter((l) => l.trim().length > 0);
    const parsedTurns: DialogueTurn[] = [];

    lines.forEach((line, idx) => {
      let spk: 'speaker1' | 'speaker2' = idx % 2 === 0 ? 'speaker1' : 'speaker2';
      let content = line.trim();

      // Check if line starts with speaker name
      const spk1Prefix = `${speaker1.name}:`;
      const spk2Prefix = `${speaker2.name}:`;

      if (content.startsWith(spk1Prefix)) {
        spk = 'speaker1';
        content = content.slice(spk1Prefix.length).trim();
      } else if (content.startsWith(spk2Prefix)) {
        spk = 'speaker2';
        content = content.slice(spk2Prefix.length).trim();
      } else if (content.startsWith('1:') || content.startsWith('أ:') || content.toLowerCase().startsWith('a:')) {
        spk = 'speaker1';
        content = content.replace(/^([1أaA]):\s*/, '').trim();
      } else if (content.startsWith('2:') || content.startsWith('ب:') || content.toLowerCase().startsWith('b:')) {
        spk = 'speaker2';
        content = content.replace(/^([2بbB]):\s*/, '').trim();
      }

      parsedTurns.push({
        id: `turn_${Date.now()}_${idx}`,
        speaker: spk,
        text: content,
      });
    });

    if (parsedTurns.length > 0) {
      onTurnsChange(parsedTurns);
      setFastMode(false);
    }
  };

  // Convert current turns to fast text format
  const handleOpenFastMode = () => {
    const formatted = turns
      .map((t) => `${t.speaker === 'speaker1' ? speaker1.name : speaker2.name}: ${t.text}`)
      .join('\n\n');
    setFastScriptText(formatted);
    setFastMode(true);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Users className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              إعداد حوار بين شخصيتين (Dialogue Mode)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                ميزة جديدة 👥
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              قم بإنشاء محادثة صوتية متكاملة بين متحدثين مختلفين بأسلوب واقعي
            </p>
          </div>
        </div>

        {/* Quick presets and tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isTashkeelLoading || isLoading}
            onClick={handleTashkeelAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
            title="تشكيل إعرابي ذكي لكافة أسطر الحوار لضمان نطق عربي سليم"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isTashkeelLoading ? 'animate-spin' : ''}`} />
            <span>{isTashkeelLoading ? 'جارٍ التشكيل...' : 'تشكيل الحوار كاملاً 🪄'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (fastMode) {
                setFastMode(false);
              } else {
                handleOpenFastMode();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
            <span>{fastMode ? 'العودة للبطاقات' : 'المحرر النصي السريع'}</span>
          </button>
        </div>
      </div>

      {/* 1. Speakers Setup Cards (Speaker 1 and Speaker 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Speaker 1 Card */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/40 relative ring-1 ring-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              الشخصية الأولى (المتحدث الأول)
            </span>
            <span className="text-[11px] text-slate-400">
              {speaker1.voice.category === 'male' ? 'صوت رجالي' : speaker1.voice.category === 'female' ? 'صوت نسائي' : 'صوت أطفال'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">اسم الشخصية:</label>
              <input
                type="text"
                value={speaker1.name}
                onChange={(e) => onSpeaker1Change({ ...speaker1, name: e.target.value })}
                placeholder="مثال: عُمر"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">نبرة الصوت:</label>
              <select
                value={speaker1.voice.id}
                onChange={(e) => {
                  const found = VOICES.find((v) => v.id === e.target.value);
                  if (found) {
                    onSpeaker1Change({ ...speaker1, voice: found });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:border-amber-500 outline-none cursor-pointer"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} - {v.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Speaker 2 Card */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/40 relative ring-1 ring-rose-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
              الشخصية الثانية (المتحدث الثاني)
            </span>
            <span className="text-[11px] text-slate-400">
              {speaker2.voice.category === 'male' ? 'صوت رجالي' : speaker2.voice.category === 'female' ? 'صوت نسائي' : 'صوت أطفال'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">اسم الشخصية:</label>
              <input
                type="text"
                value={speaker2.name}
                onChange={(e) => onSpeaker2Change({ ...speaker2, name: e.target.value })}
                placeholder="مثال: نور"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">نبرة الصوت:</label>
              <select
                value={speaker2.voice.id}
                onChange={(e) => {
                  const found = VOICES.find((v) => v.id === e.target.value);
                  if (found) {
                    onSpeaker2Change({ ...speaker2, voice: found });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:border-rose-500 outline-none cursor-pointer"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} - {v.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Dialogues Selector Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
        <div className="flex items-center gap-2 mb-2.5">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">نماذج حوارات جاهزة ومضبوطة بالشكل:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIALOGUE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onLoadPreset(preset)}
              className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-right transition-all cursor-pointer group"
            >
              <div className="font-bold text-xs text-slate-200 group-hover:text-amber-300 truncate">
                {preset.title}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                {preset.badge} ({preset.turns.length} أسطر)
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fast Script Area or Turn-by-Turn Editor */}
      {fastMode ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>اكتب أو الصق نص الحوار. اكتب اسم الشخصية في بداية السطر (مثال: {speaker1.name}: نص السطر):</span>
          </div>
          <textarea
            rows={8}
            dir="rtl"
            value={fastScriptText}
            onChange={(e) => setFastScriptText(e.target.value)}
            placeholder={`${speaker1.name}: مرحباً بك يا صديقي!\n${speaker2.name}: أهلاً وسهلاً بك، سعيدٌ بلقائك اليوم.`}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-2xl p-4 text-sm sm:text-base text-white leading-relaxed outline-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setFastMode(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleParseFastScript}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 cursor-pointer shadow-md"
            >
              تطبيق وتوليد بطاقات الحوار
            </button>
          </div>
        </div>
      ) : (
        /* Turn-by-Turn Cards */
        <div className="space-y-3.5 mb-6">
          {turns.map((turn, index) => {
            const isSpeaker1 = turn.speaker === 'speaker1';
            const speakerConfig = isSpeaker1 ? speaker1 : speaker2;

            return (
              <div
                key={turn.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSpeaker1
                    ? 'bg-slate-950/70 border-amber-500/30'
                    : 'bg-slate-950/70 border-rose-500/30'
                }`}
              >
                {/* Turn Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSpeaker(turn.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                        isSpeaker1
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}
                      title="اضغط للتبديل بين الشخصية الأولى والثانية"
                    >
                      <span>{speakerConfig.voice.accentEmoji}</span>
                      <span>{speakerConfig.name}</span>
                      <span className="text-[10px] opacity-75">
                        ({isSpeaker1 ? 'المتحدث 1' : 'المتحدث 2'})
                      </span>
                    </button>
                    <span className="text-[11px] text-slate-500">
                      سطر #{index + 1}
                    </span>
                  </div>

                  {/* Actions: Move up/down, delete */}
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveTurn(index, 'up')}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                        title="تحريك لأعلى"
                      >
                        ▲
                      </button>
                    )}
                    {index < turns.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveTurn(index, 'down')}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                        title="تحريك لأسفل"
                      >
                        ▼
                      </button>
                    )}
                    {turns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTurn(turn.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="حذف هذا السطر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Turn Textarea */}
                <textarea
                  rows={2}
                  dir="rtl"
                  value={turn.text}
                  onChange={(e) => handleTurnTextChange(turn.id, e.target.value)}
                  placeholder={`اكتب كلام ${speakerConfig.name} هنا باللغة العربية...`}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-amber-500/60 rounded-xl p-3 text-sm sm:text-base text-slate-100 placeholder:text-slate-600 outline-none resize-y font-sans leading-relaxed"
                />
              </div>
            );
          })}

          {/* Add Line Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleAddTurn('speaker1')}
              className="flex-1 py-2.5 px-4 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-500/80 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة رد لـ {speaker1.name} (المتحدث 1)</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddTurn('speaker2')}
              className="flex-1 py-2.5 px-4 rounded-xl border border-dashed border-rose-500/40 hover:border-rose-500/80 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة رد لـ {speaker2.name} (المتحدث 2)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
