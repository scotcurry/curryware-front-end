// Liveness/readiness probe for Kubernetes. Static on purpose: it only proves the
// Next.js server is up, and doesn't depend on the Java API.
export function GET() {
  return Response.json({ status: "ok" });
}
