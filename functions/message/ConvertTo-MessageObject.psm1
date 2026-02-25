[cmdletbinding()]
Param([bool]$verbose)
$VerbosePreference = if ($verbose) { 'Continue' } else { 'SilentlyContinue' }

function ConvertTo-MessageObject ($message, $me, $clientId, $tenantId, $assetsFolder) {
    $time = $message.createdDateTime
    $fromIdentity = if ($message.from.user) {
        @{
            id = $message.from.user.id
            displayName = if ($message.from.user.displayName) { $message.from.user.displayName } else { (Get-DisplayName $message.from.user.id $clientId $tenantId) }
        }
    } elseif ($message.from.application) {
        @{
            id = $message.from.application.id
            displayName = if ($null -ne $message.from.application.displayName) { $message.from.application.displayName } else { "An application" }
        }
    } else {
        @{ id = $null; displayName = "Unknown" }
    }

    $baseObject = @{
        id = $message.id
        messageType = $message.messageType
        createdDateTime = $time
        from = $fromIdentity
        importance = $message.importance
        deletedDateTime = $message.deletedDateTime
        lastEditedDateTime = $message.lastEditedDateTime
        isFromMe = ($null -ne $message.from.user -and $message.from.user.displayName -eq $me.displayName)
    }

    switch ($message.messageType) {
        "message" {
            $messageBody = $message.body.content

            # Download embedded images and replace URLs with local paths
            $imageTagMatches = [Regex]::Matches($messageBody, "<img.+?src=[\`"']https:\/\/graph\.microsoft\.com(.+?)[\`"'].*?>")
            $bodyProcessed = $messageBody
            foreach ($imageTagMatch in $imageTagMatches) {
                Write-Verbose "Downloading embedded image in message..."
                $imagePath = Get-Image $imageTagMatch $assetsFolder $clientId $tenantId
                $bodyProcessed = $bodyProcessed.Replace($imageTagMatch.Groups[0], "<img src=`"$imagePath`" style=`"width: 100%;`" >")
            }

            $baseObject["body"] = @{
                contentType = $message.body.contentType
                content = $message.body.content
                contentProcessed = $bodyProcessed
            }

            $attachments = @()
            $fileAttachments = $message.attachments | Where-Object { $_.contentType -eq "reference" }
            foreach ($att in $fileAttachments) {
                $attachments += @{
                    name = $att.name
                    contentUrl = $att.contentUrl
                    contentType = $att.contentType
                }
            }
            $baseObject["attachments"] = $attachments

            Break
        }
        "systemEventMessage" {
            $systemEvent = ConvertTo-SystemEventObject $message.eventDetail $clientId $tenantId
            $baseObject["systemEvent"] = $systemEvent
            $baseObject["body"] = @{
                contentType = "text"
                content = $systemEvent.description
            }
            $baseObject["attachments"] = @()

            Break
        }
        Default {
            Write-Warning "Unhandled message type: $($message.messageType)"
            $baseObject["body"] = @{
                contentType = $message.body.contentType
                content = $message.body.content
            }
        }
    }

    [PSCustomObject]$baseObject
}
