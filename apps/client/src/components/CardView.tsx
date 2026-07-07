import type { CSSProperties } from "react";
import { CATALOG } from "../data/catalog";
import { ELEMENT_META, RANGE_META, RARITY_META } from "../data/cardMeta";

interface Props {
  cardId: string;
  onClick?: () => void;
  onInfo?: () => void;
  size?: "small" | "medium" | "large";
}

export function CardView({ cardId, onClick, onInfo, size = "medium" }: Props) {
  const card = CATALOG.get(cardId);
  if (!card) return null;

  const el = ELEMENT_META[card.elements[0]!];
  const rarity = RARITY_META[card.rarity];
  const style: CSSProperties = {
    "--card-color": card.art.placeholderColor,
    "--rarity-color": rarity.color,
  } as CSSProperties;

  return (
    <div className={`card card--${size}`} style={style} onClick={onClick}>
      <div className="card__header">
        <span className="card__element" title={el.he}>
          {el.icon}
        </span>
        {card.midBoss && <span className="card__boss" title="ענק אמצע (מתאים למלך)">👑</span>}
        {onInfo && (
          <button
            type="button"
            className="card__info"
            title="פרטי הקלף"
            onClick={(e) => {
              e.stopPropagation();
              onInfo();
            }}
          >
            ℹ
          </button>
        )}
      </div>

      <span className="card__name">{card.name.he}</span>

      {size !== "small" && (
        <span className="card__stats">
          <span title="חיים">❤️ {card.stats.hp}</span>
          <span title="עוצמה">⚔️ {card.stats.power}</span>
        </span>
      )}

      <span className="card__tags">
        <span title={RANGE_META[card.stats.range].he}>{RANGE_META[card.stats.range].icon}</span>
        {card.stats.moveSpeed > 0 && <span title="מסתער">🏃</span>}
        {card.flying && <span title="מעופף">🕊️</span>}
      </span>
    </div>
  );
}

/** A face-down card (fog of war). */
export function CardBack({ size = "small" }: { size?: "small" | "medium" }) {
  return (
    <div className={`card card--back card--${size}`}>
      <span className="card-back__mark">❓</span>
    </div>
  );
}
