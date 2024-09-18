var blurer = document.getElementById("blurer");
var settingsBlurer = document.getElementById('settingsBlurer')
var menuBTN = document.getElementById('menuBTN')
var chatBTN = document.getElementById('chat-btn')
var optionsBTN = document.getElementById('optionsBTN')
const leaveBTN = document.getElementById('leaveBTN')
var blackTriangle = document.getElementById("black-triangle")
var playerOptionsBTN = document.getElementById("playerOptions")
var gameTimer = document.getElementById('gameTimer')

import { socket } from './socket.js'

blackTriangle.addEventListener('mouseover', function() {
  menuBTN.classList.add('hover');
});
blackTriangle.addEventListener('mouseout', function() {
     menuBTN.classList.remove('hover');
});

blackTriangle.addEventListener('click', menuPress)
menuBTN.addEventListener('click', menuPress)
playerOptionsBTN.addEventListener('click', playerOptions)

function menuPress() {
   document.getElementById("wrapper").classList.toggle("show");
   document.getElementById("")
   blackTriangle.classList.toggle("rotate90");
}

optionsBTN.addEventListener('click', options)

function options() {
   document.getElementById("wrapper").classList.toggle("show");
   settingsBlurer.classList.toggle("active")
   blackTriangle.classList.toggle("rotate90");
   playerOptionsBTN.classList.toggle("active")
   for (var i = 0; i < 8; i++) {
      document.getElementById(`player${i + 1}options`).classList.remove('active')
   }
}

leaveBTN.addEventListener('click', leave)

function leave() {
   socket.emit('leaveRoom', true)
}

function playerOptions() {
   for (var i = 0; i < 8; i++) {
      if (document.getElementById(`player${i + 1}options`).innerHTML.length > 0) {
         document.getElementById(`player${i + 1}options`).classList.toggle('active')
      }
   }
}

document.getElementById('player1options').addEventListener('click', playerKick1)
document.getElementById('player2options').addEventListener('click', playerKick2)
document.getElementById('player3options').addEventListener('click', playerKick3)
document.getElementById('player4options').addEventListener('click', playerKick4)
document.getElementById('player5options').addEventListener('click', playerKick5)
document.getElementById('player6options').addEventListener('click', playerKick6)
document.getElementById('player7options').addEventListener('click', playerKick7)
document.getElementById('player8options').addEventListener('click', playerKick8)
function playerKick1() {
   socket.emit('playerKick', 1)
}
function playerKick2() {
   socket.emit('playerKick', 2)
}
function playerKick3() {
   socket.emit('playerKick', 3)
}
function playerKick4() {
   socket.emit('playerKick', 4)
}
function playerKick5() {
   socket.emit('playerKick', 5)
}
function playerKick6() {
   socket.emit('playerKick', 6)
}
function playerKick7() {
   socket.emit('playerKick', 7)
}
function playerKick8() {
   socket.emit('playerKick', 8)
}

socket.on('updatePlayerList', (playerList, playerNumber) => {
   console.log(playerList)
   for (var i = 0; i < 8; i++) {
      document.getElementById(`player${i + 1}options`).innerHTML = ''
      document.getElementById(`player${i + 1}options`).classList.remove('active')
      document.getElementById(`player${i + 1}`).classList.remove("active")
      if (i > 1 && i < 8) {
      document.getElementById(`player${i}Card1`).classList.remove('active')
      document.getElementById(`player${i}Card2`).classList.remove('active')
      }
   }
   playerList.forEach(player => {
      document.getElementById(`player${player.playerNum}`).classList.add("active")
      document.getElementById(`player${player.playerNum}options`).innerHTML = player.username
      document.getElementById(`player${player.playerNum}Card1`).classList.add('active')
      document.getElementById(`player${player.playerNum}Card2`).classList.add('active')
   })
   if (playerNumber !== 1) {
      playerList.forEach(player => {
         if (player.playerNum === playerNumber) { 
            document.getElementById(`player1Name`).innerHTML = player.username
            document.getElementById(`player1Money`).innerHTML = player.money
            document.getElementById(`player1LastAction`).innerHTML = player.lastAction
         }
         else {
            if (player.playerNum < playerNumber) {
               document.getElementById(`player${player.playerNum + 1}Name`).innerHTML = player.username
               document.getElementById(`player${player.playerNum + 1}Money`).innerHTML = player.money
               document.getElementById(`player${player.playerNum + 1}LastAction`).innerHTML = player.lastAction
            } else {
               document.getElementById(`player${ player.playerNum }Name`).innerHTML = player.username
               document.getElementById(`player${ player.playerNum }Money`).innerHTML = player.money
               document.getElementById(`player${ player.playerNum }LastAction`).innerHTML = player.lastAction
            }
         }
      })
   } 
   else {
      playerList.forEach(player => {
         if (player.playerNum === playerNumber) { 
            document.getElementById(`player1Name`).innerHTML = player.username
            document.getElementById(`player1Money`).innerHTML = player.money
            document.getElementById(`player1LastAction`).innerHTML = player.lastAction
         }
         else {
            document.getElementById(`player${player.playerNum}Name`).innerHTML = player.username
            document.getElementById(`player${player.playerNum}Money`).innerHTML = player.money
            document.getElementById(`player${player.playerNum}LastAction`).innerHTML = player.lastAction
         }
      })
   }
})


//Chat
var chatSend = document.getElementById('chat-send');
var input = document.getElementById('input');
var messages = document.getElementById('messages')
var chatWindow = document.getElementById("chat-window")

chatBTN.addEventListener('click', toggleChat)
chatSend.addEventListener('click', sendChat)

function toggleChat() {
   chatWindow.classList.toggle("active");
}

input.addEventListener('keydown', function(e) {
   if (e.key == 'Enter') {
      e.preventDefault();
      sendChat()
   }
});

socket.on('chat message', function(msg) {
   var item = document.createElement('li');
   item.textContent = msg[0] + ": " + msg[1];
   messages.appendChild(item);
   messages.scrollTo(0, messages.scrollHeight);

});

function sendChat() {
   if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
   }
}


socket.on('updateTimer', (timeLeft, over) => {
   if (!over) {
      gameTimer.classList.add('active');
      gameTimer.innerHTML = "Round Starts In: " + timeLeft;
   } else {gameTimer.classList.remove('active');}
})


socket.on('leaveRoom', (msg) => {
   alert(msg)
   window.location.href = '/'
})
