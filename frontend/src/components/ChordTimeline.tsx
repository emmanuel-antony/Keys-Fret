import React, { useEffect, useRef } from 'react';
import type { TranslatedChord } from '../types';

interface ChordTimelineProps {
  chords: TranslatedChord[];
  activeChord: TranslatedChord | null;
}

const formatTime = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const ChordTimeline = React.memo(function ChordTimeline({ chords, activeChord }: ChordTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active card into center view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const card = activeRef.current;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const containerHalf = container.offsetWidth / 2;
      container.scrollTo({ left: cardCenter - containerHalf, behavior: 'smooth' });
    }
  }, [activeChord]);

  if (chords.length === 0) return null;

  return (
    <div id="chord-timeline" className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
          Chord Timeline
        </h3>
        <span className="text-xs text-gray-600 font-mono">{chords.length} chords</span>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {chords.map((chord, i) => {
          const isActive = activeChord?.time === chord.time && activeChord?.raw_chord === chord.raw_chord;
          const isPast = activeChord ? chord.time < activeChord.time : false;

          return (
            <div
              key={`${chord.time}-${i}`}
              ref={isActive ? activeRef : null}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all duration-300 cursor-default select-none min-w-[80px] ${
                isActive
                  ? 'border-indigo-500/80 bg-indigo-500/20 shadow-lg shadow-indigo-500/20 scale-105'
                  : isPast
                  ? 'border-white/5 bg-white/3 opacity-50'
                  : 'border-white/8 bg-white/4 hover:border-indigo-500/30 hover:bg-indigo-500/5'
              }`}
            >
              {/* Timestamp */}
              <span className={`text-[10px] font-mono transition-colors ${isActive ? 'text-indigo-300' : 'text-gray-600'}`}>
                {formatTime(chord.time)}
              </span>

              {/* Chord name */}
              <span className={`text-lg font-black transition-colors leading-none ${
                isActive ? 'text-white' : isPast ? 'text-gray-600' : 'text-gray-300'
              }`}>
                {chord.easy_chord}
              </span>

              {/* Raw chord */}
              <span className={`text-[9px] font-mono transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-700'}`}>
                {chord.raw_chord}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
