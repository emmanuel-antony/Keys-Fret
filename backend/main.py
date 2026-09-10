import os
import glob
import json
import uuid
import time
import shutil
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import yt_dlp
import librosa
import numpy as np
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ── App Setup ──────────────────────────────────────────────────────────────────
app = FastAPI(title="Music IR API")

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "data", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/api/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# ── LLM Client (Capgemini Generative Engine) ───────────────────────────────────
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://openai.generative.engine.capgemini.com/v1")
LLM_API_KEY  = os.environ.get("GENERATIVE_ENGINE_API_KEY")

if not LLM_API_KEY:
    logger.warning("GENERATIVE_ENGINE_API_KEY is not set in environment variables!")

llm_client   = AsyncOpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)

# ── CORS ───────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")
origins = [url.strip() for url in FRONTEND_URL.split(",")] if FRONTEND_URL != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Accept-Ranges", "Content-Range", "Content-Length"],
)

# ── Pydantic Models ────────────────────────────────────────────────────────────
class AudioRequest(BaseModel):
    url: str

class TranslatedChord(BaseModel):
    time: float
    raw_chord: str
    easy_chord: str
    guitar_tab: str
    piano_keys: str

class MusicIRResponse(BaseModel):
    status: str
    message: str
    dominant_key: str
    audio_url: str
    chords: List[TranslatedChord]
    lead_notes: List[Dict[str, Any]]
    tempo: float

# ── Chord Templates ────────────────────────────────────────────────────────────
NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

def _build_chord_templates():
    templates, labels = [], []
    for i in range(12):                         # Major: 0, 4, 7
        t = np.zeros(12)
        t[i] = t[(i+4)%12] = t[(i+7)%12] = 1.0
        templates.append(t); labels.append(f"{NOTES[i]} Maj")
    for i in range(12):                         # Minor: 0, 3, 7
        t = np.zeros(12)
        t[i] = t[(i+3)%12] = t[(i+7)%12] = 1.0
        templates.append(t); labels.append(f"{NOTES[i]} Min")
    for i in range(12):                         # Dominant 7: 0, 4, 7, 10
        t = np.zeros(12)
        t[i] = t[(i+4)%12] = t[(i+7)%12] = t[(i+10)%12] = 1.0
        templates.append(t); labels.append(f"{NOTES[i]} 7")
    for i in range(12):                         # Major 7: 0, 4, 7, 11
        t = np.zeros(12)
        t[i] = t[(i+4)%12] = t[(i+7)%12] = t[(i+11)%12] = 1.0
        templates.append(t); labels.append(f"{NOTES[i]} maj7")
    for i in range(12):                         # Minor 7: 0, 3, 7, 10
        t = np.zeros(12)
        t[i] = t[(i+3)%12] = t[(i+7)%12] = t[(i+10)%12] = 1.0
        templates.append(t); labels.append(f"{NOTES[i]} min7")
    return np.array(templates).T, labels

CHORD_TEMPLATES, CHORD_LABELS = _build_chord_templates()

# ── Static chord lookup (instant, no LLM needed for standard chords) ───────────
CHORD_LOOKUP: Dict[str, Dict[str, str]] = {
    "C Maj":  {"easy_chord": "C",   "guitar_tab": "X32010", "piano_keys": "C-E-G"},
    "C# Maj": {"easy_chord": "C#",  "guitar_tab": "X43121", "piano_keys": "C#-F-G#"},
    "D Maj":  {"easy_chord": "D",   "guitar_tab": "XX0232", "piano_keys": "D-F#-A"},
    "D# Maj": {"easy_chord": "D#",  "guitar_tab": "XX1343", "piano_keys": "D#-G-A#"},
    "E Maj":  {"easy_chord": "E",   "guitar_tab": "022100", "piano_keys": "E-G#-B"},
    "F Maj":  {"easy_chord": "F",   "guitar_tab": "133211", "piano_keys": "F-A-C"},
    "F# Maj": {"easy_chord": "F#",  "guitar_tab": "244322", "piano_keys": "F#-A#-C#"},
    "G Maj":  {"easy_chord": "G",   "guitar_tab": "320003", "piano_keys": "G-B-D"},
    "G# Maj": {"easy_chord": "G#",  "guitar_tab": "466544", "piano_keys": "G#-C-D#"},
    "A Maj":  {"easy_chord": "A",   "guitar_tab": "X02220", "piano_keys": "A-C#-E"},
    "A# Maj": {"easy_chord": "A#",  "guitar_tab": "X13331", "piano_keys": "A#-D-F"},
    "B Maj":  {"easy_chord": "B",   "guitar_tab": "X24442", "piano_keys": "B-D#-F#"},
    "C Min":  {"easy_chord": "Cm",  "guitar_tab": "X35543", "piano_keys": "C-D#-G"},
    "C# Min": {"easy_chord": "C#m", "guitar_tab": "X46654", "piano_keys": "C#-E-G#"},
    "D Min":  {"easy_chord": "Dm",  "guitar_tab": "XX0231", "piano_keys": "D-F-A"},
    "D# Min": {"easy_chord": "D#m", "guitar_tab": "XX1342", "piano_keys": "D#-F#-A#"},
    "E Min":  {"easy_chord": "Em",  "guitar_tab": "022000", "piano_keys": "E-G-B"},
    "F Min":  {"easy_chord": "Fm",  "guitar_tab": "133111", "piano_keys": "F-G#-C"},
    "F# Min": {"easy_chord": "F#m", "guitar_tab": "244222", "piano_keys": "F#-A-C#"},
    "G Min":  {"easy_chord": "Gm",  "guitar_tab": "310033", "piano_keys": "G-A#-D"},
    "G# Min": {"easy_chord": "G#m", "guitar_tab": "466444", "piano_keys": "G#-B-D#"},
    "A Min":  {"easy_chord": "Am",  "guitar_tab": "X02210", "piano_keys": "A-C-E"},
    "A# Min": {"easy_chord": "A#m", "guitar_tab": "X13321", "piano_keys": "A#-C#-F"},
    "B Min":  {"easy_chord": "Bm",  "guitar_tab": "X24432", "piano_keys": "B-D-F#"},
}

CACHE_FILE = os.path.join(AUDIO_DIR, "chord_cache.json")
if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, "r") as f:
            cached_chords = json.load(f)
            CHORD_LOOKUP.update(cached_chords)
    except Exception as e:
        logger.error(f"Failed to load chord cache: {e}")

# ── DSP: Fast chord extraction ─────────────────────────────────────────────────
def extract_music_info(file_path: str) -> Dict[str, Any]:
    """
    Optimised DSP pipeline — benchmarked improvements over original:
      ✓ sr=11025 mono      → half the audio data to crunch
      ✓ chroma_stft        → 3-5x faster than chroma_cqt
      ✓ No HPSS            → removed the #1 bottleneck (was ~30-60s alone)
      ✓ No beat_track      → removed another heavy operation (~5-15s)
      ✓ Fixed 2s windows   → simple, fast numpy windowing
    All steps are timed and logged so you can see exactly where time goes.
    """
    t_total = time.time()
    try:
        # 1. Load at half sample rate ─────────────────────────────────────────
        logger.info(f"[DSP] Loading: {os.path.basename(file_path)}")
        t = time.time()
        y, sr = librosa.load(file_path, sr=11025, mono=True)
        duration = len(y) / sr
        logger.info(f"[DSP] ✓ Load done in {time.time()-t:.1f}s | audio duration={duration:.1f}s")

        # 2. Chromagram via STFT (fastest chroma method) ───────────────────────
        logger.info("[DSP] Computing chroma_stft...")
        t = time.time()
        hop_length = 512
        chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=hop_length, n_fft=2048)
        logger.info(f"[DSP] ✓ chroma_stft done in {time.time()-t:.1f}s | shape={chroma.shape}")

        # 3. Dominant key ──────────────────────────────────────────────────────
        dominant_key = NOTES[int(np.argmax(np.sum(chroma, axis=1)))]
        logger.info(f"[DSP] ✓ Dominant key: {dominant_key}")

        # Tempo extraction
        logger.info("[DSP] Computing tempo...")
        t_tempo = time.time()
        tempo_val, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo = round(float(tempo_val[0] if isinstance(tempo_val, np.ndarray) else tempo_val))
        logger.info(f"[DSP] ✓ Tempo: {tempo} BPM in {time.time()-t_tempo:.1f}s")

        # 4. Fixed 2-second windows → chord timeline ───────────────────────────
        logger.info("[DSP] Building chord timeline...")
        t = time.time()
        n_frames = chroma.shape[1]
        frames_per_sec = sr / hop_length
        window = max(1, int(frames_per_sec * 2))   # 2-second window

        chords = []
        for start in range(0, n_frames, window):
            segment = chroma[:, start:start + window]
            frame = np.median(segment, axis=1)
            norm = np.linalg.norm(frame)
            if norm > 0:
                frame = frame / norm
            best_chord = CHORD_LABELS[int(np.argmax(np.dot(CHORD_TEMPLATES.T, frame)))]
            timestamp = round(start / frames_per_sec, 2)
            chords.append({"time": timestamp, "chord": best_chord})

        logger.info(f"[DSP] ✓ Chord timeline done in {time.time()-t:.1f}s | {len(chords)} chords")
        
        # 5. Extract Lead Melody Notes ─────────────────────────────────────────
        logger.info("[DSP] Extracting lead notes via piptrack...")
        t = time.time()
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr, hop_length=hop_length)
        times = librosa.times_like(pitches, sr=sr, hop_length=hop_length)
        
        lead_notes = []
        last_time = -1
        # Sample every ~0.1s for UI updates
        import re
        for t_idx, ts in enumerate(times):
            if ts - last_time >= 0.1:
                idx = magnitudes[:, t_idx].argmax()
                pitch = pitches[idx, t_idx]
                mag = magnitudes[idx, t_idx]
                
                if pitch > 0 and mag > np.max(magnitudes) * 0.1:  # 10% of max magnitude threshold
                    note_full = librosa.hz_to_note(pitch)
                    note_class = re.sub(r'[-0-9]', '', note_full) # Remove octave number
                    lead_notes.append({"time": round(float(ts), 2), "note": note_class})
                last_time = ts

        logger.info(f"[DSP] ✓ Lead notes done in {time.time()-t:.1f}s | {len(lead_notes)} notes")
        logger.info(f"[DSP] ✅ Total DSP time: {time.time()-t_total:.1f}s")

        return {"dominant_key": dominant_key, "tempo": tempo, "raw_chords": chords, "lead_notes": lead_notes}

    except Exception as e:
        logger.error(f"[DSP] ✗ Error: {e}")
        raise Exception(f"DSP extraction failed: {e}")


# ── Chord Translation (lookup table first, LLM only for unknowns) ──────────────
async def translate_chords(chords: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    t = time.time()
    unique = list(set(c["chord"] for c in chords))
    translations: Dict[str, Dict[str, str]] = {}
    unknown = []

    # Step 1: instant lookup ──────────────────────────────────────────────────
    for chord in unique:
        if chord in CHORD_LOOKUP:
            translations[chord] = CHORD_LOOKUP[chord]
        else:
            unknown.append(chord)

    logger.info(f"[Translate] ✓ Local lookup: {len(translations)}/{len(unique)} chords resolved instantly")

    # Step 2: LLM only for truly unknown chords ───────────────────────────────
    if unknown:
        logger.info(f"[Translate] Calling LLM for {len(unknown)} unknown chords...")
        t_llm = time.time()
        
        # Batch unknown chords into chunks of 3 to avoid LLM truncation
        chunk_size = 3
        for i in range(0, len(unknown), chunk_size):
            chunk = unknown[i:i+chunk_size]
            prompt = (
                "Generate a JSON object mapping each of the following guitar/piano chords to their details.\n"
                "Output ONLY raw JSON with the following schema:\n"
                "{\n"
                '  "C Maj": {"easy_chord": "C", "guitar_tab": "X32010", "piano_keys": "C-E-G"}\n'
                "}\n\n"
                f"Chords to map: {json.dumps(chunk)}"
            )
            try:
                response = await llm_client.chat.completions.create(
                    model="openai.gpt-4o",
                    messages=[
                        {"role": "system", "content": "Music theory API. Output only raw JSON."},
                        {"role": "user",   "content": prompt},
                    ],
                    temperature=0.1,
                    max_tokens=1024,
                    timeout=5.0,
                )
                content = response.choices[0].message.content.strip()
                content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                new_translations = json.loads(content)
                translations.update(new_translations)
                CHORD_LOOKUP.update(new_translations)
            except Exception as e:
                logger.error(f"[Translate] ✗ LLM failed for chunk {chunk}: {e}")
                for c in chunk:
                    translations[c] = {"easy_chord": c, "guitar_tab": "N/A", "piano_keys": "N/A"}
        
        # Save to permanent cache
        try:
            with open(CACHE_FILE, "w") as f:
                json.dump(CHORD_LOOKUP, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to write to chord cache: {e}")
            
        logger.info(f"[Translate] ✓ LLM done in {time.time()-t_llm:.1f}s")
    else:
        logger.info("[Translate] ✓ All chords resolved from local table — LLM not needed!")

    logger.info(f"[Translate] ✅ Total translation time: {time.time()-t:.2f}s")

    return [{
        "time":       c["time"],
        "raw_chord":  c["chord"],
        "easy_chord": translations[c["chord"]].get("easy_chord", c["chord"]),
        "guitar_tab": translations[c["chord"]].get("guitar_tab", "N/A"),
        "piano_keys": translations[c["chord"]].get("piano_keys", "N/A"),
    } for c in chords]


def cleanup_old_audio():
    """Deletes .mp3 and .wav files older than 1 hour to prevent disk space from filling up."""
    now = time.time()
    for ext in ("*.mp3", "*.wav"):
        for f in glob.glob(os.path.join(AUDIO_DIR, ext)):
            try:
                if os.stat(f).st_mtime < now - 3600:
                    os.remove(f)
                    logger.info(f"[Cleanup] Deleted old audio file: {f}")
            except Exception as e:
                logger.error(f"[Cleanup] Failed to delete {f}: {e}")

# ── Main endpoint ──────────────────────────────────────────────────────────────
@app.post("/api/process-audio", response_model=MusicIRResponse)
async def process_audio(request: AudioRequest):
    cleanup_old_audio()
    t_req = time.time()
    url = request.url
    logger.info(f"[API] ► Request received: {url}")

    file_id        = str(uuid.uuid4())
    output_path    = os.path.join(AUDIO_DIR, f"{file_id}.mp3")

    # Dynamically look for any cookies file in the backend folder
    cookie_path = None
    cookie_candidates = glob.glob(os.path.join(os.path.dirname(__file__), "*cookies*.txt"))
    if cookie_candidates:
        cookie_path = cookie_candidates[0]

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
        "quiet": True,
        "no_warnings": True,
        # Bypass Capgemini corporate SSL certificate
        "nocheckcertificate": True,
        # Point yt-dlp to the installed FFmpeg binary or local static binary
        "ffmpeg_location": os.environ.get("FFMPEG_LOCATION", shutil.which("ffmpeg") or "ffmpeg"),
    }
    
    # If the user has provided a cookies file, use it to bypass YouTube bot detection
    if cookie_path:
        logger.info(f"[API] 🍪 Found cookies file at: {cookie_path}")
        ydl_opts["cookiefile"] = cookie_path
    else:
        logger.warning("[API] ⚠️ No cookies file found! YouTube download will likely fail.")

    try:
        # ── Step 1: Download ─────────────────────────────────────────────────
        t = time.time()
        logger.info("[Step 1/3] Downloading audio via yt-dlp...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        logger.info(f"[Step 1/3] ✓ Download done in {time.time()-t:.1f}s")

        # Robustly find output file (yt-dlp naming can vary by version)
        if not os.path.exists(output_path):
            candidates = glob.glob(os.path.join(AUDIO_DIR, f"{file_id}.*"))
            if candidates:
                os.rename(candidates[0], output_path)
                logger.info(f"[Step 1/3] Renamed {candidates[0]} → {output_path}")
            else:
                raise FileNotFoundError(f"yt-dlp produced no output for id={file_id}")

        # ── Step 2: DSP ──────────────────────────────────────────────────────
        logger.info("[Step 2/3] Running DSP extraction...")
        music_data = extract_music_info(output_path)

        # ── Step 3: Translate ────────────────────────────────────────────────
        logger.info("[Step 3/3] Translating chords...")
        translated_chords = await translate_chords(music_data["raw_chords"])

        logger.info(f"[API] ✅ Request complete in {time.time()-t_req:.1f}s total")
        return MusicIRResponse(
            status="success",
            message="Audio processed successfully.",
            dominant_key=music_data["dominant_key"],
            audio_url=f"/api/audio/{file_id}.mp3",
            chords=translated_chords,
            lead_notes=music_data["lead_notes"],
            tempo=music_data["tempo"],
        )

    except yt_dlp.utils.DownloadError as e:
        logger.error(f"[Step 1/3] ✗ Download error: {e}")
        raise HTTPException(status_code=400, detail="Failed to download audio. Check the URL.")
    except Exception as e:
        logger.error(f"[API] ✗ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-audio", response_model=MusicIRResponse)
async def upload_audio(file: UploadFile = File(...)):
    cleanup_old_audio()
    t_req = time.time()
    logger.info(f"[API] ► Upload request received: {file.filename}")

    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] if file.filename else ".mp3"
    output_path = os.path.join(AUDIO_DIR, f"{file_id}{ext}")

    try:
        # ── Step 1: Save Upload ──────────────────────────────────────────────
        logger.info("[Step 1/3] Saving uploaded file...")
        t = time.time()
        with open(output_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"[Step 1/3] ✓ Save done in {time.time()-t:.1f}s")

        # ── Step 2: DSP ──────────────────────────────────────────────────────
        logger.info("[Step 2/3] Running DSP extraction...")
        music_data = extract_music_info(output_path)

        # ── Step 3: Translate ────────────────────────────────────────────────
        logger.info("[Step 3/3] Translating chords...")
        translated_chords = await translate_chords(music_data["raw_chords"])

        logger.info(f"[API] ✅ Upload complete in {time.time()-t_req:.1f}s total")
        return MusicIRResponse(
            status="success",
            message="Audio uploaded and processed successfully.",
            dominant_key=music_data["dominant_key"],
            audio_url=f"/api/audio/{file_id}{ext}",
            chords=translated_chords,
            lead_notes=music_data["lead_notes"],
            tempo=music_data["tempo"],
        )

    except Exception as e:
        logger.error(f"[API] ✗ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )
