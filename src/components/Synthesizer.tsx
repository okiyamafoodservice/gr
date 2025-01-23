"use client";
import React, { useState } from "react";
import { Sequencer } from "./Sequencer";
import { VoiceRecorder } from "./VoiceRecorder";
import { SampleEditor } from "./SampleEditor";
import { useAudioContext } from "../hooks/useAudioContext";
import type { RecordedSample } from "@/types/music";
import { v4 as uuidv4 } from "uuid";

export function Synthesizer() {
  const audioContext = useAudioContext();
  const [recordedSamples, setRecordedSamples] = useState<RecordedSample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const handleRecordingComplete = (buffer: AudioBuffer) => {
    const newRecordedSample: RecordedSample = {
      id: uuidv4(),
      buffer,
      name: `サンプル ${recordedSamples.length + 1}`,
      startTime: 0,
      endTime: buffer.duration,
    };
    setRecordedSamples([...recordedSamples, newRecordedSample]);
  };

  const handleSampleUpdate = (updatedSample: RecordedSample) => {
    setRecordedSamples(
      recordedSamples.map((sample) =>
        sample.id === updatedSample.id ? updatedSample : sample
      )
    );
  };

  if (!audioContext) {
    return <div>オーディオコンテキストを読み込み中...</div>;
  }

  return (
    <div className="min-h-screen p-4 bg-orange-500 text-white">
      <h1 className="text-6xl font-bold mb-6 text-left text-primary">
        Webシンセ
      </h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-2">
          <Sequencer recordedSamples={recordedSamples} />
        </div>
        <div className="synth-panel p-4">
          <h2 className="text-2xl font-bold mb-4">音声録音</h2>
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            audioContext={audioContext}
          />

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">録音済みサウンド</h3>
            <ul className="space-y-2">
              {recordedSamples.map((sample) => (
                <li
                  key={sample.id}
                  className="flex items-center justify-between"
                >
                  <button
                    className="text-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setSelectedSampleId(sample.id)}
                  >
                    {sample.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {selectedSampleId && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">サンプル編集</h3>
              <SampleEditor
                sample={recordedSamples.find((s) => s.id === selectedSampleId)!}
                onUpdate={handleSampleUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
