function highCard(hand) {
  var highCard = [];
  hand.forEach((card) => highCard.push(card.v));
  return Math.max(...highCard);
}

function _pair(hand) {
  const pairs = [];
  for (const card of hand) {
    const existingPair = pairs.find((pair) => pair.v === card.v);
    if (existingPair) {
      existingPair.count++;
    } else {
      pairs.push({ v: card.v, count: 1 });
    }
  }
  const hasPair = pairs.filter((pair) => pair.count === 2)
  return [hasPair.length > 0,hasPair,hasPair.length];
}

function _3ofAKind(hand) {
  const threes = [];
  for (const card of hand) {
    const existingThree = threes.find((three) => three.v === card.v);
    if (existingThree) {
      existingThree.count++;
    } else {
      threes.push({ v: card.v, count: 1 });
    }
  }
  const hasThree = threes.filter((three) => three.count === 3);
  return [
    hasThree.length > 0,
    hasThree,
    hasThree.length,
  ];
}

function _straight(hand) {
  var cards = [];
  hand.forEach((card) => cards.push(card.v));
  cards = [...new Set(cards)]
  var cards = cards.sort((a, b) => b - a);
  for (let i = 0; i < cards.length - 4; i++) {
    if (
      cards[i] - 1 === cards[i + 1] &&
      cards[i] - 2 === cards[i + 2] &&
      cards[i] - 3 === cards[i + 3] &&
      cards[i] - 4 === cards[i + 4]) {
      return [true, {v: cards[i]}]
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
      return [true, hand[i]];
    }
  }
  return false;
}
function _straightFlush(hand) {
  const [hasFlush, flushSuits] = _flush(hand);
  if (!hasFlush) return [false, null];

  for (const flushSuit of flushSuits) {
    const straightCards = flushSuit.cards.sort((a, b) => b - a);
    if (
      straightCards[0] - 1 === straightCards[1] &&
      straightCards[1] - 1 === straightCards[2] &&
      straightCards[2] - 1 === straightCards[3] &&
      straightCards[3] - 1 === straightCards[4]
    ) {
      return [true, {v: straightCards[4]}];
    }
  }
  return [false, null];
}

function handEvaluation(hand, player) {
  hand = hand.sort((a, b) => b.v - a.v);
  switch (true) {
    case _straightFlush(hand)[0] && _straightFlush(hand)[1].v == 14:
      return { rank: 9, name: "Royal Flush" , player: player};
    case _straightFlush(hand)[0]:
      return { rank: 8, name: "Straight Flush", cards: [_straightFlush(hand)[1]], kicker: { v: highCard(hand) } , player: player};
    case _4ofAKind(hand)[0]:
      return { rank: 7, name: "4 Of A Kind", cards: _4ofAKind(hand)[1], kicker: { v: highCard(hand) } , player: player};
    case _fullHouse(hand)[0]:
      return { rank: 6, name: "Full House", cards: _3ofAKind(hand)[1], kicker: _pair(hand)[1][0] , player: player};
    case _flush(hand)[0]:
      return { rank: 5, name: "Flush", cards: _flush(hand)[1], kicker: { v: highCard(hand) } , player: player};
    case _straight(hand)[0]:
      return { rank: 4, name: "Straight", cards: [_straight(hand)[1]], kicker: { v: highCard(hand) } , player: player};
    case _3ofAKind(hand)[0]:
      return { rank: 4, name: "3 Of A Kind", cards: _3ofAKind(hand)[1], kicker: { v: highCard(hand) } , player: player};
    case _pair(hand)[2] >= 2:
      return { rank: 3, name: "2 Pair", cards: _pair(hand)[1].slice(0, 2), kicker: { v: highCard(hand) } , player: player};
    case _pair(hand)[2] == 1:
      return { rank: 2, name: "Pair", cards: _pair(hand)[1], kicker: { v: highCard(hand) } , player: player};
    default:
      return { rank: 1, name: "High Card", cards: [{ v: highCard(hand) }] , kicker: { v: highCard(hand) } , player: player};
  }
}

module.exports = { handEvaluation };
