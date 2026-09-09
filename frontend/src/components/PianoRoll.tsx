import { useState, useEffect } from 'react';

interface PianoRollProps {
  keys: string;       // e.g. "C-E-G"
  chordName?: string; // for animation trigger key
}

// One octave keyboard layout (C to B)
const KEYBOARD = [
  { note: 'C',  isBlack: false, whiteIndex: 0 },
  { note: 'C#', isBlack: true,  whiteIndex: 0 },
  { note: 'D',  isBlack: false, whiteIndex: 1 },
  { note: 'D#', isBlack: true,  whiteIndex: 1 },
  { note: 'E',  isBlack: false, whiteIndex: 2 },
  { note: 'F',  isBlack: false, whiteIndex: 3 },
  { note: 'F#', isBlack: true,  whiteIndex: 3 },
  { note: 'G',  isBlack: false, whiteIndex: 4 },
  { note: 'G#', isBlack: true,  whiteIndex: 4 },
  { note: 'A',  isBlack: false, whiteIndex: 5 },
  { note: 'A#', isBlack: true,  whiteIndex: 5 },
  { note: 'B',  isBlack: false, whiteIndex: 6 },
];

const WHITE_KEYS = KEYBOARD.filter(k => !k.isBlack);
const WHITE_KEY_WIDTH = 36; // px
const BLACK_KEY_WIDTH = 22; // px

export function PianoRoll({ keys, chordName }: PianoRollProps) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [chordName]);

  const activeNotes = keys && keys !== 'Unknown' && keys !== 'N/A'
    ? keys.split('-').map(n => n.trim())
    : [];

  const totalWidth = WHITE_KEYS.length * WHITE_KEY_WIDTH;

  return (
    <div id="piano-roll" className="glass-panel flex flex-col items-center gap-5">
      <div className="flex items-center justify-between w-full">
        <h3 className="text-lg font-semibold text-indigo-300">Piano Roll</h3>
        {chordName && (
          <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-lg">{chordName}</span>
        )}
      </div>

      {/* Keyboard */}
      <div
        className="relative rounded-b-xl overflow-hidden shadow-2xl"
        style={{ width: `${totalWidth + 4}px`, height: '120px', background: '#000' }}
      >
        {/* White keys */}
        {WHITE_KEYS.map((key, wIdx) => {
          const isActive = activeNotes.includes(key.note);
          return (
            <div
              key={key.note}
              title={key.note}
              className={`absolute top-0 bottom-0 rounded-b-lg border transition-all duration-200 ease-in-out ${
                isActive
                  ? 'bg-indigo-300 border-indigo-400 z-10'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
              }`}
              style={{
                left: `${wIdx * WHITE_KEY_WIDTH + 2}px`,
                width: `${WHITE_KEY_WIDTH - 2}px`,
                boxShadow: isActive
                  ? '0 0 16px rgba(99,102,241,0.9), 0 0 32px rgba(99,102,241,0.4), inset 0 -4px 8px rgba(0,0,0,0.2)'
                  : '0 4px 8px rgba(0,0,0,0.3)',
              }}
            >
              {/* Note label */}
              <div
                className={`absolute bottom-2 w-full text-center text-[10px] font-bold transition-colors ${
                  isActive ? 'text-indigo-700' : 'text-gray-400'
                }`}
              >
                {key.note}
              </div>

              {/* Active glow indicator */}
              {isActive && (
                <div
                  key={`glow-w-${key.note}-${animKey}`}
                  className="absolute inset-0 rounded-b-lg animate-glow-pulse"
                  style={{ background: 'rgba(99,102,241,0.3)' }}
                />
              )}
            </div>
          );
        })}

        {/* Black keys — rendered on top */}
        {KEYBOARD.filter(k => k.isBlack).map(key => {
          const isActive = activeNotes.includes(key.note);
          // Position: after the white key at whiteIndex
          const xPos = (key.whiteIndex + 1) * WHITE_KEY_WIDTH + 2 - BLACK_KEY_WIDTH / 2;

          return (
            <div
              key={key.note}
              title={key.note}
              className={`absolute top-0 z-20 rounded-b-md border transition-all duration-200 ease-in-out ${
                isActive
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-gray-800 bg-gray-900 hover:bg-gray-700'
              }`}
              style={{
                left: `${xPos}px`,
                width: `${BLACK_KEY_WIDTH}px`,
                height: '70px',
                boxShadow: isActive
                  ? '0 0 20px rgba(99,102,241,1), 0 0 40px rgba(99,102,241,0.5)'
                  : '2px 4px 8px rgba(0,0,0,0.7)',
              }}
            >
              {/* Active glow */}
              {isActive && (
                <div
                  key={`glow-b-${key.note}-${animKey}`}
                  className="absolute inset-0 rounded-b-md animate-glow-pulse"
                  style={{ background: 'rgba(129,140,248,0.4)' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Notes label */}
      <div className="font-mono text-xl text-white tracking-widest bg-black/40 px-5 py-2 rounded-xl border border-white/5">
        {keys || '—'}
      </div>
    </div>
  );
}
