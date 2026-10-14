import { useEffect, useRef } from "react";

// Live audio waveform driven by the mic AnalyserNode. Falls back to a gentle
// idle shimmer when there's no analyser (not connected yet).
export function Waveform({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      // follow the active theme's foreground colour (set via CSS var on the canvas)
      const fg = getComputedStyle(canvas).color || "rgba(245,245,247,0.85)";
      const bars = 40;
      const gap = 3;
      const bw = (width - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        let v: number;
        if (analyser && data) {
          analyser.getByteFrequencyData(data);
          const idx = Math.floor((i / bars) * data.length);
          v = data[idx] / 255;
        } else {
          v = 0.12 + 0.1 * Math.abs(Math.sin(Date.now() / 400 + i));
        }
        const h = Math.max(3, v * height);
        ctx.fillStyle = fg;
        const x = i * (bw + gap);
        const y = (height - h) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, h, bw / 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={72}
      className="w-full text-[var(--fg)]"
    />
  );
}
