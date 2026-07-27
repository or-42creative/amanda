/**
 * Wire protocol shared by the client and the authoritative multiplayer server.
 * Kept dependency-free (no engine import) so `@amanda/shared` stays a leaf:
 * the placement shapes below are structurally compatible with the engine's
 * BoardInput / Placement, so boards pass straight through to runBattle.
 */

export type Side = "A" | "B";

export interface NetBuff {
  powerAdd?: number;
  powerMult?: number;
  hpMult?: number;
}

export interface NetPlacement {
  cardId: string;
  x: number;
  y: number;
  king?: boolean;
  below?: string;
  buff?: NetBuff;
}

export interface NetBoard {
  owner: Side;
  placements: NetPlacement[];
}

/** A fog-limited view of a board (cellKey → cardId, plus the King if revealed). */
export interface BoardView {
  placements: Record<string, string>;
  king: string | null;
}

// ── client → server ────────────────────────────────────────────────
export type ClientMessage =
  | { t: "hello" }
  /** Live board (for the opponent's fog-of-war view). */
  | { t: "board"; view: BoardView }
  /** Final locked board, WITH action-card buffs, used for the battle. */
  | { t: "lock"; board: NetBoard };

// ── server → client ────────────────────────────────────────────────
export type ServerMessage =
  | { t: "waiting" }
  | { t: "start"; side: Side }
  | { t: "phase"; phase: string; timeLeft: number }
  /** Fogged view of the opponent's board for the current phase. */
  | { t: "opp"; view: BoardView }
  /** Authoritative battle inputs — both clients replay this deterministically. */
  | { t: "result"; seed: number; boardA: NetBoard; boardB: NetBoard; winner: Side | null }
  | { t: "oppLeft" };

export function encode(msg: ClientMessage | ServerMessage): string {
  return JSON.stringify(msg);
}
