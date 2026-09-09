import { useCallback, type RefObject } from 'react';
import type { TranslatedChord } from '../types';

interface AudioTimelineProps {
  currentTime: number;
  duration: number;
  chords: TranslatedChord[];
  audioRef: RefObject<HTMLAudioElement | null>;
}

export function AudioTimeline({ currentTime, duration, chords, audioRef }: AudioTimelineProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Click-to-seek
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
  }, [audioRef, duration]);

  return (
    <div id="audio-timeline" className="glass-panel w-full space-y-2.5">
      {/* Time labels */}
      <div className="flex justify-between text-xs text-indigo-300 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span className="text-gray-600">{duration > 0 ? formatTime(duration) : '--:--'}</span>
      </div>

      {/* Scrubber bar */}
      <div
        role="slider"
        aria-label="Audio seek bar"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
        className="relative h-2 bg-white/8 rounded-full overflow-hidden cursor-pointer group"
        onClick={handleSeek}
      >
        {/* Chord tick marks */}
        {duration > 0 && chords.map((chord, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-indigo-400/30 group-hover:bg-indigo-400/60 transition-colors"
            style={{ left: `${(chord.time / duration) * 100}%` }}
            title={chord.easy_chord}
          />
        ))}

        {/* Fill bar */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-none"
          style={{ width: `${progress}%` }}
        />

        {/* Playhead dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-indigo-500/50 transition-none pointer-events-none opacity-0 group-hover:opacity-100"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>
    </div>
  );
}
