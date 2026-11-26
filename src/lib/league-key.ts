/** A Yahoo league key such as "461.l.394957" is `<gameId>.l.<leagueId>`. */
export interface LeagueKeyParts {
  gameId: number;
  leagueId: number;
}

const LEAGUE_KEY = /^(\d+)\.l\.(\d+)$/;

export function isLeagueKey(value: string): boolean {
  return LEAGUE_KEY.test(value);
}

export function parseLeagueKey(leagueKey: string): LeagueKeyParts {
  const match = LEAGUE_KEY.exec(leagueKey);
  if (!match) {
    throw new Error(`Not a Yahoo league key: "${leagueKey}"`);
  }
  return { gameId: Number(match[1]), leagueId: Number(match[2]) };
}
