# Microsoft Teams Chat Exporter

## Note
I don't currently use Teams for school nor work. While I have access to a Teams environment for testing, I don't have major incentives to develop new features. There are quite a few forks of this project: these may have new features or capabilities that aren't in mine: https://github.com/evenevan/export-ms-teams-chats/forks. I encourage you to have a look into which may be best for you, but know I have not looked into any of them in depth and can not endorse any of them in particular.

## Introduction

Export Microsoft Teams messages as **machine-readable JSON**, ready for ingestion by other projects. Despite being both a dominant product and run by a trillion dollar company, Teams doesn't have a native way for end users to export messages for work or school accounts.

The repository contains a PowerShell script that fetches your Microsoft Teams chat conversations and exports them to a single JSON file.

## Important

If you are using Microsoft Teams with a personal Microsoft account, you can simply export your chats and other data with https://go.microsoft.com/fwlink/?linkid=2128346. This guide is for people using Microsoft Teams with work or school accounts.

## Output Format

The export produces a JSON file with the following structure:

```json
{
  "exportedAt": "2025-02-25T12:00:00.0000000Z",
  "exportVersion": "1.0",
  "user": {
    "id": "user-guid",
    "displayName": "Your Name"
  },
  "chats": [
    {
      "id": "19:chat-id@thread.v2",
      "name": "Chat Name",
      "chatType": "oneOnOne",
      "members": [
        { "id": "user-guid", "displayName": "Member Name" }
      ],
      "messages": [
        {
          "id": "msg-id",
          "messageType": "message",
          "createdDateTime": "2024-01-15T10:30:00Z",
          "from": { "id": "user-guid", "displayName": "Sender Name" },
          "body": {
            "contentType": "html",
            "content": "<html>raw from API</html>",
            "contentProcessed": "<html>with local image paths</html>"
          },
          "attachments": [
            { "name": "file.pdf", "contentUrl": "https://...", "contentType": "reference" }
          ],
          "importance": "normal",
          "deletedDateTime": null,
          "lastEditedDateTime": null,
          "isFromMe": false
        }
      ]
    }
  ]
}
```

- **Profile pictures** and **embedded images** are downloaded to an `assets/` subfolder; paths in `contentProcessed` reference these local files.
- **System messages** (call started/ended, members added/removed, chat renamed, etc.) include a `systemEvent` object with structured data plus a human-readable `description`.

## Advantages

- No need to create an Azure AD application registration.
- Usually no admin permissions required in your organization.
- Works as of 25/7/2023 (d/m/y).
- Machine-readable JSON output, ready for downstream processing.

## Guide

#### Option A: Using Docker

```bash
# Build the image
docker build -t export-ms-teams-chats .

# Run (interactive - you'll authenticate via device code in your browser)
docker run -it -v $(pwd)/out:/app/out export-ms-teams-chats
```

The export file `teams-export.json` and `assets/` folder will appear in the `out` folder. Mount a different path if you prefer: `-v /path/to/output:/app/out`.

Custom output file:
```bash
docker run -it -v $(pwd)/out:/app/out export-ms-teams-chats -outputFile my-chats.json
```

#### Option B: Direct PowerShell

### 1. Install PowerShell 7

- **Windows**: Usually preinstalled; continue to step 2.
- **MacOS**: [Microsoft's guide](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-macos)
- **Linux**: [Microsoft's guide](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-linux)

### 2. Run the Script

Open a PowerShell terminal:

```
irm https://go.evanfeng.dev/teams | iex
```

Alternative: `irm https://raw.githubusercontent.com/evenevan/export-ms-teams-chats/main/ps.ps1 | iex`

**Legacy method**: Download the code, extract it, and run `./Get-MicrosoftTeamsChat.ps1` from the extracted folder.

### 3. Authenticate

Authenticate with the app "Export Teams Chats". Sign in with your work/school email.

### 4. Wait

Chats will be fetched, processed, and written to JSON. This may take several minutes depending on the number of chats.

### 5. Use the Output

Open `out/teams-export.json` and ingest it with your preferred tool or script.

## Parameters

| Parameter        | Description                                           | Default             |
|-----------------|-------------------------------------------------------|---------------------|
| `exportFolder`  | Output directory                                      | `out`               |
| `outputFile`    | JSON filename                                         | `teams-export.json` |
| `toExport`      | Only export chats with these exact names              | (all chats)         |
| `skipIds`       | Chat IDs to skip                                      | `@()`               |
| `avoidOverwrite`| Add number suffix if file exists                      | `$false`            |
| `clientId`      | Azure AD app client ID                                | (built-in)          |
| `tenantId`      | Azure AD tenant ID                                    | `organizations`     |

Example with parameters:
```powershell
./Get-MicrosoftTeamsChat.ps1 -exportFolder ./exports -outputFile my-teams.json -toExport "Project Alpha","Project Beta"
```

## Notes

- Polls, location, and other widgets are not exported.
- Attachments are referenced by URL; content is not downloaded.
- Use `-Verbose` for additional logging.

## Credit

Based on improvements to a [pull request by olljanat](https://github.com/olljanat/MSTeamsChatExporter) on a repository by [telstrapurple](https://github.com/telstrapurple/MSTeamsChatExporter).

## Disclaimer

Under the MIT license, this comes with no warranty. Please don't sue me.
