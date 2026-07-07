import { CardView, CardBack } from "./CardView";
import { BOARD_SIZE, cellKey, isKingCell } from "../game/useMatch";

interface Props {
  placements: Record<string, string>;
  king: string | null;
  /** Opponent boards are mirrored so their front row (x=3) faces the player. */
  mirrored?: boolean;
  /** Fog: return false to hide a cell as face-down. Omit = everything visible. */
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
  mirrored = false,
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
  for (let y = 0; y < BOARD_SIZE; y++)
    for (let x = 0; x < BOARD_SIZE; x++) if (!isKingCell(x, y)) cells.push({ x, y });

  const size = compact ? "small" : "medium";
  const gridColumn = (x: number) => (mirrored ? BOARD_SIZE - x : x + 1);

  return (
    <div className={`board${compact ? " board--compact" : ""}`} dir="ltr">
      <div
        className={`slot slot--king${king ? " slot--filled" : ""}`}
        style={{ gridColumn: "2 / 4", gridRow: "2 / 4" }}
        onClick={() => interactive && !king && onKingClick?.()}
      >
        {!revealKing ? (
          <CardBack size="medium" />
        ) : king ? (
          <CardView
            cardId={king}
            size={compact ? "small" : "large"}
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
            style={{ gridColumn: gridColumn(x), gridRow: y + 1 }}
            onClick={() => {
              if (!interactive) return;
              onCellClick?.(x, y);
            }}
          >
            {!shown ? (
              occ ? (
                <CardBack size={size} />
              ) : (
                <CardBack size={size} />
              )
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
