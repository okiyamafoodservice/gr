"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import type { RecordedSample } from "../types/music";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioContext } from "../hooks/useAudioContext";
import {
  cutAudioBuffer,
  createDelay,
  createDistortion,
  createFlanger,
} from "@/utils/audio";
import { WaveformDisplay } from "./WaveformDisplay";
import { EffectsPanel, EffectType, EffectParameters } from "./EffectsPanel";

interface SampleEditorProps {
  sample: RecordedSample;
  onUpdate: (updatedSample: RecordedSample) => void;
}

export function SampleEditor({ sample, onUpdate }: SampleEditorProps) {
  const audioContext = useAudioContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(sample.startTime);
  const [endTime, setEndTime] = useState(sample.endTime);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // エフェクト設定用の状態
  const [selectedEffect, setSelectedEffect] = useState<EffectType>("none");
  const [effectParameters, setEffectParameters] = useState<EffectParameters>(
    {}
  );

  // onEffectChange を useCallback でメモ化
  const handleEffectChange = useCallback(
    (effect: EffectType, parameters: EffectParameters) => {
      setSelectedEffect(effect);
      setEffectParameters(parameters);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
    };
  }, []);

  // エフェクトチェーンを構築する関数
  const createEffectsChain = async (): Promise<AudioNode | null> => {
    if (!audioContext) return null;

    switch (selectedEffect) {
      case "delay":
        return createDelay(
          audioContext,
          (effectParameters as { delayTime: number }).delayTime || 0.5
        );
      case "distortion":
        return createDistortion(
          audioContext,
          (effectParameters as { amount: number }).amount || 50
        );
      case "flanger":
        const params = effectParameters as { depth: number; rate: number };
        return createFlanger(
          audioContext,
          params.depth || 0.002,
          params.rate || 0.25
        );
      default:
        return null;
    }
  };

  const playSound = async () => {
    if (!audioContext) return;

    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }

    const source = audioContext.createBufferSource();
    source.buffer = sample.buffer;

    // マスターゲインを作成
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(1, audioContext.currentTime);

    // エフェクトチェーンのノードを取得
    const effectNode = await createEffectsChain();

    // 信号チェーンの構築:
    // source -> (effectNode?) -> masterGain -> destination
    if (effectNode) {
      source.connect(effectNode);
      effectNode.connect(masterGain);
    } else {
      source.connect(masterGain);
    }
    masterGain.connect(audioContext.destination);

    source.start(0, startTime, endTime - startTime);
    audioSourceRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
    };
  };

  const stopSound = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleCut = () => {
    const newBuffer = cutAudioBuffer(sample.buffer, startTime, endTime);
    const updatedSample = {
      ...sample,
      buffer: newBuffer,
      startTime: 0,
      endTime: newBuffer.duration,
    };
    onUpdate(updatedSample);
  };

  const handleTimeRangeChange = (newStartTime: number, newEndTime: number) => {
    setStartTime(newStartTime);
    setEndTime(newEndTime);
  };

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">{sample.name}</h3>
      <div className="flex items-center space-x-2 mb-4">
        <Button onClick={isPlaying ? stopSound : playSound}>
          {isPlaying ? "停止" : "再生"}
        </Button>
        <Button onClick={handleCut}>カット</Button>
      </div>
      <div className="mb-4">
        <WaveformDisplay
          buffer={sample.buffer}
          width={600}
          height={150}
          startTime={startTime}
          endTime={endTime}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>
      {/* エフェクト設定パネル */}
      <EffectsPanel onEffectChange={handleEffectChange} />
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            開始時間: {startTime.toFixed(2)}秒
          </label>
          <Slider
            min={0}
            max={sample.buffer.duration}
            step={0.01}
            value={[startTime]}
            onValueChange={([value]) => setStartTime(value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            終了時間: {endTime.toFixed(2)}秒
          </label>
          <Slider
            min={0}
            max={sample.buffer.duration}
            step={0.01}
            value={[endTime]}
            onValueChange={([value]) => setEndTime(value)}
          />
        </div>
      </div>
    </div>
  );
}
