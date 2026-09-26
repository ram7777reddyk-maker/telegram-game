import type { DragEvent } from "react";
import type { Card as CardType } from "../types/game";

interface CardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void;
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
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop
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
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      draggable={draggable}
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
