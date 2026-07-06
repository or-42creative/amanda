import { z } from "zod";
import { LocalizedStringSchema } from "./common.js";
import { RaritySchema } from "./card.js";
import { AbilitySchema } from "./ability.js";

/** Which prep phase(s) an action card may be activated in (GDD §3: prep only). */
export const ACTION_PHASES = ["build", "panic"] as const;
export const ActionPhaseSchema = z.enum(ACTION_PHASES);
export type ActionPhase = z.infer<typeof ActionPhaseSchema>;

/**
 * Strategic Action ("System") cards. Effects are expressed as Abilities where
 * they overlap with battle mechanics; purely meta effects (draw, reveal, etc.)
 * carry an `effect` type string the client/room logic dispatches on.
 */
export const ActionCardSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  name: LocalizedStringSchema,
  rarity: RaritySchema,
  /** Copies included per envelope/pack (GDD "כמות בחבילה"). */
  copiesInPack: z.number().int().positive(),
  /** Human-facing effect description. */
  description: LocalizedStringSchema,
  /**
   * Machine-readable effect id the game logic switches on
   * (e.g. "draw", "revealBoard", "freezeEnemy", "enableStacking").
   */
  effect: z.string().regex(/^[a-zA-Z0-9_]+$/),
  /** Tunable parameters for the effect (seconds, counts, amounts…). */
  params: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).default({}),
  /** Optional battle-side ability for effects that touch the simulation. */
  battleAbility: AbilitySchema.optional(),
  /** Phases in which the card may be used. */
  usableIn: z.array(ActionPhaseSchema).min(1).default(["build", "panic"]),
});
export type ActionCard = z.infer<typeof ActionCardSchema>;
