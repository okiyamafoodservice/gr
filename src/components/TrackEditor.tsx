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
  const handleStepToggle = (index: number) => {
    const newSteps = [...track.steps];
    newSteps[index] = { ...newSteps[index], active: !newSteps[index].active };
    onUpdate({ ...track, steps: newSteps });
  };

  const handlePitchChange = (index: number, pitch: PitchName) => {
    const newSteps = [...track.steps];
    newSteps[index] = { ...newSteps[index], pitch };
    onUpdate({ ...track, steps: newSteps });
  };

  const handleVolumeChange = (index: number, volume: number) => {
    const newSteps = [...track.steps];
    newSteps[index] = { ...newSteps[index], volume };
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
          <Select value={track.sampleId} onValueChange={handleSampleChange}>
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
                className="relative w-1 h-32 bg-gray-200 rounded-none  cursor-pointer"
                onClick={() => handleStepToggle(index)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const handleMouseMove = (e: MouseEvent) => {
                    const rect = (
                      e.target as HTMLElement
                    ).getBoundingClientRect();
                    const volume =
                      1 -
                      Math.max(
                        0,
                        Math.min(1, (e.clientY - rect.top) / rect.height)
                      );
                    handleVolumeChange(index, volume);
                  };
                  const handleMouseUp = () => {
                    window.removeEventListener("mousemove", handleMouseMove);
                    window.removeEventListener("mouseup", handleMouseUp);
                  };
                  window.addEventListener("mousemove", handleMouseMove);
                  window.addEventListener("mouseup", handleMouseUp);
                  handleMouseMove(e.nativeEvent);
                }}
                style={{
                  backgroundColor: step.active
                    ? "black"
                    : "#e5e7eb landscape:whitespace-nowrap",
                }}
                aria-label={`ステップ ${index + 1}, アクティブ: ${
                  step.active ? "はい" : "いいえ"
                }, 音量: ${Math.round(step.volume * 100)}%`}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={step.volume}
              >
                <div
                  className="absolute w-6 h-6 p-0 text-xs transform -translate-x-1/2 left-1/2 rounded-none flex items-center justify-center"
                  style={{
                    bottom: `${step.volume * 100}%`,
                    transition: "bottom 0.1s ease-out",
                    backgroundColor: step.active ? "#666" : "#9ca3af",
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
              disabled={!step.active}
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
