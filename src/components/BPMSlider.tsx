import React from "react"
import { Slider } from "@/components/ui/slider"

interface BPMSliderProps {
  bpm: number
  onBPMChange: (value: number) => void
}

export function BPMSlider({ bpm, onBPMChange }: BPMSliderProps) {
  return (
    <div className="mb-4 landscape:mb-0 landscape:flex landscape:items-center landscape:space-x-2">
      <label htmlFor="bpm-slider" className="block text-sm font-medium text-gray-700 landscape:whitespace-nowrap">
        BPM: {bpm}
      </label>
      <Slider
        id="bpm-slider"
        min={40}
        max={240}
        step={1}
        value={[bpm]}
        onValueChange={(value) => onBPMChange(value[0])}
        className="w-48 landscape:w-32"
        aria-label="BPM調整"
      />
    </div>
  )
}

