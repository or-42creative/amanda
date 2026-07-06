import { z } from "zod";

/**
 * A user-facing string that always ships in both supported languages.
 * The game UI was decided to be bilingual (Hebrew + English) from day one,
 * so every displayable string is a LocalizedString rather than a raw string.
 * Adding a third language later = add a key here; nothing else changes.
 */
export const LocalizedStringSchema = z.object({
  he: z.string().min(1),
  en: z.string().min(1),
});
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

/** Supported UI languages. `he` is the default (RTL). */
export const LANGUAGES = ["he", "en"] as const;
export const LanguageSchema = z.enum(LANGUAGES);
export type Language = z.infer<typeof LanguageSchema>;

/**
 * Placeholder-first art hook. For the MVP every card renders as a colored
 * shape (`placeholderColor`); `sprite` stays null until final assets are
 * injected. Swapping in real art later is a data change, not a code change.
 */
export const ArtSchema = z.object({
  placeholderColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "must be a #rrggbb hex color"),
  sprite: z.string().nullable().default(null),
});
export type Art = z.infer<typeof ArtSchema>;
