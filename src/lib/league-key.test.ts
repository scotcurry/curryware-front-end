import { describe, expect, it } from "vitest";
import { isLeagueKey, parseLeagueKey } from "./league-key";

describe("parseLeagueKey", () => {
  it("splits a Yahoo league key into game and league ids", () => {
    expect(parseLeagueKey("461.l.394957")).toEqual({
      gameId: 461,
      leagueId: 394957,
    });
  });

  it.each(["", "461.394957", "461.l.", "abc.l.123", "461.l.394957.t.1"])(
    "rejects %j",
    (value) => {
      expect(isLeagueKey(value)).toBe(false);
      expect(() => parseLeagueKey(value)).toThrow(/Not a Yahoo league key/);
    },
  );
});
