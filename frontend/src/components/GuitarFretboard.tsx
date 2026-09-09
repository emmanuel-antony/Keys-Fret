import { useState, useEffect } from 'react';

interface GuitarFretboardProps {
  tab: string;       // e.g. "X32010"
  chordName?: string; // for animation trigger key
}

export function GuitarFretboard({ tab, chordName }: GuitarFretboardProps) {
  const [animKey, setAnimKey] = useState(0);

  // Trigger glow animation on chord change
  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [chordName]);

  const STRINGS = 6;
  const FRETS = 5;

  /**
   * Parses a tab string like "X32010" or "X-3-2-0-1-0" into an array of 6 fret numbers (or null for X).
   * Supports multi-digit frets (e.g., "X-10-9-0-8-0").
   */
  const parseTab = (t: string): (number | null)[] => {
    if (!t || t === 'Unknown' || t === 'N/A') return Array(6).fill(null);

    // Normalize: if it contains hyphens, split by dash; otherwise split by char
    let parts: string[];
    if (t.includes('-')) {
      parts = t.split('-');
    } else {
      parts = t.split('');
    }

    // Pad or trim to 6 strings
    while (parts.length < 6) parts.push('0');
    parts = parts.slice(0, 6);

    return parts.map(p => {
      if (p.toUpperCase() === 'X') return null;
      const n = parseInt(p, 10);
      return isNaN(n) ? null : n;
    });
  };

  const fingering = parseTab(tab);
  const maxFret = Math.max(0, ...fingering.filter((f): f is number => f !== null && f > 0));
  // Shift fret window to show relevant frets
  const fretOffset = maxFret > FRETS ? maxFret - FRETS : 0;

  return (
    <div id="guitar-fretboard" className="glass-panel flex flex-col items-center gap-5">
      <div className="flex items-center justify-between w-full">
        <h3 className="text-lg font-semibold text-indigo-300">Guitar Fretboard</h3>
        {chordName && (
          <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-lg">{chordName}</span>
        )}
      </div>

      {/* Fretboard */}
      <div
        className="relative rounded-lg overflow-hidden shadow-2xl"
        style={{ width: '280px', height: '180px', background: 'linear-gradient(180deg, #1a1008 0%, #100c06 100%)' }}
      >
        {/* Nut (left border) */}
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-gray-300 to-gray-400 shadow-md z-20" />

        {/* Fret position markers (dots on fret 3,5 for context) */}
        {[3].map(dot => (
          <div
            key={dot}
            className="absolute w-3 h-3 rounded-full bg-white/10 z-10"
            style={{
              left: `${(dot - 0.5 - fretOffset) * (260 / FRETS) + 20}px`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Fret wires */}
        {Array.from({ length: FRETS }).map((_, i) => (
          <div
            key={`fret-${i}`}
            className="absolute top-0 bottom-0 z-10"
            style={{
              left: `${20 + (i + 1) * (260 / FRETS)}px`,
              width: '2px',
              background: 'linear-gradient(180deg, #888 0%, #555 100%)',
            }}
          />
        ))}

        {/* Strings + Fingering Dots */}
        {Array.from({ length: STRINGS }).map((_, i) => {
          const stringThickness = 1.5 + (STRINGS - i) * 0.5;
          const yPos = 16 + i * ((180 - 32) / (STRINGS - 1));
          const fret = fingering[i];

          return (
            <div key={`string-${i}`}>
              {/* String wire */}
              <div
                className="absolute left-3 right-0 z-5"
                style={{
                  top: `${yPos}px`,
                  height: `${stringThickness}px`,
                  background: `linear-gradient(90deg, #aaa 0%, #ddd 40%, #aaa 100%)`,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              />

              {/* Muted X label */}
              {fret === null && (
                <div
                  className="absolute z-30 text-red-400 text-xs font-bold"
                  style={{ left: '2px', top: `${yPos - 7}px` }}
                >
                  ✕
                </div>
              )}

              {/* Open string circle */}
              {fret === 0 && (
                <div
                  className="absolute z-30 w-4 h-4 rounded-full border-2 border-indigo-400 bg-transparent"
                  style={{ left: '-2px', top: `${yPos - 8}px` }}
                />
              )}

              {/* Fretted dot */}
              {fret !== null && fret > 0 && (
                <div
                  key={`dot-${i}-${animKey}`}
                  className="absolute z-30 w-5 h-5 rounded-full shadow-lg animate-pop-in"
                  style={{
                    left: `${20 + (fret - fretOffset - 0.5) * (260 / FRETS) - 10}px`,
                    top: `${yPos - 10}px`,
                    background: 'radial-gradient(circle at 35% 35%, #818cf8, #4f46e5)',
                    boxShadow: '0 0 10px rgba(99,102,241,0.8), 0 2px 6px rgba(0,0,0,0.5)',
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Fret numbers */}
        {Array.from({ length: FRETS }).map((_, i) => (
          <div
            key={`fnum-${i}`}
            className="absolute bottom-0 text-[9px] text-gray-600 font-mono z-20"
            style={{ left: `${20 + (i + 0.5) * (260 / FRETS) - 4}px`, bottom: '2px' }}
          >
            {i + 1 + fretOffset}
          </div>
        ))}
      </div>

      {/* Tab text */}
      <div className="font-mono text-xl text-white tracking-[0.3em] bg-black/40 px-5 py-2 rounded-xl border border-white/5">
        {tab}
      </div>
    </div>
  );
}
