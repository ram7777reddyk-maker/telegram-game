import type { PointerEvent } from "react";
import type { Card as CardType } from "../types/game";

interface CardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLButtonElement>) => void;
}

function getSuitSymbol(
  suit: CardType["suit"]
): string {
  switch (suit) {
    case "hearts":
      return "\u2665";
    case "diamonds":
      return "\u2666";
    case "clubs":
      return "\u2663";
    case "spades":
      return "\u2660";
    default:
      return "";
  }
}

export default function Card({
  card,
  selected = false,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel
}: CardProps) {
  const symbol = getSuitSymbol(card.suit);

  const isRed =
    card.suit === "hearts" ||
    card.suit === "diamonds";

  return (
    <button
      className={`playing-card ${
        selected ? "selected" : ""
      } ${isRed ? "red" : "black"}`}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none"
      }}
      type="button"
    >
      <span className="card-rank">
        {card.rank}
      </span>

      <span className="card-suit">
        {symbol}
      </span>

      {card.isJoker && (
        <span className="joker-label">
          JOKER
        </span>
      )}
    </button>
  );
}
