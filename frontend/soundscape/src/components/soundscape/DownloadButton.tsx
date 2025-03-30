import React, { useState } from 'react';
import Button from '../common/Button';

interface DownloadButtonProps {
  audioUrl: string;
  description: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ audioUrl, description }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a sanitized filename from the description
  const createFilename = (text: string): string => {
    // Replace spaces with underscores and remove special characters
    const sanitized = text
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]/g, '')
      .substring(0, 50); // Limit length
    
    return `soundscape_${sanitized}.mp3`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    
    try {
      // Create an audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Fetch the audio file
      const response = await fetch(audioUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      // Get the audio data
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create an offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Create a source node
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create a gain node for volume normalization
      const gainNode = offlineContext.createGain();
      
      // Connect the nodes
      source.connect(gainNode);
      gainNode.connect(offlineContext.destination);
      
      // Start the source
      source.start();
      
      // Render the audio
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert to WAV format
      const wavData = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = createFilename(description);
      
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Close the audio context
      await audioContext.close();
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download audio');
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper function to convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const wav = new ArrayBuffer(44 + buffer.length * blockAlign);
    const view = new DataView(wav);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * blockAlign, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * blockAlign, true);
    
    // Write audio data
    const offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset + (i * blockAlign) + (channel * bytesPerSample), sample * 0x7FFF, true);
      }
    }
    
    return wav;
  };

  // Helper function to write strings to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return (
    <div className="download-container">
      <Button
        variant="ghost"
        className="download-button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label="Download audio file"
        title="Download audio file"
      >
        {isDownloading ? (
          <svg className="spinner" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              className="path"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            ></circle>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
          </svg>
        )}
      </Button>
      
      {error && (
        <div className="download-error" aria-live="assertive">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default DownloadButton;