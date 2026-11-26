// Server-side JSON logger. One JSON object per line on stdout, shaped for Datadog:
// `message`, a string `level`, ISO `timestamp` (a default Datadog date attribute) and
// `service`. When the Datadog Node tracer is injected (single-step instrumentation) with
// DD_LOGS_INJECTION=true, it adds dd.trace_id / dd.span_id to every line, linking logs to
// traces. pino is in Next.js's default serverExternalPackages, so the tracer can hook it.
import pino, { type DestinationStream, type LoggerOptions } from "pino";

export const loggerOptions: LoggerOptions = {
  base: { service: process.env.DD_SERVICE ?? "curryware-front-end" },
  messageKey: "message",
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => ({ level: label }),
  },
  level: process.env.LOG_LEVEL ?? "info",
};

export function createLogger(destination?: DestinationStream) {
  return destination ? pino(loggerOptions, destination) : pino(loggerOptions);
}

export const logger = createLogger();

/** Datadog standard error attributes (`error.kind`, `error.message`, `error.stack`). */
export interface ErrorAttributes {
  error: { kind: string; message: string; stack?: string; cause?: string };
}

/** Datadog standard error attributes for an unknown thrown value. */
export function errorAttributes(error: unknown): ErrorAttributes {
  if (error instanceof Error) {
    return {
      error: {
        kind: error.name,
        message: error.message,
        stack: error.stack,
        // Node's fetch reports the real reason (e.g. ECONNREFUSED) only in `cause`.
        ...(error.cause !== undefined && { cause: describeCause(error.cause) }),
      },
    };
  }
  return { error: { kind: typeof error, message: String(error) } };
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) {
    const code = (cause as Error & { code?: unknown }).code;
    return code ? `${String(code)}: ${cause.message}` : cause.message;
  }
  return String(cause);
}
