import React, { useState, useEffect, useCallback } from "react";

interface KnobProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
  label?: string;
}

export function Knob({
  min,
  max,
  value,
  onChange,
  size = 60,
  color = "#3b82f6",
  label,
}: KnobProps) {
  const [angle, setAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isDragging) {
        const knobRect = (event.target as HTMLElement).getBoundingClientRect();
        const knobCenter = {
          x: knobRect.left + knobRect.width / 2,
          y: knobRect.top + knobRect.height / 2,
        };
        const mousePosition = { x: event.clientX, y: event.clientY };
        const angle = Math.atan2(
          mousePosition.y - knobCenter.y,
          mousePosition.x - knobCenter.x
        );
        const degree = ((angle + Math.PI) / (2 * Math.PI)) * 360;
        const newValue =
          Math.round(((degree / 360) * (max - min) + min) * 100) / 100;
        onChange(Math.max(min, Math.min(max, newValue)));
      }
    },
    [isDragging, min, max, onChange]
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const angleRange = 270;
    const valueRange = max - min;
    const anglePerUnit = angleRange / valueRange;
    const newAngle = (value - min) * anglePerUnit - 135;
    setAngle(newAngle);
  }, [value, min, max]);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        style={{ cursor: "pointer" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="none"
          stroke="#4a4a4a"
          strokeWidth="2"
        />
        <line
          x1={size / 2}
          y1={size / 2}
          x2={size / 2 + (size / 3) * Math.cos((angle * Math.PI) / 180)}
          y2={size / 2 + (size / 3) * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <div className="mt-2 text-xs text-center text-red-700">
          {label}: {value.toFixed(2)}
        </div>
      )}
    </div>
  );
}
