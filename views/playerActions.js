// Import necessary modules
import * as script from '/views/script.js'; // Import all functions/objects from script.js
import { socket, getCookie, checkCookie, setCookie, deleteCookie } from '/views/socket.js'; // Import the socket connection from socket.js

// Event Listeners for game actions
var call = document.getElementById("call"); // Get the "Call" button
call.addEventListener("click", _call); // Add click event listener for "Call"

var raise = document.getElementById("raise"); // Get the "Raise" button
raise.addEventListener("click", _raise); // Add click event listener for "Raise"

var fold = document.getElementById("fold"); // Get the "Fold" button
fold.addEventListener("click", _fold); // Add click event listener for "Fold"

const hideCards = document.getElementById('hideCards'); // Get the "Hide Cards" button
hideCards.addEventListener('click', _hideCards); // Add click event listener for "Hide Cards"

// Event Listeners for opting in/out
var optInBTN = document.getElementById("optInBTN"); // Get the "Opt In" button
optInBTN.addEventListener('click', optIN); // Add click event listener for "Opt In"

var optOutBTN = document.getElementById("optOutBTN"); // Get the "Opt Out" button
optOutBTN.addEventListener('click', optOUT); // Add click event listener for "Opt Out"

var optChoices = document.getElementById("optChoices"); // Get the container for opt-in/out choices

// Variables for tracking bets and player cards
var currentBet = document.getElementById('currentBet'); // Get the element displaying the current bet
var betted = document.getElementById('betted'); // Get the element displaying the player's bet
let playersCards; // Variable to store the player's cards

// Keyboard event listener for quick actions
document.addEventListener('keydown', function (e) {
  const activeElement = document.activeElement;

  // Check if the active element is an input, textarea, or editable field
  const isEditable =
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable;

  // If the active element is not editable, handle key presses
  if (!isEditable) {
    switch (e.key) {
      case 'c': // 'c' key for Call
        _call();
        e.preventDefault(); // Prevent default behavior (e.g., typing 'c' in a text field)
        break;
      case 'r': // 'r' key for Raise
        _raise();
        e.preventDefault();
        break;
      case 'f': // 'f' key for Fold
        _fold();
        e.preventDefault();
        break;
      default:
        break;
    }
  }
});

// Function to handle the "Call" action
function _call() {
  socket.emit('playerBet', ['call', 0]); // Emit 'playerBet' event with 'call' and bet amount 0
}

// Function to handle the "Raise" action
function _raise() {
  let raiseAmount = parseInt(prompt("Raise Amount:")); // Prompt user for raise amount
  if (raiseAmount == null || isNaN(raiseAmount)) { raiseAmount = 0; } // Default to 0 if invalid input
  socket.emit('playerBet', ['raise', raiseAmount]); // Emit 'playerBet' event with 'raise' and the raise amount
}

// Function to handle the "Fold" action
function _fold() {
  socket.emit('playerBet', ['fold', 0]); // Emit 'playerBet' event with 'fold' and bet amount 0
}

// Socket event: When the next set of community cards is received
socket.on('nextCards', (cards) => {
  script.HTMLCardDisplay(cards, 'comCard'); // Display the community cards
});

// Socket event: When the player's cards are dealt
socket.on('dealCards', (cards) => {
  playersCards = cards; // Store the player's cards
  script.HTMLCardDisplay(cards, 'player1Card'); // Display the player's cards
});

// Function to toggle hiding/showing the player's cards
function _hideCards() {
  if (document.getElementById('player1Card1').src != null) {
    console.log(document.getElementById('player1Card1').src);
    if (document.getElementById('player1Card1').src.includes('cardBack.png')) {
      script.HTMLCardDisplay(playersCards, 'player1Card'); // Show the player's cards
    } else {
      script.HTMLCardDisplay('back', 'player1Card'); // Hide the player's cards (show card backs)
    }
  } else return;
}

// Event listener for the cheat sheet button
const cheatSheetButton = document.getElementById('cheatSheetButton');
cheatSheetButton.addEventListener('click', cheatSheet);

// Function to toggle the cheat sheet visibility
function cheatSheet() {
  document.getElementById('cheatSheet').classList.toggle('cheat'); // Toggle the 'cheat' class
}

// Socket event: When the round is over
socket.on('roundOver', (msg) => {
  var winners = [];
  winners.push(...msg[0]); // Extract the winners from the message
  if (winners.includes(msg[1])) { // Check if the current player is a winner
    alert(`You win! ${msg[2]}`); // Show win message
  } else {
    alert("You Lose. \n Player(s) " + msg[3] + " Win"); // Show lose message
  }
});

// Socket event: When the round is over (alternative message format)
socket.on('roundOver2', (msg) => {
  if (msg.winners.includes(msg.username)) { // Check if the current player is a winner
    alert(`You win! \n${msg.winningStatement} \n You had a ${msg.handRank}`); // Show win message
  } else {
    alert(`Keep going you'll get it next time \n ${msg.winningStatement} \nYou had a ${msg.handRank}`); // Show lose message
  }
});

// Socket event: When a new round starts
socket.on('newRound', (cards) => {
  optInBTN.classList.remove('active'); // Reset opt-in button
  optOutBTN.classList.remove('active'); // Reset opt-out button
  document.getElementById('blurer').classList.remove('active'); // Hide the blur effect
  for (let i = 0; i < 5; i++) {
    let image = document.getElementById(`${`comCard`}${i + 1}`);
    // Changed from relative to absolute path
    image.src = "/views/Images/Playing Cards/PNG-cards-1.3/cardBack.png"; // Reset community cards to card backs
    image.classList.remove("active"); // Remove 'active' class
  }
});

// Socket event: When the player doesn't have enough money to raise
socket.on('notEnoughMoney', (msg) => {
  alert("Not Enough Money To Raise" + `Money = ${msg}`); // Show alert with the player's current money
});

// Socket event: When other players' cards are shown
socket.on('showCards', (cards) => {
  if (cards != 'new round') {
    for (let i = 0; i < cards.length; i++) {
      script.HTMLCardDisplay(cards[i], `player${i + 2}Card`); // Display other players' cards
    }
  } else {
    for (let i = 0; i < 9; i++) {
      script.HTMLCardDisplay('back', `player${i + 2}Card`); // Hide other players' cards (show card backs)
    }
  }
});

// Socket event: When the turn arrow needs to move
socket.on('moveArrow', (num, playerNum) => {
  for (let i = 1; i < 9; i++) {
    document.getElementById(`player${i}Container`).classList.remove("turn"); // Remove 'turn' class from all players
  }
  if (playerNum != num) { // If the current player is not the one whose turn it is
    if (playerNum !== 1) { // If the current player is not the dealer
      if (playerNum > num) { // If the current player is to the right of the active player
        document.getElementById(`player${num + 1}Container`).classList.add("turn"); // Move the arrow to the next player
      } else {
        document.getElementById(`player${num}Container`).classList.add("turn"); // Move the arrow to the current player
      }
    } else {
      document.getElementById(`player${num}Container`).classList.add("turn"); // Move the arrow to the current player
    }
  } else {
    document.getElementById(`player1Container`).classList.add("turn"); // Move the arrow to the current player
  }
});

// Function to handle opting in
function optIN() {
  socket.emit('optIN', true); // Emit 'optIN' event with true
  blurer.classList.remove('active'); // Hide the blur effect
  optInBTN.classList.remove('active'); // Deactivate the opt-in button
  optOutBTN.classList.add('active'); // Activate the opt-out button
}

// Function to handle opting out
function optOUT() {
  socket.emit('optIN', false); // Emit 'optIN' event with false
  blurer.classList.remove('active'); // Hide the blur effect
  optOutBTN.classList.remove('active'); // Deactivate the opt-out button
  optInBTN.classList.add('active'); // Activate the opt-in button
}

// Socket event: When the player needs to make opt-in/out choices
socket.on('optChoices', (reason) => {
  blurer.classList.add('active'); // Show the blur effect
  optOutBTN.classList.add('active'); // Activate the opt-out button
  optInBTN.classList.add('active'); // Activate the opt-in button
});

// Socket event: When a new player joins
socket.on('playerJoin', (msg) => {
  var username = getCookie("username");
  console.log(msg)
  if (username != "" && msg == '') {
    socket.emit('usernameEntered', username);
    return;
  }
  while (username == '' || msg != '') {
    username = prompt(`${msg} \nEnter Username: `); // Prompt the player to enter a username
    msg = ''
  }
  console.log(username)
  socket.emit('usernameEntered', username); // Emit the entered username
});

// Socket event: When the current bet is updated
socket.on('updateBet', (arr) => {
  currentBet.innerHTML = `Current Bet: ${arr[1]}`; // Update the current bet display
});

// Socket event: When the pot is updated
socket.on('updatePot', (pot) => {
  document.getElementById('pot').innerHTML = `Pot: ${pot}`; // Update the pot display
});