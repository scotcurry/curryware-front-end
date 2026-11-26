/** Inline message for a page section whose Java API call failed. */
export function ApiErrorNotice({
  what,
  error,
}: {
  what: string;
  error: unknown;
}) {
  const detail = error instanceof Error ? error.message : String(error);
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <p className="font-medium">Couldn&apos;t load {what}.</p>
      <p className="mt-1 font-mono text-xs opacity-80">{detail}</p>
    </div>
  );
}
