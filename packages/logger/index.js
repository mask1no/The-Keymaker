const fs = require('fs');

const LOG_FILE = process.env.LOG_FILE || "./apps/daemon/keymaker.ndjson";
let stream = null;
try {
  stream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
} catch {}

function fmt(level, msg, extra) {
  const ts = new Date().toISOString();
  const payload = JSON.stringify({ ts, level, msg, ...(extra || {}) });
  try { stream && stream.write(payload + "\n"); } catch {}
  return payload;
}

const logger = {
  debug: (msg, extra) => console.debug(fmt('debug', msg, extra)),
  info: (msg, extra) => console.info(fmt('info', msg, extra)),
  warn: (msg, extra) => console.warn(fmt('warn', msg, extra)),
  error: (msg, extra) => console.error(fmt('error', msg, extra)),
};

module.exports = { logger };


