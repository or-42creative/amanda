import { z } from "zod";
import { SeriesSchema, type Series } from "./schemas/series.js";
import { ActionCardSchema, type ActionCard } from "./schemas/actionCard.js";
import type { Card } from "./schemas/card.js";

/**
 * Parse + validate a single series JSON blob. Throws a ZodError with a precise
 * path if the data is malformed, so bad card data fails loudly at load time
 * rather than silently mis-rendering in a match.
 */
export function parseSeries(data: unknown): Series {
  return SeriesSchema.parse(data);
}

/** Parse + validate the action-card list. */
export function parseActionCards(data: unknown): ActionCard[] {
  return z.array(ActionCardSchema).parse(data);
}

/**
 * Structural integrity checks that span multiple records (things a per-record
 * schema can't see). Returns a list of human-readable problems; empty = OK.
 */
export function validateCatalog(
  seriesList: Series[],
  actionCards: ActionCard[],
): string[] {
  const problems: string[] = [];
  const seenCardIds = new Set<string>();
  const seenSeriesIds = new Set<string>();
  const seenSeriesNumbers = new Set<number>();

  for (const series of seriesList) {
    if (seenSeriesIds.has(series.id)) {
      problems.push(`Duplicate series id: ${series.id}`);
    }
    seenSeriesIds.add(series.id);

    if (seenSeriesNumbers.has(series.seriesNumber)) {
      problems.push(`Duplicate series number: ${series.seriesNumber}`);
    }
    seenSeriesNumbers.add(series.seriesNumber);

    const seenNumbersInSeries = new Set<number>();
    for (const card of series.cards) {
      if (seenCardIds.has(card.id)) {
        problems.push(`Duplicate card id: ${card.id}`);
      }
      seenCardIds.add(card.id);

      if (card.seriesId !== series.id) {
        problems.push(
          `Card ${card.id} has seriesId "${card.seriesId}" but lives in series "${series.id}"`,
        );
      }
      if (seenNumbersInSeries.has(card.numberInSeries)) {
        problems.push(
          `Series ${series.id} has two cards numbered ${card.numberInSeries}`,
        );
      }
      seenNumbersInSeries.add(card.numberInSeries);
    }
  }

  const seenActionIds = new Set<string>();
  for (const action of actionCards) {
    if (seenActionIds.has(action.id)) {
      problems.push(`Duplicate action-card id: ${action.id}`);
    }
    seenActionIds.add(action.id);
  }

  return problems;
}

/** Flatten all series into a single card lookup for the engine. */
export function indexCards(seriesList: Series[]): Map<string, Card> {
  const map = new Map<string, Card>();
  for (const series of seriesList) {
    for (const card of series.cards) map.set(card.id, card);
  }
  return map;
}
