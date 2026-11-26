import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLeagues, getTeams, getTransactions, JavaApiError } from "./java-api";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("JAVA_API_BASE_URL", "http://java.test:8080/");
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function respondWith(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function requestedUrl(): string {
  return String(fetchMock.mock.calls[0][0]);
}

describe("java-api", () => {
  it("calls the /v1 endpoints under JAVA_API_BASE_URL (trailing slash trimmed)", async () => {
    respondWith([]);
    await getLeagues();
    expect(requestedUrl()).toBe("http://java.test:8080/v1/game_info/get_game_info");
  });

  it("encodes the league key in the teams path", async () => {
    respondWith([]);
    await getTeams("461.l.394957");
    expect(requestedUrl()).toBe(
      "http://java.test:8080/v1/team_info/get_teams/461.l.394957",
    );
  });

  it("sends leagueId and a whole-second transactionTime", async () => {
    respondWith([]);
    await getTransactions(13407, 1735689600.9);
    const url = new URL(requestedUrl());
    expect(url.pathname).toBe("/v1/transactions/get_transactions");
    expect(url.searchParams.get("leagueId")).toBe("13407");
    expect(url.searchParams.get("transactionTime")).toBe("1735689600");
  });

  it("returns the parsed JSON body", async () => {
    const leagues = [{ leagueKey: "461.l.394957", season: 2025 }];
    respondWith(leagues);
    await expect(getLeagues()).resolves.toEqual(leagues);
  });

  it("raises JavaApiError with the status for non-2xx responses", async () => {
    respondWith({ error: "Database unavailable." }, 503);
    const error = await getLeagues().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(JavaApiError);
    expect(error).toMatchObject({ status: 503 });
  });

  it("raises JavaApiError when the request itself fails", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(getLeagues()).rejects.toThrow(/Java API request failed/);
  });

  it("raises JavaApiError when JAVA_API_BASE_URL is not set", async () => {
    vi.stubEnv("JAVA_API_BASE_URL", "");
    await expect(getLeagues()).rejects.toThrow(/JAVA_API_BASE_URL is not set/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
