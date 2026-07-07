import type { AbilityType, Element, Range, Rarity } from "@amanda/shared";

export interface ElementMeta {
  he: string;
  en: string;
  icon: string;
  color: string;
}

export const ELEMENT_META: Record<Element, ElementMeta> = {
  fire: { he: "אש", en: "Fire", icon: "🔥", color: "#e2492f" },
  water: { he: "מים", en: "Water", icon: "💧", color: "#2f7fe2" },
  earth: { he: "אדמה", en: "Earth", icon: "🪨", color: "#8a6d3b" },
  air: { he: "אוויר", en: "Air", icon: "💨", color: "#9fd6e8" },
  electric: { he: "חשמל", en: "Electric", icon: "⚡", color: "#f2c530" },
  metal: { he: "מתכת", en: "Metal", icon: "⚙️", color: "#9aa4ad" },
  light: { he: "אור", en: "Light", icon: "✨", color: "#f5f0d0" },
  dark: { he: "אופל", en: "Dark", icon: "🌑", color: "#7a5cad" },
  poison: { he: "רעל", en: "Poison", icon: "☠️", color: "#6fbf3b" },
  variable: { he: "משתנה", en: "Variable", icon: "🔀", color: "#b06fd6" },
};

export const RANGE_META: Record<Range, { he: string; icon: string }> = {
  melee: { he: "קרוב", icon: "🗡️" },
  ranged: { he: "רחוק", icon: "🏹" },
  sniper: { he: "צלף", icon: "🎯" },
};

export const RARITY_META: Record<Rarity, { he: string; color: string }> = {
  common: { he: "נפוץ", color: "#9aa4ad" },
  rare: { he: "נדיר", color: "#4aa3ff" },
  epic: { he: "אפי", color: "#b06fd6" },
  legendary: { he: "אגדי", color: "#ffb020" },
};

/** Short Hebrew labels for ability types (used when a card has no custom text). */
export const ABILITY_LABEL: Partial<Record<AbilityType, string>> = {
  knockback: "הדף אחורה",
  sideKnockback: "הדף הצידה",
  trample: "דריסה והמשך",
  pullVacuum: "שאיבה למרכז",
  rootOnReveal: "מלכודת הצמדה",
  knockbackImmune: "חסין הדיפה",
  damageReflect: "החזרת נזק",
  armorGain: "צבירת שריון",
  armorBreak: "שבירת שריון",
  armorAura: "הילת שריון",
  damageShareAdjacent: "ספיגה לשכנים",
  damageReductionAura: "הילת הגנה",
  regen: "התחדשות",
  healAura: "הילת ריפוי",
  aoeRowAttack: "מכה אזורית",
  lineDenialDot: "חסימת נתיב",
  freezeOnHit: "הקפאה במכה",
  stackingDot: "רעל מצטבר",
  absorbOnCollision: "בליעת יריב",
  slowAura: "הילת האטה",
  attackSpeedAura: "הילת מהירות",
  delayedTransform: "התמרה מושהית",
  swarmOnDeath: "נחיל במוות",
  splitOnDeath: "פיצול במוות",
  sacrificeAdjacent: "הקרבת בעל-ברית",
  elementSteal: "גניבת אלמנט",
};
