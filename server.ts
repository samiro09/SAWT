import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { convertWavToMp3, concatWavs } from './src/utils/audioConverter.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Google GenAI with telemetry header as required by skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to detect quota / 429 errors
function isQuotaError(err: any): boolean {
  if (!err) return false;
  const str = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
  return str.includes('429') || str.includes('RESOURCE_EXHAUSTED') || str.includes('quota') || str.includes('exceeded');
}

// Helper to extract retry seconds from 429 error
function extractRetrySeconds(err: any): number {
  try {
    const msg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
    const match = msg.match(/retry in ([\d\.]+)s/i) || msg.match(/"retryDelay":\s*"(\d+)s"/i);
    if (match && match[1]) {
      return Math.ceil(parseFloat(match[1]));
    }
  } catch {}
  return 15;
}

/**
 * Text-to-Speech API
 * Converts Arabic text to spoken audio with automatic model fallback (gemini-3.8-flash-lite-tts <-> gemini-3.8-flash-tts)
 */
app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Charon',
      styleDescription = 'واضح، فصيح، متقن لمخارج الحروف العربية',
      bitrate = 192,
      speed = 1.0,
      pitch = 'normal',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال نص باللغة العربية' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير متوفر في بيئة التشغيل' });
    }

    // Compose guidance for the speech model
    let combinedStyle = styleDescription || '';
    if (speed && speed !== 1.0) {
      if (speed <= 0.8) {
        combinedStyle += '، تحدث بروية وهدوء وبطء خفيف';
      } else if (speed >= 1.3) {
        combinedStyle += '، تحدث بسرعة حماسية رشيقة';
      }
    }
    if (pitch === 'high') {
      combinedStyle += '، طبقة صوت مرتفعة قليلاً وطفولية أو حيوية';
    } else if (pitch === 'low') {
      combinedStyle += '، طبقة صوت جهورية عميقة وفخمة';
    }

    let wavBase64: string | undefined;

    // Try primary model: gemini-3.8-flash-lite-tts
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: combinedStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      wavBase64 = audioPart?.inlineData?.data;
    } catch (primaryErr: any) {
      console.warn('Primary TTS model failed, attempting secondary model gemini-3.8-flash-tts:', primaryErr?.message);
      if (isQuotaError(primaryErr)) {
        try {
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: text.trim(),
                    speechMetadata: {
                      style: combinedStyle,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
            },
          });
          const audioPart = fallbackRes.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
          wavBase64 = audioPart?.inlineData?.data;
        } catch (secondaryErr: any) {
          console.error('Both TTS models exhausted quota:', secondaryErr);
          const waitSec = extractRetrySeconds(secondaryErr) || extractRetrySeconds(primaryErr) || 15;
          return res.status(429).json({
            error: `تم تجاوز حد الطلبات المجاني المؤقت (3 طلبات بالدقيقة). يرجى الانتظار ${waitSec} ثانية والمحاولة مجدداً.`,
            retryAfter: waitSec,
          });
        }
      } else {
        throw primaryErr;
      }
    }

    if (!wavBase64) {
      return res.status(500).json({
        error: 'لم يتمكن النموذج من توليد الصوت. يرجى تجربة نص أقصر أو تغيير النبرة.',
      });
    }

    // Convert raw WAV to high quality MP3
    const wavBuffer = Buffer.from(wavBase64, 'base64');
    const mp3Bytes = convertWavToMp3(new Uint8Array(wavBuffer), Number(bitrate) || 192);
    const mp3Base64 = Buffer.from(mp3Bytes).toString('base64');

    const pcmDataSize = Math.max(0, wavBuffer.length - 44);
    const durationSeconds = +(pcmDataSize / 48000).toFixed(2);

    res.json({
      success: true,
      wavBase64,
      mp3Base64,
      duration: durationSeconds,
      bitrate: Number(bitrate) || 192,
      voiceName,
      sampleRate: 24000,
      wavSize: wavBuffer.length,
      mp3Size: mp3Bytes.length,
    });
  } catch (error: any) {
    console.error('TTS Generation error:', error);
    if (isQuotaError(error)) {
      const waitSec = extractRetrySeconds(error);
      return res.status(429).json({
        error: `تم تجاوز حد الطلبات المؤقت. يرجى الانتظار ${waitSec} ثانية والمحاولة ثانية.`,
        retryAfter: waitSec,
      });
    }
    res.status(500).json({
      error: error?.message || 'حدث خطأ أثناء تحويل النص إلى صوت',
    });
  }
});

// Helper to clean dialogue text so speaker names (e.g. "عمر:", "نور:") are never vocalized
function cleanDialogueTurnText(rawText: string, speakerName?: string): string {
  if (!rawText) return '';
  let cleaned = rawText.trim();
  if (speakerName) {
    const escaped = speakerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`^${escaped}\\s*[:：\\-]\\s*`, 'i'), '');
  }
  // Also strip generic speaker prefixes like "المتحدث 1:", "المتحدث الأول:", "Speaker 1:", etc.
  cleaned = cleaned.replace(/^(المتحدث\s*(الأول|الثاني|1|2)|شخصية\s*(1|2)|speaker\s*(1|2)|[12أب])\s*[:：\\-]\s*/i, '');
  return cleaned.trim();
}

/**
 * Dialogue Text-to-Speech API
 * Converts a 2-person conversation with distinct voices into a single combined MP3 file
 * Uses single-request multiSpeakerVoiceConfig to avoid hitting the 3 RPM limit!
 */
app.post('/api/tts-dialogue', async (req, res) => {
  try {
    const {
      turns,
      speaker1 = { name: 'المتحدث الأول', voiceName: 'Charon', style: 'واثق وهادئ وفصيح' },
      speaker2 = { name: 'المتحدث الثاني', voiceName: 'Kore', style: 'لطيفة وواضحة ومعبرة' },
      bitrate = 192,
      speed = 1.0,
      pauseMs = 280,
    } = req.body;

    if (!Array.isArray(turns) || turns.length === 0) {
      return res.status(400).json({ error: 'الرجاء إدخال أسطر الحوار' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير متوفر في بيئة التشغيل' });
    }

    let finalWavBuffer: Buffer | null = null;

    // Strategy 1: Single native multiSpeaker call with gemini-3.8-flash-tts
    // All turns in ONE request => Consumes only 1 request quota!
    // IMPORTANT: The speaker's name must NOT be in text, only pure dialogue text!
    try {
      const parts = turns.map((t: any) => {
        const isSpk1 = t.speaker === 'speaker1';
        const spkObj = isSpk1 ? speaker1 : speaker2;
        let style = spkObj.style || 'فصيح وطبيعي ومتقن';
        if (speed && speed !== 1.0) {
          if (speed <= 0.8) style += '، تحدث بروية وهدوء';
          else if (speed >= 1.3) style += '، تحدث بسرعة حماسية رشيقة';
        }
        const pureDialogueText = cleanDialogueTurnText(t.text, spkObj.name);
        return {
          text: pureDialogueText,
          speechMetadata: {
            speaker: spkObj.name,
            style,
          },
        };
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speaker1.name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker1.voiceName || 'Charon' },
                  },
                },
                {
                  speaker: speaker2.name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker2.voiceName || 'Kore' },
                  },
                },
              ],
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (audioPart?.inlineData?.data) {
        finalWavBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
      }
    } catch (multiSpeakerErr: any) {
      console.warn('Native multi-speaker call threw error, attempting sequential generation fallback:', multiSpeakerErr?.message);
    }

    // Strategy 2: If native multi-speaker failed, synthesize turns sequentially
    // (with model alternation to conserve quota)
    if (!finalWavBuffer) {
      const wavBuffersList: Uint8Array[] = [];

      for (let i = 0; i < turns.length; i++) {
        const turn = turns[i];
        const isSpk1 = turn.speaker === 'speaker1';
        const spk = isSpk1 ? speaker1 : speaker2;
        let turnStyle = spk.style || 'واضح، فصيح، متقن للنطق العربي الطبيعي';
        if (speed && speed !== 1.0) {
          if (speed <= 0.8) turnStyle += '، تحدث بروية وهدوء';
          else if (speed >= 1.3) turnStyle += '، تحدث بسرعة حماسية رشيقة';
        }

        const pureDialogueText = cleanDialogueTurnText(turn.text, spk.name);

        // Alternate models to spread the 3 RPM quota across both models
        const targetModel = i % 2 === 0 ? 'gemini-3.8-flash-lite-tts' : 'gemini-3.8-flash-tts';
        const backupModel = i % 2 === 0 ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';

        let turnAudioData: string | undefined;

        try {
          const turnRes = await ai.models.generateContent({
            model: targetModel,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: pureDialogueText,
                    speechMetadata: {
                      style: turnStyle,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: spk.voiceName || (isSpk1 ? 'Charon' : 'Kore') },
                },
              },
            },
          });
          turnAudioData = turnRes.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
        } catch (firstErr) {
          console.warn(`Turn ${i+1} failed with ${targetModel}, trying ${backupModel}:`, firstErr);
          const backupRes = await ai.models.generateContent({
            model: backupModel,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: pureDialogueText,
                    speechMetadata: {
                      style: turnStyle,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: spk.voiceName || (isSpk1 ? 'Charon' : 'Kore') },
                },
              },
            },
          });
          turnAudioData = backupRes.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
        }

        if (turnAudioData) {
          wavBuffersList.push(new Uint8Array(Buffer.from(turnAudioData, 'base64')));
        }
      }

      if (wavBuffersList.length === 0) {
        return res.status(429).json({
          error: 'تم تجاوز حد الطلبات المجاني المؤقت (3 طلبات في الدقيقة). يرجى الانتظار 15 ثانية والمحاولة مجدداً.',
          retryAfter: 15,
        });
      }

      const combinedWavBytes = concatWavs(wavBuffersList, Number(pauseMs) || 280);
      finalWavBuffer = Buffer.from(combinedWavBytes);
    }

    // Convert combined WAV to high quality MP3
    const mp3Bytes = convertWavToMp3(new Uint8Array(finalWavBuffer), Number(bitrate) || 192);
    const mp3Base64 = Buffer.from(mp3Bytes).toString('base64');
    const wavBase64 = finalWavBuffer.toString('base64');

    const pcmDataSize = Math.max(0, finalWavBuffer.length - 44);
    const durationSeconds = +(pcmDataSize / 48000).toFixed(2);

    res.json({
      success: true,
      wavBase64,
      mp3Base64,
      duration: durationSeconds,
      bitrate: Number(bitrate) || 192,
      turnsCount: turns.length,
      sampleRate: 24000,
      wavSize: finalWavBuffer.length,
      mp3Size: mp3Bytes.length,
    });
  } catch (error: any) {
    console.error('Dialogue TTS error:', error);
    if (isQuotaError(error)) {
      const waitSec = extractRetrySeconds(error);
      return res.status(429).json({
        error: `تم استهلاك حد الطلبات المؤقت. يرجى الانتظار ${waitSec} ثانية والمحاولة مجدداً.`,
        retryAfter: waitSec,
      });
    }
    res.status(500).json({
      error: error?.message || 'حدث خطأ أثناء توليد الحوار الصوتي',
    });
  }
});

/**
 * Auto-Tashkeel API
 * Accurately vowels/diacritizes Arabic text for crystal-clear TTS pronunciation
 */
app.post('/api/tashkeel', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال نص لتشكيله' });
    }

    const prompt = `أنت خبير لغوي متخصص في علم العروض والنحو والصرف العربي ومخارج الحروف.
المهمة: قم بتشكيل النص العربي التالي تشكيلاً إعرابياً وصوتياً دقيقاً وكاملاً (فتحة، ضمة، كسرة، سكون، تنوين، شدة) حتى يُقرأ بصوت الذكاء الاصطناعي بدقة تامة وفصاحة عالية.
شروط هامة:
1. لا تغير أي كلمة أو حرف من النص الأصلي.
2. لا تكتب أي مقدمات أو تحيات أو هوامش أو تعليقات.
3. أعد فقط النص بعد تشكيله مباشرة.

النص المطلوب تشكيله:
"""
${text.trim()}
"""`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
    } catch (primaryErr) {
      console.warn('Primary model busy, falling back to flash-lite:', primaryErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
      });
    }

    const vowelledText = response.text?.trim() || text;
    res.json({ success: true, vowelledText });
  } catch (error: any) {
    console.error('Tashkeel error:', error);
    res.status(500).json({ error: error?.message || 'تعذر تشكيل النص تلقائياً' });
  }
});

/**
 * Text Enhancer / Voice Script Optimizer
 */
app.post('/api/optimize-script', async (req, res) => {
  try {
    const { text, type = 'natural' } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال نص للتحسين' });
    }

    let instruction = 'قم بتحسين صياغة هذا النص العربي ليكون أكثر ملاءمة للإلقاء الصوتي وإضافة علامات الترقيم المناسبة للوقفات والتنفس الطبيعي.';
    if (type === 'story') {
      instruction = 'أعد صياغة النص بأسلوب حكائي مشوق لقصة أو رواية صوتية مع عبارات معبرة.';
    } else if (type === 'news') {
      instruction = 'صغ النص بأسلوب نشرة الأخبار الرسمية الرصينة والموجزة.';
    } else if (type === 'promo') {
      instruction = 'صغ النص بأسلوب إعلاني تسويقي مشوق وحماسي يجذب المستمع.';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${instruction}
حافظ على جوهر الفكرة الأصلية ولا تضع أي شروحات أو عبارات تمهيدية. أعد فقط النص المطور:
"""
${text.trim()}
"""`,
            },
          ],
        },
      ],
    });

    res.json({ success: true, optimizedText: response.text?.trim() || text });
  } catch (error: any) {
    console.error('Script optimize error:', error);
    res.status(500).json({ error: error?.message || 'تعذر تحسين النص' });
  }
});

// Vite setup in development, static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
