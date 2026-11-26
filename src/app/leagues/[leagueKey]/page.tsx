import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ApiErrorNotice } from "@/components/api-error-notice";
import {
  getLeagues,
  getTeams,
  getTransactions,
  type League,
  type Team,
  type Transaction,
} from "@/lib/java-api";
import { isLeagueKey, parseLeagueKey } from "@/lib/league-key";

const RECENT_TRANSACTIONS = 25;

type Params = PageProps<"/leagues/[leagueKey]">["params"];

async function leagueKeyFrom(params: Params): Promise<string> {
  const { leagueKey } = await params;
  const decoded = decodeURIComponent(leagueKey);
  if (!isLeagueKey(decoded)) notFound();
  return decoded;
}

// `params` is request-time data with Cache Components, so it is only read inside
// <Suspense> boundaries; the page shell itself is prerendered.
export default function LeaguePage(props: PageProps<"/leagues/[leagueKey]">) {
  return (
    <div className="space-y-10">
      <Suspense fallback={<div className="h-8 w-64 rounded bg-black/5 dark:bg-white/10" />}>
        <LeagueHeader params={props.params} />
      </Suspense>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Teams</h2>
        <Suspense fallback={<p className="text-zinc-500">Loading teams…</p>}>
          <TeamsTable params={props.params} />
        </Suspense>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent transactions</h2>
        <Suspense fallback={<p className="text-zinc-500">Loading transactions…</p>}>
          <TransactionsList params={props.params} />
        </Suspense>
      </section>
    </div>
  );
}

async function LeagueHeader({ params }: { params: Params }) {
  const leagueKey = await leagueKeyFrom(params);
  await connection();

  let league: League | undefined;
  try {
    league = (await getLeagues()).find((l) => l.leagueKey === leagueKey);
  } catch (error) {
    return <ApiErrorNotice what="the league" error={error} />;
  }
  if (!league) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{league.leagueName}</h1>
      <p className="text-sm text-zinc-500">
        {league.season} season · {league.numberOfTeams} teams · {league.leagueKey}
      </p>
    </div>
  );
}

async function TeamsTable({ params }: { params: Params }) {
  const leagueKey = await leagueKeyFrom(params);
  await connection();

  let teams: Team[];
  try {
    teams = await getTeams(leagueKey);
  } catch (error) {
    return <ApiErrorNotice what="teams" error={error} />;
  }
  if (teams.length === 0) {
    return <p className="text-zinc-500">No team data has been loaded for this league.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
      <table className="w-full text-left text-sm">
        <thead className="bg-black/[.03] text-zinc-500 dark:bg-white/[.06]">
          <tr>
            <th className="px-3 py-2 font-medium">Team</th>
            <th className="px-3 py-2 font-medium">Manager</th>
            <th className="px-3 py-2 text-right font-medium">Draft pick</th>
            <th className="px-3 py-2 font-medium">Draft grade</th>
            <th className="px-3 py-2 text-right font-medium">Moves</th>
            <th className="px-3 py-2 text-right font-medium">Trades</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/10">
          {teams.map((team) => (
            <tr key={team.teamKey}>
              <td className="px-3 py-2">
                <span className="flex items-center gap-2">
                  {team.teamLogo && (
                    <Image
                      src={team.teamLogo}
                      alt=""
                      width={24}
                      height={24}
                      className="rounded"
                    />
                  )}
                  {team.teamName}
                </span>
              </td>
              <td className="px-3 py-2">{team.managerNicknames ?? "—"}</td>
              <td className="px-3 py-2 text-right">{team.draftPosition ?? "—"}</td>
              <td className="px-3 py-2">{team.draftGrade ?? "—"}</td>
              <td className="px-3 py-2 text-right">{team.numberOfMoves ?? "—"}</td>
              <td className="px-3 py-2 text-right">{team.numberOfTrades ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function TransactionsList({ params }: { params: Params }) {
  const leagueKey = await leagueKeyFrom(params);
  await connection();

  let transactions: Transaction[];
  try {
    transactions = await getTransactions(parseLeagueKey(leagueKey).leagueId);
  } catch (error) {
    return <ApiErrorNotice what="transactions" error={error} />;
  }
  if (transactions.length === 0) {
    return <p className="text-zinc-500">No transactions found for this league.</p>;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });

  return (
    <ul className="divide-y divide-black/5 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
      {transactions.slice(0, RECENT_TRANSACTIONS).map((t, index) => (
        <li
          key={`${t.transactionTime}-${t.playerName}-${index}`}
          className="flex items-center gap-3 px-3 py-2 text-sm"
        >
          {t.playerHeadshot ? (
            <Image
              src={t.playerHeadshot}
              alt=""
              width={32}
              height={32}
              className="rounded-full bg-black/5 dark:bg-white/10"
            />
          ) : (
            <span className="size-8 rounded-full bg-black/5 dark:bg-white/10" />
          )}
          <span className="flex-1">
            <span className="font-medium">{t.playerName}</span>
            {t.playerTeam && <span className="text-zinc-500"> · {t.playerTeam}</span>}
            <span className="block text-xs text-zinc-500">
              {t.transactionType}
              {t.destinationTeam ? ` → ${t.destinationTeam}` : ""}
            </span>
          </span>
          <time dateTime={t.transactionTime} className="text-xs text-zinc-500">
            {formatter.format(new Date(t.transactionTime))}
          </time>
        </li>
      ))}
    </ul>
  );
}
