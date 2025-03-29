import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioRef, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Set up the audio analyzer
  useEffect(() => {
    if (!audioRef.current) return;

    // Create audio context and analyzer if they don't exist yet
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioRef]);

  // Start/stop visualization based on play state
  useEffect(() => {
    if (isPlaying) {
      startVisualization();
    } else {
      stopVisualization();
    }

    return () => {
      stopVisualization();
    };
  }, [isPlaying]);

  // Start the visualization
  const startVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Make sure canvas dimensions match its display size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(21, 26, 42, 0.2)'; // Dark blue with transparency
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        // Create a gradient from blue to purple based on frequency
        const hue = 240 - (i / bufferLength) * 60; // From blue (240) to purple (280)
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  // Stop the visualization
  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      
      // Clear the canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw a simple static visualization
          drawStaticVisualization();
        }
      }
    }
  };

  // Draw a static visualization when audio is paused
  const drawStaticVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const barCount = 32;
    const barWidth = (width / barCount) * 2.5;
    let x = 0;
    
    for (let i = 0; i < barCount; i++) {
      // Generate a random static bar height, but make it look like a pattern
      const barHeight = Math.sin(i * 0.2) * (height * 0.2) + (height * 0.1);
      
      // Use a consistent color scheme
      const hue = 240 - (i / barCount) * 60;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };

  // Draw the initial static visualization on component mount
  useEffect(() => {
    drawStaticVisualization();
  }, []);

  return (
    <div className="audio-visualizer">
      <canvas 
        ref={canvasRef} 
        className="visualizer-canvas" 
        aria-hidden="true"
      />
    </div>
  );
};

export default AudioVisualizer;