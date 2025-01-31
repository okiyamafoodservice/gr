import type { PitchName } from "@/utils/audio";

export type SoundType = "synth" | "snare" | "hihat" | "recordedSample" | "kick";

export interface TrackStep {
  active: boolean;
  pitch: PitchName;
  volume: number; // 新しく追加
}

export interface Track {
  id: string;
  soundType: SoundType;
  steps: TrackStep[];
  sampleId?: string;
  title?: string;
}

export interface RecordedSample {
  id: string;
  buffer: AudioBuffer;
  name: string;
  startTime: number;
  endTime: number;
}

export interface Project {
  name: string;
  tracks: Track[];
  bpm: number;
  recordedSamples: RecordedSample[];
}

export const STEPS_PER_BAR = 16;
export const BARS = 2;
export const TOTAL_STEPS = STEPS_PER_BAR * BARS;
