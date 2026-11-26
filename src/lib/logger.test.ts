import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger, errorAttributes } from "./logger";

describe("errorAttributes", () => {
  it("maps an Error to Datadog's error.kind / error.message / error.stack", () => {
    const attrs = errorAttributes(new TypeError("boom"));
    expect(attrs.error.kind).toBe("TypeError");
    expect(attrs.error.message).toBe("boom");
    expect(attrs.error.stack).toContain("TypeError: boom");
  });

  it("includes the cause, with its code, as Node's fetch reports it", () => {
    const cause = Object.assign(new Error("connect ECONNREFUSED 192.168.11.181:443"), {
      code: "ECONNREFUSED",
    });
    const attrs = errorAttributes(new TypeError("fetch failed", { cause }));
    expect(attrs.error).toMatchObject({
      message: "fetch failed",
      cause: "ECONNREFUSED: connect ECONNREFUSED 192.168.11.181:443",
    });
  });

  it("omits cause when there is none", () => {
    expect(errorAttributes(new Error("x")).error).not.toHaveProperty("cause");
  });

  it("handles thrown non-Error values", () => {
    expect(errorAttributes("nope")).toEqual({
      error: { kind: "string", message: "nope" },
    });
  });
});

describe("log line format", () => {
  it("writes one Datadog-shaped JSON object per line", () => {
    const lines: string[] = [];
    const sink = new Writable({
      write(chunk, _encoding, done) {
        lines.push(String(chunk));
        done();
      },
    });
    const log = createLogger(sink);
    // LOG_LEVEL is "silent" in the test environment; turn this logger back on.
    log.level = "info";

    log.warn({ java_api: { path: "/v1/x", status: 503 } }, "Java API returned an error status");

    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]);
    expect(entry).toMatchObject({
      level: "warn",
      // DD_SERVICE wins when set (the image sets it; so may a developer machine).
      service: process.env.DD_SERVICE ?? "curryware-front-end",
      message: "Java API returned an error status",
      java_api: { path: "/v1/x", status: 503 },
    });
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
    expect(entry).not.toHaveProperty("time");
    expect(entry).not.toHaveProperty("msg");
  });
});
