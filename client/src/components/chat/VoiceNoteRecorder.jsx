import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, Mic } from 'lucide-react';
import { audioRecorder } from '../../services/audioRecorder.js';

export function VoiceNoteRecorder({ onSendVoiceNote, onCancel }) {
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [amplitude, setAmplitude] = useState(0.3);
  const animFrameRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    audioRecorder.startRecording((sec) => {
      if (isMounted) setRecordingSeconds(sec);
    }).catch((err) => {
      console.error('Microphone recording error:', err);
      if (onCancel) onCancel();
    });

    const updateWave = () => {
      if (isMounted) {
        setAmplitude(audioRecorder.getLiveAmplitude());
        animFrameRef.current = requestAnimationFrame(updateWave);
      }
    };
    animFrameRef.current = requestAnimationFrame(updateWave);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleStopAndSend = async () => {
    try {
      const result = await audioRecorder.stopRecording();
      onSendVoiceNote(result.dataUrl, result.duration, result.mimeType);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      if (onCancel) onCancel();
    }
  };

  const handleCancel = () => {
    audioRecorder.cancelRecording();
    if (onCancel) onCancel();
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-chat-panel border border-brand-500/50 rounded-2xl px-4 py-2 w-full animate-slide-up shadow-lg shadow-brand-500/10">
      {/* Recording Pulse & Timer */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute" />
          <span className="w-3 h-3 rounded-full bg-rose-500 relative" />
        </div>
        <span className="text-sm font-bold text-white tracking-wider">
          {formatTimer(recordingSeconds)}
        </span>
      </div>

      {/* Live Audio Amplitude Visualizer */}
      <div className="flex-1 flex items-center justify-center gap-1 max-w-xs px-2">
        {[...Array(16)].map((_, i) => {
          const height = Math.max(15, Math.min(100, amplitude * 120 * (0.6 + 0.4 * Math.sin(i + recordingSeconds * 4))));
          return (
            <span
              key={i}
              style={{ height: `${height}%` }}
              className="w-1 bg-brand-400 rounded-full transition-all duration-75"
            />
          );
        })}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Cancel / Trash */}
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 rounded-xl text-chat-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Cancel recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Send Voice Note */}
        <button
          type="button"
          onClick={handleStopAndSend}
          className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md transition-transform active:scale-95"
          title="Send voice note"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default VoiceNoteRecorder;
