import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

const WAVEFORM_BARS = [30, 50, 80, 45, 95, 70, 40, 85, 90, 60, 40, 75, 85, 55, 65, 90, 50, 35, 70, 80, 60, 40, 30, 50];

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
    <div className="flex items-center gap-3 py-1 min-w-[240px] sm:min-w-[280px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* WhatsApp Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008069] text-white flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 outline-none"
        title={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>

      {/* Waveform Scrubber & Metadata */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div
          onClick={handleSeek}
          className="h-7 flex items-center gap-[2.5px] cursor-pointer py-1 group"
        >
          {WAVEFORM_BARS.map((heightPercent, index) => {
            const barRatio = (index + 1) / WAVEFORM_BARS.length;
            const isPlayed = barRatio <= progressRatio;

            return (
              <span
                key={index}
                style={{ height: `${Math.max(20, heightPercent)}%` }}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isPlayed
                    ? 'bg-[#00a884]'
                    : isOutgoing
                    ? 'bg-white/40 group-hover:bg-white/60'
                    : 'bg-[#8696a0] group-hover:bg-[#aebac1]'
                }`}
              />
            );
          })}
        </div>

        {/* WhatsApp Duration & Speed button */}
        <div className="flex items-center justify-between text-[11px] text-[#8696a0]">
          <span className="flex items-center gap-1 font-mono">
            <Mic className="w-3 h-3 text-[#00a884]" />
            {formatTime(currentTime > 0 ? currentTime : total)}
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-1.5 py-0.5 rounded bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] font-bold text-[10px] uppercase border border-[#2a3942] transition-colors"
            title="Playback speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceNotePlayer;
