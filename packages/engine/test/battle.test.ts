import { describe, expect, it } from "vitest";
import { elementMultiplier, runBattle, type BattleSetup } from "../src/index.js";
import { catalogOf, testCard } from "./helpers.js";

describe("element multipliers", () => {
  it("water beats fire, fire is weak to water, unrelated is neutral", () => {
    expect(elementMultiplier("water", "fire")).toBe(1.5);
    expect(elementMultiplier("fire", "water")).toBe(0.75);
    expect(elementMultiplier("fire", "air")).toBe(1);
  });
});

describe("core combat", () => {
  it("a strong melee attacker destroys the enemy King and wins", () => {
    const attacker = testCard({ id: "attacker", power: 50, moveSpeed: 2, hp: 500 });
    const tinyKing = testCard({ id: "tiny_king", hp: 20, power: 1, attackSpeed: 5 });
    const setup: BattleSetup = {
      seed: 1,
      catalog: catalogOf(attacker, tinyKing),
      a: { owner: "A", placements: [{ cardId: "attacker", x: 3, y: 1 }] },
      b: { owner: "B", placements: [{ cardId: "tiny_king", x: 1, y: 1, king: true }] },
    };
    const result = runBattle(setup);
    expect(result.winner).toBe("A");
    // King HP was 20 × 5 = 100; it must be dead.
    const king = result.finalUnits.find((u) => u.isKing);
    expect(king?.alive).toBe(false);
  });

  it("knockback pushes the target away from the attacker", () => {
    const knocker = testCard({
      id: "knocker",
      power: 5,
      moveSpeed: 0,
      hp: 1000,
      abilities: [{ type: "knockback", trigger: "onHit", params: { slots: 2 } }],
    });
    const dummy = testCard({ id: "dummy", power: 1, moveSpeed: 0, hp: 1000 });
    const setup: BattleSetup = {
      seed: 1,
      catalog: catalogOf(knocker, dummy),
      a: { owner: "A", placements: [{ cardId: "knocker", x: 3, y: 0 }] },
      b: { owner: "B", placements: [{ cardId: "dummy", x: 3, y: 0 }] },
    };
    const result = runBattle(setup);
    const pushed = result.finalUnits.find((u) => u.cardId === "dummy")!;
    // Dummy started at arena col 4; a +2 knockback should shove it further away.
    expect(pushed.col).toBeGreaterThan(5);
  });

  it("splitOnDeath spawns child units when the parent dies", () => {
    const attacker = testCard({ id: "attacker", power: 50, moveSpeed: 2, hp: 500 });
    const splitter = testCard({
      id: "splitter",
      hp: 20,
      power: 5,
      abilities: [
        {
          type: "splitOnDeath",
          trigger: "onDeath",
          params: { count: 2, childHp: 10, childPower: 5 },
        },
      ],
    });
    const setup: BattleSetup = {
      seed: 1,
      catalog: catalogOf(attacker, splitter),
      a: { owner: "A", placements: [{ cardId: "attacker", x: 3, y: 1 }] },
      b: { owner: "B", placements: [{ cardId: "splitter", x: 3, y: 1 }] },
    };
    const result = runBattle(setup);
    expect(result.events.some((e) => e.type === "split")).toBe(true);
    const spawned = result.finalUnits.filter((u) => u.cardId === "__spawn__");
    expect(spawned.length).toBe(2);
  });

  it("a revealed Ground-Floor card fights on after the top card dies", () => {
    const attacker = testCard({ id: "attacker", power: 50, moveSpeed: 2, hp: 500 });
    const top = testCard({ id: "top", hp: 20, power: 5 });
    const bottom = testCard({ id: "bottom", hp: 300, power: 40 });
    const setup: BattleSetup = {
      seed: 1,
      catalog: catalogOf(attacker, top, bottom),
      a: { owner: "A", placements: [{ cardId: "attacker", x: 3, y: 1 }] },
      b: { owner: "B", placements: [{ cardId: "top", x: 3, y: 1, below: "bottom" }] },
    };
    const result = runBattle(setup);
    const reveal = result.events.find((e) => e.type === "reveal");
    expect(reveal?.revealedCardId).toBe("bottom");
  });
});

describe("determinism", () => {
  it("same setup + seed produces a byte-identical event log", () => {
    const makeSetup = (): BattleSetup => {
      const attacker = testCard({ id: "attacker", power: 50, moveSpeed: 2, hp: 500 });
      const splitter = testCard({
        id: "splitter",
        hp: 20,
        power: 5,
        abilities: [
          {
            type: "splitOnDeath",
            trigger: "onDeath",
            params: { count: 3, childHp: 10, childPower: 5 },
          },
        ],
      });
      const king = testCard({ id: "king", hp: 100, power: 10, attackSpeed: 3 });
      return {
        seed: 42,
        catalog: catalogOf(attacker, splitter, king),
        a: {
          owner: "A",
          placements: [
            { cardId: "attacker", x: 3, y: 0 },
            { cardId: "attacker", x: 3, y: 2 },
            { cardId: "king", x: 1, y: 1, king: true },
          ],
        },
        b: {
          owner: "B",
          placements: [
            { cardId: "splitter", x: 3, y: 0 },
            { cardId: "splitter", x: 3, y: 2 },
            { cardId: "king", x: 1, y: 1, king: true },
          ],
        },
      };
    };

    const a = runBattle(makeSetup());
    const b = runBattle(makeSetup());
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
    expect(a.winner).toBe(b.winner);
    expect(a.ticks).toBe(b.ticks);
  });
});
