import React, { useEffect, useRef } from 'react';

interface AudioInputVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

const AudioInputVisualizer: React.FC<AudioInputVisualizerProps> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isActive) return;

      // Calculate volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      // Draw simplified waveform/bars
      const bars = 5;
      const gap = 2;
      const barWidth = (canvas.width - (gap * (bars - 1))) / bars;

      ctx.fillStyle = '#6366f1'; // Indigo 500

      for (let i = 0; i < bars; i++) {
        // Mock different heights based on average volume + some noise
        const noise = Math.random() * 0.5 + 0.5;
        const height = Math.min(canvas.height, (average / 255) * canvas.height * 1.5 * noise);
        
        // Center vertically
        const y = (canvas.height - height) / 2;
        
        // Gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + height);
        gradient.addColorStop(0, '#818cf8'); // Indigo 400
        gradient.addColorStop(1, '#4338ca'); // Indigo 700
        ctx.fillStyle = gradient;
        
        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(i * (barWidth + gap), y, barWidth, height, 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analyser, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={40} 
      height={24} 
      className="opacity-80"
    />
  );
};

export default AudioInputVisualizer;
