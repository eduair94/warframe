# warframe.market egress through a home PC (2026-11-20). Runs on the owner's
# always-on OMEN 15; the laptop that carried it first is retired.
#
# Opens a reverse *dynamic* SSH forward to the sync host: sshd on .10 listens on
# 127.0.0.1:<port>, and this PC's ssh client acts as the SOCKS server, so the
# price sync's warframe.market requests leave from this PC's residential IP.
# PermitRemoteOpen limits that SOCKS server to api/ws.warframe.market:443, so
# nobody on the sync host can reach this PC's LAN or any other site through it.
#
# The key is restricted on the sync host (runbook §4): it may bind only its own
# listener and its forced command only frees that listener. It grants no shell.
# The sync host's SOCKS failover (services/SocksFailover.ts) prefers this tunnel
# and falls back to the gsearch egress while the PC is off.
#
# Install: install-task.ps1 (scheduled task at boot, no logon needed).
# Log: tunnel.log next to this script.
param(
  [string]$Listen = '127.0.0.1:27041',
  [string]$Key = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.ssh\warframe_egress'),
  [string]$Target = 'root@167.148.41.10',
  [string]$Port = '2223'
)

$ErrorActionPreference = 'Continue'

# One tunnel per machine, whether started by the boot task (session 0) or by hand.
$mutex = New-Object System.Threading.Mutex($false, 'Global\WarframeEgressTunnel')
if (-not $mutex.WaitOne(0)) { exit 0 }   # already running

$Ssh        = Join-Path $env:WINDIR 'System32\OpenSSH\ssh.exe'
$Log        = Join-Path $PSScriptRoot 'tunnel.log'
$KnownHosts = Join-Path $PSScriptRoot 'known_hosts'
$Common = @(
  '-i', $Key, '-o', 'IdentitiesOnly=yes', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
  '-o', "UserKnownHostsFile=$KnownHosts", '-o', 'StrictHostKeyChecking=yes', '-p', $Port
)

function Write-Log([string]$Message) {
  Add-Content -Path $Log -Value ("{0} {1}" -f (Get-Date -Format 's'), $Message)
  if ((Get-Item $Log).Length -gt 1MB) { Move-Item -Force $Log "$Log.1" }
}

Write-Log "tunnel loop started ($Listen)"
while ($true) {
  # Same key without -N: sshd runs the key's forced command, which frees a
  # listener left by a stale session of ours (sshd keeps it for ~2 h after a
  # dropped connection, and the new session could not bind it until then).
  & $Ssh -T @Common $Target 2>&1 | Out-Null

  Write-Log 'connecting'
  & $Ssh -N -T @Common -o ExitOnForwardFailure=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=3 `
    -o 'PermitRemoteOpen=api.warframe.market:443 ws.warframe.market:443' `
    -R $Listen $Target 2>&1 | ForEach-Object { Write-Log "ssh: $_" }
  Write-Log "ssh exited ($LASTEXITCODE); reconnecting in 15 s"
  Start-Sleep -Seconds 15
}
