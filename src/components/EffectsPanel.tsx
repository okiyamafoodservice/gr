"use client";
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// エフェクトの種類
export type EffectType = "none" | "delay" | "distortion" | "flanger";

// エフェクトごとのパラメータの型を定義
export type EffectParameters =
  | { delayTime: number }
  | { amount: number }
  | { depth: number; rate: number }
  | Record<string, never>; // 空のオブジェクト型の代替

// Props の型定義
interface EffectsPanelProps {
  onEffectChange: (effect: EffectType, parameters: EffectParameters) => void;
}

export function EffectsPanel({ onEffectChange }: EffectsPanelProps) {
  const [effect, setEffect] = useState<EffectType>("none");
  const [delayTime, setDelayTime] = useState(0.5);
  const [distortionAmount, setDistortionAmount] = useState(50);
  const [flangerDepth, setFlangerDepth] = useState(0.002);
  const [flangerRate, setFlangerRate] = useState(0.25);

  useEffect(() => {
    const parameters: EffectParameters =
      effect === "delay"
        ? { delayTime }
        : effect === "distortion"
        ? { amount: distortionAmount }
        : effect === "flanger"
        ? { depth: flangerDepth, rate: flangerRate }
        : ({} as Record<string, never>);
    onEffectChange(effect, parameters);
  }, [
    effect,
    delayTime,
    distortionAmount,
    flangerDepth,
    flangerRate,
    onEffectChange,
  ]);

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">エフェクト設定</h3>
      <div className="mb-4">
        <Select
          value={effect}
          onValueChange={(val) => setEffect(val as EffectType)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="エフェクト選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">なし</SelectItem>
            <SelectItem value="delay">ディレイ</SelectItem>
            <SelectItem value="distortion">ディストーション</SelectItem>
            <SelectItem value="flanger">フランジャー</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {effect === "delay" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            ディレイタイム: {delayTime.toFixed(2)}秒
          </label>
          <Slider
            min={0.1}
            max={1}
            step={0.1}
            value={[delayTime]}
            onValueChange={([val]) => setDelayTime(val)}
            className="w-32"
          />
        </div>
      )}
      {effect === "distortion" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            ディストーション量: {distortionAmount}
          </label>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[distortionAmount]}
            onValueChange={([val]) => setDistortionAmount(val)}
            className="w-32"
          />
        </div>
      )}
      {effect === "flanger" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              フランジャー深度: {flangerDepth.toFixed(3)}
            </label>
            <Slider
              min={0.001}
              max={0.01}
              step={0.001}
              value={[flangerDepth]}
              onValueChange={([val]) => setFlangerDepth(val)}
              className="w-32"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              フランジャー速度: {flangerRate.toFixed(2)} Hz
            </label>
            <Slider
              min={0.1}
              max={1}
              step={0.05}
              value={[flangerRate]}
              onValueChange={([val]) => setFlangerRate(val)}
              className="w-32"
            />
          </div>
        </>
      )}
    </div>
  );
}
