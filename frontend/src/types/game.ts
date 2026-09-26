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

export interface PublicPlayer {
  playerId: string;
  username?: string;
  cardCount: number;
}

export interface PublicGameState {
  roomId: string;
  status:
    | "waiting"
    | "playing"
    | "finished";

  playerCount: number;
  players: PublicPlayer[];

  deckCount: number;
  discardPile: Card[];

  currentPlayerId: string | null;

  wildJokerRank: Rank | null;

  winnerPlayerId: string | null;

  declarationResult:
    | "none"
    | "valid"
    | "invalid";
}

export interface PrivatePlayerState {
  playerId: string;
  username?: string;
  cards: Card[];
}
