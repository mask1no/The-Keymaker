type Level = "debug" | "info" | "warn" | "error";

function fmt(level: Level, msg: string, extra?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const base = { ts, level, msg } as Record<string, unknown>;
  const payload = JSON.stringify({ ...base, ...(extra ?? {}) });
  return payload;
}

export const logger = {
  debug: (msg: string, extra?: Record<string, unknown>) => console.debug(fmt("debug", msg, extra)),
  info: (msg: string, extra?: Record<string, unknown>) => console.info(fmt("info", msg, extra)),
  warn: (msg: string, extra?: Record<string, unknown>) => console.warn(fmt("warn", msg, extra)),
  error: (msg: string, extra?: Record<string, unknown>) => console.error(fmt("error", msg, extra))
};


