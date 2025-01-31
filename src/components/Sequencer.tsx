// Sequencer.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  type Track,
  TOTAL_STEPS,
  type SoundType,
  type RecordedSample,
} from "../types/music";
import { TrackEditor } from "./TrackEditor";
import { Button } from "@/components/ui/button";
import { BPMSlider } from "./BPMSlider";
import { useAudioContext } from "../hooks/useAudioContext";
import {
  createOscillator,
  createNoiseBuffer,
  createKick,
  pitches,
  type PitchName,
  createEnvelopeGain,
  applyEnvelope,
} from "@/utils/audio";
import { Knob } from "./Knob";

interface SequencerProps {
  recordedSamples: RecordedSample[];
}

export function Sequencer({ recordedSamples }: SequencerProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [masterVolume, setMasterVolume] = useState(0.5);
  const audioContext = useAudioContext();

  const addTrack = () => {
    const newTrack: Track = {
      id: uuidv4(),
      soundType: "synth",
      steps: Array(TOTAL_STEPS).fill({
        pitch: "C2" as PitchName,
        volume: 0, // 初期音量をゼロに設定
      }),
    };
    setTracks([...tracks, newTrack]);
  };

  const updateTrack = (updatedTrack: Track) => {
    setTracks(
      tracks.map((track) =>
        track.id === updatedTrack.id ? updatedTrack : track
      )
    );
  };

  const deleteTrack = (trackId: string) => {
    setTracks(tracks.filter((track) => track.id !== trackId));
  };

  const playSound = useCallback(
    (
      soundType: SoundType,
      pitch: PitchName,
      volume: number,
      sampleId?: string
    ) => {
      if (!audioContext) return;

      const masterGainNode = audioContext.createGain();
      masterGainNode.gain.setValueAtTime(
        masterVolume,
        audioContext.currentTime
      );
      masterGainNode.connect(audioContext.destination);

      const envelopeGain = createEnvelopeGain(audioContext);
      envelopeGain.connect(masterGainNode);

      let source: OscillatorNode | AudioBufferSourceNode;

      switch (soundType) {
        case "synth":
          source = createOscillator(audioContext, pitches[pitch]);
          applyEnvelope(envelopeGain, audioContext, 0.01, 0.1, 0.7, 0.2);
          break;
        case "snare":
          source = audioContext.createBufferSource();
          source.buffer = createNoiseBuffer(audioContext);
          applyEnvelope(envelopeGain, audioContext, 0.005, 0.05, 0.1, 0.1);
          break;
        case "hihat":
          source = audioContext.createBufferSource();
          source.buffer = createNoiseBuffer(audioContext);
          applyEnvelope(envelopeGain, audioContext, 0.001, 0.02, 0.05, 0.05);
          break;
        case "kick":
          source = createKick(audioContext);
          applyEnvelope(envelopeGain, audioContext, 0.005, 0.1, 0.5, 0.1);
          break;
        case "recordedSample":
          if (sampleId) {
            const sample = recordedSamples.find((s) => s.id === sampleId);
            if (sample) {
              source = audioContext.createBufferSource();
              source.buffer = sample.buffer;
              source.playbackRate.setValueAtTime(
                pitches[pitch],
                audioContext.currentTime
              ); // ピッチ変更
              applyEnvelope(envelopeGain, audioContext, 0.005, 0.1, 0.7, 0.2);
              source.start(
                0,
                sample.startTime,
                sample.endTime - sample.startTime
              );
            } else {
              console.error("録音されたサンプルが見つかりません");
              return;
            }
          } else {
            console.error("サンプルIDが提供されていません");
            return;
          }
          break;
        default:
          return;
      }

      source.connect(envelopeGain);
      envelopeGain.gain.setValueAtTime(volume, audioContext.currentTime);

      if (soundType !== "recordedSample") {
        source.start();
        source.stop(audioContext.currentTime + 0.5); // 再生時間を0.5秒に延長
      }
    },
    [audioContext, recordedSamples, masterVolume]
  );

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prevStep) => (prevStep + 1) % TOTAL_STEPS);
    }, ((60 / bpm) * 1000) / 4);

    return () => clearInterval(interval);
  }, [isPlaying, bpm]);

  useEffect(() => {
    if (!isPlaying) return;

    tracks.forEach((track) => {
      const step = track.steps[currentStep];
      if (step.volume > 0) {
        playSound(track.soundType, step.pitch, step.volume, track.sampleId);
      }
    });
  }, [currentStep, isPlaying, tracks, playSound]);

  return (
    <div className="synth-panel p-4">
      <div className="flex items-center mb-4">
        <div className="flex items-center space-x-4">
          <BPMSlider bpm={bpm} onBPMChange={setBpm} />
          <Knob
            min={0}
            max={1}
            value={masterVolume}
            onChange={setMasterVolume}
            label="MASTER VOLUME"
            size={50}
            color="hsl(var(--primary))"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            className="synth-button"
          >
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button onClick={addTrack} className="synth-button">
            トラックを追加
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {tracks.map((track) => (
          <TrackEditor
            key={track.id}
            track={track}
            onUpdate={updateTrack}
            onDelete={() => deleteTrack(track.id)}
            recordedSamples={recordedSamples}
          />
        ))}
      </div>
    </div>
  );
}
