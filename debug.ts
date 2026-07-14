// README documents `DEBUG=warframe:*` (debug-package style); the app has no
// dependency on the `debug` package, so that value must be recognized here
// directly. Also accepts the plain `DEBUG=true` used elsewhere in the docs.
const raw = (process.env.DEBUG || "").trim().toLowerCase();

export const DEBUG = raw === "true" || raw === "1" || /^warframe(:|$)/.test(raw);
