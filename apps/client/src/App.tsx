import { useState } from "react";
import { PHASES } from "@amanda/shared";
import { useMatch } from "./game/useMatch";
import { BoardGrid } from "./components/BoardGrid";
import { CardView } from "./components/CardView";
import { CardDetailModal } from "./components/CardDetailModal";
import { Arena } from "./components/Arena";
import { ErrorBoundary } from "./components/ErrorBoundary";

const PHASE_LABEL: Record<string, string> = {
  build: PHASES.build.label.he,
  panic: PHASES.panic.label.he + "!",
  battle: PHASES.battle.label.he,
  result: "סיום",
};

export default function App() {
  const m = useMatch();
  const [detail, setDetail] = useState<string | null>(null);
  const openInfo = (cardId: string) => setDetail(cardId);

  const building = m.phase === "build" || m.phase === "panic";
  const winnerText =
    m.result?.winner === "A"
      ? "🎉 ניצחת!"
      : m.result?.winner === "B"
        ? "😢 הפסדת"
        : "🤝 תיקו";

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__title">אמנדה — המשחקון</div>
        <div className={`topbar__phase phase--${m.phase}`}>{PHASE_LABEL[m.phase]}</div>
        {building && <div className="topbar__timer">⏱️ {Math.ceil(m.timeLeft)}s</div>}
      </header>

      {building && (
        <main className={`build${m.phase === "panic" ? " build--panic" : ""}`}>
          <div className="boards">
            <section className="side side--enemy">
              <div className="side__label">
                {m.phase === "panic" ? "🚨 היריב — נחשף!" : "🕵️ היריב — ערפל קרב"}
              </div>
              <BoardGrid
                placements={m.opponent.placements}
                king={m.opponent.king}
                mirrored
                compact
                reveal={m.revealOpponentCell}
                revealKing={m.revealOpponentKing}
                onCardInfo={openInfo}
              />
              <div className="side__hint">
                {m.phase === "panic" ? "השורה האחורית עדיין חסויה" : "רואים רק את השורה הקדמית"}
              </div>
            </section>

            <div className="vs">⚔️</div>

            <section className="side side--me">
              <div className="side__label">👤 הלוח שלך · חזית ←</div>
              <BoardGrid
                placements={m.placements}
                king={m.king}
                interactive
                handActive={m.hand !== null}
                onCellClick={(x, y) => (m.placements[`${x}-${y}`] ? m.pickUp(x, y) : m.placeAt(x, y))}
                onKingClick={m.placeKing}
                onCardInfo={openInfo}
              />
            </section>
          </div>

          <aside className="hand">
            <div className="hand__current">
              {m.hand ? (
                <CardView cardId={m.hand} size="large" onClick={() => openInfo(m.hand!)} onInfo={() => openInfo(m.hand!)} />
              ) : (
                <div className="hand__empty">אין קלף ביד</div>
              )}
            </div>

            <div className="hand__buttons">
              <button onClick={m.draw} disabled={m.hand !== null || m.deckCount === 0}>
                שלוף קלף ({m.deckCount})
              </button>
              <button onClick={m.takeDiscard} disabled={m.hand !== null || !m.discardTop}>
                קח מהפח {m.discardTop ? "♻️" : ""}
              </button>
              <button onClick={m.discardHand} disabled={m.hand === null}>
                זרוק לפח 🗑️
              </button>
            </div>

            <p className="hand__hint">
              משבצת ריקה = הנחה · לחיצה על קלף מונח = החזרה לחפיסה · <b>ℹ</b> = פרטים · 👑 = מלך
            </p>
            {!m.hasKing && <p className="warn">⚠️ עדיין לא מיניתם מלך!</p>}

            <button className="btn-fight" onClick={m.startBattle}>
              ⚔️ התחל קרב!
            </button>
          </aside>
        </main>
      )}

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
    </div>
  );
}
