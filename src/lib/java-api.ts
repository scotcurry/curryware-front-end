// Typed client for curryware-java-api-server. Server-side only: it reads
// JAVA_API_BASE_URL, which is never exposed to the browser.
//
// In the cluster JAVA_API_BASE_URL is the internal Service
// (http://curryware-java-api-server-service:8080); for local development it is the
// public ingress (https://ubuntu-microk8s.curryware.org/java). See .env.development.

import { errorAttributes, logger } from "@/lib/logger";

const REQUEST_TIMEOUT_MS = 10_000;

/** One row of /v1/game_info/get_game_info (all_league_information). */
export interface League {
  leagueKey: string;
  gameId: number;
  leagueId: number;
  leagueName: string;
  leagueLogoUrl: string | null;
  numberOfTeams: number;
  season: number;
  startDate: string | null;
  endWeek: string | null;
  leagueUpdateTimestamp: string | null;
}

/** One row of /v1/team_info/get_teams/{leagueKey} (all_team_information). */
export interface Team {
  teamKey: string;
  teamId: number;
  leagueKey: string;
  teamName: string;
  teamLogo: string | null;
  managerNicknames: string | null;
  draftGrade: string | null;
  draftPosition: number | null;
  numberOfMoves: number | null;
  numberOfTrades: number | null;
  previousSeasonTeamRank: number | null;
}

/** One row of /v1/transactions/get_transactions (one player leg of a transaction). */
export interface Transaction {
  playerName: string;
  playerTeam: string | null;
  playerStatus: string | null;
  playerHeadshot: string | null;
  transactionType: string;
  destinationTeam: string | null;
  /** ISO 8601 timestamp, e.g. "2025-12-31T03:55:24Z". */
  transactionTime: string;
}

export class JavaApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "JavaApiError";
  }
}

function baseUrl(): string {
  const url = process.env.JAVA_API_BASE_URL;
  if (!url) {
    throw new JavaApiError("JAVA_API_BASE_URL is not set");
  }
  return url.replace(/\/+$/, "");
}

async function getJson<T>(path: string): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const started = performance.now();
  const elapsedMs = () => Math.round(performance.now() - started);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logger.warn(
      { ...errorAttributes(error), java_api: { path, duration_ms: elapsedMs() } },
      "Java API request failed",
    );
    throw new JavaApiError(
      `Java API request failed: ${path} (${error instanceof Error ? error.message : String(error)})`,
    );
  }
  if (!response.ok) {
    logger.warn(
      { java_api: { path, status: response.status, duration_ms: elapsedMs() } },
      "Java API returned an error status",
    );
    throw new JavaApiError(
      `Java API returned ${response.status} for ${path}`,
      response.status,
    );
  }
  const body = (await response.json()) as T;
  logger.debug(
    { java_api: { path, status: response.status, duration_ms: elapsedMs() } },
    "Java API request succeeded",
  );
  return body;
}

export function getLeagues(): Promise<League[]> {
  return getJson<League[]>("/v1/game_info/get_game_info");
}

export function getTeams(leagueKey: string): Promise<Team[]> {
  return getJson<Team[]>(
    `/v1/team_info/get_teams/${encodeURIComponent(leagueKey)}`,
  );
}

/** Transactions for a league since a Unix time in seconds (0 = all). */
export function getTransactions(
  leagueId: number,
  sinceUnixSeconds = 0,
): Promise<Transaction[]> {
  const query = new URLSearchParams({
    leagueId: String(leagueId),
    transactionTime: String(Math.floor(sinceUnixSeconds)),
  });
  return getJson<Transaction[]>(`/v1/transactions/get_transactions?${query}`);
}
