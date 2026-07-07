import { useCallback, useEffect, useRef, useState } from "react";
import { PHASES } from "@amanda/shared";
import {
  runBattle,
  type BattleResult,
  type BoardInput,
  type Placement,
} from "@amanda/engine";
import { CATALOG, KING_CANDIDATES, starterDeck } from "../data/catalog";
import { sfx } from "./sfx";

export type Phase = "intro" | "countdown" | "build" | "panic" | "prebattle" | "battle" | "result";

/** Fixed seed → the same boards always produce the same battle (determinism). */
const BATTLE_SEED = 20260707;
const COUNTDOWN_SECONDS = 3;
const PREBATTLE_SECONDS = 4;

export const BOARD_SIZE = 4;
export function isKingCell(x: number, y: number): boolean {
  return x >= 1 && x <= 2 && y >= 1 && y <= 2;
}
export function cellKey(x: number, y: number): string {
  return `${x}-${y}`;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function perimeterCells(): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  for (let x = 0; x < BOARD_SIZE; x++)
    for (let y = 0; y < BOARD_SIZE; y++) if (!isKingCell(x, y)) cells.push({ x, y });
  return cells;
}

function generateAiBoard(): BoardInput {
  const kingPool = KING_CANDIDATES.length ? KING_CANDIDATES : [...CATALOG.values()];
  const king = kingPool[Math.floor(Math.random() * kingPool.length)]!.id;
  const pool = shuffle(starterDeck().filter((id) => id !== king));
  const placements: Placement[] = [{ cardId: king, x: 1, y: 1, king: true }];
  const cells = shuffle(perimeterCells());
  cells.slice(0, 7).forEach((c, i) =>
    placements.push({ cardId: pool[i % pool.length]!, x: c.x, y: c.y }),
  );
  for (const c of cells)
    if (!placements.some((p) => p.x === c.x && p.y === c.y))
      placements.push({ cardId: "crumb_demon", x: c.x, y: c.y });
  return { owner: "B", placements };
}

function resolveKing(
  king: string | null,
  placements: Record<string, string>,
): { king: string; placements: Record<string, string> } {
  if (king) return { king, placements };
  let bestKey: string | null = null;
  let bestScore = -1;
  for (const [k, id] of Object.entries(placements)) {
    const c = CATALOG.get(id);
    const score = (c?.stats.hp ?? 0) + (c?.stats.power ?? 0);
    if (score > bestScore) {
      bestScore = score;
      bestKey = k;
    }
  }
  if (bestKey) {
    const rest = { ...placements };
    const promoted = rest[bestKey]!;
    delete rest[bestKey];
    return { king: promoted, placements: rest };
  }
  return { king: "crumb_demon", placements };
}

function buildPlayerBoard(state: GameState): BoardInput {
  const resolved = resolveKing(state.king, state.placements);
  const ps: Placement[] = [{ cardId: resolved.king, x: 1, y: 1, king: true }];
  for (const [key, cardId] of Object.entries(resolved.placements)) {
    const [x, y] = key.split("-").map(Number) as [number, number];
    ps.push({ cardId, x, y });
  }
  for (const c of perimeterCells())
    if (!resolved.placements[cellKey(c.x, c.y)])
      ps.push({ cardId: "crumb_demon", x: c.x, y: c.y });
  return { owner: "A", placements: ps };
}

interface GameState {
  deck: string[];
  hand: string | null;
  discard: string[];
  placements: Record<string, string>;
  king: string | null;
}

function initialGameState(): GameState {
  return { deck: shuffle(starterDeck()), hand: null, discard: [], placements: {}, king: null };
}

/** Auto-draw: keep a card in hand whenever the deck has cards. */
function drawIfEmpty(s: GameState): GameState {
  if (s.hand !== null || s.deck.length === 0) return s;
  return { ...s, hand: s.deck[0]!, deck: s.deck.slice(1) };
}

export interface BoardView {
  placements: Record<string, string>;
  king: string | null;
}

function boardInputToView(b: BoardInput): BoardView {
  const placements: Record<string, string> = {};
  let king: string | null = null;
  for (const p of b.placements) {
    if (p.king) king = p.cardId;
    else placements[cellKey(p.x, p.y)] = p.cardId;
  }
  return { placements, king };
}

export interface MatchApi {
  phase: Phase;
  timeLeft: number;
  deckCount: number;
  hand: string | null;
  discardTop: string | null;
  placements: Record<string, string>;
  king: string | null;
  result: BattleResult | null;
  hasKing: boolean;
  opponent: BoardView;
  revealOpponentCell: (x: number, y: number) => boolean;
  revealOpponentKing: boolean;
  startMatch: () => void;
  discardHand: () => void;
  takeDiscard: () => void;
  placeAt: (x: number, y: number) => void;
  placeKing: () => void;
  toBattle: () => void;
  finishBattle: () => void;
  reset: () => void;
}

export function useMatch(): MatchApi {
  const [phase, setPhase] = useState<Phase>("intro");
  const [timeLeft, setTimeLeft] = useState<number>(COUNTDOWN_SECONDS);
  const [gs, setGs] = useState<GameState>(initialGameState);
  const [result, setResult] = useState<BattleResult | null>(null);

  const gsRef = useRef(gs);
  gsRef.current = gs;
  const aiRef = useRef<BoardInput | null>(null);
  if (!aiRef.current) aiRef.current = generateAiBoard();

  const placeAt = useCallback(
    (x: number, y: number) => {
      if (isKingCell(x, y)) return;
      const key = cellKey(x, y);
      let ok = false;
      setGs((s) => {
        if (s.hand === null || s.placements[key]) return s;
        ok = true;
        return drawIfEmpty({ ...s, placements: { ...s.placements, [key]: s.hand }, hand: null });
      });
      if (ok) sfx.play("place");
    },
    [],
  );

  const placeKing = useCallback(() => {
    let ok = false;
    setGs((s) => {
      if (s.hand === null || s.king !== null) return s;
      ok = true;
      return drawIfEmpty({ ...s, king: s.hand, hand: null });
    });
    if (ok) sfx.play("place");
  }, []);

  const discardHand = useCallback(() => {
    let ok = false;
    setGs((s) => {
      if (s.hand === null) return s;
      ok = true;
      return drawIfEmpty({ ...s, discard: [...s.discard, s.hand], hand: null });
    });
    if (ok) sfx.play("discard");
  }, []);

  const takeDiscard = useCallback(() => {
    let ok = false;
    setGs((s) => {
      if (s.discard.length === 0) return s;
      ok = true;
      const top = s.discard[s.discard.length - 1]!;
      const discard = s.discard.slice(0, -1);
      if (s.hand !== null) discard.push(s.hand); // swap current hand back onto the pile
      return { ...s, hand: top, discard };
    });
    if (ok) sfx.play("draw");
  }, []);

  const enterPrebattle = useCallback(() => {
    // Lock the board: auto-promote a King if needed and fill empty slots with Crumb Demons.
    setGs((s) => {
      const resolved = resolveKing(s.king, s.placements);
      const placements = { ...resolved.placements };
      for (const c of perimeterCells())
        if (!placements[cellKey(c.x, c.y)]) placements[cellKey(c.x, c.y)] = "crumb_demon";
      return { ...s, king: resolved.king, placements, hand: null };
    });
    sfx.play("crumbs");
    setPhase("prebattle");
    setTimeLeft(PREBATTLE_SECONDS);
  }, []);

  const startBattle = useCallback(() => {
    const r = runBattle({
      seed: BATTLE_SEED,
      catalog: CATALOG,
      a: buildPlayerBoard(gsRef.current),
      b: aiRef.current!,
      recordFrames: true,
    });
    setResult(r);
    sfx.play("go");
    setPhase("battle");
  }, []);

  const startMatch = useCallback(() => {
    sfx.unlock();
    sfx.play("click");
    setPhase("countdown");
    setTimeLeft(COUNTDOWN_SECONDS);
  }, []);

  const finishBattle = useCallback(() => {
    const w = result?.winner;
    sfx.play(w === "A" ? "win" : w === "B" ? "lose" : "beep");
    setPhase("result");
  }, [result]);

  const reset = useCallback(() => {
    aiRef.current = generateAiBoard();
    setGs(initialGameState());
    setResult(null);
    setTimeLeft(COUNTDOWN_SECONDS);
    setPhase("intro");
  }, []);

  // Countdown ticker for the timed phases.
  useEffect(() => {
    if (!["countdown", "build", "panic", "prebattle"].includes(phase)) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 0.1)), 100);
    return () => clearInterval(id);
  }, [phase]);

  // Phase transitions when a timer hits zero.
  useEffect(() => {
    if (timeLeft > 0) return;
    if (phase === "countdown") {
      setPhase("build");
      setTimeLeft(PHASES.build.seconds);
      setGs((s) => drawIfEmpty(s)); // first auto-draw
    } else if (phase === "build") {
      setPhase("panic");
      setTimeLeft(PHASES.panic.seconds);
    } else if (phase === "panic") {
      enterPrebattle();
    } else if (phase === "prebattle") {
      startBattle();
    }
  }, [timeLeft, phase, enterPrebattle, startBattle]);

  const revealOpponentCell = useCallback(
    (x: number, _y: number): boolean => {
      if (phase === "build") return x === 3;
      if (phase === "panic" || phase === "prebattle") return x >= 1;
      return true;
    },
    [phase],
  );

  return {
    phase,
    timeLeft,
    deckCount: gs.deck.length,
    hand: gs.hand,
    discardTop: gs.discard.length ? gs.discard[gs.discard.length - 1]! : null,
    placements: gs.placements,
    king: gs.king,
    result,
    hasKing: gs.king !== null,
    opponent: boardInputToView(aiRef.current),
    revealOpponentCell,
    revealOpponentKing: phase === "panic" || phase === "prebattle",
    startMatch,
    discardHand,
    takeDiscard,
    placeAt,
    placeKing,
    toBattle: enterPrebattle,
    finishBattle,
    reset,
  };
}
