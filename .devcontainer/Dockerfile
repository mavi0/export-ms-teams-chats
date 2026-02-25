# Base: Ubuntu with common dev tools
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Wails v2 Linux requirements (GTK + WebKit for native WebView)
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
        build-essential \
        pkg-config \
        libgtk-3-dev \
        libwebkit2gtk-4.0-dev \
        gstreamer1.0-plugins-good \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
