#!/bin/sh
# Installed on the sync host (.10) as /usr/local/sbin/warframe-pc-egress-free.
# Frees 127.0.0.1:27040 when the PC's previous reverse-tunnel session went stale
# (PC slept or lost its connection): sshd keeps that session's listener until TCP
# keepalive gives up (~2 h), and the PC's new session cannot bind it until then.
# Called by scripts/pc-egress/pc-egress-tunnel.ps1 before each reconnect.
pids=$(ss -Hltnp 'sport = :27040' | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)
[ -n "$pids" ] && kill $pids
exit 0
