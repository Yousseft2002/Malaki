import type { Instrumentation } from "next";

// Server error monitoring without vendor lock-in: every uncaught server error
// is logged as structured JSON, and optionally POSTed to ERROR_WEBHOOK_URL
// (any service that accepts a JSON webhook: Slack/Discord incoming webhooks,
// a self-hosted collector, etc.). Request headers are deliberately not sent
// because they contain cookies.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const digest = typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : undefined;
  const report = {
    time: new Date().toISOString(),
    level: "error",
    msg: "request.error",
    err: { name: error.name, message: error.message, stack: error.stack },
    digest,
    method: request.method,
    path: request.path.split("?")[0],
    routePath: context.routePath,
    routeType: context.routeType,
  };
  console.error(JSON.stringify(report));

  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `MALAKI error on ${report.routePath}: ${error.message}`, ...report }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Never let error reporting break the request.
  }
};
