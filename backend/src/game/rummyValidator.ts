import { Card, Rank } from "./types.js";

export type CombinationType =
  | "pure_sequence"
  | "impure_sequence"
  | "set";

export interface Combination {
  type: CombinationType;
  cards: Card[];
}

const rankValue: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  "J": 11,
  "Q": 12,
  "K": 13,
  "A": 14
};

function cardKey(card: Card): string {
  return `${card.suit}:${card.rank}:${card.isJoker === true}`;
}

function isJokerCard(
  card: Card,
  wildJokerRank: Rank | null
): boolean {
  return (
    card.isJoker === true ||
    (
      wildJokerRank !== null &&
      card.rank === wildJokerRank
    )
  );
}

function normalCards(
  cards: Card[],
  wildJokerRank: Rank | null
): Card[] {
  return cards.filter(
    card => !isJokerCard(card, wildJokerRank)
  );
}

function sortCards(cards: Card[]): Card[] {
  return [...cards].sort(
    (a, b) =>
      rankValue[a.rank] -
      rankValue[b.rank]
  );
}

export function isPureSequence(
  cards: Card[],
  wildJokerRank: Rank | null = null
): boolean {
  if (cards.length < 3) {
    return false;
  }

  if (
    cards.some(
      card => isJokerCard(card, wildJokerRank)
    )
  ) {
    return false;
  }

  const sorted =
    sortCards(cards);

  if (
    !sorted.every(
      card =>
        card.suit ===
        sorted[0].suit
    )
  ) {
    return false;
  }

  const values =
    sorted.map(
      card => rankValue[card.rank]
    );

  if (
    new Set(values).size !==
    values.length
  ) {
    return false;
  }

  let normal = true;

  for (
    let i = 1;
    i < values.length;
    i++
  ) {
    if (
      values[i] !==
      values[i - 1] + 1
    ) {
      normal = false;
      break;
    }
  }

  if (normal) {
    return true;
  }

  // A-2-3
  if (
    values.includes(14) &&
    values.includes(2) &&
    values.includes(3)
  ) {
    const aceLow =
      values
        .map(value =>
          value === 14
            ? 1
            : value
        )
        .sort(
          (a, b) => a - b
        );

    for (
      let i = 1;
      i < aceLow.length;
      i++
    ) {
      if (
        aceLow[i] !==
        aceLow[i - 1] + 1
      ) {
        return false;
      }
    }

    return true;
  }

  return false;
}

export function isImpureSequence(
  cards: Card[],
  wildJokerRank: Rank | null
): boolean {
  if (cards.length < 3) {
    return false;
  }

  const jokers =
    cards.filter(
      card =>
        isJokerCard(
          card,
          wildJokerRank
        )
    );

  const naturals =
    normalCards(
      cards,
      wildJokerRank
    );

  if (jokers.length === 0) {
    return false;
  }

  if (naturals.length === 0) {
    return false;
  }

  const suit =
    naturals[0].suit;

  if (
    !naturals.every(
      card =>
        card.suit === suit
    )
  ) {
    return false;
  }

  const values =
    naturals
      .map(
        card =>
          rankValue[card.rank]
      )
      .sort(
        (a, b) => a - b
      );

  if (
    new Set(values).size !==
    values.length
  ) {
    return false;
  }

  /*
   * Try normal sequence:
   *
   * Example:
   * 5, 6, Joker, 8
   *
   * Joker fills 7.
   */
  const normalMissing =
    values[
      values.length - 1
    ] -
    values[0] +
    1 -
    values.length;

  if (
    normalMissing >= 0 &&
    normalMissing <=
      jokers.length
  ) {
    return true;
  }

  /*
   * Try A-2-3 style sequence.
   *
   * Example:
   * A, 2, Joker
   */
  if (
    values.includes(14)
  ) {
    const aceLowValues =
      values
        .map(
          value =>
            value === 14
              ? 1
              : value
        )
        .sort(
          (a, b) => a - b
        );

    const missing =
      aceLowValues[
        aceLowValues.length - 1
      ] -
      aceLowValues[0] +
      1 -
      aceLowValues.length;

    if (
      missing >= 0 &&
      missing <=
        jokers.length
    ) {
      return true;
    }
  }

  return false;
}

export function isSet(
  cards: Card[],
  wildJokerRank: Rank | null = null
): boolean {
  if (
    cards.length !== 3 &&
    cards.length !== 4
  ) {
    return false;
  }

  const jokers =
    cards.filter(
      card =>
        isJokerCard(
          card,
          wildJokerRank
        )
    );

  const naturals =
    normalCards(
      cards,
      wildJokerRank
    );

  if (naturals.length === 0) {
    return false;
  }

  const firstRank =
    naturals[0].rank;

  if (
    !naturals.every(
      card =>
        card.rank === firstRank
    )
  ) {
    return false;
  }

  const uniqueSuits =
    new Set(
      naturals.map(
        card => card.suit
      )
    );

  if (
    uniqueSuits.size !==
    naturals.length
  ) {
    return false;
  }

  return (
    naturals.length +
      jokers.length >= 3
  );
}

export function findCombinations(
  cards: Card[],
  wildJokerRank: Rank | null = null
): Combination[] {
  const combinations: Combination[] = [];

  for (
    let mask = 0;
    mask <
      (1 << cards.length);
    mask++
  ) {
    const subset: Card[] = [];

    for (
      let i = 0;
      i < cards.length;
      i++
    ) {
      if (
        mask & (1 << i)
      ) {
        subset.push(cards[i]);
      }
    }

    if (
      subset.length < 3
    ) {
      continue;
    }

    if (
      isPureSequence(
        subset,
        wildJokerRank
      )
    ) {
      combinations.push({
        type: "pure_sequence",
        cards:
          sortCards(subset)
      });
    }

    if (
      isImpureSequence(
        subset,
        wildJokerRank
      )
    ) {
      combinations.push({
        type: "impure_sequence",
        cards:
          sortCards(subset)
      });
    }

    if (
      isSet(
        subset,
        wildJokerRank
      )
    ) {
      combinations.push({
        type: "set",
        cards:
          sortCards(subset)
      });
    }
  }

  return combinations;
}

function canUseAllCards(
  cards: Card[],
  combinations: Combination[],
  used: boolean[],
  selected: Combination[],
  hasPureSequence: boolean
): boolean {
  const usedCount =
    used.filter(
      value => value
    ).length;

  if (
    usedCount ===
    cards.length
  ) {
    return hasPureSequence;
  }

  const firstUnusedIndex =
    used.findIndex(
      value => !value
    );

  if (
    firstUnusedIndex === -1
  ) {
    return false;
  }

  const firstUnusedCard =
    cards[firstUnusedIndex];

  for (
    const combination
      of combinations
  ) {
    if (
      !combination.cards.some(
        card =>
          cardKey(card) ===
          cardKey(
            firstUnusedCard
          )
      )
    ) {
      continue;
    }

    const indexes: number[] = [];

    let valid = true;

    for (
      const combinationCard
        of combination.cards
    ) {
      const index =
        cards.findIndex(
          (
            card,
            cardIndex
          ) =>
            !used[cardIndex] &&
            cardKey(card) ===
              cardKey(
                combinationCard
              )
        );

      if (
        index === -1
      ) {
        valid = false;
        break;
      }

      indexes.push(index);
    }

    if (!valid) {
      continue;
    }

    for (
      const index of indexes
    ) {
      used[index] = true;
    }

    selected.push(
      combination
    );

    const result =
      canUseAllCards(
        cards,
        combinations,
        used,
        selected,
        hasPureSequence ||
          combination.type ===
            "pure_sequence"
      );

    if (result) {
      return true;
    }

    selected.pop();

    for (
      const index of indexes
    ) {
      used[index] = false;
    }
  }

  return false;
}

export function isValidRummyHand(
  cards: Card[],
  wildJokerRank: Rank | null = null
): boolean {
  if (
    cards.length !== 13
  ) {
    return false;
  }

  const uniqueCards =
    new Set(
      cards.map(card =>
        cardKey(card)
      )
    );

  if (
    uniqueCards.size !==
    cards.length
  ) {
    return false;
  }

  const combinations =
    findCombinations(
      cards,
      wildJokerRank
    );

  const used =
    new Array(
      cards.length
    ).fill(false);

  return canUseAllCards(
    cards,
    combinations,
    used,
    [],
    false
  );
}


