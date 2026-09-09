import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UrlInput } from './components/UrlInput';
import { SkeletonLoader } from './components/SkeletonLoader';
import { AudioTimeline } from './components/AudioTimeline';
import { GuitarFretboard } from './components/GuitarFretboard';
import { PianoRoll } from './components/PianoRoll';
import { ChordTimeline } from './components/ChordTimeline';
import { MelodyTimeline } from './components/MelodyTimeline';
import type { MusicIRResponse } from './types';
import { useAudioSync } from './hooks/useAudioSync';
import { Music2, Zap, Guitar, Piano, Wand2, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { transposeTranslatedChord, getCapoSuggestion, calculateMagicKeyShift, transposeNote } from './utils/transposition';

// Processing steps shown during loading
const STEPS = [
  { icon: '⬇️', label: 'Downloading audio from YouTube' },
  { icon: '🎵', label: 'Running DSP chord extraction' },
  { icon: '🤖', label: 'Consulting AI music theory engine' },
];

function WaveformBars() {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-indigo-500/60 rounded-full origin-bottom animate-wave"
          style={{ animationDelay: `${i * 0.08}s`, height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [data, setData] = useState<MusicIRResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [beatKey, setBeatKey] = useState(0); // triggers beat-ring animation
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('guitar');
  const [semitones, setSemitones] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  const emptyChords = useMemo(() => [], []);
  const emptyLeadNotes = useMemo(() => [], []);

  const { currentTime, activeChord: rawActiveChord, activeLeadNote: rawActiveLeadNote } = useAudioSync({
    audioRef,
    chords: data?.chords || emptyChords,
    leadNotes: data?.lead_notes || emptyLeadNotes,
  });

  const activeChord = useMemo(() => {
    if (!rawActiveChord) return null;
    return transposeTranslatedChord(rawActiveChord, semitones);
  }, [rawActiveChord, semitones]);

  const activeLeadNote = useMemo(() => {
    if (!rawActiveLeadNote) return null;
    return { ...rawActiveLeadNote, note: transposeNote(rawActiveLeadNote.note, semitones) };
  }, [rawActiveLeadNote, semitones]);

  const transposedChords = useMemo(() => {
    if (!data?.chords) return [];
    return data.chords.map(c => transposeTranslatedChord(c, semitones));
  }, [data?.chords, semitones]);

  const currentKey = useMemo(() => {
    if (!data?.dominant_key) return '';
    return transposeNote(data.dominant_key, semitones);
  }, [data?.dominant_key, semitones]);

  const capoSuggestion = useMemo(() => getCapoSuggestion(currentKey), [currentKey]);

  // Cycle through loading steps for UX feedback
  const cycleSteps = useCallback(() => {
    setLoadingStep(0);
    const t1 = setTimeout(() => setLoadingStep(1), 3000);
    const t2 = setTimeout(() => setLoadingStep(2), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleSubmit = async (inputData: { url?: string; file?: File }) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setAudioUrl(null);
    setSemitones(0); // reset transposition
    const cleanup = cycleSteps();

    try {
      let response;
      if (inputData.file) {
        const formData = new FormData();
        formData.append('file', inputData.file);
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload-audio`, {
          method: 'POST',
          body: formData,
        });
      } else if (inputData.url) {
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/process-audio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: inputData.url }),
        });
      } else {
        throw new Error('No input provided');
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to process audio');
      }

      const result: MusicIRResponse = await response.json();
      setData(result);
      setAudioUrl(`${import.meta.env.VITE_API_BASE_URL}${result.audio_url}?t=${Date.now()}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      cleanup();
      setIsLoading(false);
    }
  };

  const prevChordRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeChord && activeChord.easy_chord !== prevChordRef.current) {
      prevChordRef.current = activeChord.easy_chord;
      setBeatKey(k => k + 1);
    }
  }, [activeChord]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans">

      {/* ── Ambient Background Orbs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-indigo-600/20 rounded-full blur-[140px] animate-drift" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-purple-600/15 rounded-full blur-[140px] animate-drift-delayed" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[120px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-14 flex flex-col items-center">

        {/* ── Header ── */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-widest uppercase">
            <Zap className="w-3 h-3" />
            AI-Powered Music Analysis
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 leading-tight">
            Keys & Fret
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
            Extract keys, chord progressions, guitar tabs & piano fingerings
            from any YouTube track — powered by local DSP + AI.
          </p>
        </div>

        {/* ── URL Input ── */}
        <div className="w-full max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <UrlInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mt-6 w-full max-w-2xl p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3 animate-slide-up">
            <span className="text-lg">⚠️</span>
            {error}
          </div>
        )}

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="mt-12 w-full max-w-3xl animate-slide-up">
            <SkeletonLoader currentStep={loadingStep} steps={STEPS} />
          </div>
        )}

        {/* ── Results Dashboard ── */}
        {data && !isLoading && (
          <div className="mt-12 w-full max-w-5xl space-y-6 animate-slide-up">

            {/* Row 1: Key Badge + Audio Player */}
            <div className="glass-card flex flex-col md:flex-row gap-6 items-center">

              {/* Key Badge */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1 glass-panel px-10 py-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-xl" />
                <div className="relative">
                  <Music2 className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                  <div className="text-[10px] text-indigo-300 uppercase tracking-[0.2em] font-semibold">Dominant Key</div>
                  <div className="text-5xl font-black text-white mt-1">{currentKey}</div>
                </div>
              </div>

              {/* Transpose & Magic Key Tools */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setSemitones(s => s + calculateMagicKeyShift(currentKey))}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/40 hover:to-purple-500/40 border border-pink-500/30 rounded-xl text-pink-100 font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-105"
                  title="Automatically transpose to the easiest playable key"
                >
                  <Wand2 className="w-4 h-4" /> Simplify Chords
                </button>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
                  <button onClick={() => setSemitones(s => s - 1)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Transpose Down">
                    <ArrowDownRight className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center flex flex-col items-center justify-center min-w-[3rem]">
                    <span className="text-xs text-gray-500 font-semibold tracking-wider">SHIFT</span>
                    <span className="text-sm font-mono text-indigo-300">
                      {semitones > 0 ? `+${semitones}` : semitones}
                    </span>
                  </div>
                  <button onClick={() => setSemitones(s => s + 1)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Transpose Up">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSemitones(0)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border-l border-white/10 ml-1" title="Reset">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Audio Player + Timeline */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <WaveformBars />
                  <span className="text-xs text-gray-500 font-mono">{data.chords.length} chords detected</span>
                </div>
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    controls
                    className="w-full rounded-xl opacity-70 hover:opacity-100 transition-opacity duration-300"
                    style={{ filter: 'hue-rotate(230deg) saturate(1.5)' }}
                  />
                )}
                <AudioTimeline
                  currentTime={currentTime}
                  duration={audioRef.current?.duration || 0}
                  chords={transposedChords}
                  audioRef={audioRef}
                />
              </div>
            </div>

            {/* Instruction Banners */}
            {capoSuggestion && instrument === 'guitar' && (
              <div className="glass-card bg-amber-500/10 border-amber-500/30 p-4 rounded-xl flex items-center gap-4 animate-slide-up">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <span className="text-2xl">💡</span>
                </div>
                <div>
                  <h4 className="text-amber-200 font-semibold mb-1">This key uses complex chords.</h4>
                  <p className="text-amber-100/70 text-sm">
                    Place a Capo on the <strong>{capoSuggestion.fret}{capoSuggestion.fret === 1 ? 'st' : capoSuggestion.fret === 2 ? 'nd' : capoSuggestion.fret === 3 ? 'rd' : 'th'} Fret</strong> and play in <strong>{capoSuggestion.easyShapes} shapes</strong> to make it easy!
                  </p>
                </div>
              </div>
            )}
            
            {capoSuggestion && instrument === 'piano' && (
              <div className="glass-card bg-indigo-500/10 border-indigo-500/30 p-4 rounded-xl flex items-center gap-4 animate-slide-up">
                <div className="p-3 bg-indigo-500/20 rounded-lg">
                  <Piano className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-indigo-200 font-semibold mb-1">Keyboard setting:</h4>
                  <p className="text-indigo-100/70 text-sm">
                    Transpose <strong>{semitones > 0 ? `+${semitones}` : semitones}</strong> and play in easier shapes.
                  </p>
                </div>
              </div>
            )}

            {/* Grid Layout: Now Playing & Instruments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              
              {/* Left Column: Active Chord Hero */}
              <div className="glass-card text-center py-10 relative overflow-hidden flex flex-col justify-center h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />
              <div className="relative">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">Now Playing</div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                  {/* Chord Focus */}
                  <div className="flex flex-col items-center">
                    <div
                      key={beatKey}
                      className="text-7xl md:text-8xl font-black text-indigo-400 tracking-tighter leading-none animate-beat"
                      style={{ textShadow: '0 0 60px rgba(99,102,241,0.5), 0 0 120px rgba(99,102,241,0.2)' }}
                    >
                      {activeChord?.easy_chord || '—'}
                    </div>
                    <div className="mt-2 text-sm text-gray-400 font-mono tracking-wider">
                      CHORD
                    </div>
                  </div>

                  {/* Tempo Focus */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mt-4 md:mt-0 min-h-[56px]">
                      {data.tempo ? (
                        <div className="min-w-[4rem] px-4 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl font-black text-emerald-300 shadow-lg shadow-emerald-500/20">
                          {data.tempo}
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-600">—</div>
                      )}
                    </div>
                    <div className="mt-4 text-sm text-gray-400 font-mono tracking-wider">
                      BPM TEMPO
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
                  <span>Raw: <span className="text-gray-300 font-mono">{activeChord?.raw_chord || '—'}</span></span>
                  <span className="text-gray-700">|</span>
                  <span>Tab: <span className="text-gray-300 font-mono">{activeChord?.guitar_tab || '—'}</span></span>
                </div>
                </div>
              </div>

            {/* Right Column: Instruments Toggle & View */}
            <div className="glass-card py-10 flex flex-col items-center justify-center gap-6 h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />
              <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl relative z-10">
                <button
                  onClick={() => setInstrument('guitar')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    instrument === 'guitar' 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Guitar className="w-4 h-4" /> Guitar View
                </button>
                <button
                  onClick={() => setInstrument('piano')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    instrument === 'piano' 
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Piano className="w-4 h-4" /> Piano View
                </button>
              </div>

                <div className="w-full max-w-md mx-auto transition-all duration-500 relative z-10">
                  {instrument === 'guitar' ? (
                    <GuitarFretboard tab={activeChord?.guitar_tab || 'X32010'} chordName={activeChord?.easy_chord} />
                  ) : (
                    <PianoRoll keys={activeChord?.piano_keys || 'C-E-G'} chordName={activeChord?.easy_chord} />
                  )}
                </div>
              </div>
            </div>

            {/* Row 4: Chord Timeline Strip */}
            <ChordTimeline
              chords={transposedChords}
              activeChord={activeChord}
            />

            {/* Row 5: Melody Timeline Strip */}
            <MelodyTimeline
              leadNotes={data.lead_notes}
              activeLeadNote={activeLeadNote}
            />

          </div>
        )}
      </main>
    </div>
  );
}

export default App;
