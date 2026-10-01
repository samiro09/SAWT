/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { TextEditor } from './components/TextEditor.tsx';
import { VoiceSelector } from './components/VoiceSelector.tsx';
import { AudioControls } from './components/AudioControls.tsx';
import { AudioPlayer } from './components/AudioPlayer.tsx';
import { AudioHistory } from './components/AudioHistory.tsx';
import { SampleModal } from './components/SampleModal.tsx';
import { DialogueEditor } from './components/DialogueEditor.tsx';
import { VOICES, MOODS, SAMPLE_TEXTS, DIALOGUE_PRESETS, SamplePreset } from './constants/voices.ts';
import {
  VoicePersona,
  MoodStyle,
  BitrateOption,
  GeneratedAudioItem,
  DialogueTurn,
  DialogueSpeakerConfig,
  DialoguePreset,
} from './types/tts.ts';
import { Sparkles, AlertCircle, Volume2, ShieldCheck, Zap, Users, User } from 'lucide-react';

const STORAGE_KEY = 'sawtek_audio_history_v1';

export default function App() {
  // App Mode: single speaker or two-person dialogue
  const [appMode, setAppMode] = useState<'single' | 'dialogue'>('single');

  // Single Speaker State
  const [text, setText] = useState<string>(
    'مَرحَباً بِكُم في تَطبيقِ صَوْتُك، المِنَصَّةُ المُتَطَوِّرةُ لِتَحويلِ النُّصوصِ العَرَبِيَّةِ إِلى أَصواتٍ طَبيعِيَّةٍ وواقِعِيَّةٍ بِأَعلى دِقَّة، مَعَ إِمكانِيَّةِ تَحميلِ المَلَفّاتِ بِصيغَةِ MP3 فائِقةِ النَّقاء.'
  );
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>(VOICES[0]);
  const [selectedMood, setSelectedMood] = useState<MoodStyle>('formal');

  // Dialogue Mode State
  const [speaker1, setSpeaker1] = useState<DialogueSpeakerConfig>({
    name: 'عُمر',
    voice: VOICES[0], // male-doc
  });
  const [speaker2, setSpeaker2] = useState<DialogueSpeakerConfig>({
    name: 'نور',
    voice: VOICES[4], // female-pro
  });
  const [dialogueTurns, setDialogueTurns] = useState<DialogueTurn[]>(
    DIALOGUE_PRESETS[0].turns.map((t, idx) => ({
      id: `turn_${idx}`,
      speaker: t.speaker,
      text: t.text,
    }))
  );

  // Common Audio & Quality Controls
  const [speed, setSpeed] = useState<number>(1.0);
  const [bitrate, setBitrate] = useState<BitrateOption>(192);
  const [pitch, setPitch] = useState<'normal' | 'low' | 'high'>('normal');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [currentAudio, setCurrentAudio] = useState<GeneratedAudioItem | null>(null);
  const [history, setHistory] = useState<GeneratedAudioItem[]>([]);

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSamplesOpen, setIsSamplesOpen] = useState<boolean>(false);

  // Audio preview state for voice card sample button
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const playerSectionRef = useRef<HTMLDivElement | null>(null);

  // Decrement countdown timer every second
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setErrorMessage(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 30));
        }
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (items: GeneratedAudioItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
    } catch (e) {
      console.warn('LocalStorage limit reached', e);
    }
  };

  // Stop preview on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  // Generate speech for single-speaker mode
  const handleGenerateSingle = async () => {
    if (!text.trim() || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const moodObj = MOODS.find((m) => m.id === selectedMood);
      const styleDescription = `${selectedVoice.baseStyle} النبرة الشعورية: ${moodObj?.promptDescription || ''}`;

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: selectedVoice.geminiVoiceName,
          styleDescription,
          bitrate,
          speed,
          pitch,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 429 || data.retryAfter) {
          setCountdown(data.retryAfter || 15);
        }
        throw new Error(data.error || 'تعذر توليد الصوت. يرجى المحاولة مرة أخرى.');
      }

      const newItem: GeneratedAudioItem = {
        id: `track_${Date.now()}`,
        text: text.trim(),
        voiceName: selectedVoice.name,
        voiceTitle: `${selectedVoice.name} - ${selectedVoice.title}`,
        voiceCategory: selectedVoice.category,
        moodLabel: moodObj?.label || 'فصيح',
        speed,
        bitrate,
        duration: data.duration,
        mp3Base64: data.mp3Base64,
        wavBase64: data.wavBase64,
        mp3Size: data.mp3Size,
        wavSize: data.wavSize,
        createdAt: Date.now(),
        isDialogue: false,
      };

      setCurrentAudio(newItem);
      const updatedHistory = [newItem, ...history.filter((h) => h.id !== newItem.id)];
      saveHistory(updatedHistory);

      // Scroll smoothly to player
      setTimeout(() => {
        playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'حدث خطأ غير متوقع أثناء توليد الصوت');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate speech for dialogue mode
  const handleGenerateDialogue = async () => {
    const validTurns = dialogueTurns.filter((t) => t.text.trim().length > 0);
    if (validTurns.length === 0 || isLoading) {
      setErrorMessage('الرجاء كتابة نص واحد على الأقل في أسطر الحوار');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/tts-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: validTurns,
          speaker1: {
            name: speaker1.name,
            voiceName: speaker1.voice.geminiVoiceName,
            style: speaker1.voice.baseStyle,
          },
          speaker2: {
            name: speaker2.name,
            voiceName: speaker2.voice.geminiVoiceName,
            style: speaker2.voice.baseStyle,
          },
          bitrate,
          speed,
          pauseMs: 280,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 429 || data.retryAfter) {
          setCountdown(data.retryAfter || 15);
        }
        throw new Error(data.error || 'تعذر توليد الحوار الصوتي');
      }

      const summaryText = validTurns
        .map((t) => `${t.speaker === 'speaker1' ? speaker1.name : speaker2.name}: ${t.text}`)
        .join(' • ');

      const newItem: GeneratedAudioItem = {
        id: `dialogue_${Date.now()}`,
        text: summaryText,
        voiceName: `${speaker1.name} & ${speaker2.name}`,
        voiceTitle: `حوار ثنائي: ${speaker1.name} و ${speaker2.name}`,
        voiceCategory: 'male',
        moodLabel: 'حوار ثنائي 👥',
        speed,
        bitrate,
        duration: data.duration,
        mp3Base64: data.mp3Base64,
        wavBase64: data.wavBase64,
        mp3Size: data.mp3Size,
        wavSize: data.wavSize,
        createdAt: Date.now(),
        isDialogue: true,
        dialogueInfo: {
          speaker1Name: speaker1.name,
          speaker2Name: speaker2.name,
          turnsCount: validTurns.length,
        },
      };

      setCurrentAudio(newItem);
      const updatedHistory = [newItem, ...history.filter((h) => h.id !== newItem.id)];
      saveHistory(updatedHistory);

      setTimeout(() => {
        playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'حدث خطأ أثناء توليد الحوار الصوتي');
    } finally {
      setIsLoading(false);
    }
  };

  // Preview voice sample
  const handlePreviewSample = async (voice: VoicePersona) => {
    if (previewingVoiceId === voice.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingVoiceId(null);
      return;
    }

    try {
      setPreviewingVoiceId(voice.id);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleText,
          voiceName: voice.geminiVoiceName,
          styleDescription: voice.baseStyle,
          bitrate: 128,
          speed: 1.0,
        }),
      });
      const data = await res.json();
      if (data.mp3Base64) {
        if (!previewAudioRef.current) {
          previewAudioRef.current = new Audio();
        }
        previewAudioRef.current.src = `data:audio/mp3;base64,${data.mp3Base64}`;
        previewAudioRef.current.onended = () => setPreviewingVoiceId(null);
        await previewAudioRef.current.play();
      }
    } catch (e) {
      console.error('Preview error', e);
      setPreviewingVoiceId(null);
    }
  };

  // Select sample preset for single mode
  const handleSelectSample = (sample: SamplePreset) => {
    setText(sample.text);
    const foundVoice = VOICES.find((v) => v.id === sample.suggestedVoiceId);
    if (foundVoice) setSelectedVoice(foundVoice);
    const foundMood = MOODS.find((m) => m.id === sample.suggestedMood);
    if (foundMood) setSelectedMood(foundMood.id);
  };

  // Load dialogue preset
  const handleLoadDialoguePreset = (preset: DialoguePreset) => {
    const spk1Voice = VOICES.find((v) => v.id === preset.speaker1VoiceId) || VOICES[0];
    const spk2Voice = VOICES.find((v) => v.id === preset.speaker2VoiceId) || VOICES[4];

    setSpeaker1({ name: preset.speaker1Name, voice: spk1Voice });
    setSpeaker2({ name: preset.speaker2Name, voice: spk2Voice });

    setDialogueTurns(
      preset.turns.map((t, idx) => ({
        id: `turn_${Date.now()}_${idx}`,
        speaker: t.speaker,
        text: t.text,
      }))
    );
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
    if (currentAudio?.id === id) {
      setCurrentAudio(null);
    }
  };

  // Clear all history
  const handleClearHistory = () => {
    saveHistory([]);
    setCurrentAudio(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Navbar */}
      <Navbar
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSamples={() => setIsSamplesOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="text-center max-w-3xl mx-auto pt-2 pb-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>محرك توليد الصوت العربي المتطور بتقنية Gemini Audio</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            حوّل أي نص عربي إلى{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              صوت طبيعي فصيح
            </span>{' '}
            مع تحميل MP3
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
            اختر من بين نبرات رجالية، نسائية، أطفال، وشيوخ، أو أنشئ حواراً صوتياً بين شخصيتين مع التحكم الكامل في السرعة وجودة الترميز وتحميل الملف بصيغة MP3 و WAV استوديو.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <button
              type="button"
              onClick={() => setAppMode('single')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                appMode === 'single'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>إلقاء فردي (صوت منفرد)</span>
            </button>

            <button
              type="button"
              onClick={() => setAppMode('dialogue')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
                appMode === 'dialogue'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>حوار ثنائي (شخصيتين)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 font-black">
                جديد
              </span>
            </button>
          </div>
        </section>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-center justify-between gap-3 shadow-lg transition-all ${
              countdown && countdown > 0
                ? 'bg-amber-950/70 border-amber-600/70 text-amber-200 ring-1 ring-amber-500/30'
                : 'bg-rose-950/60 border-rose-800 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {countdown && countdown > 0 ? (
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                  {countdown}
                </div>
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div>
                <p className="font-semibold">{errorMessage}</p>
                {countdown && countdown > 0 && (
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    الحد الأقصى للنموذج التجريبي هو 3 طلبات بالدقيقة. سيتم إعادة تفعيل التوليد تلقائياً عند انتهاء العداد.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setErrorMessage(null);
                setCountdown(null);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer shrink-0"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Content based on Mode */}
        {appMode === 'single' ? (
          <>
            {/* 1. Single Speaker Text Editor */}
            <section>
              <TextEditor
                text={text}
                onChange={setText}
                onOpenSamples={() => setIsSamplesOpen(true)}
                isLoading={isLoading}
              />
            </section>

            {/* 2. Single Speaker Voice & Mood Selector */}
            <section>
              <VoiceSelector
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                selectedMood={selectedMood}
                onSelectMood={setSelectedMood}
                onPreviewSample={handlePreviewSample}
                isPreviewingVoiceId={previewingVoiceId}
              />
            </section>

            {/* 3. Audio Controls & Quality Settings */}
            <section>
              <AudioControls
                speed={speed}
                onSpeedChange={setSpeed}
                bitrate={bitrate}
                onBitrateChange={setBitrate}
                pitch={pitch}
                onPitchChange={setPitch}
                onGenerate={handleGenerateSingle}
                isLoading={isLoading}
                canGenerate={Boolean(text.trim())}
                countdown={countdown}
              />
            </section>
          </>
        ) : (
          <>
            {/* Dialogue Mode: Dialogue Editor */}
            <section>
              <DialogueEditor
                speaker1={speaker1}
                onSpeaker1Change={setSpeaker1}
                speaker2={speaker2}
                onSpeaker2Change={setSpeaker2}
                turns={dialogueTurns}
                onTurnsChange={setDialogueTurns}
                onLoadPreset={handleLoadDialoguePreset}
                isLoading={isLoading}
              />
            </section>

            {/* Audio Controls for Dialogue */}
            <section>
              <AudioControls
                speed={speed}
                onSpeedChange={setSpeed}
                bitrate={bitrate}
                onBitrateChange={setBitrate}
                pitch={pitch}
                onPitchChange={setPitch}
                onGenerate={handleGenerateDialogue}
                isLoading={isLoading}
                canGenerate={dialogueTurns.some((t) => t.text.trim().length > 0)}
                countdown={countdown}
              />
            </section>
          </>
        )}

        {/* 4. Audio Player & MP3 Download Section */}
        <section ref={playerSectionRef} className="pt-2">
          <AudioPlayer currentAudio={currentAudio} />
        </section>

        {/* Features Highlights */}
        <section className="pt-6 pb-4 border-t border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                نطق عربي فصيح وحوارات واقعية
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                مخارج حروف دقيقة وإمكانية إنشاء محادثات متناغمة بين شخصيتين مع تشكيل إعرابي ذكي.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                تحميل فوري بصيغة MP3
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ترميز LAME عالي الجودة حتى 320 kbps متوافق مع كافة الهواتف والحواسيب والمشغلات.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                تحكم كامل في السرعة وجودة الصوت
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                تعديل السرعة من 0.5x حتى 2.0x مع طبقات صوت عميقة أو حادة تناسب كافة الأغراض.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1.5">
          <span>صَوْتُـك © 2026 - استوديو تحويل النصوص العربية والحوارات إلى صوت وتحميل MP3</span>
        </p>
      </footer>

      {/* Modals */}
      <AudioHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={history}
        onSelectTrack={(item) => setCurrentAudio(item)}
        onDeleteItem={handleDeleteHistoryItem}
        onClearAll={handleClearHistory}
        currentTrackId={currentAudio?.id}
      />

      <SampleModal
        isOpen={isSamplesOpen}
        onClose={() => setIsSamplesOpen(false)}
        onSelectSample={handleSelectSample}
      />
    </div>
  );
}

