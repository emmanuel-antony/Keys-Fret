import type { TranslatedChord } from '../types';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getNoteIndex(note: string): number {
  return NOTES.findIndex(n => n === note || n === getEnharmonic(note));
}

export function getEnharmonic(note: string): string {
  const enharmonics: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  };
  return enharmonics[note] || note;
}

export function transposeNote(note: string, semitones: number): string {
  if (!note || note === 'N/A') return note;
  
  // Extract base note and accidental
  const match = note.match(/([A-G][b#]?)/);
  if (!match) return note;
  
  let baseNote = match[1];
  baseNote = getEnharmonic(baseNote);
  
  const index = getNoteIndex(baseNote);
  if (index === -1) return note;

  const newIndex = (index + semitones + 120) % 12; // +120 to handle negative semitones safely
  const newBaseNote = NOTES[newIndex];
  
  return note.replace(match[1], newBaseNote);
}

export function transposeChord(chordName: string, semitones: number): string {
  if (!chordName || chordName === 'N/A' || chordName === '—') return chordName;
  return transposeNote(chordName, semitones);
}

export function transposePianoKeys(keys: string, semitones: number): string {
  if (!keys || keys === 'N/A') return keys;
  // keys are usually format "C-E-G"
  const noteArray = keys.split('-');
  return noteArray.map(n => transposeNote(n, semitones)).join('-');
}

export function transposeGuitarTab(tab: string, semitones: number): string {
  if (!tab || tab === 'N/A' || semitones === 0) return tab;
  
  // Tab format: "X32010", "133211", etc.
  let newTab = "";
  for (let i = 0; i < tab.length; i++) {
    const char = tab[i];
    if (char === 'X' || char === 'x' || char === '-') {
      newTab += char;
    } else {
      const fret = parseInt(char, 10);
      if (!isNaN(fret)) {
        let newFret = fret + semitones;
        // If fret goes below 0 or above 14, just fallback to suggesting Capo
        if (newFret < 0 || newFret > 14) {
           return 'N/A (Use Capo)';
        }
        // Since tab string is single characters, if fret > 9 it breaks standard 6-char format.
        // We can just represent it in hex-like or brackets if needed, but for typical transpositions 
        // it might be fine or we use a bracket: "[10]". To keep it simple, if > 9 we can use brackets.
        if (newFret > 9) {
          newTab += `[${newFret}]`;
        } else {
          newTab += newFret.toString();
        }
      } else {
        newTab += char;
      }
    }
  }
  return newTab;
}

export function transposeTranslatedChord(chord: TranslatedChord, semitones: number): TranslatedChord {
  return {
    ...chord,
    easy_chord: transposeChord(chord.easy_chord, semitones),
    piano_keys: transposePianoKeys(chord.piano_keys, semitones),
    guitar_tab: transposeGuitarTab(chord.guitar_tab, semitones)
  };
}

export function getCapoSuggestion(key: string): { fret: number, easyShapes: string } | null {
  const match = key.match(/([A-G][b#]?)/);
  if (!match) return null;
  
  const baseNote = getEnharmonic(match[1]);
  // We don't strictly need the mode since capo suggestions in this app are based on the base note
  // But let's just match the baseNote.
  const normalizedKey = baseNote;
  
  const map: Record<string, { fret: number, easyShapes: string }> = {
    'C#': { fret: 1, easyShapes: 'C Major' },
    'D#': { fret: 1, easyShapes: 'D Major or C Major' }, // user mentioned 1 or 3, we'll pick 1
    'F#': { fret: 2, easyShapes: 'E Major' },
    'G#': { fret: 1, easyShapes: 'G Major or E Major' },
    'A#': { fret: 1, easyShapes: 'A Major or G Major' },
    'B': { fret: 2, easyShapes: 'A Major' }
  };

  return map[normalizedKey] || null;
}

export function calculateMagicKeyShift(currentKey: string): number {
  const match = currentKey.match(/([A-G][b#]?)/);
  if (!match) return 0;
  
  const baseNote = getEnharmonic(match[1]);
  const normalizedKey = baseNote;
  
  // Easiest keys to play in: C, G, D, A, E
  const easyKeys = ['C', 'G', 'D', 'A', 'E'];
  if (easyKeys.includes(normalizedKey)) return 0;
  
  const currentIndex = getNoteIndex(normalizedKey);
  if (currentIndex === -1) return 0;
  
  // Find the smallest shift to an easy key
  let minShift = 0;
  let minAbsShift = 12;
  
  for (const easy of easyKeys) {
    const easyIndex = getNoteIndex(easy);
    let shift = easyIndex - currentIndex;
    
    // Normalize shift to be between -6 and +5
    if (shift > 5) shift -= 12;
    if (shift < -6) shift += 12;
    
    if (Math.abs(shift) < minAbsShift) {
      minAbsShift = Math.abs(shift);
      minShift = shift;
    }
  }
  
  return minShift;
}
