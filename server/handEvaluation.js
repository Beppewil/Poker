function highCard(hand) {
  var highCard = [];
  hand.forEach((card) => highCard.push(card.v));
  return Math.max(...highCard);
}

function _pair(hand) {
  const pairs = []; // Array to store card values and their counts

  // Count occurrences of each card value
  for (const card of hand) {
    const existingPair = pairs.find((pair) => pair.v === card.v);
    if (existingPair) {
      existingPair.count++;
    } else {
      pairs.push({ v: card.v, count: 1 });
    }
  }

  // Find all values that appear at least twice (pairs)
  let hasPair = pairs.filter((pair) => pair.count >= 2);

  // Sort pairs by value in descending order to get the strongest pairs first
  hasPair.sort((a, b) => b.v - a.v);

  let pairHand = [];

  if (hasPair.length > 0) {
    // Take up to the best two pairs
    const bestPairs = hasPair.slice(0, 2);

    // Extract the actual card objects corresponding to the best pairs
    const pairsCards = hand.filter((card) => bestPairs.find((pair) => pair.v === card.v));

    // Find the highest remaining card not part of the pairs
    const remainingCards = hand
      .filter((card) => !pairsCards.includes(card))
      .sort((a, b) => b.v - a.v); // Sort in descending order

    // Construct the best five-card hand: two pairs + highest kicker
    pairHand = pairsCards.concat(remainingCards.slice(0, 1));

    // Ensure the hand is exactly 5 cards (though it should be already)
    pairHand = pairHand.slice(0, 5);
  }

  // Return relevant information
  return [hasPair.length > 0, hasPair, hasPair.length, pairHand];
}


function _3ofAKind(hand) {
  const threes = []; // Array to store card values and their counts

  // Count occurrences of each card value
  for (const card of hand) {
    const existingThree = threes.find((three) => three.v === card.v);
    if (existingThree) {
      existingThree.count++;
    } else {
      threes.push({ v: card.v, count: 1 });
    }
  }

  // Find all values that appear at least three times (three-of-a-kind)
  let hasThree = threes.filter((three) => three.count >= 3);

  // Sort three-of-a-kind hands by value in descending order (strongest first)
  hasThree.sort((a, b) => b.v - a.v);

  let _3ofkHand = [];

  if (hasThree.length > 0) {
    // Pick the highest three-of-a-kind
    const bestThree = hasThree[0];

    // Extract the actual card objects corresponding to the best three-of-a-kind
    const threeOfAKindCards = hand.filter((card) => card.v === bestThree.v);

    // Find the highest two remaining cards (kickers)
    const remainingCards = hand
      .filter((card) => card.v !== bestThree.v) // Exclude the three-of-a-kind
      .sort((a, b) => b.v - a.v); // Sort remaining cards by value descending

    // Construct the best five-card hand: three-of-a-kind + two highest kickers
    _3ofkHand = threeOfAKindCards.concat(remainingCards.slice(0, 2));

    // Ensure exactly 5 cards (should already be handled)
    _3ofkHand = _3ofkHand.slice(0, 5);
  }

  // Return relevant information
  return [
    hasThree.length > 0, // Whether a three-of-a-kind was found
    hasThree, // List of found three-of-a-kind sets
    hasThree.length, // Number of three-of-a-kind sets
    _3ofkHand // The best possible hand (three-of-a-kind + two highest kickers)
  ];
}


function _straight(hand) {
  var cards = [];
  hand.forEach((card) => cards.push({ v: card.v }));

  if (hand.find(card => card.v === 14)) {
    cards.push({ v: 1 }); // Ace can be low in A-2-3-4-5
  }

  // Remove duplicates
  cards = [...new Map(cards.map(card => [card.v, card])).values()];

  // Sort cards in descending order
  cards.sort((a, b) => b.v - a.v);

  for (let i = 0; i < cards.length - 4; i++) {
    if (
      cards[i].v - 1 === cards[i + 1].v &&
      cards[i].v - 2 === cards[i + 2].v &&
      cards[i].v - 3 === cards[i + 3].v &&
      cards[i].v - 4 === cards[i + 4].v
    ) {
      var straightHand = cards.slice(i, i + 5);
      return [true, straightHand];
    }
  }

  return false;
}


function _flush(hand) {
  const suits = []; // Array to keep track of different suits and their card counts
  let hasFlush = false; // Flag to indicate if a flush is found

  // Iterate through each card in the hand
  for (const card of hand) {
    // Check if we already have this suit in the suits array
    const existingSuit = suits.find((suit) => suit.s === card.s);

    if (existingSuit) {
      // If the suit exists, increase its count and add the card to the list
      existingSuit.count++;
      existingSuit.cards.push(card);

      // If a suit reaches 5 cards, we have a flush
      if (existingSuit.count == 5) {
        hasFlush = true;
      }
    } else {
      // If the suit doesn't exist, create a new entry for it
      // 'v' is initialized with the first card's value in that suit
      suits.push({ v: card.v, s: card.s, count: 1, cards: [card] });
    }
  }

  // Return an array containing:
  // 1. Whether a flush was found (true/false)
  // 2. The suits that have at least 5 cards (flush candidates)
  return [hasFlush, suits.filter((suit) => suit.count >= 5)];
}

function _fullHouse(hand) {
  const threeOfAKind = _3ofAKind(hand)[1]; // List of three-of-a-kinds (triplets)
  const pairs = _pair(hand)[1]; // List of pairs

  // Ensure at least one three-of-a-kind exists
  if (threeOfAKind.length === 0) {
    return [false, null]; // No full house possible
  }

  // Sort three-of-a-kind and pairs in descending order (highest value first)
  threeOfAKind.sort((a, b) => b.v - a.v);
  pairs.sort((a, b) => b.v - a.v);

  // Case 1: Standard full house (three-of-a-kind + pair)
  if (threeOfAKind.length > 0 && pairs.length > 0) {
    // Ensure that the pair is not part of the three-of-a-kind
    const validPairs = pairs.filter(pair => pair.v !== threeOfAKind[0].v);

    if (validPairs.length > 0) {
      return [
        true,
        {
          three: threeOfAKind[0], // Highest three-of-a-kind
          pair: validPairs[0], // Highest pair that is not part of the three-of-a-kind
        },
      ];
    }
  }

  // Case 2: Two three-of-a-kinds (use one as the "three" and the other as the "pair")
  if (threeOfAKind.length >= 2) {
    return [
      true,
      {
        three: threeOfAKind[0], // Highest three-of-a-kind
        pair: { v: threeOfAKind[1].v, count: 2 }, // Second three-of-a-kind acts as the pair
      },
    ];
  }

  return [false, null]; // No valid full house found
}



function _4ofAKind(hand) {
  const counts = {}; // Object to track occurrences of each card value

  // Count occurrences of each card value
  for (const card of hand) {
    counts[card.v] = (counts[card.v] || 0) + 1;
  }

  // Find the value that appears exactly 4 times
  const fourValue = Object.keys(counts)
    .map(Number)
    .find((v) => counts[v] === 4);

  if (fourValue !== undefined) {
    // Extract the four-of-a-kind cards
    const fourOfAKindCards = hand.filter((card) => card.v === fourValue);

    // Find the highest kicker (remaining highest card)
    const kickers = hand
      .filter((card) => card.v !== fourValue)
      .sort((a, b) => b.v - a.v);

    // Construct the best 5-card hand (four-of-a-kind + best kicker)
    const _4ofkHand = fourOfAKindCards.concat(kickers.slice(0, 1));

    return [true, fourOfAKindCards, _4ofkHand];
  }

  return [false, [], []]; // No four-of-a-kind found
}

function _straightFlush(hand) {
  const [hasFlush, flushSuits] = _flush(hand);
  if (!hasFlush || flushSuits.length === 0) return [false, null]; // Defensive check

  for (const flushSuit of flushSuits) {
    if (!flushSuit.cards) continue; // Skip if undefined

    // Sort flush cards by value (descending)
    flushSuit.cards.sort((a, b) => b.v - a.v);

    // Add Ace as a low card (for A-2-3-4-5 straight flush)
    if (flushSuit.cards.some(card => card.v === 14)) {
      flushSuit.cards.push({ v: 1, s: flushSuit.s });
    }

    // Check for a straight within the flush cards
    for (let i = 0; i <= flushSuit.cards.length - 5; i++) {
      let isStraightFlush = true;

      for (let j = 0; j < 4; j++) {
        if (flushSuit.cards[i + j].v - 1 !== flushSuit.cards[i + j + 1].v) {
          isStraightFlush = false;
          break;
        }
      }

      if (isStraightFlush) {
        return [true, flushSuit.cards.slice(i, i + 5)]; // Return best straight flush
      }
    }
  }

  return [false, null]; // No straight flush found
}


function handEvaluation(hand, player, username) {
  // Create a sorted copy of the hand to avoid modifying the original array
  // Sort in descending order based on card value (v) for easier evaluation
  hand = [...hand].sort((a, b) => b.v - a.v);

  // Evaluate all possible hand rankings using helper functions
  // Each helper function returns an array where the first element is a boolean indicating if the hand ranking is met
  const straightFlush = _straightFlush(hand); // Check for Straight Flush
  const fourOfAKind = _4ofAKind(hand);       // Check for Four of a Kind
  const fullHouse = _fullHouse(hand);        // Check for Full House
  const flush = _flush(hand);                // Check for Flush
  const straight = _straight(hand);          // Check for Straight
  const threeOfAKind = _3ofAKind(hand);      // Check for Three of a Kind
  const pair = _pair(hand);                  // Check for Pairs

  // Check for Royal Flush (a special case of Straight Flush where the highest card is an Ace)
  if (straightFlush[0] && straightFlush[1][0].v == 14)
    return { rank: 9, name: "Royal Flush", player, username };

  // Check for Straight Flush (five consecutive cards of the same suit)
  else if (straightFlush[0])
    return { rank: 8, name: "Straight Flush", cards: straightFlush[1], player, username };

  // Check for Four of a Kind (four cards of the same value)
  else if (fourOfAKind[0])
    return { rank: 7, name: "4 Of A Kind", cards: fourOfAKind[2], player, username };

  // Check for Full House (three of a kind + a pair)
  else if (fullHouse[0]) {
    const fh = fullHouse[1]; // Extract the three of a kind and pair values
    return {
      rank: 6,
      name: "Full House",
      cards: [
        ...hand.filter(card => card.v === fh.three.v).slice(0, 3), // Take three cards of the same value
        ...hand.filter(card => card.v === fh.pair.v).slice(0, 2),  // Take two cards of the same value (pair)
      ],
      player,
      username,
    };
  }

  // Check for Flush (five cards of the same suit, not in sequence)
  else if (flush[0])
    return { rank: 5, name: "Flush", cards: flush[1][0].cards.slice(0, 5), player, username };

  // Check for Straight (five consecutive cards, not of the same suit)
  else if (straight[0])
    return { rank: 4, name: "Straight", cards: straight[1], player, username };

  // Check for Three of a Kind (three cards of the same value)
  else if (threeOfAKind[0])
    return { rank: 3, name: "3 Of A Kind", cards: threeOfAKind[3], player, username };

  // Check for Two Pair (two different pairs)
  else if (pair[2] >= 2)
    return { rank: 2, name: "2 Pair", cards: pair[3], player, username };

  // Check for One Pair (a single pair)
  else if (pair[2] == 1)
    return { rank: 1, name: "Pair", cards: pair[3], player, username };

  // If no other hand ranking is met, return High Card (the top 5 highest cards)
  return { rank: 0, name: "High Card", cards: hand.slice(0, 5), player, username };
}

module.exports = { handEvaluation };