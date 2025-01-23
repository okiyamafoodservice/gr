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
        active: false,
        pitch: "C" as PitchName,
        volume: 0.5,
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

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(
        volume * masterVolume,
        audioContext.currentTime
      );
      gainNode.connect(audioContext.destination);

      let source: OscillatorNode | AudioBufferSourceNode;

      switch (soundType) {
        case "synth":
          source = createOscillator(audioContext, pitches[pitch]);
          break;
        case "snare":
          source = audioContext.createBufferSource();
          source.buffer = createNoiseBuffer(audioContext);
          gainNode.gain.setValueAtTime(
            volume * masterVolume,
            audioContext.currentTime
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.2
          );
          break;
        case "hihat":
          source = audioContext.createBufferSource();
          source.buffer = createNoiseBuffer(audioContext);
          gainNode.gain.setValueAtTime(
            volume * masterVolume,
            audioContext.currentTime
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.05
          );
          break;
        case "kick":
          source = createKick(audioContext);
          break;
        case "recordedSample":
          if (sampleId) {
            const sample = recordedSamples.find((s) => s.id === sampleId);
            if (sample) {
              source = audioContext.createBufferSource();
              source.buffer = sample.buffer;
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

      source.connect(gainNode);
      if (soundType !== "recordedSample") {
        source.start();
        setTimeout(() => {
          source.stop();
        }, 100);
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
      if (step.active) {
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
