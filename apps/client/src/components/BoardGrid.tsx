import { CardView, CardBack } from "./CardView";
import { BOARD_SIZE, cellKey, isKingCell } from "../game/useMatch";

interface Props {
  placements: Record<string, string>;
  king: string | null;
  /**
   * Which way the board's front row (depth x=3) points. "up" = front at the top
   * (the player, at the bottom of the screen); "down" = front at the bottom
   * (the opponent, at the top of the screen). The two thus face each other.
   */
  facing: "up" | "down";
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
  facing,
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
  // Depth (x) runs vertically; lanes (y) run horizontally so both boards' lanes align.
  const rowForX = (x: number) => (facing === "up" ? BOARD_SIZE - x : x + 1);
  const colForY = (y: number) => y + 1;

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
            style={{ gridColumn: colForY(y), gridRow: rowForX(x) }}
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
