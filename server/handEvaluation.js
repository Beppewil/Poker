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
<<<<<<< HEAD

  var pairHand = [];
  if (hasPair.length > 0) {
    const pairsCards = hand.filter((card) => hasPair.find((pair) => pair.v === card.v));
    pairHand = pairsCards.concat(hand.filter((card) => !pairsCards.includes(card)).sort((a, b) => b.v - a.v));
    if (pairHand.length > 5) {
      pairHand = pairHand.slice(0, 5);
    }
  }

  return [hasPair.length > 0,hasPair,hasPair.length, pairHand];
=======
  return [hasPair.length > 0,hasPair,hasPair.length];
>>>>>>> f806904bd851b7597dbfa53e54e558e18e7cc7d1
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
<<<<<<< HEAD
  var _3ofkHand = [];
  if (hasThree.length > 0) {
    const threeOfAKindCards = hand.filter((card) => hasThree.find((three) => three.v === card.v));
    _3ofkHand = threeOfAKindCards.concat(hand.filter((card) => !threeOfAKindCards.includes(card)).sort((a, b) => b.v - a.v));
    if (_3ofkHand.length > 5) {
      _3ofkHand = _3ofkHand.slice(0, 5);
    }
  }

=======
>>>>>>> f806904bd851b7597dbfa53e54e558e18e7cc7d1
  return [
    hasThree.length > 0,
    hasThree,
    hasThree.length,
<<<<<<< HEAD
    _3ofkHand
=======
>>>>>>> f806904bd851b7597dbfa53e54e558e18e7cc7d1
  ];
}

function _straight(hand) {
  var cards = [];
<<<<<<< HEAD
  hand.forEach((card) => cards.push({ v:card.v }));

  if (hand.find(card => card.v === 14)) {
    cards.push({ v: 1 }); // add a card with value 1 if there's an ace, needed for ace low straight (maybe)
  }

  cards = [...new Set(cards)] // not needed for SF because only 1 version of each value possible
  var cards = cards.sort((a, b) => b.v - a.v);
  for (let i = 0; i < cards.length - 4; i++) {
    if (
      cards[i].v - 1 === cards[i + 1].v &&
      cards[i].v - 2 === cards[i + 2].v &&
      cards[i].v - 3 === cards[i + 3].v &&
      cards[i].v - 4 === cards[i + 4].v) {
      var straightHand = cards.slice(i, i + 5);
      return [true, straightHand]
=======
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
>>>>>>> f806904bd851b7597dbfa53e54e558e18e7cc7d1
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
      existingSuit.cards.push(card);
      if (existingSuit.count == 5) {
        hasFlush = true;
      }
    } else {
      //v is the maximum value of the flush because filter = b-a
      suits.push({ v: card.v, s: card.s, count: 1, cards: [card] });
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
<<<<<<< HEAD
      const hasFour = [hand[i]]
      var _4ofkHand = [];
      const fourOfAKindCards = hand.filter((card) => hasFour.find((four) => four.v === card.v));
      _4ofkHand = fourOfAKindCards.concat(hand.filter((card) => !fourOfAKindCards.includes(card)).sort((a, b) => b.v - a.v));
      if (_4ofkHand.length > 5) {
        _4ofkHand = _4ofkHand.slice(0, 5);
      }
      return [true, hasFour, _4ofkHand];
=======
      return [true, hand[i]];
>>>>>>> f806904bd851b7597dbfa53e54e558e18e7cc7d1
    }
  }
  return false;
}
function _straightFlush(hand) {
  const [hasFlush, flushSuits] = _flush(hand);
  if (!hasFlush) return [false, null];

  for (const flushSuit of flushSuits) {
<<<<<<< HEAD
    if (flushSuit.cards.find(card => card.v === 14)) {
      flushSuit.cards.push({ v: 1 , s: flushSuit.s });
    }
    const straightCards = flushSuit.cards.sort((a, b) => b.v - a.v);
    for (let i = 0; i < straightCards.length - 4; i++) {
      if (
        straightCards[i].v - 1 === straightCards[i + 1].v &&
        straightCards[i + 1].v - 1 === straightCards[i + 2].v &&
        straightCards[i + 2].v - 1 === straightCards[i + 3].v &&
        straightCards[i + 3].v - 1 === straightCards[i + 4].v
      ) {
        var straightFlushHand = straightCards.slice(i, i + 5);
        return [true, straightFlushHand];
      }
=======
    const straightCards = flushSuit.cards.sort((a, b) => b - a);
    if (
      straightCards[0] - 1 === straightCards[1] &&
      straightCards[1] - 1 === straightCards[2] &&
      straightCards[2] - 1 === straightCards[3] &&
      straightCards[3] - 1 === straightCards[4]
    ) {
      return [true, {v: straightCards[4]}];
>>>>>>> f806904bd851b7597dbfa53e54e558e18e7cc7d1
    }
  }
  return [false, null];
}

<<<<<<< HEAD
function handEvaluation(hand, player, username) {
  hand = hand.sort((a, b) => b.v - a.v);
  switch (true) {
    case _straightFlush(hand)[0] && _straightFlush(hand)[1][0].v == 14:
      return { rank: 9, name: "Royal Flush" , player: player, username: username};
    case _straightFlush(hand)[0]:
      return { rank: 8, name: "Straight Flush", cards: _straightFlush(hand)[1], player: player, username: username};
    case _4ofAKind(hand)[0]:
      return { rank: 7, name: "4 Of A Kind", cards: _4ofAKind(hand)[2],  player: player, username: username};
    case _fullHouse(hand)[0]:
      return { rank: 6, name: "Full House", cards: _3ofAKind(hand)[1] + _pair(hand)[1][0], player: player, username: username};
    case _flush(hand)[0]:
      return { rank: 5, name: "Flush", cards: _flush(hand)[1][0].cards.splice(0,5), player: player, username: username};
    case _straight(hand)[0]:
      return { rank: 4, name: "Straight", cards: _straight(hand)[1], player: player, username: username};
    case _3ofAKind(hand)[0]:
      return { rank: 4, name: "3 Of A Kind", cards: _3ofAKind(hand)[3] , player: player, username: username};
    case _pair(hand)[2] >= 2:
      return { rank: 3, name: "2 Pair", cards: _pair(hand)[3], player: player, username: username};
    case _pair(hand)[2] == 1:
      return { rank: 2, name: "Pair", cards: _pair(hand)[3], player: player, username: username};
    default:
      return { rank: 1, name: "High Card", cards: hand.splice(0, 5) , player: player, username: username};
=======
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
>>>>>>> f806904bd851b7597dbfa53e54e558e18e7cc7d1
  }
}

module.exports = { handEvaluation };