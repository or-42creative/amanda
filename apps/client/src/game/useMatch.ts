import { useCallback, useEffect, useRef, useState } from "react";
import { PHASES } from "@amanda/shared";
import {
  runBattle,
  type BattleResult,
  type BoardInput,
  type Placement,
} from "@amanda/engine";
import { CATALOG, KING_CANDIDATES, starterDeck } from "../data/catalog";

export type Phase = "build" | "panic" | "battle" | "result";

/** Fixed seed → the same boards always produce the same battle (determinism). */
const BATTLE_SEED = 20260707;

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

/** Non-King board cells (the 12 perimeter slots). */
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
  cells.slice(0, 6).forEach((c, i) =>
    placements.push({ cardId: pool[i % pool.length]!, x: c.x, y: c.y }),
  );
  for (const c of cells)
    if (!placements.some((p) => p.x === c.x && p.y === c.y))
      placements.push({ cardId: "crumb_demon", x: c.x, y: c.y });

  return { owner: "B", placements };
}

/** If the player never set a King, promote their strongest placed card. */
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

/** All mutable build-phase state, updated as one atomic unit (pure reducers). */
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
  /** Opponent board (fog of war applied via revealOpponentCell/revealOpponentKing). */
  opponent: BoardView;
  /** True if the opponent's cell at (x,y) is currently visible to the player. */
  revealOpponentCell: (x: number, y: number) => boolean;
  revealOpponentKing: boolean;
  draw: () => void;
  takeDiscard: () => void;
  discardHand: () => void;
  placeAt: (x: number, y: number) => void;
  placeKing: () => void;
  pickUp: (x: number, y: number) => void;
  startBattle: () => void;
  finishBattle: () => void;
  reset: () => void;
}

export function useMatch(): MatchApi {
  const [phase, setPhase] = useState<Phase>("build");
  const [timeLeft, setTimeLeft] = useState<number>(PHASES.build.seconds);
  const [gs, setGs] = useState<GameState>(initialGameState);
  const [result, setResult] = useState<BattleResult | null>(null);

  const gsRef = useRef(gs);
  gsRef.current = gs;
  const aiRef = useRef<BoardInput | null>(null);
  if (!aiRef.current) aiRef.current = generateAiBoard();

  const draw = useCallback(() => {
    setGs((s) =>
      s.hand !== null || s.deck.length === 0
        ? s
        : { ...s, hand: s.deck[0]!, deck: s.deck.slice(1) },
    );
  }, []);

  const takeDiscard = useCallback(() => {
    setGs((s) =>
      s.hand !== null || s.discard.length === 0
        ? s
        : { ...s, hand: s.discard[s.discard.length - 1]!, discard: s.discard.slice(0, -1) },
    );
  }, []);

  const discardHand = useCallback(() => {
    setGs((s) =>
      s.hand === null ? s : { ...s, discard: [...s.discard, s.hand], hand: null },
    );
  }, []);

  const placeAt = useCallback((x: number, y: number) => {
    if (isKingCell(x, y)) return;
    const key = cellKey(x, y);
    setGs((s) =>
      s.hand === null || s.placements[key]
        ? s
        : { ...s, placements: { ...s.placements, [key]: s.hand }, hand: null },
    );
  }, []);

  const placeKing = useCallback(() => {
    setGs((s) => (s.hand === null || s.king !== null ? s : { ...s, king: s.hand, hand: null }));
  }, []);

  const pickUp = useCallback((x: number, y: number) => {
    const key = cellKey(x, y);
    setGs((s) => {
      if (s.hand !== null || !s.placements[key]) return s;
      const rest = { ...s.placements };
      const card = rest[key]!;
      delete rest[key];
      return { ...s, placements: rest, deck: [...s.deck, card] };
    });
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
    setPhase("battle");
  }, []);

  const finishBattle = useCallback(() => setPhase("result"), []);

  const reset = useCallback(() => {
    aiRef.current = generateAiBoard();
    setGs(initialGameState());
    setResult(null);
    setTimeLeft(PHASES.build.seconds);
    setPhase("build");
  }, []);

  // Prep-phase countdown.
  useEffect(() => {
    if (phase !== "build" && phase !== "panic") return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 0.1)), 100);
    return () => clearInterval(id);
  }, [phase]);

  // Phase transitions when the timer hits zero.
  useEffect(() => {
    if (timeLeft > 0) return;
    if (phase === "build") {
      setPhase("panic");
      setTimeLeft(PHASES.panic.seconds);
    } else if (phase === "panic") {
      startBattle();
    }
  }, [timeLeft, phase, startBattle]);

  // Fog of war (GDD §4): build → only the opponent's front row (x=3) is visible;
  // panic → front + sides + King revealed, back "Surprise Row" (x=0) stays hidden.
  const revealOpponentCell = useCallback(
    (x: number, _y: number): boolean => {
      if (phase === "build") return x === 3;
      if (phase === "panic") return x >= 1;
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
    revealOpponentKing: phase === "panic",
    draw,
    takeDiscard,
    discardHand,
    placeAt,
    placeKing,
    pickUp,
    startBattle,
    finishBattle,
    reset,
  };
}
