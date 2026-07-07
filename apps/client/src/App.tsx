import { PHASES } from "@amanda/shared";
import { useMatch } from "./game/useMatch";
import { Board } from "./components/Board";
import { CardView } from "./components/CardView";
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
        {(m.phase === "build" || m.phase === "panic") && (
          <div className="topbar__timer">⏱️ {Math.ceil(m.timeLeft)}s</div>
        )}
      </header>

      {(m.phase === "build" || m.phase === "panic") && (
        <main className="build">
          <section className="build__board">
            <Board m={m} />
            <p className="opponent-note">
              {m.phase === "panic" ? "🚨 היריב נחשף! התאמות אחרונות" : "🕵️ היריב בונה בסתר…"}
            </p>
          </section>

          <aside className="hand">
            <div className="hand__current">
              {m.hand ? (
                <CardView cardId={m.hand} />
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
              לחצו על משבצת ריקה כדי להניח את הקלף.
              <br />
              לחצו על משבצת <b>👑 המלך</b> כדי למנות מלך.
              <br />
              לחיצה על קלף שהונח מחזירה אותו לחפיסה.
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
    </div>
  );
}
