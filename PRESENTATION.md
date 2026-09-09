---
marp: true
theme: default
class: invert
paginate: true
backgroundColor: #0B0F19
color: #FFFFFF
style: |
  h1 {
    color: #a5b4fc;
    font-size: 3rem;
  }
  h2 {
    color: #c084fc;
  }
  a {
    color: #6366f1;
  }
---

# 🎵 Keys & Fret
### AI-Powered Music Information Retrieval Engine

**Extract Chords, Keys & Tabs from Any Song Instantly**

---

## 📋 Table of Contents

1. Problem Statement
2. The Solution
3. Key Features
4. Technology Stack
5. System Architecture
6. Pipeline & Workflow
7. Future Implementations
8. Conclusion

---

## 🚨 Problem Statement

Musicians, learners, and producers often struggle to figure out the chords, key, or fingerings of a song just by listening to it. 
- Traditional methods require **trained ears** and take a lot of time.
- Existing tools are often **expensive**, lock features behind paywalls, or provide **inaccurate** chord charts.
- There is a lack of **real-time visual aids** for playing along with the original audio.

---

## 💡 The Solution

**Keys & Fret** is a 100% free, fully local AI music theory engine. 
Simply paste any YouTube link, and the system will automatically:
1. Download and isolate the audio.
2. Use Digital Signal Processing (DSP) to analyze the frequencies.
3. Translate the musical data into **Easy Chords**, **Guitar Tabs**, and **Piano Keys** using AI.
4. Provide a stunning, interactive UI that syncs the exact chords to the music in real-time.

---

## ✨ Key Features

- 🔗 **YouTube Integration:** Direct ingestion via URL.
- ⚡ **Instant Processing:** Heavily optimized local DSP pipeline (processes songs in seconds).
- 🧠 **AI Translation:** Translates raw music theory into human-readable fingerings.
- 🎸 **Interactive Fretboard & Piano Roll:** Real-time visual feedback synchronized with the audio.
- 🎨 **Premium UI:** Dark mode, glassmorphism, and smooth micro-animations.

---

## 🛠️ Technology Stack

**Frontend (UI & Visualization)**
- React 19, TypeScript, Vite
- Tailwind CSS v4 + Custom Glassmorphism

**Backend (API & Processing)**
- Python, FastAPI, Uvicorn
- yt-dlp & FFmpeg (Audio pipeline)
- Librosa & NumPy (Digital Signal Processing)

**AI & LLM**
- Capgemini Generative Engine (`openai.gpt-4o`)

---

## 🏗️ System Architecture

1. **Client (React):** Handles user input and complex synchronized animations via HTML5 Audio and `requestAnimationFrame`.
2. **API (FastAPI):** Orchestrates the downloading, processing, and translation.
3. **Audio Engine:** `yt-dlp` fetches the stream, `FFmpeg` converts it to mono `.wav`.
4. **DSP Engine:** `librosa` extracts Chromagrams (STFT) and correlates them against 24 perfect chord matrices to build a timeline.
5. **AI Translation:** Maps raw chords to instrument fingerings using a static lookup table, with GPT-4o acting as a fallback for complex anomalies.

---

## ⚙️ Workflow / How It Works

1. **Ingest:** User submits YouTube URL.
2. **Extract:** Backend downloads audio as a `.wav` file.
3. **Analyze:** DSP engine determines the Global Key and slices audio into 2-second windows to extract raw chords.
4. **Translate:** Raw chords (e.g., `C Maj`) are translated into tabs (`X32010`) and piano keys (`C-E-G`).
5. **Visualize:** Frontend receives JSON payload, plays the audio, and uses an `O(log n)` binary search to sync the visualizer components perfectly in real-time.

---

## 🚀 Future Implementations

- **Spotify / Apple Music Integration:** Support for direct streaming links.
- **Advanced AI LLM Prompts:** Better support for complex 7th, 9th, and diminished chords.
- **Audio Separation:** Isolate vocals, drums, bass, and melody tracks using models like Spleeter or Demucs.
- **Export Options:** Allow users to download the generated chord sheet as a PDF or MIDI file.
- **User Accounts:** Save favorite songs and track learning progress.

---

## 🎯 Conclusion

**Keys & Fret** bridges the gap between complex music theory and accessible learning. 

By combining lightning-fast Digital Signal Processing (DSP) with modern AI translations and a highly responsive React frontend, it empowers musicians of all skill levels to learn and play any song on the internet, completely free of charge.

***

**Thank You!**
