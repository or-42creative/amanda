import { useEffect, useRef } from "react";
import { Application, Container, Graphics } from "pixi.js";
import { ARENA, SIMULATION } from "@amanda/shared";
import type { BattleResult, FrameUnit } from "@amanda/engine";
import { cardColor } from "../data/catalog";

const CELL = 66;
const W = ARENA.width * CELL; // 8 columns
const H = ARENA.lanes * CELL; // 4 lanes
const OWNER_TINT = { A: 0x4aa3ff, B: 0xff5a5a } as const;

/** Center pixel for an arena column / lane. */
const cx = (col: number): number => (col + 0.5) * CELL;
const cy = (lane: number): number => (lane + 0.5) * CELL;
const laneCenter = (lanes: number[]): number =>
  lanes.reduce((s, l) => s + l, 0) / lanes.length;

interface UnitGfx {
  container: Container;
  body: Graphics;
  hp: Graphics;
}

export function Arena({
  result,
  onFinish,
}: {
  result: BattleResult;
  onFinish: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    let disposed = false;
    let initialized = false;
    let finishTimer: number | undefined;
    const app = new Application();
    const gfxByUid = new Map<string, UnitGfx>();

    function drawUnit(fu: FrameUnit): UnitGfx {
      const container = new Container();
      const isKing = fu.isKing;
      const w = (isKing ? 2 : 1) * CELL * 0.82;
      const h = (isKing ? 2 : 1) * CELL * 0.82;
      const body = new Graphics();
      body
        .roundRect(-w / 2, -h / 2, w, h, 8)
        .fill(cardColor(fu.cardId))
        .stroke({ width: isKing ? 4 : 2, color: OWNER_TINT[fu.owner] });
      const hp = new Graphics();
      container.addChild(body, hp);
      app.stage.addChild(container);
      const g = { container, body, hp };
      gfxByUid.set(fu.uid, g);
      return g;
    }

    function applyFrame(units: FrameUnit[]): void {
      for (const fu of units) {
        const g = gfxByUid.get(fu.uid) ?? drawUnit(fu);
        g.container.x = cx(fu.col);
        g.container.y = cy(laneCenter(fu.lanes));
        g.container.visible = fu.alive;
        g.container.alpha = fu.alive ? 1 : 0;
        const w = (fu.isKing ? 2 : 1) * CELL * 0.82;
        const ratio = Math.max(0, Math.min(1, fu.hp / fu.maxHp));
        g.hp.clear();
        g.hp
          .roundRect(-w / 2, -w / 2 - 10, w, 6, 3)
          .fill(0x222833)
          .roundRect(-w / 2, -w / 2 - 10, w * ratio, 6, 3)
          .fill(ratio > 0.35 ? 0x5ad25a : 0xe2c04a);
      }
    }

    void app
      .init({
        width: W,
        height: H,
        background: "#0e1220",
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      .then(() => {
        initialized = true;
        if (disposed) {
          app.destroy(true, { children: true });
          return;
        }
        hostRef.current?.appendChild(app.canvas);

        // Static arena: lanes + the mid-line dividing the two boards.
        const grid = new Graphics();
        for (let l = 0; l <= ARENA.lanes; l++)
          grid.moveTo(0, l * CELL).lineTo(W, l * CELL);
        for (let c = 0; c <= ARENA.width; c++)
          grid.moveTo(c * CELL, 0).lineTo(c * CELL, H);
        grid.stroke({ width: 1, color: 0x263041 });
        grid.moveTo(W / 2, 0).lineTo(W / 2, H).stroke({ width: 3, color: 0x3a4a63 });
        app.stage.addChildAt(grid, 0);

        const frames = result.frames;
        const msPerFrame = 1000 / SIMULATION.ticksPerSecond;
        if (frames.length > 0) applyFrame(frames[0]!.units);
        let elapsed = 0;

        // rAF drives the smooth animation while the tab is visible.
        app.ticker.add((ticker) => {
          elapsed += ticker.deltaMS;
          const idx = Math.min(frames.length - 1, Math.floor(elapsed / msPerFrame));
          const frame = frames[idx];
          if (frame) applyFrame(frame.units);
        });

        // A wall-clock timer guarantees the result screen appears even if the
        // tab is backgrounded (browsers throttle/pause rAF when hidden).
        const durationMs = frames.length * msPerFrame + 900;
        finishTimer = window.setTimeout(() => {
          if (!finishedRef.current) {
            finishedRef.current = true;
            onFinish();
          }
        }, durationMs);
      });

    return () => {
      disposed = true;
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
      if (initialized) app.destroy(true, { children: true });
    };
  }, [result, onFinish]);

  return <div className="arena" ref={hostRef} />;
}
