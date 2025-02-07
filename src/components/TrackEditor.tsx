// TrackEditor.tsx
"use client";
import React from "react";
import type { Track, RecordedSample } from "@/types/music";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type PitchName, pitches } from "@/utils/audio";

interface TrackEditorProps {
  track: Track;
  onUpdate: (updatedTrack: Track) => void;
  onDelete: () => void;
  recordedSamples: RecordedSample[];
}

export function TrackEditor({
  track,
  onUpdate,
  onDelete,
  recordedSamples,
}: TrackEditorProps) {
  const handleVolumeChange = (index: number, volume: number) => {
    const newSteps = [...track.steps];
    newSteps[index] = { ...newSteps[index], volume };
    onUpdate({ ...track, steps: newSteps });
  };

  const handlePitchChange = (index: number, pitch: PitchName) => {
    const newSteps = [...track.steps];
    newSteps[index] = { ...newSteps[index], pitch };
    onUpdate({ ...track, steps: newSteps });
  };

  const handleSoundTypeChange = (soundType: Track["soundType"]) => {
    onUpdate({ ...track, soundType, sampleId: undefined });
  };

  const handleSampleChange = (sampleId: string) => {
    onUpdate({ ...track, sampleId });
  };

  return (
    <div className="synth-panel p-4 mb-4">
      <div className="flex items-center mb-4 space-x-2">
        <Select value={track.soundType} onValueChange={handleSoundTypeChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="音の種類" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="synth">シンセ</SelectItem>
            <SelectItem value="snare">スネア</SelectItem>
            <SelectItem value="hihat">ハイハット</SelectItem>
            <SelectItem value="kick">キック</SelectItem>
            <SelectItem value="recordedSample">録音サンプル</SelectItem>
          </SelectContent>
        </Select>
        {track.soundType === "recordedSample" && (
          <Select
            value={track.sampleId}
            defaultValue="A4"
            onValueChange={handleSampleChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="サンプルを選択" />
            </SelectTrigger>
            <SelectContent>
              {recordedSamples.map((sample) => (
                <SelectItem key={sample.id} value={sample.id}>
                  {sample.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          onClick={onDelete}
          variant="destructive"
          size="sm"
          className="synth-button bg-slate-500"
        >
          削除
        </Button>
      </div>
      <div className="overflow-x-auto">
        <div className="flex w-full space-x-1 mb-2 justify-between">
          {track.steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center w-8">
              <div
                className="relative w-1 h-32 bg-gray-200 rounded-none cursor-pointer"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const target = e.currentTarget;
                  const rect = target.getBoundingClientRect();
                  const startY = e.clientY;
                  const startVolume = step.volume;

                  const handlePointerMove = (e: PointerEvent) => {
                    if (e.buttons !== 1) return; // 左クリック（またはタッチ）の場合のみ処理
                    const deltaY = startY - e.clientY;
                    const deltaVolume = deltaY / rect.height;
                    const newVolume = Math.max(
                      0,
                      Math.min(1, startVolume + deltaVolume)
                    );
                    handleVolumeChange(index, newVolume);
                  };

                  const handlePointerUp = () => {
                    target.releasePointerCapture(e.pointerId);
                    target.removeEventListener(
                      "pointermove",
                      handlePointerMove
                    );
                    target.removeEventListener("pointerup", handlePointerUp);
                  };

                  target.setPointerCapture(e.pointerId);
                  target.addEventListener("pointermove", handlePointerMove);
                  target.addEventListener("pointerup", handlePointerUp);
                }}
                style={{
                  backgroundColor: "#e5e7eb",
                }}
                aria-label={`ステップ ${index + 1}, 音量: ${Math.round(
                  step.volume * 100
                )}%`}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(step.volume * 100)}
              >
                <div
                  className="absolute w-6 h-6 p-0 text-xs transform -translate-x-1/2 left-1/2 rounded-none flex items-center justify-center"
                  style={{
                    bottom: `${step.volume * 83}%`,
                    transition: "bottom 0.01s linear",
                    backgroundColor: "#666",
                  }}
                >
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex w-full space-x-1 mb-2 justify-between">
          {track.steps.map((step, index) => (
            <Select
              key={index}
              value={step.pitch}
              onValueChange={(value) =>
                handlePitchChange(index, value as PitchName)
              }
            >
              <SelectTrigger className="w-8 h-8 p-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(pitches).map((pitch) => (
                  <SelectItem key={pitch} value={pitch}>
                    {pitch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>
    </div>
  );
}
