#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing Python requirements..."
pip install -r requirements.txt

echo "Checking for ffmpeg..."
if [[ ! -f ./ffmpeg/ffmpeg ]]; then
    echo "Downloading standalone ffmpeg..."
    mkdir -p ffmpeg
    # Download a statically linked ffmpeg binary
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
    tar -xf ffmpeg.tar.xz --strip-components=1 -C ffmpeg
    rm ffmpeg.tar.xz
    echo "ffmpeg installed at $(pwd)/ffmpeg/ffmpeg"
else
    echo "ffmpeg already installed."
fi
