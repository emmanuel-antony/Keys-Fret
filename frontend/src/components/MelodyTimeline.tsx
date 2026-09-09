import React, { useEffect, useRef } from 'react';
import type { LeadNote } from '../types';

interface MelodyTimelineProps {
  leadNotes: LeadNote[];
  activeLeadNote: LeadNote | null;
}

const formatTime = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const MelodyTimeline = React.memo(function MelodyTimeline({ leadNotes, activeLeadNote }: MelodyTimelineProps) {
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
  }, [activeLeadNote]);

  if (leadNotes.length === 0) return null;

  return (
    <div id="melody-timeline" className="glass-card mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-pink-400 uppercase tracking-widest">
          Melody Timeline
        </h3>
        <span className="text-xs text-gray-600 font-mono">{leadNotes.length} notes</span>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-3 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {leadNotes.map((leadNote, i) => {
          const isActive = activeLeadNote?.time === leadNote.time && activeLeadNote?.note === leadNote.note;
          const isPast = activeLeadNote ? leadNote.time < activeLeadNote.time : false;

          return (
            <div
              key={`${leadNote.time}-${i}`}
              ref={isActive ? activeRef : null}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-300 cursor-default select-none min-w-[60px] ${
                isActive
                  ? 'border-pink-500/80 bg-pink-500/20 shadow-lg shadow-pink-500/20 scale-105'
                  : isPast
                  ? 'border-white/5 bg-white/3 opacity-50'
                  : 'border-white/8 bg-white/4 hover:border-pink-500/30 hover:bg-pink-500/5'
              }`}
            >
              {/* Timestamp */}
              <span className={`text-[9px] font-mono transition-colors ${isActive ? 'text-pink-300' : 'text-gray-600'}`}>
                {formatTime(leadNote.time)}
              </span>

              {/* Note name */}
              <span className={`text-base font-black transition-colors leading-none mt-1 ${
                isActive ? 'text-white' : isPast ? 'text-gray-600' : 'text-gray-300'
              }`}>
                {leadNote.note}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-pink-400 animate-pulse mt-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
