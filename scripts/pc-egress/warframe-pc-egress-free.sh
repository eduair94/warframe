#!/bin/sh
# Installed on the sync host (.10) as /usr/local/sbin/warframe-pc-egress-free.
# Frees 127.0.0.1:<port> (default 27041) when a home PC's previous reverse-tunnel
# session went stale (PC slept or lost its connection): sshd keeps that
# session's listener until TCP keepalive gives up (~2 h), and the PC's new
# session cannot bind it until then.
#
# It is the FORCED COMMAND of the PC's tunnel key in root's authorized_keys
# (command="/usr/local/sbin/warframe-pc-egress-free 27041"), so the PC frees
# its own listener by connecting with that key without -N; the key grants no
# shell. scripts/pc-egress/pc-egress-tunnel.ps1 does that before each reconnect.
port="${1:-27041}"
case "$port" in
  ''|*[!0-9]*) echo "bad port: $port" >&2; exit 2 ;;
esac
pids=$(ss -Hltnp "sport = :$port" | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)
[ -n "$pids" ] && kill $pids
exit 0
