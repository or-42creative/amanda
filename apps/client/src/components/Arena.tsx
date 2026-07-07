import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text } from "pixi.js";
import { ARENA, SIMULATION } from "@amanda/shared";
import type { BattleResult, FrameUnit, Owner } from "@amanda/engine";
import { cardColor, CATALOG } from "../data/catalog";
import { sfx } from "../game/sfx";

const CELL = 72;
const W = ARENA.width * CELL;
const H = ARENA.lanes * CELL;
const OWNER_TINT = { A: 0x4aa3ff, B: 0xff5a5a } as const;
const FINALE_MS = 1700;

const cx = (col: number): number => (col + 0.5) * CELL;
const cy = (lane: number): number => (lane + 0.5) * CELL;
const laneCenter = (lanes: number[]): number => lanes.reduce((s, l) => s + l, 0) / lanes.length;

interface UnitGfx {
  container: Container;
  body: Graphics;
  hp: Graphics;
  targetAlpha: number;
  pulse: number;
  exploding: boolean;
  half: number;
  owner: Owner;
}
interface Floater {
  text: Text;
  life: number;
}
interface Burst {
  g: Graphics;
  life: number;
}

export function Arena({ result, onFinish }: { result: BattleResult; onFinish: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    let disposed = false;
    let initialized = false;
    let finaleStarted = false;
    const timers: number[] = [];
    const app = new Application();
    const gfxByUid = new Map<string, UnitGfx>();
    const floaters: Floater[] = [];
    const bursts: Burst[] = [];

    function drawUnit(fu: FrameUnit): UnitGfx {
      const container = new Container();
      const w = (fu.isKing ? 2 : 1) * CELL * 0.8;
      const body = new Graphics();
      body
        .roundRect(-w / 2, -w / 2, w, w, 10)
        .fill(cardColor(fu.cardId))
        .stroke({ width: fu.isKing ? 5 : 3, color: OWNER_TINT[fu.owner] });
      const hp = new Graphics();
      const name = CATALOG.get(fu.cardId)?.name.he ?? "";
      const label = new Text({
        text: fu.isKing ? `👑 ${name}` : name,
        style: { fontFamily: "Segoe UI, sans-serif", fontSize: 11, fill: 0xffffff, fontWeight: "600" },
      });
      label.anchor.set(0.5);
      label.y = w / 2 + 9;
      container.addChild(body, hp, label);
      app.stage.addChild(container);
      const g: UnitGfx = {
        container,
        body,
        hp,
        targetAlpha: 1,
        pulse: 0,
        exploding: false,
        half: w / 2,
        owner: fu.owner,
      };
      gfxByUid.set(fu.uid, g);
      return g;
    }

    function applyFrame(units: FrameUnit[]): void {
      for (const fu of units) {
        const g = gfxByUid.get(fu.uid) ?? drawUnit(fu);
        g.container.x = cx(fu.col);
        g.container.y = cy(laneCenter(fu.lanes));
        g.targetAlpha = fu.alive ? 1 : 0;
        const ratio = Math.max(0, Math.min(1, fu.hp / fu.maxHp));
        g.hp.clear();
        g.hp
          .roundRect(-g.half, -g.half - 11, g.half * 2, 6, 3)
          .fill(0x222833)
          .roundRect(-g.half, -g.half - 11, g.half * 2 * ratio, 6, 3)
          .fill(ratio > 0.35 ? 0x5ad25a : 0xe2c04a);
      }
    }

    function spawnDamage(uid: string | undefined, amount: number): void {
      if (!uid || amount <= 0) return;
      const g = gfxByUid.get(uid);
      if (!g) return;
      const t = new Text({
        text: `-${amount}`,
        style: { fontFamily: "Segoe UI, sans-serif", fontSize: 15, fill: 0xff6b6b, fontWeight: "800" },
      });
      t.anchor.set(0.5);
      t.x = g.container.x;
      t.y = g.container.y - g.half;
      app.stage.addChild(t);
      floaters.push({ text: t, life: 1 });
    }

    function spawnBurst(x: number, y: number): void {
      const g = new Graphics();
      g.x = x;
      g.y = y;
      app.stage.addChild(g);
      bursts.push({ g, life: 1 });
    }

    function triggerFinale(units: FrameUnit[]): void {
      finaleStarted = true;
      const loser = result.winner === "A" ? "B" : result.winner === "B" ? "A" : null;
      if (!loser) return; // a draw does not collapse a board
      sfx.play("explode");
      for (const fu of units) {
        if (fu.owner !== loser) continue;
        if (!fu.alive && !fu.isKing) continue; // collapse the survivors + the King
        const g = gfxByUid.get(fu.uid);
        if (!g) continue;
        g.container.alpha = 1;
        g.exploding = true;
        spawnBurst(g.container.x, g.container.y);
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

        const bg = new Graphics();
        bg.rect(0, 0, W / 2, H).fill({ color: OWNER_TINT.A, alpha: 0.06 });
        bg.rect(W / 2, 0, W / 2, H).fill({ color: OWNER_TINT.B, alpha: 0.06 });
        for (let l = 0; l <= ARENA.lanes; l++) bg.moveTo(0, l * CELL).lineTo(W, l * CELL);
        for (let c = 0; c <= ARENA.width; c++) bg.moveTo(c * CELL, 0).lineTo(c * CELL, H);
        bg.stroke({ width: 1, color: 0x263041 });
        bg.moveTo(W / 2, 0).lineTo(W / 2, H).stroke({ width: 3, color: 0x3a4a63 });
        app.stage.addChildAt(bg, 0);

        const frames = result.frames;
        const events = result.events;
        const msPerFrame = 1000 / SIMULATION.ticksPerSecond;
        const lastUnits = frames.length ? frames[frames.length - 1]!.units : [];
        let elapsed = 0;
        let eventCursor = 0;
        if (frames.length > 0) applyFrame(frames[0]!.units);

        app.ticker.add((ticker) => {
          elapsed += ticker.deltaMS;
          const k = Math.min(1, ticker.deltaMS / 90);

          if (!finaleStarted) {
            const idx = Math.min(frames.length - 1, Math.floor(elapsed / msPerFrame));
            const frame = frames[idx];
            if (frame) applyFrame(frame.units);
            const currentTick = frame?.tick ?? 0;
            while (eventCursor < events.length && events[eventCursor]!.tick <= currentTick) {
              const ev = events[eventCursor]!;
              if (ev.type === "hit") spawnDamage(ev.targetUid, ev.damage ?? 0);
              else if (ev.type === "attack" && ev.uid) {
                const g = gfxByUid.get(ev.uid);
                if (g) g.pulse = 1;
              }
              eventCursor++;
            }
          }

          for (const g of gfxByUid.values()) {
            if (g.exploding) {
              g.container.alpha += (0 - g.container.alpha) * k * 1.4;
              const s = g.container.scale.x + (2.1 - g.container.scale.x) * k * 1.4;
              g.container.scale.set(s);
            } else {
              g.container.alpha += (g.targetAlpha - g.container.alpha) * k;
              const s = (g.targetAlpha < 0.5 ? 0.6 : 1) + g.pulse * 0.18;
              g.container.scale.set(g.container.scale.x + (s - g.container.scale.x) * k);
              g.pulse *= 0.82;
            }
          }
          for (let i = floaters.length - 1; i >= 0; i--) {
            const f = floaters[i]!;
            f.text.y -= ticker.deltaMS * 0.03;
            f.life -= ticker.deltaMS / 700;
            f.text.alpha = Math.max(0, f.life);
            if (f.life <= 0) {
              f.text.destroy();
              floaters.splice(i, 1);
            }
          }
          for (let i = bursts.length - 1; i >= 0; i--) {
            const b = bursts[i]!;
            b.life -= ticker.deltaMS / FINALE_MS;
            const r = (1 - b.life) * 60;
            b.g.clear();
            b.g.circle(0, 0, r).stroke({ width: 4, color: 0xffcc44, alpha: Math.max(0, b.life) });
            b.g.circle(0, 0, r * 0.6).fill({ color: 0xffffff, alpha: Math.max(0, b.life * 0.5) });
            if (b.life <= 0) {
              b.g.destroy();
              bursts.splice(i, 1);
            }
          }
        });

        const playbackMs = frames.length * msPerFrame;
        timers.push(window.setTimeout(() => triggerFinale(lastUnits), playbackMs));
        timers.push(
          window.setTimeout(() => {
            if (!finishedRef.current) {
              finishedRef.current = true;
              onFinish();
            }
          }, playbackMs + FINALE_MS),
        );
      });

    return () => {
      disposed = true;
      for (const t of timers) window.clearTimeout(t);
      if (initialized) app.destroy(true, { children: true });
    };
  }, [result, onFinish]);

  return <div className="arena" ref={hostRef} />;
}
