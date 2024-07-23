import * as script from './script.js';
import { socket } from './menuActions.js'

//Event Listeners
var call = document.getElementById("call")
call.addEventListener("click", _call)
var raise = document.getElementById("raise")
raise.addEventListener("click", _raise)
var fold = document.getElementById("fold")
fold.addEventListener("click", _fold)

var optInBTN = document.getElementById("optInBTN")
optInBTN.addEventListener('click', optIN) 
var optOutBTN = document.getElementById("optOutBTN")
optOutBTN.addEventListener('click', optOUT)
var optChoices = document.getElementById("optChoices")

var currentBet = document.getElementById('currentBet')
var betted = document.getElementById('betted')

function _call() {
  socket.emit('playerBet', ['call', null])
} 

function _raise() {
  let raiseAmount = parseInt(prompt("Raise Amount:"));
  if (raiseAmount == null || isNaN(raiseAmount)) {raiseAmount = 0}
  socket.emit('playerBet', ['raise', raiseAmount])
}
function _fold() {
  socket.emit('playerBet', ['fold', null])
}

socket.on('nextCards', (cards) => {
  script.HTMLCardDisplay(cards, 'comCard')
})

socket.on('dealCards', (cards) => {
  script.HTMLCardDisplay(cards, 'player1Card')
})

socket.on('roundOver', (msg) => {
  var winners = []
  winners.push(...msg[0])
  if (winners.includes(msg[1])) {
    alert(`You win! ${msg[2]}`)
  } else {alert("You Lose. \n Player(s) " + msg[3] + " Win")}
})

socket.on('newRound', (cards) => {
  optInBTN.classList.remove('active')
  optOutBTN.classList.remove('active')
  console.log(optOutBTN.classList.remove('active'))
  for (let i = 0; i < 5; i++) {
    let image = document.getElementById(`${`comCard`}${i + 1}`);
    image.classList.remove("active")
  }
})

socket.on('notEnoughMoney', (msg) => {
  alert("Not Enough Money To Raise" + `Money = ${msg}`)
})

socket.on('showCards', (cards) => {
  for (let i = 0; i < cards.length; i++){
    console.log(cards[i])
    script.HTMLCardDisplay(cards[i], `player${i+2}Card`)
  }
})

socket.on('updateMoney', (amount) => {
  document.getElementById('money').innerHTML = `Money: ${amount}`
})

socket.on('moveArrow', (num) => {
  console.log(num)
  let arrow = document.getElementById(`arrow`)
  arrow.className = ''
  arrow.classList.add(`a${num}`)
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
  console.log("MAKE CHOICE")
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
  //new indicators
  console.log("UPDATED")
  currentBet.innerHTML = `Current Bet: ${arr[1]}`
});

socket.on('playerBet', (bet) => {
  betted.innerHTML = `Betted: ${bet}`
})

socket.on('updatePot', (pot) => {
  document.getElementById('pot').innerHTML = `Pot: ${pot}`
})
//on playerJoin 
//create new div 'player'+i 
//make css styles for each player 2-8 
//yippee