# Stage 1: Build Tailwind CSS
FROM node:20-alpine AS builder
WORKDIR /build

COPY package.json package-lock.json tailwind.config.cjs ./
COPY assets/ ./assets/
RUN npm ci && npm run tailwindcss

# Stage 2: PowerShell runtime
FROM mcr.microsoft.com/powershell:7.4-ubuntu-22.04
WORKDIR /app

# Copy built assets (includes stylesheet.css) and application files
COPY --from=builder /build/assets/ ./assets/
COPY Get-MicrosoftTeamsChat.ps1 ./
COPY functions/ ./functions/

# Default export folder - mount a volume to persist output
# e.g. docker run -v $(pwd)/out:/app/out ...
ENV exportFolder=out

ENTRYPOINT ["pwsh", "-File", "./Get-MicrosoftTeamsChat.ps1"]
CMD ["-exportFolder", "out"]
