# Registers pc-egress-tunnel.ps1 as a scheduled task that starts at boot, with
# or without anyone logged on (S4U: no stored password), comes back if it dies
# and never times out. Run once, elevated, from the folder that holds both
# scripts (e.g. %LOCALAPPDATA%\warframe-egress). Re-running replaces the task.
#
# Remove: Unregister-ScheduledTask -TaskName WarframeEgressTunnel -Confirm:$false
$ErrorActionPreference = 'Stop'

$TaskName = 'WarframeEgressTunnel'
$Script   = Join-Path $PSScriptRoot 'pc-egress-tunnel.ps1'
if (-not (Test-Path $Script)) { throw "missing $Script" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Script`""
# Task Scheduler's "restart on failure" only covers a failure to START, not a
# process that dies later, so a 5-minute watchdog trigger relaunches it; while
# the loop runs, IgnoreNew (and the script's own mutex) drops the extra start.
$watchdog = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)
$trigger = @((New-ScheduledTaskTrigger -AtStartup), $watchdog)
# The token's own name: over an SSH session $env:USERDOMAIN does not map to the
# account (Register-ScheduledTask fails with 0x80070534).
$user = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType S4U -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal `
  -Settings $settings -Description 'warframe.market egress tunnel for the price sync (see docs/runbook-outage.md)' -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
