"use client";
import React, { useState } from "react";
import { Sequencer } from "./Sequencer";
import { VoiceRecorder } from "./VoiceRecorder";
import { SampleEditor } from "./SampleEditor";
import { useAudioContext } from "../hooks/useAudioContext";
import type { RecordedSample } from "@/types/music";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";

export function Synthesizer() {
  const audioContext = useAudioContext();
  const [recordedSamples, setRecordedSamples] = useState<RecordedSample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const handleRecordingComplete = (buffer: AudioBuffer) => {
    const newRecordedSample: RecordedSample = {
      id: uuidv4(),
      buffer,
      name: `録音音源 ${recordedSamples.length + 1}`,
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
    <div className="min-h-screen p-4 bg-slate-800 text-white">
      <h1 className="text-8xl font-bold mb-6 text-right text-primary ml-auto mr-0 w-auto">
        <Image
          src="/images/logo.svg"
          alt="browserMIDI ロゴ"
          width={100} // 適切な幅に調整
          height={50} // 適切な高さに調整
          className="ml-auto mr-0 w-auto align-center"
        />
      </h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-2">
          <Sequencer recordedSamples={recordedSamples} />
        </div>
        <div className="synth-panel p-4">
          <h2 className=" font-bold mb-4 text-3xl text-slate-50">音声録音</h2>
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            audioContext={audioContext}
          />

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2 text-slate-50">
              録音済みサウンド
            </h3>
            <ul className="space-y-2">
              {recordedSamples.map((sample) => (
                <li
                  key={sample.id}
                  className="flex items-center justify-between"
                >
                  <button
                    className="text-primary hover:text-primary-foreground transition-colors text-white"
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
              <h3 className="text-xl font-semibold mb-2 tracking-wide ">
                RECORD SOUND EDITOR
              </h3>
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
