import { connection } from "next/server";

// Datadog demo: an unhandled server-side error, which should appear in APM and
// Error Tracking for the curryware-front-end service.
export async function GET() {
  // Run at request time; without this the handler would be prerendered at build.
  await connection();
  throw new Error("Intentional error from curryware-front-end (/api/throw-error)");
}
