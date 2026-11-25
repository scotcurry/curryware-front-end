// Server instrumentation (Next.js instrumentation convention). Datadog APM itself is
// injected by single-step instrumentation in the cluster, so nothing is registered here;
// onRequestError logs every server error as structured JSON so it shows up in Datadog
// Logs (with trace ids) and Error Tracking.
import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logger, errorAttributes } = await import("@/lib/logger");

  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  logger.error(
    {
      ...errorAttributes(error),
      http: { method: request.method, url_details: { path: request.path } },
      next: {
        route_path: context.routePath,
        route_type: context.routeType,
        render_source: context.renderSource,
        digest,
      },
    },
    `Unhandled error in ${context.routeType} ${context.routePath}`,
  );
};
