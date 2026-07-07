import { CardView } from "./CardView";
import { BOARD_SIZE, cellKey, isKingCell, type MatchApi } from "../game/useMatch";

export function Board({ m }: { m: MatchApi }) {
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < BOARD_SIZE; y++)
    for (let x = 0; x < BOARD_SIZE; x++) if (!isKingCell(x, y)) cells.push({ x, y });

  const building = m.phase === "build" || m.phase === "panic";

  return (
    <div className="board" dir="ltr">
      {/* Central 2×2 King slot */}
      <div
        className={`slot slot--king${m.king ? " slot--filled" : ""}`}
        style={{ gridColumn: "2 / 4", gridRow: "2 / 4" }}
        onClick={() => building && !m.king && m.placeKing()}
      >
        {m.king ? <CardView cardId={m.king} /> : <span className="slot__hint">👑 המלך</span>}
      </div>

      {cells.map(({ x, y }) => {
        const key = cellKey(x, y);
        const occ = m.placements[key];
        return (
          <div
            key={key}
            className={`slot${occ ? " slot--filled" : ""}`}
            style={{ gridColumn: x + 1, gridRow: y + 1 }}
            onClick={() => {
              if (!building) return;
              if (occ) m.pickUp(x, y);
              else m.placeAt(x, y);
            }}
          >
            {occ ? (
              <CardView cardId={occ} small />
            ) : (
              m.hand && <span className="slot__hint">＋</span>
            )}
          </div>
        );
      })}

      <div className="board__front-label">חזית ← מול היריב</div>
    </div>
  );
}
