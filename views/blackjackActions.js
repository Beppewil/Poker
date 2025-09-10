import { socket, getCookie, checkCookie, setCookie } from '/views/socket.js'; // Import the socket connection from socket.js

// Socket event: When a new player joins
socket.on('playerJoin', (msg) => {
  var username = getCookie("username");
  if (username != "") {
    socket.emit('usernameEntered', username);
    return;
  }
  while (username == '') {
    username = prompt(`${msg} Enter Username: `); // Prompt the player to enter a username
  }
  socket.emit('usernameEntered', username); // Emit the entered username
});