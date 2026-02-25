#Requires -Version 5.1
<#

    .SYNOPSIS
        Exports Microsoft Teams Chat History

    .DESCRIPTION
        This script reads the Microsoft Graph API and exports chat history as machine-readable JSON,
        ready for ingestion by other projects.

    .PARAMETER exportFolder
        Export location where the JSON file will be saved. For example, "D:\ExportedJSON\"

    .PARAMETER outputFile
        Name of the output JSON file. Default: teams-export.json

    .PARAMETER toExport
        If specified, only group chats matching these names (exact match) will be exported

    .PARAMETER skipIds
        Chat IDs to skip

    .PARAMETER avoidOverwrite
        If a file with the same name already exists, create with a number suffix instead (e.g. teams-export (1).json)

    .PARAMETER clientId
        The client id of the Azure AD App Registration.

    .PARAMETER tenantId
        The tenant id. See https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc#find-your-apps-openid-configuration-document-uri

    .EXAMPLE
        .\Get-MicrosoftTeamsChat.ps1 -exportFolder "D:\Exported" -outputFile "my-chats.json"

    .NOTES
        Original Author: Trent Steenholdt
        Pre-requisites: An app registration with delegated User.Read, Chat.Read and User.ReadBasic.All permissions
        in the Azure AD tenant you're connecting to.

#>

[cmdletbinding()]
Param(
    [Parameter(Mandatory = $false, HelpMessage = "Export location where the JSON file will be saved.")] [string] $exportFolder = "out",
    [Parameter(Mandatory = $false, HelpMessage = "Name of the output JSON file.")] [string] $outputFile = "teams-export.json",
    [Parameter(Mandatory = $false, HelpMessage = "If specified, only chats named (exact match) will be exported")] [string[]] $toExport = $null,
    [Parameter(Mandatory = $false, HelpMessage = "Any chat IDs specified will be skipped")] [string[]] $skipIds = @(),
    [Parameter(Mandatory = $false, HelpMessage = "If a file with the same name already exists, append a number suffix instead")] [switch] $avoidOverwrite,
    [Parameter(Mandatory = $false, HelpMessage = "The client id of the Azure AD App Registration")] [string] $clientId = "7f586887-37d3-4d1f-89cf-153c7d1bbe54",
    [Parameter(Mandatory = $false, HelpMessage = "The tenant id of the Azure AD environment the user logs into")] [string] $tenantId = "organizations"
)

#################################
##   Import Modules  ##
#################################

Set-Location $PSScriptRoot

$verbose = $PSBoundParameters["verbose"]

Get-ChildItem "$PSScriptRoot/functions/chat/*.psm1" | ForEach-Object { Import-Module $_.FullName -Force -ArgumentList $verbose }
Get-ChildItem "$PSScriptRoot/functions/message/*.psm1" | ForEach-Object { Import-Module $_.FullName -Force -ArgumentList $verbose }
Get-ChildItem "$PSScriptRoot/functions/user/*.psm1" | ForEach-Object { Import-Module $_.FullName -Force -ArgumentList $verbose }
Get-ChildItem "$PSScriptRoot/functions/util/*.psm1" | ForEach-Object { Import-Module $_.FullName -Force -Global -ArgumentList $verbose }

$start = Get-Date

Write-Host -ForegroundColor Cyan "Starting script..."

if (-not(Test-Path -Path $exportFolder)) { New-Item -ItemType Directory -Path $exportFolder | Out-Null }
$exportFolder = (Resolve-Path -Path $exportFolder).ToString()
$assetsFolder = Join-Path -Path $exportFolder -ChildPath "assets"
if (-not(Test-Path -Path $assetsFolder)) { New-Item -ItemType Directory -Path $assetsFolder | Out-Null }

Write-Host "Export will be saved to $exportFolder"

$me = Invoke-RestMethod -Method Get -Uri "https://graph.microsoft.com/v1.0/me" -Headers @{
    "Authorization" = "Bearer $(Get-GraphAccessToken $clientId $tenantId)"
}

$export = @{
    exportedAt = (Get-Date).ToUniversalTime().ToString("o")
    exportVersion = "1.0"
    user = @{
        id = $me.id
        displayName = $me.displayName
    }
    chats = @()
}

Write-Host "Getting all chats, please wait... This may take some time."
$chats = Get-Chats $clientId $tenantId
Write-Host ("" + $chats.count + " possible chats found.")

$chatIndex = 0

foreach ($chat in $chats) {
    Write-Progress -Activity "Exporting Chats" -Status "Chat $($chatIndex) of $($chats.count)" -PercentComplete $(($chatIndex / $chats.count) * 100)
    $chatIndex += 1

    Write-Verbose "Exporting $($chat.id)"

    $members = Get-Members $chat $clientId $tenantId
    $name = ConvertTo-ChatName $chat $members $me $clientId $tenantId

    if ($null -ne $toExport -and $toExport -notcontains $name) {
        Write-Host ("$name is not in chats to export ($($toExport -join ", ")), skipping...")
        continue
    }

    if ($skipIds -contains $chat.id) {
        Write-Host ("$name ($($chat.id)) is in the skip list, skipping...")
        continue
    }

    $messages = Get-Messages $chat $clientId $tenantId

    if (($messages.count -gt 0) -and (-not([string]::isNullorEmpty($name)))) {
        Write-Host -ForegroundColor White ("`r`n$name :: $($messages.count) messages.")

        Write-Host "Downloading profile pictures..."
        foreach ($member in $members) {
            Get-ProfilePicture $member.userId $assetsFolder $clientId $tenantId | Out-Null
        }

        Write-Host "Processing messages..."

        $membersExport = @()
        foreach ($m in $members) {
            $displayName = if ($m.displayName) { $m.displayName } else { (Get-DisplayName $m.userId $clientId $tenantId) }
            $membersExport += @{
                id = $m.userId
                displayName = $displayName
            }
        }

        $messagesExport = @()
        foreach ($message in $messages) {
            $msgObj = ConvertTo-MessageObject $message $me $clientId $tenantId $assetsFolder
            $messagesExport += $msgObj
        }

        $chatExport = @{
            id = $chat.id
            name = $name
            chatType = $chat.chatType
            members = $membersExport
            messages = $messagesExport
        }

        $export.chats += $chatExport
    }
    else {
        Write-Host ("`r`n$name :: No messages found.")
        Write-Host -ForegroundColor Yellow "Skipping..."
    }
}

$file = Join-Path -Path $exportFolder -ChildPath $outputFile

if ($avoidOverwrite -eq $true) {
    Write-Verbose "Avoid overwrite enabled, appending counter if file path is not unique"
    $uniqueFile = $file
    $counter = 1
    $baseName = [IO.Path]::GetFileNameWithoutExtension($file)
    $ext = [IO.Path]::GetExtension($file)
    $dir = [IO.Path]::GetDirectoryName($file)

    while (Test-Path $uniqueFile) {
        $uniqueFile = Join-Path $dir "$baseName ($counter)$ext"
        $counter++
    }
    $file = $uniqueFile
}

Write-Host -ForegroundColor Green "Writing JSON to $file..."
$export | ConvertTo-Json -Depth 20 | Out-File -LiteralPath $file -Encoding utf8

Write-Host -ForegroundColor Cyan "`r`nScript completed after $(((Get-Date) - $start).TotalSeconds)s... Bye!"
