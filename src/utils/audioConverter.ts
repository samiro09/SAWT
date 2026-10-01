import { Mp3Encoder } from '@breezystack/lamejs';

export interface WavInfo {
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  pcmDataOffset: number;
  pcmDataLength: number;
}

/**
 * Robustly parses a WAV buffer to extract header info and PCM payload offset.
 */
export function parseWavHeader(buffer: Uint8Array): WavInfo {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Check 'RIFF' and 'WAVE'
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (riff !== 'RIFF') {
    // Fallback: Gemini TTS defaults (24kHz mono 16-bit, 44 byte header)
    return {
      channels: 1,
      sampleRate: 24000,
      bitsPerSample: 16,
      pcmDataOffset: 44,
      pcmDataLength: Math.max(0, buffer.byteLength - 44),
    };
  }

  let offset = 12;
  let channels = 1;
  let sampleRate = 24000;
  let bitsPerSample = 16;
  let pcmDataOffset = 44;
  let pcmDataLength = buffer.byteLength - 44;

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'fmt ') {
      channels = view.getUint16(offset + 8 + 2, true);
      sampleRate = view.getUint32(offset + 8 + 4, true);
      bitsPerSample = view.getUint16(offset + 8 + 14, true);
    } else if (chunkId === 'data') {
      pcmDataOffset = offset + 8;
      pcmDataLength = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
  }

  return {
    channels,
    sampleRate,
    bitsPerSample,
    pcmDataOffset,
    pcmDataLength,
  };
}

/**
 * Converts a WAV buffer (Uint8Array or Buffer) into MP3 bytes.
 * @param wavBuffer The raw WAV byte array.
 * @param kbps Bitrate in kbps (e.g. 128, 192, 320). Default 192.
 */
export function convertWavToMp3(wavBuffer: Uint8Array, kbps = 192): Uint8Array {
  const info = parseWavHeader(wavBuffer);
  const { channels, sampleRate, pcmDataOffset, pcmDataLength } = info;

  // Extract raw PCM bytes
  const pcmRaw = wavBuffer.subarray(pcmDataOffset, pcmDataOffset + pcmDataLength);
  
  // Cast into Int16Array (16-bit signed PCM)
  const numSamples = Math.floor(pcmRaw.byteLength / 2);
  const int16Samples = new Int16Array(
    pcmRaw.buffer,
    pcmRaw.byteOffset,
    numSamples
  );

  const encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Chunks: Uint8Array[] = [];

  const sampleBlockSize = 1152;
  if (channels === 1) {
    for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
      const chunk = int16Samples.subarray(i, i + sampleBlockSize);
      const encoded = encoder.encodeBuffer(chunk);
      if (encoded.length > 0) {
        mp3Chunks.push(new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength));
      }
    }
  } else {
    // Stereo interleaved: split into left & right
    const left = new Int16Array(int16Samples.length / 2);
    const right = new Int16Array(int16Samples.length / 2);
    for (let i = 0; i < left.length; i++) {
      left[i] = int16Samples[i * 2];
      right[i] = int16Samples[i * 2 + 1];
    }
    for (let i = 0; i < left.length; i += sampleBlockSize) {
      const leftChunk = left.subarray(i, i + sampleBlockSize);
      const rightChunk = right.subarray(i, i + sampleBlockSize);
      const encoded = encoder.encodeBuffer(leftChunk, rightChunk);
      if (encoded.length > 0) {
        mp3Chunks.push(new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength));
      }
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) {
    mp3Chunks.push(new Uint8Array(flushed.buffer, flushed.byteOffset, flushed.byteLength));
  }

  // Combine chunks into single Uint8Array
  const totalLength = mp3Chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of mp3Chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
}

/**
 * Concatenates multiple WAV buffers into a single seamless WAV file,
 * inserting an optional pause (silence) between segments.
 */
export function concatWavs(wavBuffers: Uint8Array[], silenceMs = 280): Uint8Array {
  if (wavBuffers.length === 0) {
    return new Uint8Array(0);
  }
  if (wavBuffers.length === 1) {
    return wavBuffers[0];
  }

  const parsedSegments = wavBuffers.map((buf) => {
    const info = parseWavHeader(buf);
    const pcm = buf.subarray(info.pcmDataOffset, info.pcmDataOffset + info.pcmDataLength);
    return { info, pcm };
  });

  const sampleRate = parsedSegments[0].info.sampleRate || 24000;
  const channels = parsedSegments[0].info.channels || 1;
  const bitsPerSample = parsedSegments[0].info.bitsPerSample || 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;

  // Calculate silence bytes per pause
  const silenceSamples = Math.floor((sampleRate * silenceMs) / 1000);
  const silenceBytes = silenceSamples * blockAlign;
  const silencePcm = new Uint8Array(silenceBytes); // initialized with zeroes

  // Calculate total PCM length
  let totalPcmLength = 0;
  parsedSegments.forEach((seg, idx) => {
    totalPcmLength += seg.pcm.byteLength;
    if (idx < parsedSegments.length - 1 && silenceMs > 0) {
      totalPcmLength += silenceBytes;
    }
  });

  const totalFileSize = 44 + totalPcmLength;
  const combined = new Uint8Array(totalFileSize);
  const view = new DataView(combined.buffer);

  // Write 44-byte standard RIFF WAV header
  view.setUint32(0, 0x52494646, false); // 'RIFF'
  view.setUint32(4, 36 + totalPcmLength, true); // ChunkSize
  view.setUint32(8, 0x57415645, false); // 'WAVE'
  view.setUint32(12, 0x666d7420, false); // 'fmt '
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, channels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample
  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, totalPcmLength, true); // Subchunk2Size

  let currentOffset = 44;
  parsedSegments.forEach((seg, idx) => {
    combined.set(seg.pcm, currentOffset);
    currentOffset += seg.pcm.byteLength;

    if (idx < parsedSegments.length - 1 && silenceMs > 0) {
      combined.set(silencePcm, currentOffset);
      currentOffset += silenceBytes;
    }
  });

  return combined;
}

