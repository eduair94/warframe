// Optional fixed, private SOCKS egress for warframe.market. The SSH key on the
// egress host permits forwarding only to api.warframe.market:443, never a shell.
// Both the API and sync hosts use their own loopback listener. PM2 restarts SSH
// after a dropped connection; keepalives detect a dead link within 45 seconds.
require("dotenv").config();

const target = process.env.WFM_EGRESS_SSH_TARGET;
const key = process.env.WFM_EGRESS_SSH_KEY;
const port = process.env.WFM_EGRESS_PORT || "27028";
if (target && (!key || !/^\d+$/.test(port) || +port < 1 || +port > 65535)) {
  throw new Error("WFM egress requires WFM_EGRESS_SSH_KEY and a valid WFM_EGRESS_PORT");
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
      "-i", key, "-D", `127.0.0.1:${port}`, target,
    ],
    autorestart: true,
    restart_delay: 5000,
    log_date_format: "YYYY-MM-DD HH:mm Z",
  }] : [],
};
