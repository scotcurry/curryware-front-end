import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ApiErrorNotice } from "@/components/api-error-notice";
import { getLeagues, type League } from "@/lib/java-api";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Leagues</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading leagues…</p>}>
        <LeaguesBySeason />
      </Suspense>
    </div>
  );
}

async function LeaguesBySeason() {
  // Read JAVA_API_BASE_URL and fetch at request time, not during the build.
  await connection();

  let leagues: League[];
  try {
    leagues = await getLeagues();
  } catch (error) {
    return <ApiErrorNotice what="leagues" error={error} />;
  }

  const seasons = Map.groupBy(leagues, (league) => league.season);
  const ordered = [...seasons.entries()].sort(([a], [b]) => b - a);

  return (
    <div className="space-y-8">
      {ordered.map(([season, seasonLeagues]) => (
        <section key={season}>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            {season}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {seasonLeagues.map((league) => (
              <li key={league.leagueKey}>
                <Link
                  href={`/leagues/${league.leagueKey}`}
                  className="block rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.06]"
                >
                  <span className="block font-medium">{league.leagueName}</span>
                  <span className="text-sm text-zinc-500">
                    {league.numberOfTeams} teams · {league.leagueKey}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
