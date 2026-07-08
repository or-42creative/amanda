import { CardView, CardBack } from "./CardView";
import { BOARD_SIZE, cellKey, isKingCell } from "../game/useMatch";

interface Props {
  placements: Record<string, string>;
  king: string | null;
  /**
   * Which side of the screen this board sits on. The front row (depth x=3)
   * always points toward the center, so the two boards face each other:
   * "left" board (you) → front on its right; "right" board (opponent) → front
   * on its left.
   */
  side: "left" | "right";
  reveal?: (x: number, y: number) => boolean;
  revealKing?: boolean;
  interactive?: boolean;
  handActive?: boolean;
  onCellClick?: (x: number, y: number) => void;
  onKingClick?: () => void;
  onCardInfo?: (cardId: string) => void;
  compact?: boolean;
}

export function BoardGrid({
  placements,
  king,
  side,
  reveal,
  revealKing = true,
  interactive = false,
  handActive = false,
  onCellClick,
  onKingClick,
  onCardInfo,
  compact = false,
}: Props) {
  const cells: Array<{ x: number; y: number }> = [];
  for (let x = 0; x < BOARD_SIZE; x++)
    for (let y = 0; y < BOARD_SIZE; y++) if (!isKingCell(x, y)) cells.push({ x, y });

  const size = compact ? "small" : "medium";
  // Depth (x) runs horizontally so the two boards face each other; lanes (y)
  // run vertically and align across both boards.
  const colForX = (x: number) => (side === "left" ? x + 1 : BOARD_SIZE - x);
  const rowForY = (y: number) => y + 1;

  return (
    <div className={`board${compact ? " board--compact" : ""}`} dir="ltr">
      <div
        className={`slot slot--king${king ? " slot--filled" : ""}`}
        style={{ gridColumn: "2 / 4", gridRow: "2 / 4" }}
        onClick={() => {
          if (!interactive) return;
          if (king) onCardInfo?.(king);
          else onKingClick?.();
        }}
      >
        {!revealKing ? (
          <CardBack size="medium" />
        ) : king ? (
          <CardView
            cardId={king}
            size={compact ? "small" : "large"}
            king
            onInfo={onCardInfo ? () => onCardInfo(king) : undefined}
          />
        ) : (
          <span className="slot__hint">👑 המלך</span>
        )}
      </div>

      {cells.map(({ x, y }) => {
        const key = cellKey(x, y);
        const occ = placements[key];
        const shown = reveal ? reveal(x, y) : true;
        return (
          <div
            key={key}
            className={`slot${occ && shown ? " slot--filled" : ""}`}
            style={{ gridColumn: colForX(x), gridRow: rowForY(y) }}
            onClick={() => {
              if (!interactive) return;
              if (occ) onCardInfo?.(occ);
              else onCellClick?.(x, y);
            }}
          >
            {!shown ? (
              <CardBack size={size} />
            ) : occ ? (
              <CardView
                cardId={occ}
                size={size}
                onInfo={onCardInfo ? () => onCardInfo(occ) : undefined}
              />
            ) : (
              interactive && handActive && <span className="slot__hint">＋</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
