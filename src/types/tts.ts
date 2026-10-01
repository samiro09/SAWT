export type VoiceCategory = 'male' | 'female' | 'kids' | 'elderly';

export interface VoicePersona {
  id: string;
  name: string;
  category: VoiceCategory;
  geminiVoiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  title: string;
  description: string;
  avatarColor: string;
  accentEmoji: string;
  baseStyle: string;
  sampleText: string;
}

export type MoodStyle =
  | 'formal'
  | 'documentary'
  | 'cheerful'
  | 'dramatic'
  | 'calm'
  | 'commercial';

export interface MoodOption {
  id: MoodStyle;
  label: string;
  icon: string;
  promptDescription: string;
}

export type BitrateOption = 64 | 128 | 192 | 320;

export interface GeneratedAudioItem {
  id: string;
  text: string;
  vowelledText?: string;
  voiceName: string;
  voiceTitle: string;
  voiceCategory: VoiceCategory;
  moodLabel: string;
  speed: number;
  bitrate: BitrateOption;
  duration: number;
  mp3Base64: string;
  wavBase64: string;
  mp3Size: number;
  wavSize: number;
  createdAt: number;
  isDialogue?: boolean;
  dialogueInfo?: {
    speaker1Name: string;
    speaker2Name: string;
    turnsCount: number;
  };
}

export interface DialogueTurn {
  id: string;
  speaker: 'speaker1' | 'speaker2';
  text: string;
}

export interface DialogueSpeakerConfig {
  name: string;
  voice: VoicePersona;
}

export interface DialoguePreset {
  id: string;
  title: string;
  badge: string;
  description: string;
  speaker1Name: string;
  speaker1VoiceId: string;
  speaker2Name: string;
  speaker2VoiceId: string;
  turns: { speaker: 'speaker1' | 'speaker2'; text: string }[];
}

