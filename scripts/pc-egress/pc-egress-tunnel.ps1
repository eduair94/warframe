# Temporary warframe.market egress through the owner's PC (2026-11-20).
#
# Opens a reverse *dynamic* SSH forward to the sync host: sshd on .10 listens on
# 127.0.0.1:27040, and this PC's ssh client acts as the SOCKS server, so the
# price sync's warframe.market requests leave from this PC's residential IP.
# PermitRemoteOpen limits that SOCKS server to api/ws.warframe.market:443, so
# nobody on the sync host can reach this PC's LAN or any other site through it.
# The key is restricted on the server side to that one listener (see runbook).
#
# The sync host's SOCKS failover (services/SocksFailover.ts) prefers this tunnel
# and falls back to the gsearch egress while the PC is off or asleep.
#
# Install: copy this file and start-hidden.vbs to %LOCALAPPDATA%\warframe-egress\
# and start-hidden.vbs to the Startup folder (shell:startup). Log:
# %LOCALAPPDATA%\warframe-egress\tunnel.log

$ErrorActionPreference = 'Continue'

$mutex = New-Object System.Threading.Mutex($false, 'Local\WarframeEgressTunnel')
if (-not $mutex.WaitOne(0)) { exit 0 }   # already running

$Ssh       = Join-Path $env:WINDIR 'System32\OpenSSH\ssh.exe'
$Key       = Join-Path $env:USERPROFILE '.ssh\warframe_pc_egress'
$Target    = 'root@167.148.41.10'
$Port      = '2223'
$Listen    = '127.0.0.1:27040'
$AdminHost = 'build'   # ~/.ssh/config alias with shell access, only used to free a stale listener
$LogDir    = Join-Path $env:LOCALAPPDATA 'warframe-egress'
$Log       = Join-Path $LogDir 'tunnel.log'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log([string]$Message) {
  Add-Content -Path $Log -Value ("{0} {1}" -f (Get-Date -Format 's'), $Message)
  if ((Get-Item $Log).Length -gt 1MB) { Move-Item -Force $Log "$Log.1" }
}

Write-Log 'tunnel loop started'
while ($true) {
  # A previous session can leave sshd holding the listener for ~2 h after the
  # PC slept; the new session could not bind it until then.
  & $Ssh -o BatchMode=yes -o ConnectTimeout=15 $AdminHost /usr/local/sbin/warframe-pc-egress-free 2>&1 | Out-Null

  Write-Log 'connecting'
  & $Ssh -N -T -i $Key -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=15 `
    -o ExitOnForwardFailure=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=3 `
    -o StrictHostKeyChecking=accept-new `
    -o 'PermitRemoteOpen=api.warframe.market:443 ws.warframe.market:443' `
    -p $Port -R $Listen $Target 2>&1 | ForEach-Object { Write-Log "ssh: $_" }
  Write-Log "ssh exited ($LASTEXITCODE); reconnecting in 15 s"
  Start-Sleep -Seconds 15
}
