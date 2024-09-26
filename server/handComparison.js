//import { _handEvaluation.handEvaluation } from './_handEvaluation.handEvaluation.js'
const _handEvaluation = require('./handEvaluation.js')


//super obsolete
function twoPlayerHandComparison(hands) {
  var hand1Value = _handEvaluation.handEvaluation(hands[0])[0]
  var hand2Value = _handEvaluation.handEvaluation(hands[1])[0]
  if (hand1Value > hand2Value) {
    return ("player1 wins " + _handEvaluation.handEvaluation(hands[0])[1])
  }
  else if (hand1Value < hand2Value) {
    return ("player 2 wins " + _handEvaluation.handEvaluation(hands[1])[1])
  } else {
    for (var e = 2; e < _handEvaluation.handEvaluation(hands[0]).length; e++) {
      for (var i = 0; i < _handEvaluation.handEvaluation(hands[0])[e].length; i++) {
        if (_handEvaluation.handEvaluation(hands[0])[e][i].v > _handEvaluation.handEvaluation(hands[1])[e][i].v) {
          return "Player 1 wins " + _handEvaluation.handEvaluation(hands[0])[1]
        }
        else if (_handEvaluation.handEvaluation(hands[0])[e][i].v < _handEvaluation.handEvaluation(hands[1])[e][i].v) {
          return "Player 2 wins " + _handEvaluation.handEvaluation(hands[1])[1]
        }
      }
    }
    return "draw"
  }
}


//obsolete
function arrayHandComparison(hands) {
  var winningHand = hands[0][1];
  var winningHandValue = _handEvaluation.handEvaluation(hands[0][0])[0];
  var winningHandDescription = _handEvaluation.handEvaluation(hands[0][0])[1];
  var draw = [false, winningHand]
  for (var i = 1; i < hands.length; i++) {
    var currentHandValue = _handEvaluation.handEvaluation(hands[i][0])[0];
    var currentHandDescription = _handEvaluation.handEvaluation(hands[i][0])[1];
    console.log(_handEvaluation.handEvaluation(hands[i][0]), _handEvaluation.handEvaluation(hands[0][0]))
    if (currentHandValue > winningHandValue) {
      winningHand = i;
      winningHandValue = currentHandValue;
      winningHandDescription = currentHandDescription;
      draw = [false, winningHand]
    }
    else if (currentHandValue == winningHandValue) {
      var winningHandCards = _handEvaluation.handEvaluation(hands[winningHand][0])[3];
      var currentHandCards = _handEvaluation.handEvaluation(hands[i][0])[3];
      var drawing = true;
      console.log(winningHandCards)
      for (var e = 0; e < winningHandCards.length; e++) {
        for (var j = 0; j < winningHandCards[e].length; j++) {
          if (currentHandCards[e][j].v > winningHandCards[e][j].v) {
            winningHand = hands[i][1];
            winningHandDescription = currentHandDescription;
            draw = [false, winningHand]
            drawing = false;
            break;
          }
          else if (currentHandCards[e][j].v < winningHandCards[e][j].v) {
            draw = [false, winningHand]
            drawing = false;
            break;
          }
        }
        if (!drawing) {
          break;
        }
      }
      if (drawing) {
        draw[0] = true;
        draw.push(hands[i][1])
      }
    }
  }
  if (hands.length == 1) {
    return [1];
  }
  else if (draw[0]) {

    var drawStatement = [(parseInt(draw[1]))]
    for (let i = 2; i < draw.length; i++) {
      drawStatement.push(parseInt(draw[i]))
    }
    return drawStatement
  }
  return [winningHand]  //winningHandDescription;
}

//Actual Function
function handComparison(hands) {
  var values = [];
  for (var i = 0; i < hands.length; i++) {
    var currentHandValue = _handEvaluation.handEvaluation(hands[i].c, hands[i].p, hands[i].n);
    console.log(hands[i])
    console.log(currentHandValue)
    values.push(_handEvaluation.handEvaluation(hands[i].c, hands[i].p, hands[i].n))
  }
  const max = values.sort((a,b)=>b.rank-a.rank)[0].rank;
  const winners = values.filter(hand => hand.rank == max);
  if (winners.length == 1 || max == 'Royal Flush') { 
    console.log(winners)
    return winners;
  }
  else {
    for (var i = 0; i < 5; i++) { // go through each card checking to see if a player has a higher card than any other
      const maxCards = winners.sort((a,b)=>(b.cards[i]).v-(a.cards[i]).v)[0].cards[i].v;
      const winners2 = winners.filter(hand => hand.cards[i].v == maxCards);
      if (winners2.length == 1) {
        console.log(winners2)
        return winners2; // yes
      }
    }
    console.log(winners)
    return winners // no
  }
}

module.exports = { twoPlayerHandComparison, arrayHandComparison, handComparison }