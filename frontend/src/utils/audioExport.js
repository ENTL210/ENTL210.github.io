import { Mp3Encoder } from "@breezystack/lamejs";

function floatTo16BitPCM(float32Array) {
  const pcm = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return pcm;
}

function audioBufferToMp3(buffer, kbps = 192) {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);
  const left = floatTo16BitPCM(buffer.getChannelData(0));
  const right =
    numChannels > 1
      ? floatTo16BitPCM(buffer.getChannelData(1))
      : left;

  const blockSize = 1152;
  const parts = [];

  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const rightChunk = right.subarray(i, i + blockSize);
    const mp3buf =
      numChannels === 1
        ? encoder.encodeBuffer(leftChunk)
        : encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) parts.push(new Uint8Array(mp3buf));
  }

  const end = encoder.flush();
  if (end.length > 0) parts.push(new Uint8Array(end));

  return new Blob(parts, { type: "audio/mpeg" });
}

async function decodeAudioData(arrayBuffer) {
  const audioCtx = new AudioContext();
  try {
    return await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioCtx.close();
  }
}

async function renderTrimmedBuffer(sourceBuffer, startSec, endSec) {
  const duration = Math.max(0, endSec - startSec);
  if (duration <= 0) {
    throw new Error("Invalid trim range");
  }

  const sampleRate = sourceBuffer.sampleRate;
  const frameCount = Math.max(1, Math.ceil(duration * sampleRate));
  const offline = new OfflineAudioContext(
    sourceBuffer.numberOfChannels,
    frameCount,
    sampleRate,
  );

  const source = offline.createBufferSource();
  source.buffer = sourceBuffer;
  source.connect(offline.destination);
  source.start(0, startSec, duration);

  return offline.startRendering();
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Slice audioBytes from startSec→endSec, encode MP3, trigger a file download.
 */
export async function exportTrimmedMp3(
  audioBytes,
  startSec,
  endSec,
  filename = "ed-tools-trim.mp3",
) {
  const decoded = await decodeAudioData(audioBytes);
  const clippedStart = Math.max(0, startSec);
  const clippedEnd = Math.min(decoded.duration, endSec);
  const trimmed = await renderTrimmedBuffer(decoded, clippedStart, clippedEnd);
  const blob = audioBufferToMp3(trimmed, 192);
  triggerDownload(blob, filename);
}
