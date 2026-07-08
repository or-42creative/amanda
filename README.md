# Amanda 🃏⚔️

Online, real-time multiplayer **auto-battler card game**. Fast ~85-second matches: build your 4×4 board behind fog of war, then watch a 15-second automatic battle decide who destroys the enemy **King** first.

> Game design lives in `משחק אמנדה - קלפים.docx` (bilingual Hebrew/English GDD).

## Tech stack

| Layer | Choice |
|---|---|
| Language | **TypeScript** everywhere (one shared, deterministic, server-authoritative engine) |
| Monorepo | **pnpm workspaces** |
| Frontend UI | **React + Vite** (menus), **PixiJS** (battle arena renderer) |
| Real-time backend | **Node + Colyseus** (rooms, matchmaking, state sync) |
| Data validation | **Zod** — all cards/actions are JSON validated against schemas |
| Future mobile | **Capacitor** (wraps the same web build to iOS/Android) |

The 15-second battle is a **deterministic simulation**: the server runs it authoritatively and both clients replay the same seed → identical outcome, low bandwidth, cheat-resistant.

## Repository layout

```
amanda/
├─ packages/
│  ├─ shared/            @amanda/shared — types, Zod schemas, config, data loader
│  │  ├─ src/
│  │  │  ├─ config.ts        ← ALL tunable rules (deck size, phases, King ×5, elements…)
│  │  │  ├─ schemas/         ← common, elements, ability, card, series, actionCard
│  │  │  ├─ loader.ts        ← parse + validate + cross-record integrity
│  │  │  └─ index.ts
│  │  └─ scripts/validate-data.ts
│  └─ engine/            @amanda/engine — deterministic headless auto-battle sim
│     ├─ src/
│     │  ├─ rng.ts           ← seeded PRNG (determinism)
│     │  ├─ setup.ts         ← boards → 4×8 arena units (King ×5, mirroring, stacking)
│     │  ├─ combat.ts        ← element multipliers + lane geometry
│     │  ├─ abilities.ts     ← data-driven ability handler registry
│     │  ├─ simulate.ts      ← fixed-tick loop → BattleResult + event log
│     │  └─ types.ts
│     ├─ test/               ← vitest: determinism + core mechanics
│     └─ scripts/demo-battle.ts
├─ data/                 JSON-driven content
│  ├─ series/            one file per monster series (5 seeded: dragons, giants,
│  │                     insects, plants, slimes = 50 cards). Drop in NN-name.json
│  │                     and the client auto-loads it — no code change.
│  └─ action-cards.json  13 action cards
└─ (coming next) apps/client · apps/server
```

### Engine capabilities (Step 2)

The 4×8 lane arena, advancing/collision/trample movement, melee/ranged/sniper
targeting, element multipliers, the King ×5 HP + King-death win condition, the
Ground-Floor stacking reveal, and a data-driven ability registry. Implemented
ability handlers so far: knockback, sideKnockback, trample, freezeOnHit,
armorBreak, elementSteal, damageReflect, sacrifice→armor, delayedTransform,
split/swarm-on-death, rootOnReveal, and the damageReduction / slow / attackSpeed
auras. Remaining ability types are stubbed no-ops (added incrementally as
content lands). Line-of-sight nuance for snipers and series-synergy activation
are the next engine TODOs.

```bash
pnpm --filter @amanda/engine test   # run the deterministic-sim tests
pnpm --filter @amanda/engine demo   # simulate a Dragons vs Slimes match
```

## Getting started

```bash
pnpm install
pnpm validate:data   # validate all card/action JSON against the schemas
pnpm typecheck       # type-check every package
```

## Design principles baked into the code

- **JSON-driven engine.** Cards, series synergies and action cards are pure data. Behaviors are expressed as *ability descriptors* (`{ type, trigger, params }`) — adding a card behavior = one enum entry + one engine handler, never a schema change.
- **Everything flexible is in `config.ts`.** Deck size (18/24), action-card count, action-slot count, and random-vs-manual action selection are one-line edits, exactly as the GDD requires.
- **Placeholder-first art.** Every card carries `art.placeholderColor` now and `art.sprite: null`; final graphics drop in as data later, no logic changes.
- **Bilingual from day one.** Every user-facing string is a `LocalizedString { he, en }`.

## Roadmap

1. ✅ **Foundation** — monorepo, JSON card schema, seed data
2. ✅ **Engine** — headless deterministic combat sim + tests (4×8 arena, lanes, stacking, abilities)
3. ✅ **Client** — React + Pixi local playable single-player loop
4. ⬜ **Multiplayer** — drop the engine into a Colyseus room

### Run the game (Step 3)

```bash
pnpm --filter @amanda/client dev   # open the printed http://localhost:5173
```

A full single-player match: draw cards, place them on your 4×4 board (click a
slot; click the centre 👑 to set your King), watch the 3-phase timer
(Build 2 min → Panic 30 s → Auto-Battle 15 s), then the PixiJS arena replays the
deterministic battle and shows the result. Placeholder shapes now; art drops in later.

Also in the client: a start screen (identity 🧑 vs 🤖) — the match begins only
on **Start**, then a 3-2-1 countdown; **auto-draw** (a card is always in hand,
refilled on place/discard); **glued placement** (placed cards stick — a future
action card may free them); richer cards (element icon, rarity, range/movement
tags); a tap-**ℹ** card detail view (full stats, abilities, series synergy);
a **vertical facing layout** (opponent on top, you at the bottom, front rows
meeting in the middle); fog of war (front row in Build; front + sides + King in
Panic; back Surprise Row hidden till battle); a **pre-battle** step that fills
empty slots with Crumb Demons then counts down; battle animations (unit labels,
attack pulses, floating damage, death fades) and a **King-explosion board
collapse** finale before the result; synthesised **sound effects** (mutable);
and a layered animated background.

King bonus: the card in the King slot gets **×3 HP and ×3 Power** (Or's tuned rule).

Match deck is **24 monster cards + 5 Action Cards** shuffled together (a deck-builder
screen comes later). **Action Cards are drawn during play**: when one comes up you
choose to **take it** into your 3-slot action bar (or discard it). Some are **active**
(⚡ Energy Boost, 👁️ X-Ray, ⬆️ Full Refuel — click in the bar to use) and some are
**passive** (🌋/🪨/🔥/💧 *Fill* cards — while held, they fill your empty slots at
battle start with a strong card instead of Crumb Demons — so it can pay to leave slots
open). The **opponent builds its board over the Build phase** (its front row appears as
it plays). Placement/battle share one orientation: **you on the left, opponent on the
right, front rows meeting in the middle.** Timing: Build 90 s → Panic 15 s → Battle 15 s.
