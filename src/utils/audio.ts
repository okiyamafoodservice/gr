export function createOscillator(
  context: AudioContext,
  frequency: number
): OscillatorNode {
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  return oscillator;
}

export function createNoiseBuffer(audioContext: AudioContext): AudioBuffer {
  const bufferSize = audioContext.sampleRate * 0.5; // 0.5秒のノイズ
  const buffer = audioContext.createBuffer(
    1,
    bufferSize,
    audioContext.sampleRate
  );
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export const pitches = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392.0,
  "G#": 415.3,
  A: 440.0,
  "A#": 466.16,
  B: 493.88,
};

export type PitchName = keyof typeof pitches;

export function cutAudioBuffer(
  buffer: AudioBuffer,
  startTime: number,
  endTime: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const newLength = endSample - startSample;

  const newBuffer = new AudioBuffer({
    length: newLength,
    numberOfChannels: channels,
    sampleRate: sampleRate,
  });

  for (let channel = 0; channel < channels; channel++) {
    const newChannelData = newBuffer.getChannelData(channel);
    const originalChannelData = buffer.getChannelData(channel);
    for (let i = 0; i < newLength; i++) {
      newChannelData[i] = originalChannelData[startSample + i];
    }
  }

  return newBuffer;
}

export async function loadAudioFile(
  context: AudioContext,
  filePath: string
): Promise<AudioBuffer> {
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();
  return await context.decodeAudioData(arrayBuffer);
}

export function createPitchedSource(
  context: AudioContext,
  buffer: AudioBuffer,
  pitch: PitchName
): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = buffer;
  const basePitch = pitches["A"];
  const targetPitch = pitches[pitch];
  source.playbackRate.value = targetPitch / basePitch;
  return source;
}

export const soundFiles = {
  hihat: "/sounds/hihat.wav",
  snare: "/sounds/snare.wav",
  kick: "/sounds/kick.wav",
};

export function applyFadeOut(
  context: AudioContext,
  param: AudioParam,
  duration = 0.05
): void {
  const now = context.currentTime;
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(0, now + duration);
}

export function playSound(
  context: AudioContext,
  source: AudioScheduledSourceNode,
  gainNode: GainNode
): void {
  source.connect(gainNode);
  gainNode.connect(context.destination);

  source.start();

  if (source instanceof AudioBufferSourceNode && source.buffer) {
    const duration = source.buffer.duration;
    applyFadeOut(context, gainNode.gain, 0.05);
    source.stop(context.currentTime + duration);
  }
}

export function createKick(context: AudioContext): AudioBufferSourceNode {
  const buffer = createNoiseBuffer(context);
  const source = context.createBufferSource();
  source.buffer = buffer;

  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(150, context.currentTime);
  lowpass.frequency.exponentialRampToValueAtTime(
    0.01,
    context.currentTime + 0.5
  );

  source.connect(lowpass);
  return source;
}

interface EnvelopeOptions {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export function applyEnvelope(
  context: AudioContext,
  param: AudioParam,
  options: Partial<EnvelopeOptions> = {}
): void {
  const { attack = 0.05, decay = 0.1, sustain = 0.7, release = 0.2 } = options;
  const now = context.currentTime;

  param.setValueAtTime(0, now);
  param.linearRampToValueAtTime(1, now + attack);
  param.linearRampToValueAtTime(sustain, now + attack + decay);
  param.linearRampToValueAtTime(0, now + attack + decay + release);
}

export async function loadAndCacheSounds(
  context: AudioContext
): Promise<Record<string, AudioBuffer>> {
  const soundBuffers: Record<string, AudioBuffer> = {};
  for (const [key, path] of Object.entries(soundFiles)) {
    soundBuffers[key] = await loadAudioFile(context, path);
  }
  return soundBuffers;
}
