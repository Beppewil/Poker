// Get references to DOM elements
var blurer = document.getElementById("blurer"); // Blur effect for the main screen
var settingsBlurer = document.getElementById('settingsBlurer'); // Blur effect for settings
var menuBTN = document.getElementById('menuBTN'); // Menu button
var chatBTN = document.getElementById('chat-btn'); // Chat button
var optionsBTN = document.getElementById('optionsBTN'); // Options button
const leaveBTN = document.getElementById('leaveBTN'); // Leave button
var blackTriangle = document.getElementById("black-triangle"); // Triangle icon for menu
var playerOptionsBTN = document.getElementById("playerOptions"); // Player options button
var gameTimer = document.getElementById('gameTimer'); // Game timer display

// Import the socket connection
import { socket } from './socket.js';

// Add hover effects to the black triangle (menu icon)
blackTriangle.addEventListener('mouseover', function () {
  menuBTN.classList.add('hover'); // Add hover class to menu button
});
blackTriangle.addEventListener('mouseout', function () {
  menuBTN.classList.remove('hover'); // Remove hover class from menu button
});

// Add click event listeners for menu and player options
blackTriangle.addEventListener('click', menuPress);
menuBTN.addEventListener('click', menuPress);
playerOptionsBTN.addEventListener('click', playerOptions);

// Function to toggle the menu
function menuPress() {
  document.getElementById("wrapper").classList.toggle("show"); // Toggle the menu visibility
  blackTriangle.classList.toggle("rotate90"); // Rotate the triangle icon
}

// Add click event listener for the options button
optionsBTN.addEventListener('click', options);

// Function to toggle the options menu
function options() {
  document.getElementById("wrapper").classList.toggle("show"); // Toggle the menu visibility
  settingsBlurer.classList.toggle("active"); // Toggle the settings blur effect
  blackTriangle.classList.toggle("rotate90"); // Rotate the triangle icon
  playerOptionsBTN.classList.toggle("active"); // Toggle the player options button
  for (var i = 0; i < 8; i++) {
    document.getElementById(`player${i + 1}options`).classList.remove('active'); // Hide all player options
  }
}

// Add click event listener for the leave button
leaveBTN.addEventListener('click', leave);

// Function to handle leaving the room
function leave() {
  socket.emit('leaveRoom', true); // Emit 'leaveRoom' event to the server
}

// Function to toggle player options
function playerOptions() {
  for (var i = 0; i < 8; i++) {
    if (document.getElementById(`player${i + 1}options`).innerHTML.length > 0) {
      document.getElementById(`player${i + 1}options`).classList.toggle('active'); // Toggle player options visibility
    }
  }
}

// Add click event listeners for kicking players
document.getElementById('player1options').addEventListener('click', playerKick1);
document.getElementById('player2options').addEventListener('click', playerKick2);
document.getElementById('player3options').addEventListener('click', playerKick3);
document.getElementById('player4options').addEventListener('click', playerKick4);
document.getElementById('player5options').addEventListener('click', playerKick5);
document.getElementById('player6options').addEventListener('click', playerKick6);
document.getElementById('player7options').addEventListener('click', playerKick7);
document.getElementById('player8options').addEventListener('click', playerKick8);

// Functions to kick specific players
function playerKick1() { socket.emit('playerKick', 1); }
function playerKick2() { socket.emit('playerKick', 2); }
function playerKick3() { socket.emit('playerKick', 3); }
function playerKick4() { socket.emit('playerKick', 4); }
function playerKick5() { socket.emit('playerKick', 5); }
function playerKick6() { socket.emit('playerKick', 6); }
function playerKick7() { socket.emit('playerKick', 7); }
function playerKick8() { socket.emit('playerKick', 8); }

// Socket event: Update the player list
socket.on('updatePlayerList', (playerList, playerNumber) => {
  console.log(playerList);
  // Reset all player options and UI elements
  for (var i = 0; i < 8; i++) {
    document.getElementById(`player${i + 1}options`).innerHTML = '';
    document.getElementById(`player${i + 1}options`).classList.remove('active');
    document.getElementById(`player${i + 1}`).classList.remove("active");
    if (i > 1 && i < 8) {
      document.getElementById(`player${i}Card1`).classList.remove('active');
      document.getElementById(`player${i}Card2`).classList.remove('active');
    }
  }
  // Update the UI with the current player list
  playerList.forEach(player => {
    document.getElementById(`player${player.playerNum}`).classList.add("active");
    document.getElementById(`player${player.playerNum}options`).innerHTML = player.username;
    document.getElementById(`player${player.playerNum}Card1`).classList.add('active');
    document.getElementById(`player${player.playerNum}Card2`).classList.add('active');
  });
  // Update player names, money, and last actions based on their position
  if (playerNumber !== 1) {
    playerList.forEach(player => {
      if (player.playerNum === playerNumber) {
        document.getElementById(`player1Name`).innerHTML = player.username;
        document.getElementById(`player1Money`).innerHTML = player.money;
        document.getElementById(`player1LastAction`).innerHTML = player.lastAction;
      } else {
        if (player.playerNum < playerNumber) {
          document.getElementById(`player${player.playerNum + 1}Name`).innerHTML = player.username;
          document.getElementById(`player${player.playerNum + 1}Money`).innerHTML = player.money;
          document.getElementById(`player${player.playerNum + 1}LastAction`).innerHTML = player.lastAction;
        } else {
          document.getElementById(`player${player.playerNum}Name`).innerHTML = player.username;
          document.getElementById(`player${player.playerNum}Money`).innerHTML = player.money;
          document.getElementById(`player${player.playerNum}LastAction`).innerHTML = player.lastAction;
        }
      }
    });
  } else {
    playerList.forEach(player => {
      if (player.playerNum === playerNumber) {
        document.getElementById(`player1Name`).innerHTML = player.username;
        document.getElementById(`player1Money`).innerHTML = player.money;
        document.getElementById(`player1LastAction`).innerHTML = player.lastAction;
      } else {
        document.getElementById(`player${player.playerNum}Name`).innerHTML = player.username;
        document.getElementById(`player${player.playerNum}Money`).innerHTML = player.money;
        document.getElementById(`player${player.playerNum}LastAction`).innerHTML = player.lastAction;
      }
    });
  }
});

// Chat functionality
var chatSend = document.getElementById('chat-send'); // Chat send button
var input = document.getElementById('input'); // Chat input field
var messages = document.getElementById('messages'); // Chat messages container
var chatWindow = document.getElementById("chat-window"); // Chat window

// Add click event listeners for chat
chatBTN.addEventListener('click', toggleChat);
chatSend.addEventListener('click', sendChat);

// Function to toggle the chat window
function toggleChat() {
  chatWindow.classList.toggle("active");
}

// Add keydown event listener for chat input
input.addEventListener('keydown', function (e) {
  if (e.key == 'Enter') {
    e.preventDefault();
    sendChat(); // Send chat message on Enter key
  }
});

// Socket event: Receive chat messages
socket.on('chat message', function (msg) {
  var item = document.createElement('li'); // Create a new list item for the message
  item.textContent = msg[0] + ": " + msg[1]; // Add the message content
  messages.appendChild(item); // Append the message to the chat window
  messages.scrollTo(0, messages.scrollHeight); // Scroll to the bottom of the chat
});

// Function to send a chat message
function sendChat() {
  if (input.value) {
    socket.emit('chat message', input.value); // Emit the chat message to the server
    input.value = ''; // Clear the input field
  }
}

// Socket event: Update the game timer
socket.on('updateTimer', (timeLeft, over) => {
  if (!over) {
    gameTimer.classList.add('active');
    gameTimer.innerHTML = "Round Starts In: " + timeLeft; // Update the timer display
  } else {
    gameTimer.classList.remove('active'); // Hide the timer when the round is over
  }
});

// Socket event: Handle leaving the room
socket.on('leaveRoom', (msg) => {
  alert(msg); // Show a message when leaving the room
  window.location.href = '/'; // Redirect to the home page
});