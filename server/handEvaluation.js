function highCard(hand) {
  var highCard = [];
  hand.forEach((card) => highCard.push(card.v));
  return Math.max(...highCard);
}

function _pair(hand) {
  const pairs = [];
  let hasPair = false;
  for (const card of hand) {
    const existingPair = pairs.find((pair) => pair.v === card.v);
    if (existingPair) {
      existingPair.count++;
      hasPair = true;
    } else {
      pairs.push({ v: card.v, count: 1 });
    }
  }
  return [
    hasPair,
    pairs.filter((pair) => pair.count === 2),
    pairs.filter((pair) => pair.count === 2).length,
  ];
}

function _3ofAKind(hand) {
  const threes = [];
  let hasThree = false;
  for (const card of hand) {
    const existingThree = threes.find((three) => three.v === card.v);
    if (existingThree) {
      existingThree.count++;
      if (existingThree.count === 3) {
        hasThree = true;
      }
    } else {
      threes.push({ v: card.v, count: 1 });
    }
  }
  return [
    hasThree,
    threes.filter((three) => three.count === 3),
    threes.filter((three) => three.count === 3).length,
  ];
}

function _straight(hand) {
  for (let i = 5; i < hand.length; i++) {
    if (
      hand[1].v == hand[0].v - 1 &&
      hand[2].v == hand[0].v - 2 &&
      hand[3].v == hand[0].v - 3 &&
      hand[4].v == hand[0].v - 4
    ) {
      return [true, hand[0]];
    }
  }
  return false;
}

function _flush(hand) {
  const suits = [];
  let hasFlush = false;
  for (const card of hand) {
    const existingSuit = suits.find((suit) => suit.s === card.s);
    if (existingSuit) {
      existingSuit.count++;
      existingSuit.cards.push(card.v);
      if (existingSuit.count == 5) {
        hasFlush = true;
      }
    } else {
      //v is the maximum value of the flush because filter = b-a
      suits.push({ v: card.v, s: card.s, count: 1, cards: [card.v] });
    }
  }
  return [hasFlush, suits.filter((suit) => suit.count >= 5)];
}

function _fullHouse(hand) {
  return [_pair(hand)[1].length > 0 && _3ofAKind(hand)[1].length > 0];
}

function _4ofAKind(hand) {
  for (var i = 3; i < hand.length; i++) {
    if (
      hand[i - 3].v == hand[i].v &&
      hand[i - 2].v == hand[i].v &&
      hand[i - 1].v == hand[i].v
    ) {
      return [true, hand[i].v];
    }
  }
  return false;
}
function _straightFlush(hand) {
  const [hasFlush, flushSuits] = _flush(hand);
  if (!hasFlush) return [false, null];

  for (const flushSuit of flushSuits) {
    const straightCards = flushSuit.cards.sort((a, b) => a - b);
    if (
      straightCards[0] + 1 === straightCards[1] &&
      straightCards[1] + 1 === straightCards[2] &&
      straightCards[2] + 1 === straightCards[3] &&
      straightCards[3] + 1 === straightCards[4]
    ) {
      return [true, straightCards[4]];
    }
  }
  return [false, null];
}

function handEvaluation(hand) {
  hand.sort((a, b) => b.v - a.v);
  switch (true) {
    case _straightFlush(hand)[0] && _straightFlush(hand)[1].v == 14:
      return [9, "Royal Flush"];
    case _straightFlush(hand)[0]:
      return [8, "Straight Flush", hand[0].v];
    case _4ofAKind(hand)[0]:
      return [7, "4 Of A Kind", _4ofAKind(hand)[1]];
    case _fullHouse(hand)[0]:
      return [6, "Full House", _3ofAKind(hand)[1], [_pair(hand)[1][0]]];
    case _flush(hand)[0]:
      return [5, "Flush", _flush(hand)[1]];
    case _straight(hand)[0]:
      return [4, "Straight", _straight(hand)[1]];
    case _3ofAKind(hand)[0]:
      return [4, "3 Of A Kind", _3ofAKind(hand)[1], [{ v: highCard(hand) }]];
    case _pair(hand)[2] >= 2:
      return [3, "2 Pair", _pair(hand)[1].slice(0, 2), [{ v: highCard(hand) }]];
    case _pair(hand)[2] == 1:
      return [2, "Pair", [_pair(hand)[1][0]], [{ v: highCard(hand) }]];
    default:
      return [1, "High Card", [{ v: highCard(hand) }]];
  }
}

module.exports = { handEvaluation };
