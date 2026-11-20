// Optional fixed, private SOCKS egress for warframe.market. The SSH key on the
// egress host permits forwarding only to api.warframe.market:443, never a shell.
// Both the API and sync hosts use their own loopback listener. PM2 restarts SSH
// after a dropped connection; keepalives detect a dead link within 45 seconds.
// WFM_EGRESS_SSH_PORT selects a non-standard sshd port on the egress host
// (gsearch, 104.234.204.107, listens on 2223 only).
require("dotenv").config();

const target = process.env.WFM_EGRESS_SSH_TARGET;
const key = process.env.WFM_EGRESS_SSH_KEY;
const port = process.env.WFM_EGRESS_PORT || "27028";
const sshPort = process.env.WFM_EGRESS_SSH_PORT || "";
const validPort = (p) => /^\d+$/.test(p) && +p >= 1 && +p <= 65535;
if (target && (!key || !validPort(port) || (sshPort && !validPort(sshPort)))) {
  throw new Error("WFM egress requires WFM_EGRESS_SSH_KEY, a valid WFM_EGRESS_PORT and, if set, a valid WFM_EGRESS_SSH_PORT");
}

module.exports = {
  apps: target ? [{
    name: "warframe-egress-proxy",
    script: "ssh",
    interpreter: "none",
    args: [
      "-N", "-T", "-o", "BatchMode=yes",
      "-o", "IdentitiesOnly=yes", "-o", "ConnectTimeout=15",
      "-o", "ServerAliveInterval=15", "-o", "ServerAliveCountMax=3",
      "-o", "ExitOnForwardFailure=yes",
      "-o", "StrictHostKeyChecking=accept-new",
      ...(sshPort ? ["-p", sshPort] : []),
      "-i", key, "-D", `127.0.0.1:${port}`, target,
    ],
    autorestart: true,
    restart_delay: 5000,
    log_date_format: "YYYY-MM-DD HH:mm Z",
  }] : [],
};
