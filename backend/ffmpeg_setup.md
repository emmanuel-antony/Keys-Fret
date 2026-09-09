# FFmpeg Installation & Verification Guide

This project relies on `FFmpeg` being installed and accessible in your system's PATH. Both `yt-dlp` (for extracting high-quality audio streams) and `librosa` (for processing some audio formats) depend on it.

## Verification

To verify that FFmpeg is correctly installed and accessible, run the following command in your terminal or Command Prompt:

```bash
ffmpeg -version
```

### Expected Output

If FFmpeg is properly installed, you should see output detailing the installed version, configuration, and libraries, similar to:

```
ffmpeg version 7.0.x Copyright (c) 2000-2024 the FFmpeg developers
built with gcc 13.x.x (GCC)
...
```

### Troubleshooting (Windows)

If you see an error like `'ffmpeg' is not recognized as an internal or external command`, it means FFmpeg is not installed or not in your system's PATH environment variable.

1.  **Download:** Download the latest Windows build from the [gyan.dev FFmpeg site](https://www.gyan.dev/ffmpeg/builds/) or use a package manager like `winget` (`winget install ffmpeg`) or `choco` (`choco install ffmpeg`).
2.  **Add to PATH:** If downloaded manually, extract the folder, and add the path to the `bin` directory (e.g., `C:\ffmpeg\bin`) to your Windows environment variables under "Path".
3.  **Restart Terminal:** Close and reopen your terminal for the PATH changes to take effect.
