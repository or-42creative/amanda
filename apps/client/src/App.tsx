import { useEffect, useRef, useState } from "react";
import { PHASES } from "@amanda/shared";
import { useMatch } from "./game/useMatch";
import { sfx } from "./game/sfx";
import { ACTIONS } from "./data/catalog";
import { BoardGrid } from "./components/BoardGrid";
import { CardView } from "./components/CardView";
import { CardDetailModal } from "./components/CardDetailModal";
import { ActionDetailModal } from "./components/ActionDetailModal";
import { Arena } from "./components/Arena";
import { ErrorBoundary } from "./components/ErrorBoundary";

const ACTION_ICON: Record<string, string> = {
  energy_boost: "⚡",
  xray: "👁️",
  full_refuel: "⬆️",
  fill_lava: "🌋",
  fill_colossus: "🪨",
  fill_flame: "🔥",
  fill_cube: "💧",
};

const PHASE_LABEL: Record<string, string> = {
  build: PHASES.build.label.he,
  panic: PHASES.panic.label.he + "!",
  prebattle: "נועלים לוחות…",
  battle: PHASES.battle.label.he,
  result: "סיום",
};

export default function App() {
  const m = useMatch();
  const [detail, setDetail] = useState<string | null>(null);
  const [actionDetail, setActionDetail] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const openInfo = (cardId: string) => setDetail(cardId);

  const showBoards = m.phase === "build" || m.phase === "panic" || m.phase === "prebattle";
  const interactive = m.phase === "build" || m.phase === "panic";

  // Countdown beeps for the timed overlays.
  const secRef = useRef(-1);
  useEffect(() => {
    if (m.phase === "countdown" || m.phase === "prebattle") {
      const s = Math.ceil(m.timeLeft);
      if (s !== secRef.current && s > 0) {
        secRef.current = s;
        sfx.play("beep");
      }
    } else {
      secRef.current = -1;
    }
  }, [m.timeLeft, m.phase]);

  const winnerText =
    m.result?.winner === "A" ? "🎉 ניצחת!" : m.result?.winner === "B" ? "😢 הפסדת" : "🤝 תיקו";

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__title">אמנדה — המשחקון</div>
        {m.phase !== "intro" && (
          <div className={`topbar__phase phase--${m.phase}`}>{PHASE_LABEL[m.phase]}</div>
        )}
        {(m.phase === "build" || m.phase === "panic") && (
          <div className="topbar__timer">⏱️ {Math.ceil(m.timeLeft)}s</div>
        )}
        <button
          className="mute"
          title="צליל"
          onClick={() => setMuted(sfx.toggleMute())}
          style={{ marginInlineStart: m.phase === "build" || m.phase === "panic" ? 0 : "auto" }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </header>

      {/* ---- intro / start screen ---- */}
      {m.phase === "intro" && (
        <main className="intro">
          <div className="intro__card">
            <h1>אמנדה</h1>
            <p className="intro__tag">קרב מדבקות מהיר · 4×4</p>
            <div className="versus">
              <div className="who who--me">
                <div className="who__avatar">🧑</div>
                <div className="who__name">אתה</div>
              </div>
              <div className="versus__x">VS</div>
              <div className="who who--enemy">
                <div className="who__avatar">🤖</div>
                <div className="who__name">היריב</div>
              </div>
            </div>
            <button className="btn-fight" onClick={m.startMatch}>
              ▶️ התחל משחק
            </button>
            <p className="intro__hint">2 דקות לבנות את הלוח · חצי דקה פאניקה · 15 שניות קרב</p>
          </div>
        </main>
      )}

      {/* ---- build / panic / prebattle: two facing boards ---- */}
      {showBoards && (
        <main className={`build${m.phase === "panic" ? " build--panic" : ""}`}>
          <div className="boards">
            <section className="side side--me">
              <div className="side__label">🧑 אתה · חזית ⟶</div>
              <BoardGrid
                placements={m.placements}
                king={m.king}
                side="left"
                interactive={interactive}
                handActive={m.hand !== null}
                mods={m.mods}
                targeting={m.targeting !== null}
                onTarget={m.applyTargetCell}
                onTargetKing={m.applyTargetKing}
                onCellClick={(x, y) => m.placeAt(x, y)}
                onKingClick={m.placeKing}
                onCardInfo={openInfo}
              />
            </section>

            <div className="midline">
              <span>⚔️</span>
            </div>

            <section className="side side--enemy">
              <div className="side__label">
                🤖 היריב {m.phase === "build" ? "· ערפל" : "· נחשף!"} ⟵ חזית
              </div>
              <BoardGrid
                placements={m.opponent.placements}
                king={m.opponent.king}
                side="right"
                reveal={m.revealOpponentCell}
                revealKing={m.revealOpponentKing}
                onCardInfo={openInfo}
              />
            </section>
          </div>

          {m.targeting && (
            <div className="targeting-bar">
              🎯 בחרו קלף על הלוח שלכם עבור "{ACTIONS.get(m.targeting)?.name.he}"
              <button onClick={m.cancelTargeting}>ביטול</button>
            </div>
          )}

          {interactive && (
            <div className="actions">
              <span className="actions__title">
                קלפי פעולה {m.actionBar.length}/3:
              </span>
              {m.actionBar.length === 0 && (
                <span className="actions__empty">שלוף קלפי פעולה מהחפיסה וקח אותם לכאן</span>
              )}
              {m.actionBar.map((a) => {
                const card = ACTIONS.get(a.id);
                return (
                  <div key={a.id} className={`action-chip${a.passive ? " action-chip--passive" : ""}${a.used ? " action-chip--used-state" : ""}`}>
                    <button
                      className="action-chip__main"
                      disabled={a.passive || a.used}
                      onClick={() => m.activateAction(a.id)}
                    >
                      <span className="action-chip__icon">{ACTION_ICON[a.id] ?? "🎴"}</span>
                      <span className="action-chip__name">{card?.name.he}</span>
                      <span className="action-chip__used">
                        {a.passive ? "♾️" : a.used ? "✔" : "▶"}
                      </span>
                    </button>
                    <button
                      className="action-chip__info"
                      title="הסבר"
                      onClick={() => setActionDetail(a.id)}
                    >
                      ℹ
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {interactive && (
            <aside className="hand">
              <div className="hand__current">
                {!m.hand ? (
                  <div className="hand__empty">אין קלף</div>
                ) : m.handIsAction ? (
                  <button
                    className="action-hand"
                    title="לחצו להסבר"
                    onClick={() => setActionDetail(m.hand!)}
                  >
                    <span className="action-hand__info">i</span>
                    <span className="action-hand__icon">{ACTION_ICON[m.hand] ?? "🎴"}</span>
                    <span className="action-hand__name">{ACTIONS.get(m.hand)?.name.he}</span>
                    <span className="action-hand__tag">קלף פעולה</span>
                  </button>
                ) : (
                  <CardView cardId={m.hand} size="large" onClick={() => openInfo(m.hand!)} onInfo={() => openInfo(m.hand!)} />
                )}
              </div>
              <div className="hand__buttons">
                {m.handIsAction && (
                  <button className="take-action" onClick={m.takeAction} disabled={m.barFull}>
                    {m.barFull ? "הבר מלא" : "➕ קח לפעולה"}
                  </button>
                )}
                <button onClick={m.discardHand} disabled={m.hand === null}>
                  זרוק 🗑️
                </button>
                <button onClick={m.takeDiscard} disabled={!m.discardTop}>
                  קח מהפח {m.discardTop ? "♻️" : ""}
                </button>
              </div>
              <p className="hand__hint">
                מפלצת: הנחה על משבצת (קבוע!) · קלף פעולה: "קח לפעולה" (עד 3) · 👑 = מלך
              </p>
              {!m.hasKing && <p className="warn">⚠️ עדיין לא מיניתם מלך!</p>}
              <button className="btn-fight" onClick={m.toBattle}>
                ⚔️ התחל קרב!
              </button>
            </aside>
          )}

          {m.phase === "prebattle" && (
            <div className="overlay">
              <div className="overlay__mini">ממלאים את המשבצות הריקות…</div>
              <div className="overlay__count">{Math.ceil(m.timeLeft)}</div>
              <div className="overlay__label">הקרב מתחיל!</div>
            </div>
          )}
        </main>
      )}

      {/* ---- countdown before build ---- */}
      {m.phase === "countdown" && (
        <main className="build">
          <div className="overlay">
            <div className="overlay__count">{Math.ceil(m.timeLeft)}</div>
            <div className="overlay__label">מתכוננים לבנייה…</div>
          </div>
        </main>
      )}

      {/* ---- battle ---- */}
      {m.phase === "battle" && m.result && (
        <main className="battle">
          <ErrorBoundary
            fallback={
              <div className="result__card">
                <h1>💥</h1>
                <p>שגיאה בהצגת הקרב</p>
                <button className="btn-fight" onClick={m.finishBattle}>
                  המשך לתוצאה
                </button>
              </div>
            }
          >
            <Arena result={m.result} onFinish={m.finishBattle} />
          </ErrorBoundary>
        </main>
      )}

      {/* ---- result ---- */}
      {m.phase === "result" && m.result && (
        <main className="result">
          <div className="result__card">
            <h1>{winnerText}</h1>
            <p>
              הקרב נמשך {(m.result.ticks / 30).toFixed(1)} שניות ·{" "}
              {m.result.events.filter((e) => e.type === "death").length} מפלצות נפלו
            </p>
            <button className="btn-fight" onClick={m.reset}>
              🔄 משחק חדש
            </button>
          </div>
        </main>
      )}

      {detail && <CardDetailModal cardId={detail} onClose={() => setDetail(null)} />}
      {actionDetail && (
        <ActionDetailModal actionId={actionDetail} onClose={() => setActionDetail(null)} />
      )}
    </div>
  );
}
