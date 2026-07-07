import { CRUMB_DEMON, parseSeries, type Card, type Series } from "@amanda/shared";

/**
 * Auto-load every series file under /data/series. Dropping a new NN-name.json
 * there makes its cards appear in the game with no code change.
 */
const seriesModules = import.meta.glob("../../../../data/series/*.json", {
  eager: true,
}) as Record<string, { default: unknown }>;

export const SERIES: Series[] = Object.keys(seriesModules)
  .sort()
  .map((path) => parseSeries(seriesModules[path]!.default));

/** All series indexed by id, for lookups (synergy, detail view). */
export const SERIES_BY_ID: Map<string, Series> = new Map(SERIES.map((s) => [s.id, s]));

/** Every playable monster card, keyed by id. */
export const CATALOG: Map<string, Card> = new Map();
for (const s of SERIES) for (const c of s.cards) CATALOG.set(c.id, c);

/**
 * The weak filler placed on empty slots when the build timer ends
 * (GDD §4 — "Crumb Demon"). Synthesised in code, not part of the card pool.
 */
export const CRUMB_DEMON_CARD: Card = {
  id: "crumb_demon",
  seriesId: "system",
  numberInSeries: 1,
  name: { he: "מפלץ פירורים", en: "Crumb Demon" },
  elements: ["earth"],
  rarity: "common",
  stats: {
    hp: CRUMB_DEMON.hp,
    power: CRUMB_DEMON.power,
    attackSpeed: CRUMB_DEMON.attackSpeed,
    moveSpeed: 0,
    range: "melee",
  },
  flying: false,
  midBoss: false,
  abilities: [],
  art: { placeholderColor: "#7a7a7a", sprite: null },
};
CATALOG.set(CRUMB_DEMON_CARD.id, CRUMB_DEMON_CARD);

/** Cards designed to sit in the King slot (big mid-bosses first, then the rest). */
export const KING_CANDIDATES: Card[] = [...CATALOG.values()].filter((c) => c.midBoss);

/** The colour used to render a card's placeholder shape. */
export function cardColor(cardId: string): string {
  return CATALOG.get(cardId)?.art.placeholderColor ?? "#888888";
}

/** A demo starter deck: every real monster card, shuffled deterministically. */
export function starterDeck(): string[] {
  return [...CATALOG.keys()].filter((id) => id !== "crumb_demon");
}
