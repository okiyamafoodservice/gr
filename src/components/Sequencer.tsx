// Sequencer.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  type Track,
  STEPS_PER_BAR,
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
import { Slider } from "@/components/ui/slider";

interface SequencerProps {
  recordedSamples: RecordedSample[];
}

export function Sequencer({ recordedSamples }: SequencerProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [masterVolume, setMasterVolume] = useState(0.5);
  // 小節数を管理する状態（初期値：2小節）
  const [bars, setBars] = useState<number>(2);
  const audioContext = useAudioContext();

  // 総ステップ数は小節数 × 1小節あたりのステップ数
  const totalSteps = STEPS_PER_BAR * bars;

  // 小節数変更時、既存トラックのステップ数を更新する関数
  const updateTracksForBars = (newBars: number) => {
    const newTotalSteps = STEPS_PER_BAR * newBars;
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        let newSteps = [...track.steps];
        if (newSteps.length < newTotalSteps) {
          const stepsToAdd = newTotalSteps - newSteps.length;
          newSteps = newSteps.concat(
            Array(stepsToAdd).fill({
              active: false,
              pitch: "A4" as PitchName,
              volume: 0,
            })
          );
        } else if (newSteps.length > newTotalSteps) {
          newSteps = newSteps.slice(0, newTotalSteps);
        }
        return { ...track, steps: newSteps };
      })
    );
  };

  const addTrack = () => {
    const newTrack: Track = {
      id: uuidv4(),
      soundType: "synth",
      steps: Array(totalSteps).fill({
        active: false,
        pitch: "A4" as PitchName,
        volume: 0,
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

  /**
   * 各サウンドタイプでピッチ変更を適用するため、すべての場合で
   * 選択されたピッチに基づく playbackRate を設定します。
   * 基準として、pitches["A"]（440Hz）を用い、倍率＝(pitches[pitch] / 440) とします。
   */
  const playSound = useCallback(
    (
      soundType: SoundType,
      pitch: PitchName,
      volume: number,
      sampleId?: string
    ) => {
      if (!audioContext) return;

      // マスターゲインの作成
      const masterGainNode = audioContext.createGain();
      masterGainNode.gain.setValueAtTime(
        masterVolume,
        audioContext.currentTime
      );
      masterGainNode.connect(audioContext.destination);

      // エンベロープ用のゲインノードを作成
      const envelopeGain = createEnvelopeGain(audioContext);
      envelopeGain.connect(masterGainNode);

      let source: OscillatorNode | AudioBufferSourceNode;

      // 共通処理：基準ピッチ「A」(440Hz) を用いて playbackRate を計算
      const basePitch = pitches["A"];
      const targetPitch = pitches[pitch];
      const playbackRate = targetPitch / basePitch;

      switch (soundType) {
        case "synth":
          // シンセの場合はオシレーターの周波数を直接設定
          source = createOscillator(audioContext, pitches[pitch]);
          applyEnvelope(envelopeGain, audioContext, 0.01, 0.1, 0.7, 0.2);
          break;
        case "snare":
          source = audioContext.createBufferSource();
          source.buffer = createNoiseBuffer(audioContext);
          // ノイズでも playbackRate でピッチ変更を適用
          source.playbackRate.setValueAtTime(
            playbackRate,
            audioContext.currentTime
          );
          applyEnvelope(envelopeGain, audioContext, 0.005, 0.05, 0.1, 0.1);
          break;
        case "hihat":
          source = audioContext.createBufferSource();
          source.buffer = createNoiseBuffer(audioContext);
          source.playbackRate.setValueAtTime(
            playbackRate,
            audioContext.currentTime
          );
          applyEnvelope(envelopeGain, audioContext, 0.001, 0.02, 0.05, 0.05);
          break;
        case "kick":
          source = createKick(audioContext);
          source.playbackRate.setValueAtTime(
            playbackRate,
            audioContext.currentTime
          );
          applyEnvelope(envelopeGain, audioContext, 0.005, 0.1, 0.5, 0.1);
          break;
        case "recordedSample":
          if (sampleId) {
            const sample = recordedSamples.find((s) => s.id === sampleId);
            if (sample) {
              source = audioContext.createBufferSource();
              source.buffer = sample.buffer;
              source.playbackRate.setValueAtTime(
                playbackRate,
                audioContext.currentTime
              );
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

      // 録音音源以外は再生開始後に一定時間で停止
      if (soundType !== "recordedSample") {
        source.start();
        source.stop(audioContext.currentTime + 0.5);
      }
    },
    [audioContext, recordedSamples, masterVolume]
  );

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => (prevStep + 1) % totalSteps);
    }, ((60 / bpm) * 1000) / 4);
    return () => clearInterval(interval);
  }, [isPlaying, bpm, totalSteps]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
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
          <div className="flex flex-col items-center">
            <label className="text-lg font-bold text-gray-100">
              小節数: {bars}
            </label>
            <Slider
              min={1}
              max={8}
              step={1}
              value={[bars]}
              onValueChange={([value]) => {
                setBars(value);
                updateTracksForBars(value);
              }}
              className="w-32"
              aria-label="小節数調整"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
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
