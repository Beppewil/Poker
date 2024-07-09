var blurer = document.getElementById("blurer");
var menuBTN = document.getElementById('menuBTN')
var chatBTN = document.getElementById('chat-btn')
var optionsBTN = document.getElementById('optionsBTN')
var blackTriangle = document.getElementById("black-triangle")

const socket = io();

blackTriangle.addEventListener('mouseover', function() {
  menuBTN.classList.add('hover');
});
blackTriangle.addEventListener('mouseout', function() {
     menuBTN.classList.remove('hover');
});

blackTriangle.addEventListener('click', menuPress)
menuBTN.addEventListener('click', menuPress)

function menuPress() {
   document.getElementById("wrapper").classList.toggle("show");
   blackTriangle.classList.toggle("rotate90");
}

optionsBTN.addEventListener('click', options)

function options() {
   document.getElementById("wrapper").classList.toggle("show");
   blurer.classList.toggle("active")
}





//Chat
var chatSend = document.getElementById('chat-send');
var input = document.getElementById('input');
var messages = document.getElementById('messages')

chatBTN.addEventListener('click', toggleChat)
chatSend.addEventListener('click', sendChat)

function toggleChat() {
   document.getElementById("chat-window").classList.toggle("active");
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
   document.getElementById("chat-window").scrollTo(0, document.body.scrollHeight);
});

function sendChat() {
   if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
   }
}



export {socket}