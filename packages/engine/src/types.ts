import type { Ability, Element, LocalizedString, Range } from "@amanda/shared";
import type { Rng } from "./rng.js";

/** Which side of the arena a unit belongs to. */
export type Owner = "A" | "B";

/** A live combatant in the arena. Positions use the 4×8 arena coordinate space. */
export interface Unit {
  uid: string;
  cardId: string;
  owner: Owner;
  name: LocalizedString;
  elements: Element[];
  /** Element used for damage math; may change at runtime (elementSteal). */
  activeElement: Element;

  // --- base stats ---
  maxHp: number;
  hp: number;
  power: number;
  /** Base seconds between attacks. */
  attackSpeed: number;
  /** Base columns advanced per second (0 = static). */
  moveSpeed: number;
  range: Range;
  flying: boolean;
  isKing: boolean;

  // --- spatial (arena space: col 0..7, lanes are rows 0..3) ---
  /** Continuous center column. */
  col: number;
  /** Columns occupied (1 for normal, 2 for the King). */
  width: number;
  /** Lanes (rows) occupied (King spans two). */
  lanes: number[];
  /** +1 advances toward higher columns (side A), -1 toward lower (side B). */
  facing: 1 | -1;

  // --- combat runtime ---
  /** Seconds until this unit can attack again. */
  attackCooldown: number;
  /** Flat damage blocked per incoming hit. */
  armor: number;
  /** Tick index until which the unit is stunned (frozen). */
  stunnedUntil: number;
  /** Cannot be pushed by knockback. */
  knockbackImmune: boolean;

  // --- per-tick aura-derived values (recomputed every tick) ---
  damageTakenMult: number;
  attackSpeedMult: number;
  moveSlowMult: number;
  /** Flat armor granted by allied auras this tick (on top of `armor`). */
  auraArmor: number;

  abilities: Ability[];
  alive: boolean;

  /** Ground-floor card revealed when this unit dies (Stacking). */
  below: StackedCard | null;
  /** Runtime flags used by ability handlers (e.g. rooted, elementStolen). */
  flags: Record<string, boolean | number>;
}

/** A card sitting under another via the Stacking / "Ground Floor" mechanic. */
export interface StackedCard {
  cardId: string;
}

export interface BattleEvent {
  tick: number;
  type:
    | "spawn"
    | "attack"
    | "hit"
    | "death"
    | "knockback"
    | "stun"
    | "split"
    | "reveal"
    | "win";
  /** Acting unit. */
  uid?: string;
  targetUid?: string;
  cardId?: string;
  owner?: Owner;
  col?: number;
  lanes?: number[];
  damage?: number;
  targetHp?: number;
  untilTick?: number;
  childUids?: string[];
  revealedCardId?: string;
  winner?: Owner | null;
}

export interface BattleState {
  tick: number;
  rng: Rng;
  units: Unit[];
  events: BattleEvent[];
  winner: Owner | null;
  ended: boolean;
  nextUid: number;
}

/** Lightweight per-unit snapshot used for animated replay on the client. */
export interface FrameUnit {
  uid: string;
  owner: Owner;
  cardId: string;
  col: number;
  lanes: number[];
  hp: number;
  maxHp: number;
  alive: boolean;
  isKing: boolean;
}

/** A snapshot of the whole arena at one tick. */
export interface BattleFrame {
  tick: number;
  units: FrameUnit[];
}

export interface BattleResult {
  winner: Owner | null;
  ticks: number;
  events: BattleEvent[];
  /** Final unit snapshot (useful for tests and post-battle UI). */
  finalUnits: Unit[];
  /** Per-tick snapshots for animated replay (only when setup.recordFrames). */
  frames: BattleFrame[];
}
