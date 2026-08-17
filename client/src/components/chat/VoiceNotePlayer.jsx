import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

const WAVEFORM_BARS = [40, 65, 80, 45, 90, 70, 30, 85, 95, 60, 40, 75, 85, 50, 65, 90, 45, 35, 70, 80, 60, 40];

export function VoiceNotePlayer({ audioUrl, duration = 0, isOutgoing = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play failed:', err);
      });
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIndex];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const totalDuration = duration || audio.duration || 1;
    const clickX = e.nativeEvent.offsetX;
    const width = e.currentTarget.offsetWidth;
    const newTime = (clickX / width) * totalDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const total = duration || (audioRef.current?.duration || 0);
  const progressRatio = total > 0 ? Math.min(1, currentTime / total) : 0;

  return (
    <div className="flex items-center gap-3 py-1 min-w-[200px] sm:min-w-[240px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 outline-none ${
          isOutgoing
            ? 'bg-white text-brand-600 hover:bg-slate-100'
            : 'bg-brand-600 text-white hover:bg-brand-500'
        }`}
        title={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform Visualizer */}
      <div className="flex-1 flex flex-col gap-1">
        <div
          onClick={handleSeek}
          className="h-6 flex items-center gap-[2.5px] cursor-pointer py-1 group"
        >
          {WAVEFORM_BARS.map((heightPercent, index) => {
            const barRatio = (index + 1) / WAVEFORM_BARS.length;
            const isPlayed = barRatio <= progressRatio;

            return (
              <span
                key={index}
                style={{ height: `${Math.max(15, heightPercent)}%` }}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isPlayed
                    ? isOutgoing
                      ? 'bg-white'
                      : 'bg-brand-500'
                    : isOutgoing
                    ? 'bg-white/40 group-hover:bg-white/60'
                    : 'bg-slate-600 group-hover:bg-slate-500'
                }`}
              />
            );
          })}
        </div>

        {/* Time & Speed metadata */}
        <div className="flex items-center justify-between text-[11px] opacity-80">
          <span>{formatTime(currentTime > 0 ? currentTime : total)}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className={`px-1.5 py-0.2 rounded-md font-bold text-[10px] uppercase transition-colors ${
              isOutgoing
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300'
            }`}
            title="Change playback speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceNotePlayer;
