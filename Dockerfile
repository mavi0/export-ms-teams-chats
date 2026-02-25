FROM mcr.microsoft.com/powershell:7.4-ubuntu-22.04
WORKDIR /app

COPY Get-MicrosoftTeamsChat.ps1 ./
COPY functions/ ./functions/

# Assets folder (profile pictures, embedded images) is created inside exportFolder at runtime

# Default export folder - mount a volume to persist output
# e.g. docker run -v $(pwd)/out:/app/out ...
ENV exportFolder=out

ENTRYPOINT ["pwsh", "-File", "./Get-MicrosoftTeamsChat.ps1"]
CMD ["-exportFolder", "out", "-outputFile", "teams-export.json"]
