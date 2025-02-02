// utils/audio.ts

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
  C2: 65.41,
  "C#2": 69.3,
  D2: 73.42,
  "D#2": 77.78,
  E2: 82.41,
  F2: 87.31,
  "F#2": 92.5,
  G2: 98.0,
  "G#2": 103.83,
  A2: 110.0,
  "A#2": 116.54,
  B2: 123.47,
  C3: 130.81,
  "C#3": 138.59,
  D3: 146.83,
  "D#3": 155.56,
  E3: 164.81,
  F3: 174.61,
  "F#3": 185.0,
  G3: 196.0,
  "G#3": 207.65,
  A3: 220.0,
  "A#3": 233.08,
  B3: 246.94,
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  "G#4": 415.3,
  A: 440.0,
  A4: 440.0,
  "A#4": 466.16,
  B4: 493.88,
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

export function createEnvelopeGain(context: AudioContext): GainNode {
  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0, context.currentTime);
  return gainNode;
}

export function applyEnvelope(
  gainNode: GainNode,
  context: AudioContext,
  attackTime: number,
  decayTime: number,
  sustainLevel: number,
  releaseTime: number
): void {
  const now = context.currentTime;
  gainNode.gain.linearRampToValueAtTime(1, now + attackTime);
  gainNode.gain.linearRampToValueAtTime(
    sustainLevel,
    now + attackTime + decayTime
  );
  gainNode.gain.setValueAtTime(
    sustainLevel,
    now + attackTime + decayTime + 0.1
  );
  gainNode.gain.linearRampToValueAtTime(
    0,
    now + attackTime + decayTime + 0.1 + releaseTime
  );
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

/* ============================= */
/* エフェクト関連のユーティリティ */
/* ============================= */

export function createDelay(
  context: AudioContext,
  delayTime: number = 0.5
): DelayNode {
  const delayNode = context.createDelay();
  delayNode.delayTime.value = delayTime;
  return delayNode;
}

export function createDistortion(
  context: AudioContext,
  amount: number = 50
): WaveShaperNode {
  const distortion = context.createWaveShaper();
  const k = amount;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  distortion.curve = curve;
  distortion.oversample = "4x";
  return distortion;
}

export async function createReverb(
  context: AudioContext,
  impulseUrl: string
): Promise<ConvolverNode> {
  const response = await fetch(impulseUrl);
  const arrayBuffer = await response.arrayBuffer();
  const impulseBuffer = await context.decodeAudioData(arrayBuffer);
  const convolver = context.createConvolver();
  convolver.buffer = impulseBuffer;
  return convolver;
}

export function createFlanger(
  context: AudioContext,
  depth: number = 0.002,
  rate: number = 0.25
): AudioNode {
  const delay = context.createDelay();
  // 基本のディレイタイム（非常に短い時間）
  delay.delayTime.value = 0.005;

  // LFO（低周波オシレーター）を使って delayTime をモジュレーション
  const lfo = context.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = rate; // フランジャーの速度

  const lfoGain = context.createGain();
  lfoGain.gain.value = depth; // フランジャーの深さ

  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);
  lfo.start();

  return delay;
}
