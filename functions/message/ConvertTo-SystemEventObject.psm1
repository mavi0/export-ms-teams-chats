[cmdletbinding()]
Param([bool]$verbose)
$VerbosePreference = if ($verbose) { 'Continue' } else { 'SilentlyContinue' }

function ConvertTo-SystemEventObject ($eventDetail, $clientId, $tenantId) {
    $base = @{
        type = $eventDetail."@odata.type"
        description = $null
    }

    switch ($eventDetail."@odata.type") {
        "#microsoft.graph.callEndedEventMessageDetail" {
            $base["description"] = "Call ended after $($eventDetail.callDuration)."
            $base["callDuration"] = $eventDetail.callDuration
            Break
        }
        "#microsoft.graph.callStartedEventMessageDetail" {
            $base["initiator"] = (Get-Initiator $eventDetail.initiator $clientId $tenantId)
            $base["description"] = "$($base.initiator) started a call."
            Break
        }
        "#microsoft.graph.chatRenamedEventMessageDetail" {
            $base["initiator"] = (Get-Initiator $eventDetail.initiator $clientId $tenantId)
            $base["chatDisplayName"] = $eventDetail.chatDisplayName
            $base["description"] = "$($base.initiator) changed the chat name to $($eventDetail.chatDisplayName)."
            Break
        }
        "#microsoft.graph.membersAddedEventMessageDetail" {
            $base["initiator"] = (Get-Initiator $eventDetail.initiator $clientId $tenantId)
            $base["members"] = ($eventDetail.members | ForEach-Object { @{ id = $_.id; displayName = (Get-DisplayName $_.id $clientId $tenantId) } })
            $base["description"] = "$($base.initiator) added $(($base.members | ForEach-Object { $_.displayName }) -join ', ')."
            Break
        }
        "#microsoft.graph.membersDeletedEventMessageDetail" {
            $base["initiator"] = (Get-Initiator $eventDetail.initiator $clientId $tenantId)
            $base["members"] = ($eventDetail.members | ForEach-Object { @{ id = $_.id; displayName = (Get-DisplayName $_.id $clientId $tenantId) } })
            if (($eventDetail.members.count -eq 1) -and ($null -ne $eventDetail.initiator.user) -and ($eventDetail.initiator.user.id -eq $eventDetail.members[0].id)) {
                $base["description"] = "$($base.members[0].displayName) left."
            } else {
                $base["description"] = "$($base.initiator) removed $(($base.members | ForEach-Object { $_.displayName }) -join ', ')."
            }
            Break
        }
        "#microsoft.graph.messagePinnedEventMessageDetail" {
            $base["initiator"] = (Get-Initiator $eventDetail.initiator $clientId $tenantId)
            $base["description"] = "$($base.initiator) pinned a message."
            Break
        }
        "#microsoft.graph.messageUnpinnedEventMessageDetail" {
            $base["initiator"] = (Get-Initiator $eventDetail.initiator $clientId $tenantId)
            $base["description"] = "$($base.initiator) unpinned a message."
            Break
        }
        "#microsoft.graph.teamsAppInstalledEventMessageDetail" {
            $base["initiator"] = (Get-Initiator $eventDetail.initiator $clientId $tenantId)
            $base["teamsAppDisplayName"] = $eventDetail.teamsAppDisplayName
            $base["description"] = "$($base.initiator) added $($eventDetail.teamsAppDisplayName) here."
            Break
        }
        "#microsoft.graph.teamsAppRemovedEventMessageDetail" {
            $base["initiator"] = (Get-Initiator $eventDetail.initiator $clientId $tenantId)
            $base["teamsAppDisplayName"] = $eventDetail.teamsAppDisplayName
            $base["description"] = "$($base.initiator) removed $($eventDetail.teamsAppDisplayName)."
            Break
        }
        Default {
            Write-Warning "Unhandled system event type: $($eventDetail.'@odata.type')"
            $base["description"] = "Unhandled system event type $($eventDetail.'@odata.type'): $($eventDetail | ConvertTo-Json -Depth 5)"
            $base["raw"] = $eventDetail
        }
    }

    [PSCustomObject]$base
}
