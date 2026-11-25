// Runs in the browser before the app becomes interactive (Next.js
// instrumentation-client convention): starts Datadog RUM.
//
// The NEXT_PUBLIC_DD_* values are inlined at build time (.env.production and the
// NEXT_PUBLIC_DD_VERSION Docker build arg). RUM stays off when no application id is
// set, which is the case for `npm run dev`.
import { datadogRum } from "@datadog/browser-rum";

const applicationId = process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID;
const clientToken = process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN;

if (applicationId && clientToken) {
  try {
    datadogRum.init({
      applicationId,
      clientToken,
      site: "datadoghq.com",
      service: "curryware-front-end-js",
      env: process.env.NEXT_PUBLIC_DD_ENV ?? "prod",
      version: process.env.NEXT_PUBLIC_DD_VERSION,
      sessionSampleRate: 100,
      sessionReplaySampleRate: 100,
      trackLongTasks: true,
      defaultPrivacyLevel: "mask-user-input",
      // Add trace headers to requests to this app's own server (page navigations,
      // RSC payloads, /api routes) so RUM views connect to the curryware-front-end
      // APM traces, and through them to curryware-java-api-server.
      allowedTracingUrls: [(url) => url.startsWith(window.location.origin)],
    });
  } catch (error) {
    // Monitoring must never break the app.
    console.warn("Datadog RUM failed to start", error);
  }
}
