' Starts pc-egress-tunnel.ps1 without a console window. Put a copy in the
' Startup folder (shell:startup) so the tunnel comes back after a reboot.
Set sh = CreateObject("WScript.Shell")
ps1 = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%\warframe-egress\pc-egress-tunnel.ps1")
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ps1 & """", 0, False
