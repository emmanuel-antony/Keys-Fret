import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';
import type { TranslatedChord, LeadNote } from '../types';

interface UseAudioSyncProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  chords: TranslatedChord[];
  leadNotes?: LeadNote[];
}

/**
 * Binary search for the last chord whose time <= currentTime.
 * O(log n) — efficient even for long songs with hundreds of chords.
 */
function findActiveChord(chords: TranslatedChord[], time: number): TranslatedChord | null {
  if (!chords || chords.length === 0) return null;

  let lo = 0;
  let hi = chords.length - 1;
  let result = chords[0];

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (chords[mid].time <= time) {
      result = chords[mid];
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}

function findActiveLeadNote(notes: LeadNote[], time: number): LeadNote | null {
  if (!notes || notes.length === 0) return null;

  let lo = 0;
  let hi = notes.length - 1;
  let result = null;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (notes[mid].time <= time) {
      result = notes[mid];
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  // If the active lead note is more than 0.2s old, it means the singer stopped singing (since we sample every 0.1s).
  if (result && time - result.time > 0.2) {
      return null;
  }

  return result;
}

export function useAudioSync({ audioRef, chords, leadNotes = [] }: UseAudioSyncProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [activeChord, setActiveChord] = useState<TranslatedChord | null>(null);
  const [activeLeadNote, setActiveLeadNote] = useState<LeadNote | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  const updateFromAudio = useCallback(() => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    setActiveChord(findActiveChord(chords, time));
    setActiveLeadNote(findActiveLeadNote(leadNotes, time));
  }, [audioRef, chords, leadNotes]);

  const tick = useCallback(() => {
    updateFromAudio();
    if (audioRef.current && !audioRef.current.paused) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [updateFromAudio, audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      rafRef.current = requestAnimationFrame(tick);
    };

    const handlePause = () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
      // Still update time display on pause
      updateFromAudio();
    };

    const handleSeeked = () => {
      // Immediately sync chord display on seek (works during pause too)
      updateFromAudio();
    };

    const handleEnded = () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
      updateFromAudio();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('ended', handleEnded);

    // Sync immediately if audio is already playing when chords arrive
    if (!audio.paused) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('ended', handleEnded);
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [audioRef, chords, leadNotes, tick, updateFromAudio]);

  return { currentTime, activeChord, activeLeadNote };
}
