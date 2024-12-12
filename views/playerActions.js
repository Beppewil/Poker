import * as script from './script.js';
import { socket } from './socket.js'

//Event Listeners
var call = document.getElementById("call")
call.addEventListener("click", _call)
var raise = document.getElementById("raise")
raise.addEventListener("click", _raise)
var fold = document.getElementById("fold")
fold.addEventListener("click", _fold)
const hideCards = document.getElementById('hideCards')
hideCards.addEventListener('click', _hideCards)

var optInBTN = document.getElementById("optInBTN")
optInBTN.addEventListener('click', optIN) 
var optOutBTN = document.getElementById("optOutBTN")
optOutBTN.addEventListener('click', optOUT)
var optChoices = document.getElementById("optChoices")

var currentBet = document.getElementById('currentBet')
var betted = document.getElementById('betted')
let playersCards;

document.addEventListener('keypress', function(e) {
  switch(e.key){
    case 'c':
      _call()
      break;
    case 'r':
      _raise()
      break;
    case 'f':
      _fold()
      break;
    default:
      break;
  }
})

function _call() {
  socket.emit('playerBet', ['call', 0])
} 

function _raise() {
  let raiseAmount = parseInt(prompt("Raise Amount:"));
  if (raiseAmount == null || isNaN(raiseAmount)) {raiseAmount = 0}
  socket.emit('playerBet', ['raise', raiseAmount])
}
function _fold() {
  socket.emit('playerBet', ['fold', 0])
}

socket.on('nextCards', (cards) => {
  script.HTMLCardDisplay(cards, 'comCard')
})

socket.on('dealCards', (cards) => {
  playersCards = cards
  script.HTMLCardDisplay(cards, 'player1Card')
})

function _hideCards() {
  if (document.getElementById('player1Card1').src != null) {
    console.log(document.getElementById('player1Card1').src)
    console.log(playersCards)
    if (document.getElementById('player1Card1').src.includes('cardBack.png')) {
      script.HTMLCardDisplay(playersCards, 'player1Card')
    }
    else {script.HTMLCardDisplay('back', 'player1Card')}
  } else return;
}

const cheatSheetButton = document.getElementById('cheatSheetButton')
cheatSheetButton.addEventListener('click', cheatSheet);

function cheatSheet() {
  document.getElementById('cheatSheet').classList.toggle('cheat');
}


socket.on('roundOver', (msg) => {
  var winners = []
  winners.push(...msg[0])
  if (winners.includes(msg[1])) {
    alert(`You win! ${msg[2]}`)
  } else {alert("You Lose. \n Player(s) " + msg[3] + " Win")}
})

socket.on('roundOver2', (msg) => {
  if (msg.winners.includes(msg.username)) {
    alert(`You win! \n${msg.winningStatement}`)
  }
  else {
    alert(`Keep going you'll get it next time \n ${msg.winningStatement}`)
  }
})

socket.on('newRound', (cards) => {
  optInBTN.classList.remove('active')
  optOutBTN.classList.remove('active')
  document.getElementById('blurer').classList.remove('active')
  for (let i = 0; i < 5; i++) {
    let image = document.getElementById(`${`comCard`}${i + 1}`);
    image.src = "./Images/Playing Cards/PNG-cards-1.3/cardBack.png"
    image.classList.remove("active")
  }
})

socket.on('notEnoughMoney', (msg) => {
  alert("Not Enough Money To Raise" + `Money = ${msg}`)
})

socket.on('showCards', (cards) => {
  if (cards != 'new round') {
    for (let i = 0; i < cards.length; i++){
      script.HTMLCardDisplay(cards[i], `player${i+2}Card`)
    }
  } else {
    for (let i =0; i < 9; i++) {
      script.HTMLCardDisplay('back', `player${i+2}Card`)
    }
  }
})

socket.on('moveArrow', (num, playerNum) => {
  for (let i = 1; i < 9; i++) {
    document.getElementById(`player${i}Container`).classList.remove("turn")
  }
  console.log(playerNum, num)
  if (playerNum != num) { 
    if (playerNum !== 1) {
      if (playerNum > num) {
      document.getElementById(`player${num + 1}Container`).classList.add("turn")
      } else {document.getElementById(`player${num}Container`).classList.add("turn")}
    } 
    else {
      document.getElementById(`player${num}Container`).classList.add("turn")
    }
  } else {document.getElementById(`player1Container`).classList.add("turn")}
})

function optIN() {
  socket.emit('optIN', true) 
  blurer.classList.remove('active')
  optInBTN.classList.remove('active')
  optOutBTN.classList.add('active')
}
function optOUT() {
  socket.emit( 'optIN', false)
  blurer.classList.remove('active')
  optOutBTN.classList.remove('active')
  optInBTN.classList.add('active')
}

socket.on('optChoices', (reason) => {
  //if (reason == '<2') {prompt("Not Enough players for game to continue")}
  blurer.classList.add('active');
  optOutBTN.classList.add('active')
  optInBTN.classList.add('active')
})

socket.on('playerJoin', (msg) => {
  var username = '';
  while (username == '') {
    username = prompt(`${msg} Enter Username: `)
  }
  socket.emit('usernameEntered', username)
})

socket.on('updateBet', (arr) => {
  currentBet.innerHTML = `Current Bet: ${arr[1]}`
});

socket.on('playerBet', (bet) => {
  betted.innerHTML = `Betted: ${bet}`
})

socket.on('updatePot', (pot) => {
  document.getElementById('pot').innerHTML = `Pot: ${pot}`
})
//yippee