import React from "react";
import { Button } from "@/components/ui/button";
import { type PitchName, pitches } from "@/utils/audio";

interface PitchSelectorProps {
  selectedPitch: PitchName;
  onPitchChange: (pitch: PitchName) => void;
}

export function PitchSelector({
  selectedPitch,
  onPitchChange,
}: PitchSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.keys(pitches).map((pitch) => (
        <Button
          key={pitch}
          onClick={() => onPitchChange(pitch as PitchName)}
          variant={selectedPitch === pitch ? "default" : "outline"}
        >
          {pitch}
        </Button>
      ))}
    </div>
  );
}
