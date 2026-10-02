// Minimal structured logger: one JSON object per line on stdout/stderr, which
// any log drain (Vercel, Fly, Docker, CloudWatch…) can ingest. Log ids, not
// personal data.

type Level = "debug" | "info" | "warn" | "error";
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const configured = process.env.LOG_LEVEL as Level | undefined;
  return order[configured ?? "info"] ?? order.info;
}

function serializeError(err: unknown) {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  return { message: String(err) };
}

function write(level: Level, msg: string, context?: Record<string, unknown>) {
  if (order[level] < threshold()) return;
  const entry: Record<string, unknown> = { time: new Date().toISOString(), level, msg };
  if (context) {
    for (const [k, v] of Object.entries(context)) entry[k] = k === "err" ? serializeError(v) : v;
  }
  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => write("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => write("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => write("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => write("error", msg, ctx),
};
