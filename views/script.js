//import {handEvaluation} from '../server/handEvaluation.js'
//import {twoPlayerHandComparison, arrayHandComparison} from './handComparison.js'
//import {deckCreate, cardDisplay, shuffle, cardValues} from '../server/cards.js'
import {socket} from './socket.js'


const cardValuesW = {
  "-1" : "spades",
  "-2" : "hearts",
  "-3" : "clubs",
  "-4" : "diamonds",	
  "2":  "2",
  "3" : "3",
  "4" : "4",
  "5" : "5",
  "6" : "6",
  "7" : "7",
  "8" : "8",
  "9" : "9",
  "10" : "10",
  "11" : "jack",
  "12" : "queen",
  "13" : "king",
  "14" : "ace"	
}

socket.on('playerDisconnect', (player) => {
  console.log(`${player} disconnected (client)`);
});

function HTMLCardDisplay(Cards, handName) {
  if (Cards === 'back') {
    for (let i = 0; i < 2; i++) {
      let image = document.getElementById(`${handName}${i + 1}`);
      image.src = `views/Images/Playing Cards/PNG-cards-1.3/cardBack.png`
    }
  } else {
    for (let i = 0; i < Cards.length; i++) {
      let image = document.getElementById(`${handName}${i + 1}`);
      image.src = `./Images/Playing Cards/PNG-cards-1.3/${cardValuesW[Cards[i].v]}_of_${cardValuesW[Cards[i].s]}.png`;
      image.classList.add("active")
    }
  }
}

export {HTMLCardDisplay, cardValuesW}