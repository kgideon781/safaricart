import "server-only";

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, scope: string, msg: string, fields?: Record<string, unknown>) {
  const payload = {
    level,
    scope,
    msg,
    time: new Date().toISOString(),
    ...fields,
  };
  // Single-line JSON keeps logs greppable in Vercel and most aggregators.
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logger(scope: string) {
  return {
    debug: (msg: string, fields?: Record<string, unknown>) => emit("debug", scope, msg, fields),
    info: (msg: string, fields?: Record<string, unknown>) => emit("info", scope, msg, fields),
    warn: (msg: string, fields?: Record<string, unknown>) => emit("warn", scope, msg, fields),
    error: (msg: string, fields?: Record<string, unknown>) => emit("error", scope, msg, fields),
  };
}
