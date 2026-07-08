import { useCallback, useEffect, useRef, useState } from "react";
import { DECK, PHASES } from "@amanda/shared";
import {
  runBattle,
  type BattleResult,
  type BoardInput,
  type Placement,
  type PlacementBuff,
} from "@amanda/engine";
import { ACTIONS, CATALOG, IMPLEMENTED_ACTIONS, KING_CANDIDATES, cardPool } from "../data/catalog";
import { sfx } from "./sfx";

export type Phase = "intro" | "countdown" | "build" | "panic" | "prebattle" | "battle" | "result";

const BATTLE_SEED = 20260707;
const COUNTDOWN_SECONDS = 3;
const PREBATTLE_SECONDS = 4;
const XRAY_MS = 6000;

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

function matchDeck(): string[] {
  return shuffle(cardPool()).slice(0, DECK.size);
}

function perimeterCells(): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  for (let x = 0; x < BOARD_SIZE; x++)
    for (let y = 0; y < BOARD_SIZE; y++) if (!isKingCell(x, y)) cells.push({ x, y });
  return cells;
}

/** The opponent's ordered build plan: real cards (King + monsters), front row first. */
function generateAiPlan(): Placement[] {
  const kingPool = KING_CANDIDATES.length ? KING_CANDIDATES : [...CATALOG.values()];
  const king = kingPool[Math.floor(Math.random() * kingPool.length)]!.id;
  const pool = shuffle(matchDeck().filter((id) => id !== king));
  const chosen = shuffle(perimeterCells()).slice(0, 7);
  const reals: Placement[] = chosen.map((c, i) => ({ cardId: pool[i % pool.length]!, x: c.x, y: c.y }));
  reals.sort((a, b) => b.x - a.x); // front row (x=3) placed first → visible as it builds
  return [...reals, { cardId: king, x: 1, y: 1, king: true }];
}

function fillCrumbs(placements: Placement[]): Placement[] {
  const out = [...placements];
  for (const c of perimeterCells())
    if (!out.some((p) => !p.king && p.x === c.x && p.y === c.y))
      out.push({ cardId: "crumb_demon", x: c.x, y: c.y });
  return out;
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

interface BattleMods {
  powerBuff: number;
  kingBoost: boolean;
}

function buildPlayerBoard(state: GameState, mods: BattleMods): BoardInput {
  const resolved = resolveKing(state.king, state.placements);
  const cardBuff = (): PlacementBuff | undefined =>
    mods.powerBuff > 0 ? { powerAdd: mods.powerBuff } : undefined;
  const kingBuff: PlacementBuff = {};
  if (mods.powerBuff > 0) kingBuff.powerAdd = mods.powerBuff;
  if (mods.kingBoost) {
    kingBuff.powerMult = 1.5;
    kingBuff.hpMult = 1.5;
  }
  const ps: Placement[] = [
    { cardId: resolved.king, x: 1, y: 1, king: true, buff: Object.keys(kingBuff).length ? kingBuff : undefined },
  ];
  for (const [key, cardId] of Object.entries(resolved.placements)) {
    const [x, y] = key.split("-").map(Number) as [number, number];
    ps.push({ cardId, x, y, buff: cardBuff() });
  }
  return { owner: "A", placements: fillCrumbs(ps) };
}

interface GameState {
  deck: string[];
  hand: string | null;
  discard: string[];
  placements: Record<string, string>;
  king: string | null;
}

function initialGameState(): GameState {
  return { deck: matchDeck(), hand: null, discard: [], placements: {}, king: null };
}

function drawIfEmpty(s: GameState): GameState {
  if (s.hand !== null || s.deck.length === 0) return s;
  return { ...s, hand: s.deck[0]!, deck: s.deck.slice(1) };
}

export interface BoardView {
  placements: Record<string, string>;
  king: string | null;
}

export interface ActionState {
  id: string;
  used: boolean;
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
  actions: ActionState[];
  activateAction: (id: string) => void;
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
  const [usedActions, setUsedActions] = useState<Record<string, boolean>>({});
  const [powerBuff, setPowerBuff] = useState(0);
  const [kingBoost, setKingBoost] = useState(false);
  const [xrayActive, setXrayActive] = useState(false);

  const gsRef = useRef(gs);
  gsRef.current = gs;
  const modsRef = useRef<BattleMods>({ powerBuff: 0, kingBoost: false });
  modsRef.current = { powerBuff, kingBoost };
  const aiPlanRef = useRef<Placement[] | null>(null);
  if (!aiPlanRef.current) aiPlanRef.current = generateAiPlan();

  const placeAt = useCallback((x: number, y: number) => {
    if (isKingCell(x, y)) return;
    const key = cellKey(x, y);
    let ok = false;
    setGs((s) => {
      if (s.hand === null || s.placements[key]) return s;
      ok = true;
      return drawIfEmpty({ ...s, placements: { ...s.placements, [key]: s.hand }, hand: null });
    });
    if (ok) sfx.play("place");
  }, []);

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
      if (s.hand !== null) discard.push(s.hand);
      return { ...s, hand: top, discard };
    });
    if (ok) sfx.play("draw");
  }, []);

  const activateAction = useCallback((id: string) => {
    setUsedActions((u) => {
      if (u[id]) return u;
      const effect = ACTIONS.get(id)?.effect;
      const params = ACTIONS.get(id)?.params ?? {};
      if (effect === "boardPowerBuff") setPowerBuff((b) => b + Number(params.power ?? 50));
      else if (effect === "upgradeCardTemp") setKingBoost(true);
      else if (effect === "revealBoard") {
        setXrayActive(true);
        window.setTimeout(() => setXrayActive(false), XRAY_MS);
      }
      sfx.play("draw");
      return { ...u, [id]: true };
    });
  }, []);

  const enterPrebattle = useCallback(() => {
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
    const aiFull: BoardInput = { owner: "B", placements: fillCrumbs(aiPlanRef.current!) };
    const r = runBattle({
      seed: BATTLE_SEED,
      catalog: CATALOG,
      a: buildPlayerBoard(gsRef.current, modsRef.current),
      b: aiFull,
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
    aiPlanRef.current = generateAiPlan();
    setGs(initialGameState());
    setResult(null);
    setUsedActions({});
    setPowerBuff(0);
    setKingBoost(false);
    setXrayActive(false);
    setTimeLeft(COUNTDOWN_SECONDS);
    setPhase("intro");
  }, []);

  useEffect(() => {
    if (!["countdown", "build", "panic", "prebattle"].includes(phase)) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 0.1)), 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (timeLeft > 0) return;
    if (phase === "countdown") {
      setPhase("build");
      setTimeLeft(PHASES.build.seconds);
      setGs((s) => drawIfEmpty(s));
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
      if (xrayActive) return true;
      if (phase === "build") return x === 3;
      if (phase === "panic" || phase === "prebattle") return x >= 1;
      return true;
    },
    [phase, xrayActive],
  );

  // Opponent builds its album over the Build phase (front row appears first).
  const plan = aiPlanRef.current;
  let visible = plan.length;
  if (phase === "build") {
    const frac = 1 - timeLeft / PHASES.build.seconds;
    visible = Math.max(0, Math.min(plan.length, Math.ceil(frac * plan.length)));
  } else if (phase === "intro" || phase === "countdown") {
    visible = 0;
  }
  const opponentView: BoardView = { placements: {}, king: null };
  for (const p of plan.slice(0, visible)) {
    if (p.king) opponentView.king = p.cardId;
    else opponentView.placements[cellKey(p.x, p.y)] = p.cardId;
  }

  const actions: ActionState[] = IMPLEMENTED_ACTIONS.map((id) => ({ id, used: !!usedActions[id] }));

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
    opponent: opponentView,
    revealOpponentCell,
    revealOpponentKing: xrayActive || phase === "panic" || phase === "prebattle",
    actions,
    activateAction,
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
