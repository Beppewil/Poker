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


function arrayHandComparison(hands) {
  // If there's only one hand, return it as the winner
  if (hands.length === 1) {
    return [_handEvaluation.handEvaluation(hands[0].c, hands[0].p, hands[0].n)]; // Return the evaluated hand object
  }

  // Initialize the winning hand as the first hand in the array
  var winningHandIndex = 0; // Index of the current winning hand
  var winningHandValue = _handEvaluation.handEvaluation(hands[0].c, hands[0].p, hands[0].n).rank; // Rank of the winning hand
  var winningHandDescription = _handEvaluation.handEvaluation(hands[0].c, hands[0].p, hands[0].n).name; // Description of the winning hand
  var draw = [false, winningHandIndex]; // Track if there is a draw and the winning hands. [isDraw, winningHandIndex]

  // Iterate through the remaining hands to find the best one
  for (var i = 1; i < hands.length; i++) {
    // Evaluate the current hand's rank and description
    var currentHandValue = _handEvaluation.handEvaluation(hands[i].c, hands[i].p, hands[i].n).rank;
    var currentHandDescription = _handEvaluation.handEvaluation(hands[i].c, hands[i].p, hands[i].n).name;

    // If the current hand is stronger than the winning hand, update the winning hand
    if (currentHandValue > winningHandValue) {
      winningHandIndex = i; // Update the winning hand index
      winningHandValue = currentHandValue; // Update the winning hand's rank
      winningHandDescription = currentHandDescription; // Update the winning hand's description
      draw = [false, winningHandIndex]; // Reset the draw status since there's a clear winner
    }
    // If the current hand is of the same strength as the winning hand, compare individual cards
    else if (currentHandValue === winningHandValue) {
      // Get the cards of the winning hand and the current hand for comparison
      var winningHandCards = _handEvaluation.handEvaluation(hands[winningHandIndex].c, hands[winningHandIndex].p, hands[winningHandIndex].n).cards;
      var currentHandCards = _handEvaluation.handEvaluation(hands[i].c, hands[i].p, hands[i].n).cards;
      var drawing = true; // Assume it's a draw unless proven otherwise

      console.log(winningHandCards, currentHandCards); // Log the cards for debugging

      // Compare individual cards to determine the stronger hand
      for (var e = 0; e < winningHandCards.length; e++) {
        // If the current hand's card is stronger, update the winning hand
        if (currentHandCards[e].v > winningHandCards[e].v) {
          winningHandIndex = i; // Update the winning hand index
          winningHandDescription = currentHandDescription; // Update the description
          draw = [false, winningHandIndex]; // Reset the draw status
          drawing = false; // Mark that it's not a draw
          break; // Exit the loop since we found a stronger card
        }
        // If the current hand's card is weaker, keep the current winning hand
        else if (currentHandCards[e].v < winningHandCards[e].v) {
          draw = [false, winningHandIndex]; // Reset the draw status
          drawing = false; // Mark that it's not a draw
          break; // Exit the loop since the current hand is weaker
        }
      }

      // If it's still a draw after comparing all cards, mark it as a draw
      if (drawing) {
        draw[0] = true; // Set the draw flag to true
        draw.push(i); // Add the current hand index to the draw list
      }
    }
  }

  // If there's a draw, return the list of drawing hands as full objects
  if (draw[0]) {
    var drawHands = [];
    for (let i = 1; i < draw.length; i++) {
      drawHands.push(_handEvaluation.handEvaluation(hands[draw[i]].c, hands[draw[i]].p, hands[draw[i]].n)); // Add the evaluated hand object
    }
    return drawHands; // Return the list of drawing hands
  }

  // Return the winning hand as a full object
  return [_handEvaluation.handEvaluation(hands[winningHandIndex].c, hands[winningHandIndex].p, hands[winningHandIndex].n)]; // Return the evaluated winning hand object
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