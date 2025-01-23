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
            <SelectItem value="kick">いってなにしてんねん</SelectItem>
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
          className="synth-button"
        >
          トラックを消す
        </Button>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex space-x-4 mb-2 justify-between">
          {track.steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center w-8">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={step.volume}
                onChange={(e) =>
                  handleVolumeChange(index, parseFloat(e.target.value))
                }
                className="w-8 h-24 appearance-none bg-gray-200 rounded-full overflow-hidden transform rotate-180"
                style={{
                  WebkitAppearance: "slider-vertical",
                  opacity: step.active ? 1 : 0.5,
                }}
                disabled={!step.active}
              />
              <Button
                onClick={() => handleStepToggle(index)}
                variant={step.active ? "default" : "outline"}
                className={`w-8 h-8 p-0 text-xs mt-1 ${
                  step.active ? "synth-button" : "synth-button opacity-50"
                }`}
                aria-label={`ステップ ${index + 1}, アクティブ: ${
                  step.active ? "はい" : "いいえ"
                }, 音量: ${Math.round(step.volume * 100)}%`}
              >
                {index + 1}
              </Button>
            </div>
          ))}
        </div>
        <div className="inline-flex space-x-4 mb-2">
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
