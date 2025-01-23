import type React from "react";
import { useRef, useEffect, useState } from "react";

interface WaveformDisplayProps {
  buffer: AudioBuffer;
  width: number;
  height: number;
  startTime: number;
  endTime: number;
  onTimeRangeChange: (startTime: number, endTime: number) => void;
}

export function WaveformDisplay({
  buffer,
  width,
  height,
  startTime,
  endTime,
  onTimeRangeChange,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = "#5e5e5e";
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(0, amp);

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.lineTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }

    ctx.strokeStyle = "#0bfc03";
    ctx.stroke();

    // Draw start and end markers
    const startX = (startTime / buffer.duration) * width;
    const endX = (endTime / buffer.duration) * width;

    ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
    ctx.fillRect(startX, 0, endX - startX, height);

    ctx.fillStyle = "#eb4034";
    ctx.fillRect(startX - 2, 0, 4, height);
    ctx.fillRect(endX - 2, 0, 4, height);
  }, [buffer, width, height, startTime, endTime]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartX(e.nativeEvent.offsetX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentX = e.nativeEvent.offsetX;
    const timeDiff = ((currentX - dragStartX) / width) * buffer.duration;

    let newStartTime = startTime + timeDiff;
    let newEndTime = endTime + timeDiff;

    if (newStartTime < 0) {
      newEndTime -= newStartTime;
      newStartTime = 0;
    }

    if (newEndTime > buffer.duration) {
      newStartTime -= newEndTime - buffer.duration;
      newEndTime = buffer.duration;
    }

    onTimeRangeChange(newStartTime, newEndTime);
    setDragStartX(currentX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="cursor-grab active:cursor-grabbing"
    />
  );
}
