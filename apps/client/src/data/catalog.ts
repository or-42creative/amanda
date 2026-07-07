import { CRUMB_DEMON, parseSeries, type Card, type Series } from "@amanda/shared";
import dragonsJson from "../../../../data/series/01-dragons.json";
import slimesJson from "../../../../data/series/17-slimes.json";

/** All series shipped so far (Dragons + Slimes). */
export const SERIES: Series[] = [parseSeries(dragonsJson), parseSeries(slimesJson)];

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
