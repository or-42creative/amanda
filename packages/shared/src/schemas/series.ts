import { z } from "zod";
import { LocalizedStringSchema } from "./common.js";
import { AbilitySchema } from "./ability.js";
import { CardSchema } from "./card.js";

/**
 * Passive buff granted when a threshold of same-series cards is on the board
 * (GDD: "synergy of 3+ cards from the same family"). The bonus itself is an
 * Ability, so synergies reuse the exact same engine handlers as card abilities.
 */
export const SynergySchema = z.object({
  /** Minimum same-series cards on board to activate (default 3). */
  threshold: z.number().int().min(2).default(3),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
  ability: AbilitySchema,
});
export type Synergy = z.infer<typeof SynergySchema>;

export const SeriesSchema = z.object({
  /** Unique id, e.g. "dragons". */
  id: z.string().regex(/^[a-z0-9_]+$/),
  /** 1–18 catalog number. */
  seriesNumber: z.number().int().min(1).max(18),
  name: LocalizedStringSchema,
  /** The series' strategic specialty (design text). */
  specialty: LocalizedStringSchema,
  synergy: SynergySchema,
  cards: z.array(CardSchema),
});
export type Series = z.infer<typeof SeriesSchema>;
