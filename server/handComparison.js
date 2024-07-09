//import { _handEvaluation.handEvaluation } from './_handEvaluation.handEvaluation.js'
const _handEvaluation = require('./handEvaluation.js')



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

//might have to add a thing that checks if the current hand = players[player].hand and then make that winningHand

function arrayHandComparison(hands) {
  var winningHand = hands[0][1];
  var winningHandValue = _handEvaluation.handEvaluation(hands[0][0])[0];
  var winningHandDescription = _handEvaluation.handEvaluation(hands[0][0])[1];
  var draw = [false, winningHand]
  for (var i = 1; i < hands.length; i++) {
    var currentHandValue = _handEvaluation.handEvaluation(hands[i][0])[0];
    var currentHandDescription = _handEvaluation.handEvaluation(hands[i][0])[1];
    if (currentHandValue > winningHandValue) {
      winningHand = i;
      winningHandValue = currentHandValue;
      winningHandDescription = currentHandDescription;
      draw = [false, winningHand]
    }
    else if (currentHandValue == winningHandValue) {
      var winningHandCards = _handEvaluation.handEvaluation(hands[winningHand][0]).slice(2);
      var currentHandCards = _handEvaluation.handEvaluation(hands[i][0]).slice(2);
      var drawing = true;
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

module.exports = { twoPlayerHandComparison, arrayHandComparison }