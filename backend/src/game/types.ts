export type Suit =
  | "hearts"
  | "diamonds"
  | "clubs"
  | "spades";

export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  isJoker?: boolean;
}

export interface PlayerState {
  playerId: string;
  username?: string;
  cards: Card[];
}

export interface GameState {
  roomId: string;
  status: "waiting" | "playing" | "finished";

  players: PlayerState[];

  deck: Card[];

  discardPile: Card[];

  currentPlayerId: string | null;

  hasDrawnThisTurn: boolean;

  wildJokerRank: Rank | null;

  winnerPlayerId: string | null;

  declarationResult:
    | "none"
    | "valid"
    | "invalid";
}
