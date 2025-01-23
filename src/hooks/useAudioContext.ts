import { useState, useEffect } from "react";

// window オブジェクトの型を拡張
interface WindowWithWebkitAudioContext extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export function useAudioContext() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // 型アサーションを使用して、拡張したwindowオブジェクトを参照
    const windowWithAudio = window as unknown as WindowWithWebkitAudioContext;
    const AudioContextClass =
      windowWithAudio.AudioContext || windowWithAudio.webkitAudioContext;

    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      setAudioContext(ctx);

      return () => {
        ctx.close();
      };
    } else {
      console.error("AudioContext is not supported in this browser");
    }
  }, []);

  return audioContext;
}
