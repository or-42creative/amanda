import { z } from "zod";

/**
 * Card elements. Combat uses a rock-paper-scissors style multiplier between
 * elements (see GameConfig.elements.chart). `variable` is for shapeshifters
 * (e.g. the Assimilator) that start with no fixed element and copy one at runtime.
 */
export const ELEMENTS = [
  "fire",
  "water",
  "earth",
  "air",
  "electric",
  "metal",
  "light",
  "dark",
  "poison",
  "variable",
] as const;

export const ElementSchema = z.enum(ELEMENTS);
export type Element = z.infer<typeof ElementSchema>;

/**
 * A card may carry 1–2 elements (the GDD has dual-element cards like
 * "fire / poison"). The first element is the primary one used for the
 * rock-paper-scissors damage lookup; extras count toward synergies/tags.
 */
export const ElementsSchema = z.array(ElementSchema).min(1).max(2);
