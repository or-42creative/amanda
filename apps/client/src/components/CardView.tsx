import type { CSSProperties } from "react";
import { CATALOG } from "../data/catalog";

const RANGE_ICON: Record<string, string> = {
  melee: "🗡️",
  ranged: "🏹",
  sniper: "🎯",
};

export function CardView({
  cardId,
  onClick,
  small,
}: {
  cardId: string;
  onClick?: () => void;
  small?: boolean;
}) {
  const card = CATALOG.get(cardId);
  if (!card) return null;
  return (
    <button
      type="button"
      className={`card${small ? " card--small" : ""}`}
      style={{ "--card-color": card.art.placeholderColor } as CSSProperties}
      onClick={onClick}
      title={card.role?.he ?? card.name.he}
    >
      <span className="card__name">{card.name.he}</span>
      {!small && (
        <span className="card__stats">
          {card.stats.hp}❤ · {card.stats.power}⚔
        </span>
      )}
      <span className="card__tags">
        {RANGE_ICON[card.stats.range]}
        {card.stats.moveSpeed > 0 ? " →" : ""}
      </span>
    </button>
  );
}
